import { NextRequest, NextResponse } from 'next/server';
import { upstashFetch, localRedisGet, localRedisSet, isLocalMode } from '../../_utils/upstash';

// Redis操作包装器
const redis = {
    async get(key: string): Promise<string | null> {
        if (isLocalMode()) {
            return await localRedisGet(key);
        } else {
            try {
                const result = await upstashFetch<{ result: string | null }>(`get/${key}`);
                return result.result;
            } catch (error) {
                return null;
            }
        }
    },
    
    async setex(key: string, seconds: number, value: string | any): Promise<string> {
        if (isLocalMode()) {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            return await localRedisSet(key, stringValue, seconds);
        } else {
            const bodyValue = typeof value === 'string' ? value : JSON.stringify(value);
            const result = await upstashFetch<{ result: string }>(`setex/${key}/${seconds}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyValue)
            });
            return result.result;
        }
    },
    
    async del(key: string): Promise<number> {
        if (isLocalMode()) {
            await localRedisSet(key, '', 1);
            return 1;
        } else {
            const result = await upstashFetch<{ result: number }>(`del/${key}`, {
                method: 'POST'
            });
            return result.result;
        }
    },
    
    async keys(pattern: string): Promise<string[]> {
        if (isLocalMode()) {
            return [];
        } else {
            try {
                const result = await upstashFetch<{ result: string[] }>(`keys/${pattern}`);
                return result.result;
            } catch (error) {
                return [];
            }
        }
    }
};

// 设备信息接口
interface Device {
    id: string;
    name: string;
    type: 'desktop' | 'mobile' | 'tablet';
    joinedAt: number;
    lastSeen: number;
}

// 房间信息接口
interface Room {
    id: string;
    name: string;
    devices: Device[];
    createdAt: number;
    lastActivity: number;
}

// 信令消息接口
interface SignalMessage {
    id: string;
    type: 'offer' | 'answer' | 'ice-candidate' | 'room-update';
    fromDevice: string;
    toDevice: string;
    data: any;
    timestamp: number;
}

// 生成房间ID
function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 生成设备ID
function generateDeviceId(): string {
    return Math.random().toString(36).substring(2, 10);
}

// 获取房间信息
async function getRoomInfo(roomId: string): Promise<Room | null> {
    try {
        const roomData = await redis.get(`lan:room:${roomId}`);
        if (!roomData) return null;

        let room: any;
        try {
            if (typeof roomData === 'string') {
                room = JSON.parse(roomData);
                if (typeof room === 'string') {
                    room = JSON.parse(room);
                }
            } else {
                room = roomData;
            }
        } catch (parseError) {
            return null;
        }
        
        if (!room || typeof room !== 'object') {
            return null;
        }
        
        if (!room.devices || !Array.isArray(room.devices)) {
            room.devices = [];
        }
        
        return room as Room;
    } catch (error) {
        return null;
    }
}

// 保存房间信息
async function saveRoomInfo(room: Room): Promise<void> {
    try {
        const roomKey = `lan:room:${room.id}`;
        await redis.setex(roomKey, 3600, room);
    } catch (error) {
    }
}

// 创建房间
async function createRoom(): Promise<{ roomId: string; room: Room }> {
    const roomId = generateRoomId();
    const room: Room = {
        id: roomId,
        name: `房间 ${roomId}`,
        devices: [],
        createdAt: Date.now(),
        lastActivity: Date.now()
    };
    
    await saveRoomInfo(room);
    return { roomId, room };
}

// 加入房间
async function joinRoom(roomId: string, deviceName: string, deviceType: 'desktop' | 'mobile' | 'tablet'): Promise<{ room: Room; device: Device } | null> {
    const room = await getRoomInfo(roomId);
    if (!room) {
        return null;
    }

    if (!room.devices || !Array.isArray(room.devices)) {
        room.devices = [];
    }

    const deviceId = generateDeviceId();
    const device: Device = {
        id: deviceId,
        name: deviceName,
        type: deviceType,
        joinedAt: Date.now(),
        lastSeen: Date.now()
    };

    room.devices = room.devices.filter(d => d.name !== deviceName);
    room.devices.push(device);
    room.lastActivity = Date.now();

    await saveRoomInfo(room);
    
    await broadcastRoomUpdate(roomId, device.id);
    
    return { room, device };
}

// 离开房间
async function leaveRoom(roomId: string, deviceId: string): Promise<void> {
    const room = await getRoomInfo(roomId);
    if (!room) return;

    if (!room.devices || !Array.isArray(room.devices)) {
        room.devices = [];
    }

    room.devices = room.devices.filter(d => d.id !== deviceId);
    room.lastActivity = Date.now();

    if (room.devices.length === 0) {
        await redis.del(`lan:room:${roomId}`);
        await redis.del(`lan:messages:${roomId}`);
    } else {
        await saveRoomInfo(room);
        await broadcastRoomUpdate(roomId, deviceId);
    }
}

// 发送信令消息
async function sendSignal(roomId: string, message: Omit<SignalMessage, 'id' | 'timestamp'>): Promise<void> {
    const signalMessage: SignalMessage = {
        ...message,
        id: Math.random().toString(36).substring(2),
        timestamp: Date.now()
    };

    const messagesKey = `lan:messages:${roomId}`;
    try {
        const existingMessages = await redis.get(messagesKey);
        let messages: SignalMessage[] = [];
        
        if (existingMessages) {
            try {
                let parsed = JSON.parse(existingMessages);
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
                messages = Array.isArray(parsed) ? parsed : [];
            } catch (parseError) {
                messages = [];
            }
        }
        
        messages.push(signalMessage);
        if (messages.length > 50) {
            messages.splice(0, messages.length - 50);
        }
        
        await redis.setex(messagesKey, 1800, messages);
    } catch (error) {
    }
}

// 广播房间状态更新
async function broadcastRoomUpdate(roomId: string, excludeDeviceId?: string): Promise<void> {
    const room = await getRoomInfo(roomId);
    if (!room) {
        return;
    }

    for (const device of room.devices) {
        if (excludeDeviceId && device.id === excludeDeviceId) {
            continue;
        }
        
        await sendSignal(roomId, {
            type: 'room-update',
            fromDevice: 'server',
            toDevice: device.id,
            data: { 
                room: room,
                type: 'device-joined'
            }
        });
    }
}

// 轮询消息
async function pollMessages(roomId: string, deviceId: string, lastMessageId?: string): Promise<SignalMessage[]> {
    try {
        const messagesKey = `lan:messages:${roomId}`;
        const messagesData = await redis.get(messagesKey);
        
        if (!messagesData) {
            return [];
        }
        
        let allMessages: SignalMessage[] = [];
        try {
            let parsed = JSON.parse(messagesData);
            if (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
            }
            allMessages = Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
            return [];
        }
        
        const deviceMessages = allMessages.filter(msg => 
            msg.toDevice === deviceId && 
            (!lastMessageId || msg.timestamp > parseInt(lastMessageId))
        );

        return deviceMessages;
    } catch (error) {
        return [];
    }
}

// 更新设备在线状态
async function updateDeviceHeartbeat(roomId: string, deviceId: string): Promise<void> {
    const room = await getRoomInfo(roomId);
    if (!room) return;

    if (!room.devices || !Array.isArray(room.devices)) {
        room.devices = [];
    }

    const device = room.devices.find(d => d.id === deviceId);
    if (device) {
        device.lastSeen = Date.now();
        room.lastActivity = Date.now();
        await saveRoomInfo(room);
    }
}

// GET 请求处理
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const roomId = searchParams.get('roomId');
    const deviceId = searchParams.get('deviceId');
    const lastMessageId = searchParams.get('lastMessageId');

    try {
        if (action === 'poll' && roomId && deviceId) {
            // 轮询消息
            const messages = await pollMessages(roomId, deviceId, lastMessageId || undefined);
            
            // 更新设备心跳
            await updateDeviceHeartbeat(roomId, deviceId);
            
            return NextResponse.json({ messages });
        }

        if (action === 'room' && roomId) {
            // 获取房间信息
            const room = await getRoomInfo(roomId);
            if (!room) {
                return NextResponse.json({ error: '房间不存在' }, { status: 404 });
            }
            return NextResponse.json({ room });
        }

        if (action === 'rooms') {
            // 获取所有房间（简化）
            return NextResponse.json({ rooms: [] });
        }

        return NextResponse.json({ error: '无效的操作' }, { status: 400 });
    } catch (error) {
        console.error('GET请求处理失败:', error);
        return NextResponse.json({ error: '服务器错误' }, { status: 500 });
    }
}

// POST 请求处理
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'create-room') {
            // 创建房间
            const result = await createRoom();
            return NextResponse.json(result);
        }

        if (action === 'join-room') {
            // 加入房间
            const { roomId, deviceName, deviceType } = body;
            
            if (!roomId || !deviceName || !deviceType) {
                return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
            }

            const result = await joinRoom(roomId, deviceName, deviceType);
            if (!result) {
                return NextResponse.json({ error: '房间不存在' }, { status: 404 });
            }

            return NextResponse.json(result);
        }

        if (action === 'signal') {
            // 发送信令
            const { roomId, type, fromDevice, toDevice, data } = body;
            
            if (!roomId || !type || !fromDevice || !toDevice || !data) {
                return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
            }

            await sendSignal(roomId, { type, fromDevice, toDevice, data });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: '无效的操作' }, { status: 400 });
    } catch (error) {
        console.error('POST请求处理失败:', error);
        return NextResponse.json({ error: '服务器错误' }, { status: 500 });
    }
}

// DELETE 请求处理
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const deviceId = searchParams.get('deviceId');

    if (!roomId || !deviceId) {
        return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    try {
        await leaveRoom(roomId, deviceId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE请求处理失败:', error);
        return NextResponse.json({ error: '服务器错误' }, { status: 500 });
    }
}