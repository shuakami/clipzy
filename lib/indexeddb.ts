const DB_NAME = 'clipzyLocalCache';
const DB_VERSION = 1;
const STORE_NAME = 'viewedClips';

export interface ViewedClip {
  id: string;           // 原始分享内容的 ID
  encryptedData: string; // 使用本地密钥加密后的数据
  timestamp: number;     // 查看时的时间戳
}

/**
 * 打开 IndexedDB 数据库
 * @returns Promise<IDBDatabase>
 */
function openClipzyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (_event) => {
      console.error('IndexedDB error:', request.error);
      reject(`IndexedDB error: ${request.error}`);
    };

    request.onsuccess = (_event) => {
      resolve(request.result);
    };

    // 仅在版本升级或首次创建时触发
    request.onupgradeneeded = (_event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // 创建对象存储，使用 id 作为主键
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log(`Object store "${STORE_NAME}" created.`);
      }
      // 如果需要，可以在这里添加索引
      // store.createIndex('timestamp', 'timestamp', { unique: false });
    };
  });
}

/**
 * 保存或更新一个预览过的 clip 到 IndexedDB
 * @param clipData - 包含 id, encryptedData, timestamp 的对象
 */
export async function saveViewedClip(clipData: ViewedClip): Promise<void> {
  try {
    const db = await openClipzyDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // 使用 put 方法，如果 id 已存在则会更新
    const request = store.put(clipData);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        // console.log('Clip saved to IndexedDB:', clipData.id);
        resolve();
      };
      request.onerror = () => {
        console.error('Failed to save clip to IndexedDB:', request.error);
        reject(`Failed to save clip: ${request.error}`);
      };
      transaction.oncomplete = () => {
        db.close();
      };
      transaction.onerror = () => {
        console.error('IndexedDB transaction error:', transaction.error);
        // No reject here as request.onerror should handle it
      };
    });
  } catch (error) {
    console.error('Error in saveViewedClip:', error);
    // 不向上抛出错误，避免阻塞主流程
  }
}

/**
 * 获取所有存储的预览记录，按时间戳降序排列
 * @returns Promise<ViewedClip[]>
 */
export async function getViewedClips(): Promise<ViewedClip[]> {
  try {
    const db = await openClipzyDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    // 使用 getAll() 获取所有记录
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        // 对结果按时间戳降序排序
        const sortedClips = (request.result as ViewedClip[]).sort((a, b) => b.timestamp - a.timestamp);
        resolve(sortedClips);
      };
      request.onerror = () => {
        console.error('Failed to get clips from IndexedDB:', request.error);
        reject(`Failed to get clips: ${request.error}`);
      };
      transaction.oncomplete = () => {
        db.close();
      };
      transaction.onerror = () => {
        console.error('IndexedDB transaction error:', transaction.error);
      };
    });
  } catch (error) {
    console.error('Error in getViewedClips:', error);
    return []; // 出错时返回空数组
  }
}

/**
 * 从 IndexedDB 删除指定的预览记录
 * @param id 要删除记录的 ID
 */
export async function deleteViewedClip(id: string): Promise<void> {
  try {
    const db = await openClipzyDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        // console.log(`Clip ${id} deleted from IndexedDB.`);
        resolve();
      };
      request.onerror = () => {
        console.error(`Failed to delete clip ${id} from IndexedDB:`, request.error);
        reject(`Failed to delete clip: ${request.error}`);
      };
      transaction.oncomplete = () => {
        db.close();
      };
      transaction.onerror = () => {
        console.error('IndexedDB transaction error:', transaction.error);
      };
    });
  } catch (error) {
    console.error(`Error in deleteViewedClip for ID ${id}:`, error);
     // 不向上抛出错误
  }
} 