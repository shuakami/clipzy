#define NOMINMAX
#include <windows.h>
#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <map>
#include <iphlpapi.h>
#include <tchar.h>
// #include <stdio.h> // Not strictly needed with iostream
#include <winreg.h>
#include <comdef.h> // For _bstr_t
#include <Wbemidl.h>

#pragma comment(lib, "iphlpapi.lib")
#pragma comment(lib, "wbemuuid.lib")

// Global WMI pointers
IWbemLocator *g_pLoc = NULL;
IWbemServices *g_pSvc = NULL;

// Set console output to UTF-8
void setUTF8() {
    SetConsoleOutputCP(CP_UTF8);
    // The std::ios::sync_with_stdio(false) is good for performance with C++ streams,
    // but ensure std::wcout is used consistently.
    std::ios::sync_with_stdio(false);
    std::wcout.imbue(std::locale("")); // Ensure wcout uses user's default locale for formatting if needed, adapted for UTF-8 by SetConsoleOutputCP
}

// General WMI multi-row query
std::vector<std::map<std::wstring, std::wstring>> queryWMIAll(const std::wstring& wql) {
    std::vector<std::map<std::wstring, std::wstring>> results;
    if (!g_pSvc) {
        std::wcerr << L"WMI Service not initialized." << std::endl;
        return results;
    }

    HRESULT hres;
    IEnumWbemClassObject* pEnumerator = NULL;
    
    hres = g_pSvc->ExecQuery(
        bstr_t(L"WQL"),
        bstr_t(wql.c_str()),
        WBEM_FLAG_FORWARD_ONLY | WBEM_FLAG_RETURN_IMMEDIATELY,
        NULL,
        &pEnumerator
    );

    if (FAILED(hres)) {
        // std::wcerr << L"WMI Query failed for: " << wql << L". Error: 0x" << std::hex << hres << std::endl;
        return results;
    }

    IWbemClassObject *pclsObj = NULL;
    ULONG uReturn = 0;

    while (pEnumerator) {
        hres = pEnumerator->Next(WBEM_INFINITE, 1, &pclsObj, &uReturn);
        if (uReturn == 0 || FAILED(hres)) {
            break;
        }

        std::map<std::wstring, std::wstring> row;
        SAFEARRAY* pNames = NULL;
        
        // Get all property names
        HRESULT hrGetNames = pclsObj->GetNames(NULL, WBEM_FLAG_ALWAYS | WBEM_FLAG_NONSYSTEM_ONLY, NULL, &pNames);
        if (SUCCEEDED(hrGetNames) && pNames != NULL) {
            LONG lLBound, lUBound;
            SafeArrayGetLBound(pNames, 1, &lLBound);
            SafeArrayGetUBound(pNames, 1, &lUBound);

            for (LONG i = lLBound; i <= lUBound; ++i) {
                BSTR bstrName = NULL; 
                HRESULT hrElem = SafeArrayGetElement(pNames, &i, &bstrName);

                if (SUCCEEDED(hrElem) && bstrName != NULL) {
                    VARIANT vtProp;
                    VariantInit(&vtProp); // Initialize variant

                    HRESULT hrGet = pclsObj->Get(bstrName, 0, &vtProp, 0, 0);
                    if (SUCCEEDED(hrGet)) {
                        if (vtProp.vt == VT_BSTR) {
                            row[bstrName] = (vtProp.bstrVal ? vtProp.bstrVal : L"");
                        } else if (vtProp.vt == VT_I4) {
                            row[bstrName] = std::to_wstring(vtProp.lVal);
                        } else if (vtProp.vt == VT_UI4) {
                            row[bstrName] = std::to_wstring(vtProp.ulVal);
                        } else if (vtProp.vt == VT_I8) {
                            row[bstrName] = std::to_wstring(vtProp.llVal);
                        } else if (vtProp.vt == VT_UI8) {
                            row[bstrName] = std::to_wstring(vtProp.ullVal);
                        } else if (vtProp.vt == VT_BOOL) {
                            row[bstrName] = (vtProp.boolVal == VARIANT_TRUE) ? L"True" : L"False";
                        } else if (vtProp.vt == VT_NULL || vtProp.vt == VT_EMPTY) {
                            row[bstrName] = L""; // Represent null/empty as empty string
                        } else {
                            // Potentially handle other types like datetime, arrays, etc. or mark as unhandled
                            // row[bstrName] = L"[Unhandled Type:" + std::to_wstring(vtProp.vt) + L"]";
                        }
                    } else {
                        row[std::wstring(bstrName)] = L"[Error Getting Value]";
                    }
                    VariantClear(&vtProp);
                    SysFreeString(bstrName); // Free bstrName allocated by SafeArrayGetElement
                }
                // If SafeArrayGetElement failed or bstrName was NULL, bstrName was not freed (as it wasn't allocated or was invalid)
            }
            SafeArrayDestroy(pNames); // pNames was allocated by GetNames
        }
        pclsObj->Release();
        pclsObj = NULL; 
        results.push_back(row);
    }

    if (pEnumerator) pEnumerator->Release();
    return results;
}

// Unused wstr function, can be removed if not needed elsewhere
// std::wstring wstr(const std::string& s) {
//     int len = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), -1, NULL, 0);
//     std::wstring ws(len, 0);
//     MultiByteToWideChar(CP_UTF8, 0, s.c_str(), -1, &ws[0], len);
//     ws.resize(wcslen(ws.c_str())); // Ensure null termination is handled correctly for length
//     return ws;
// }

// Utility function: safely get wstring from map
std::wstring safeGet(const std::map<std::wstring, std::wstring>& m, const std::wstring& key) {
    auto it = m.find(key);
    if (it != m.end() && !it->second.empty()) {
        return it->second;
    }
    return L"Unknown"; // Return "Unknown" if key not found or value is empty
}

// Utility function: safely convert wstring to uint64_t
uint64_t safeStoull(const std::wstring& s) {
    if (s == L"Unknown" || s.empty()) return 0;
    try {
        return std::stoull(s);
    } catch (const std::invalid_argument& ia) {
        // std::wcerr << L"Invalid argument for stoull: " << s << std::endl;
        return 0;
    } catch (const std::out_of_range& oor) {
        // std::wcerr << L"Out of range for stoull: " << s << std::endl;
        return 0;
    }
    return 0;
}

void printSystemInfo() {
    auto sys = queryWMIAll(L"SELECT Caption, Version, BuildNumber, OSArchitecture, SerialNumber, InstallDate, LastBootUpTime, RegisteredUser, Organization, BootDevice, WindowsDirectory, SystemDirectory, Locale, OSLanguage, CountryCode, TotalVisibleMemorySize, FreePhysicalMemory FROM Win32_OperatingSystem");
    if (!sys.empty()) {
        auto& s = sys[0];
        std::wcout << L"[System Information]" << std::endl;
        std::wcout << L"  System Name      : " << safeGet(s, L"Caption") << L" (" << safeGet(s, L"OSArchitecture") << L")" << std::endl;
        std::wcout << L"  Version/Build    : " << safeGet(s, L"Version") << L" / " << safeGet(s, L"BuildNumber") << std::endl;
        std::wcout << L"  Serial Number    : " << safeGet(s, L"SerialNumber") << std::endl;
        std::wcout << L"  Install Date     : " << safeGet(s, L"InstallDate") << std::endl;
        std::wcout << L"  Last Boot        : " << safeGet(s, L"LastBootUpTime") << std::endl;
        std::wcout << L"  Registered User  : " << safeGet(s, L"RegisteredUser") << std::endl;
        std::wcout << L"  Organization     : " << safeGet(s, L"Organization") << std::endl;
        std::wcout << L"  Boot Device      : " << safeGet(s, L"BootDevice") << std::endl;
        std::wcout << L"  Windows Dir      : " << safeGet(s, L"WindowsDirectory") << std::endl;
        std::wcout << L"  System Dir       : " << safeGet(s, L"SystemDirectory") << std::endl;
        std::wcout << L"  Locale/Country   : " << safeGet(s, L"Locale") << L" / " << safeGet(s, L"CountryCode") << L" (Lang: " << safeGet(s, L"OSLanguage") << L")" << std::endl;
        // TotalVisibleMemorySize and FreePhysicalMemory are in kilobytes
        uint64_t totalMemKB = safeStoull(safeGet(s, L"TotalVisibleMemorySize"));
        uint64_t freeMemKB = safeStoull(safeGet(s, L"FreePhysicalMemory"));
        std::wcout << L"  Total Memory (GB): " << std::fixed << std::setprecision(2) << (totalMemKB / (1024.0 * 1024.0)) << std::endl;
        std::wcout << L"  Free Memory (GB) : " << std::fixed << std::setprecision(2) << (freeMemKB / (1024.0 * 1024.0)) << std::endl;
    } else {
        std::wcout << L"[System Information]" << std::endl;
        std::wcout << L"  Could not retrieve system information." << std::endl;
    }
}

void printCPUInfo() {
    auto cpus = queryWMIAll(L"SELECT Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed, Manufacturer, ProcessorId, SocketDesignation, L2CacheSize, L3CacheSize, VirtualizationFirmwareEnabled FROM Win32_Processor");
    std::wcout << L"\n[CPU Information]" << std::endl;
    if (!cpus.empty()) {
        for (size_t i = 0; i < cpus.size(); ++i) {
            auto& c = cpus[i];
            std::wcout << L"  Processor " << (i + 1) << L": " << safeGet(c, L"Name") << std::endl;
            std::wcout << L"    Cores/Threads   : " << safeGet(c, L"NumberOfCores") << L" / " << safeGet(c, L"NumberOfLogicalProcessors") << std::endl;
            std::wcout << L"    Max Clock (MHz) : " << safeGet(c, L"MaxClockSpeed") << std::endl;
            std::wcout << L"    Manufacturer    : " << safeGet(c, L"Manufacturer") << std::endl;
            std::wcout << L"    Processor ID    : " << safeGet(c, L"ProcessorId") << std::endl;
            std::wcout << L"    Socket          : " << safeGet(c, L"SocketDesignation") << std::endl;
            std::wcout << L"    L2 Cache (KB)   : " << safeGet(c, L"L2CacheSize") << std::endl;
            std::wcout << L"    L3 Cache (KB)   : " << safeGet(c, L"L3CacheSize") << std::endl;
            std::wcout << L"    Virtualization  : " << safeGet(c, L"VirtualizationFirmwareEnabled") << std::endl;
        }
    } else {
        std::wcout << L"  Could not retrieve CPU information." << std::endl;
    }
}

void printMemoryInfo() {
    auto mems = queryWMIAll(L"SELECT BankLabel, Capacity, Speed, Manufacturer, SerialNumber, PartNumber, MemoryType, FormFactor FROM Win32_PhysicalMemory");
    std::wcout << L"\n[Memory Information]" << std::endl;
    uint64_t totalCapacityBytes = 0;
    if (!mems.empty()) {
        for (size_t i = 0; i < mems.size(); ++i) {
            auto& m = mems[i];
            uint64_t capacityBytes = safeStoull(safeGet(m, L"Capacity"));
            totalCapacityBytes += capacityBytes;
            std::wcout << L"  Slot " << (i + 1) << L" (" << safeGet(m, L"BankLabel") << L"):" << std::endl;
            std::wcout << L"    Capacity (GB)   : " << std::fixed << std::setprecision(2) << (capacityBytes / (1024.0 * 1024.0 * 1024.0)) << std::endl;
            std::wcout << L"    Speed (MHz)     : " << safeGet(m, L"Speed") << std::endl;
            std::wcout << L"    Type            : " << safeGet(m, L"MemoryType") << L" (FormFactor: " << safeGet(m, L"FormFactor") << L")" << std::endl;
            std::wcout << L"    Manufacturer    : " << safeGet(m, L"Manufacturer") << std::endl;
            std::wcout << L"    Serial Number   : " << safeGet(m, L"SerialNumber") << std::endl;
            std::wcout << L"    Part Number     : " << safeGet(m, L"PartNumber") << std::endl;
        }
        std::wcout << L"  Total RAM (GB)     : " << std::fixed << std::setprecision(2) << (totalCapacityBytes / (1024.0 * 1024.0 * 1024.0)) << std::endl;
    } else {
        std::wcout << L"  Could not retrieve physical memory information." << std::endl;
    }
}

void printGPUInfo() {
    auto gpus = queryWMIAll(L"SELECT Name, DriverVersion, AdapterRAM, VideoProcessor, PNPDeviceID, Status, InfFilename, CurrentHorizontalResolution, CurrentVerticalResolution, CurrentRefreshRate FROM Win32_VideoController");
    std::wcout << L"\n[GPU Information]" << std::endl;
    if (!gpus.empty()) {
        for (size_t i = 0; i < gpus.size(); ++i) {
            auto& g = gpus[i];
            std::wcout << L"  GPU " << (i + 1) << L": " << safeGet(g, L"Name") << std::endl;
            std::wcout << L"    Driver Version  : " << safeGet(g, L"DriverVersion") << std::endl;
            uint64_t adapterRAMBytes = safeStoull(safeGet(g, L"AdapterRAM"));
            std::wcout << L"    VRAM (MB)       : " << (adapterRAMBytes / (1024 * 1024)) << std::endl;
            std::wcout << L"    Video Processor : " << safeGet(g, L"VideoProcessor") << std::endl;
            std::wcout << L"    Resolution      : " << safeGet(g, L"CurrentHorizontalResolution") << L"x" << safeGet(g, L"CurrentVerticalResolution") << L" @" << safeGet(g, L"CurrentRefreshRate") << L"Hz" << std::endl;
            std::wcout << L"    Device ID       : " << safeGet(g, L"PNPDeviceID") << std::endl;
            std::wcout << L"    Status          : " << safeGet(g, L"Status") << std::endl;
            // std::wcout << L"    INF File        : " << safeGet(g, L"InfFilename") << std::endl; // Often less useful
        }
    } else {
        std::wcout << L"  Could not retrieve GPU information." << std::endl;
    }
}

void printDiskInfo() {
    auto disks = queryWMIAll(L"SELECT Model, SerialNumber, FirmwareRevision, InterfaceType, MediaType, Size, Index, Partitions, Status, PNPDeviceID FROM Win32_DiskDrive");
    auto parts = queryWMIAll(L"SELECT DeviceID, DiskIndex, Name, Size, Type, Bootable, BootPartition, StartingOffset FROM Win32_DiskPartition");
    // Querying logical disks associated with partitions is more complex.
    // For simplicity, we'll query all local fixed logical disks.
    auto logics = queryWMIAll(L"SELECT DeviceID, VolumeName, FileSystem, FreeSpace, Size FROM Win32_LogicalDisk WHERE DriveType=3");

    std::wcout << L"\n[Disk Information]" << std::endl;
    if (!disks.empty()) {
        for (size_t i = 0; i < disks.size(); ++i) {
            auto& d = disks[i];
            std::wstring diskIndexStr = safeGet(d, L"Index");
            std::wcout << L"  Disk " << diskIndexStr << L": " << safeGet(d, L"Model") << std::endl;
            std::wcout << L"    Serial Number   : " << safeGet(d, L"SerialNumber") << std::endl;
            std::wcout << L"    Firmware Rev    : " << safeGet(d, L"FirmwareRevision") << std::endl;
            std::wcout << L"    Interface Type  : " << safeGet(d, L"InterfaceType") << std::endl;
            std::wcout << L"    Media Type      : " << safeGet(d, L"MediaType") << std::endl;
            uint64_t diskSizeBytes = safeStoull(safeGet(d, L"Size"));
            std::wcout << L"    Size (GB)       : " << std::fixed << std::setprecision(2) << (diskSizeBytes / (1024.0*1024.0*1024.0)) << std::endl;
            std::wcout << L"    Partitions Cnt  : " << safeGet(d, L"Partitions") << std::endl;
            std::wcout << L"    Status          : " << safeGet(d, L"Status") << std::endl;
            // std::wcout << L"    Device ID       : " << safeGet(d, L"PNPDeviceID") << std::endl;

            // Attempt to determine if SSD (heuristic, not foolproof)
            std::wstring mediaType = safeGet(d, L"MediaType");
            bool isSSD = (mediaType.find(L"SSD") != std::wstring::npos || 
                          mediaType.find(L"Fixed hard disk media") == std::wstring::npos); // HDDs often report "Fixed hard disk media"
            // A more reliable way requires checking Win32_PhysicalDisk and its SpindleSpeed, or other vendor-specific WMI classes.
            // For now, this is a simple guess.
            // std::wcout << L"    Is SSD (guess)  : " << (isSSD ? L"Yes" : L"No") << std::endl;


            // List partitions for this disk
            for (const auto& p : parts) {
                if (safeGet(p, L"DiskIndex") == diskIndexStr) {
                    std::wstring partDeviceID = safeGet(p, L"DeviceID"); // e.g., "Disk #0, Partition #1"
                    uint64_t partSizeBytes = safeStoull(safeGet(p, L"Size"));
                    std::wcout << L"    Partition: " << partDeviceID << L" (" << safeGet(p, L"Name") << L")" << std::endl;
                    std::wcout << L"      Size (GB)       : " << std::fixed << std::setprecision(2) << (partSizeBytes / (1024.0*1024.0*1024.0)) << std::endl;
                    std::wcout << L"      Type            : " << safeGet(p, L"Type") << std::endl;
                    std::wcout << L"      Bootable        : " << safeGet(p, L"Bootable") << (safeGet(p, L"BootPartition") == L"True" ? L" (System Boot Partition)" : L"") << std::endl;
                    std::wcout << L"      Offset (Bytes)  : " << safeGet(p, L"StartingOffset") << std::endl;

                    // Try to find associated logical disks (simple matching, not fully robust)
                    // A robust solution uses WMI Associators like Win32_LogicalDiskToPartition
                    // Example WQL for associators: ASSOCIATORS OF {Win32_DiskPartition.DeviceID='Disk #0, Partition #1'} WHERE AssocClass = Win32_LogicalDiskToPartition
                    // This is too complex for this quick fix. The current simple loop is kept but might not always link correctly.
                    for (const auto& l : logics) {
                        // This association is tricky. Win32_LogicalDisk doesn't directly expose partition DeviceID.
                        // We'd typically query associators. A simple heuristic:
                        // A logical disk's DeviceID (e.g., "C:") comes from a partition.
                        // If we could query Win32_LogicalDiskToPartition, we could map p.DeviceID to l.DeviceID
                        // The original code's find logic was incorrect.
                        // For now, we'll skip direct logical disk listing under partition to avoid confusion from incorrect matching.
                        // The logical disks will be listed separately if desired, or a more advanced WMI query is needed here.
                    }
                }
            }
        }
        // Separately list logical drives if not detailed under partitions
        std::wcout << L"\n  Logical Drives (Fixed Disks):" << std::endl;
        if (!logics.empty()) {
            for (const auto& l : logics) {
                uint64_t totalSizeBytes = safeStoull(safeGet(l, L"Size"));
                uint64_t freeSizeBytes = safeStoull(safeGet(l, L"FreeSpace"));
                std::wcout << L"    Drive " << safeGet(l, L"DeviceID") << L" (Label: " << safeGet(l, L"VolumeName") << L")" << std::endl;
                std::wcout << L"      File System     : " << safeGet(l, L"FileSystem") << std::endl;
                std::wcout << L"      Total Size (GB) : " << std::fixed << std::setprecision(2) << (totalSizeBytes / (1024.0*1024.0*1024.0)) << std::endl;
                std::wcout << L"      Free Space (GB) : " << std::fixed << std::setprecision(2) << (freeSizeBytes / (1024.0*1024.0*1024.0)) << std::endl;
            }
        } else {
             std::wcout << L"    Could not retrieve logical drive information." << std::endl;
        }

    } else {
        std::wcout << L"  Could not retrieve disk drive information." << std::endl;
    }
}


void printBoardInfo() {
    auto boards = queryWMIAll(L"SELECT Manufacturer, Product, SerialNumber, Version FROM Win32_BaseBoard");
    std::wcout << L"\n[Motherboard Information]" << std::endl;
    if (!boards.empty()) {
        for (auto& b : boards) { // Usually only one baseboard
            std::wcout << L"  Manufacturer     : " << safeGet(b, L"Manufacturer") << std::endl;
            std::wcout << L"  Product          : " << safeGet(b, L"Product") << std::endl;
            std::wcout << L"  Serial Number    : " << safeGet(b, L"SerialNumber") << std::endl;
            std::wcout << L"  Version          : " << safeGet(b, L"Version") << std::endl;
        }
    } else {
        std::wcout << L"  Could not retrieve motherboard information." << std::endl;
    }
}

void printBIOSInfo() {
    auto bios = queryWMIAll(L"SELECT Manufacturer, SMBIOSBIOSVersion, ReleaseDate, SerialNumber, Version FROM Win32_BIOS");
    std::wcout << L"\n[BIOS Information]" << std::endl;
    if (!bios.empty()) {
        for (auto& b : bios) { // Usually only one BIOS
            std::wcout << L"  Manufacturer     : " << safeGet(b, L"Manufacturer") << std::endl;
            std::wcout << L"  Version          : " << safeGet(b, L"SMBIOSBIOSVersion") << " (BIOS Version: " << safeGet(b, L"Version") << ")" << std::endl;
            std::wcout << L"  Release Date     : " << safeGet(b, L"ReleaseDate") << std::endl;
            std::wcout << L"  Serial Number    : " << safeGet(b, L"SerialNumber") << std::endl;
        }
    } else {
        std::wcout << L"  Could not retrieve BIOS information." << std::endl;
    }
}

void printUUID() {
    auto uuidInfo = queryWMIAll(L"SELECT UUID FROM Win32_ComputerSystemProduct");
    std::wcout << L"\n[System UUID]" << std::endl;
    if (!uuidInfo.empty()) {
        std::wcout << L"  UUID: " << safeGet(uuidInfo[0], L"UUID") << std::endl;
    } else {
        std::wcout << L"  Could not retrieve system UUID." << std::endl;
    }
}

void printTPM() {
    // Win32_Tpm might not be available on all systems or require admin rights for some properties.
    auto tpmInfo = queryWMIAll(L"SELECT SpecVersion, ManufacturerID, ManufacturerVersion, IsEnabled_InitialValue, IsActivated_InitialValue, PhysicalPresenceVersionInfo FROM Win32_Tpm");
    std::wcout << L"\n[TPM Information]" << std::endl;
    if (!tpmInfo.empty()) {
        for (auto& t : tpmInfo) { // Usually one TPM
            std::wcout << L"  Spec Version     : " << safeGet(t, L"SpecVersion") << std::endl;
            std::wcout << L"  Manufacturer ID  : " << safeGet(t, L"ManufacturerID") << std::endl;
            std::wcout << L"  Manufacturer Ver : " << safeGet(t, L"ManufacturerVersion") << std::endl;
            std::wcout << L"  Physical Presence: " << safeGet(t, L"PhysicalPresenceVersionInfo") << std::endl;
            std::wcout << L"  Enabled          : " << safeGet(t, L"IsEnabled_InitialValue") << std::endl;
            std::wcout << L"  Activated        : " << safeGet(t, L"IsActivated_InitialValue") << std::endl;
        }
    } else {
        std::wcout << L"  TPM information not found or not accessible (Win32_Tpm class)." << std::endl;
        // Attempt query from MSFT_Tpm namespace if available (newer systems)
        // This requires connecting to "ROOT\\CIMV2\\Security\\MicrosoftTpm" which complicates the global g_pSvc.
        // For now, we stick to Win32_Tpm.
    }
}

void printSoundDevices() {
    auto sndDevs = queryWMIAll(L"SELECT Name, Manufacturer, Status, PNPDeviceID FROM Win32_SoundDevice");
    std::wcout << L"\n[Sound Device Information]" << std::endl;
    if (!sndDevs.empty()) {
        for (const auto& s : sndDevs) {
            std::wcout << L"  Name             : " << safeGet(s, L"Name") << std::endl;
            std::wcout << L"    Manufacturer   : " << safeGet(s, L"Manufacturer") << std::endl;
            std::wcout << L"    Status         : " << safeGet(s, L"Status") << std::endl;
            std::wcout << L"    Device ID      : " << safeGet(s, L"PNPDeviceID") << std::endl;
        }
    } else {
        std::wcout << L"  Could not retrieve sound device information." << std::endl;
    }
}

void printUSBDevices() {
    // Win32_USBControllerDevice is an association class. To get actual device info:
    // 1. Query Win32_USBHub for hubs
    // 2. Query Win32_PnPEntity for USB devices (WHERE Service = 'USBSTOR' or Name LIKE '%USB%')
    // The original query might be slow or return less useful info.
    // A more targeted query for connected USB devices (often PnPEntities):
    auto usbDevs = queryWMIAll(L"SELECT Name, DeviceID, PNPDeviceID, Description, Status, Manufacturer FROM Win32_PnPEntity WHERE PNPClass = 'USB' OR Service = 'USBSTOR' OR Name LIKE '%USB Mass Storage%' OR Name LIKE '%USB Composite Device%'");
    std::wcout << L"\n[USB Devices (from PnPEntity)]" << std::endl;
    if (!usbDevs.empty()) {
        for (const auto& u : usbDevs) {
            std::wcout << L"  Name             : " << safeGet(u, L"Name") << std::endl;
            std::wcout << L"    Description    : " << safeGet(u, L"Description") << std::endl;
            std::wcout << L"    Manufacturer   : " << safeGet(u, L"Manufacturer") << std::endl;
            std::wcout << L"    Status         : " << safeGet(u, L"Status") << std::endl;
            std::wcout << L"    PNP Device ID  : " << safeGet(u, L"PNPDeviceID") << std::endl;
        }
    } else {
        std::wcout << L"  Could not retrieve USB device information or no relevant USB PnP entities found." << std::endl;
    }
}

void printNetworkAdapters() {
    auto nics = queryWMIAll(L"SELECT Name, MACAddress, AdapterType, Speed, Manufacturer, NetConnectionStatus, PNPDeviceID, NetEnabled FROM Win32_NetworkAdapter WHERE PhysicalAdapter=True");
    std::wcout << L"\n[Network Adapter Information (Physical)]" << std::endl;
    if (!nics.empty()) {
        for (const auto& n : nics) {
            std::wcout << L"  Name             : " << safeGet(n, L"Name") << std::endl;
            std::wcout << L"    MAC Address    : " << safeGet(n, L"MACAddress") << std::endl;
            std::wcout << L"    Type           : " << safeGet(n, L"AdapterType") << std::endl;
            uint64_t speedBps = safeStoull(safeGet(n, L"Speed"));
            std::wcout << L"    Speed (Mbps)   : " << (speedBps / (1000*1000)) << std::endl;
            std::wcout << L"    Manufacturer   : " << safeGet(n, L"Manufacturer") << std::endl;
            std::wcout << L"    Enabled        : " << safeGet(n, L"NetEnabled") << std::endl;
            std::wcout << L"    Status Code    : " << safeGet(n, L"NetConnectionStatus") << " (2=Connected, 7=Disconnected, etc.)" << std::endl;
            // std::wcout << L"    Device ID      : " << safeGet(n, L"PNPDeviceID") << std::endl;
        }
    } else {
        std::wcout << L"  Could not retrieve physical network adapter information." << std::endl;
    }
}

bool initializeWMI() {
    HRESULT hres;

    hres = CoInitializeEx(0, COINIT_MULTITHREADED);
    if (FAILED(hres)) {
        std::wcerr << L"Failed to initialize COM library. Error code = 0x" << std::hex << hres << std::endl;
        return false;
    }

    hres = CoInitializeSecurity(
        NULL,
        -1,                          // COM authentication
        NULL,                        // Authentication services
        NULL,                        // Reserved
        RPC_C_AUTHN_LEVEL_DEFAULT,   // Default authentication
        RPC_C_IMP_LEVEL_IMPERSONATE, // Default Impersonation
        NULL,                        // Authentication info
        EOAC_NONE,                   // Additional capabilities
        NULL                         // Reserved
    );
    if (FAILED(hres)) {
        std::wcerr << L"Failed to initialize security. Error code = 0x" << std::hex << hres << std::endl;
        CoUninitialize();
        return false;
    }

    hres = CoCreateInstance(
        CLSID_WbemLocator,
        0,
        CLSCTX_INPROC_SERVER,
        IID_IWbemLocator, (LPVOID *)&g_pLoc);
    if (FAILED(hres)) {
        std::wcerr << L"Failed to create IWbemLocator object. Error code = 0x" << std::hex << hres << std::endl;
        CoUninitialize();
        return false;
    }

    hres = g_pLoc->ConnectServer(
        _bstr_t(L"ROOT\\CIMV2"), // Object path of WMI namespace
        NULL,                    // User name. NULL = current user
        NULL,                    // User password. NULL = current
        0,                       // Locale. NULL indicates current
        NULL,                    // Security flags.
        0,                       // Authority (e.g. Kerberos)
        0,                       // Context object
        &g_pSvc                  // pointer to IWbemServices proxy
    );
    if (FAILED(hres)) {
        std::wcerr << L"Could not connect to WMI namespace ROOT\\CIMV2. Error code = 0x" << std::hex << hres << std::endl;
        g_pLoc->Release();
        g_pLoc = NULL;
        CoUninitialize();
        return false;
    }

    hres = CoSetProxyBlanket(
        g_pSvc,                        // Indicates the proxy to set
        RPC_C_AUTHN_WINNT,           // RPC_C_AUTHN_xxx
        RPC_C_AUTHZ_NONE,            // RPC_C_AUTHZ_xxx
        NULL,                        // Server principal name
        RPC_C_AUTHN_LEVEL_CALL,      // RPC_C_AUTHN_LEVEL_xxx
        RPC_C_IMP_LEVEL_IMPERSONATE, // RPC_C_IMP_LEVEL_xxx
        NULL,                        // client identity
        EOAC_NONE                    // proxy capabilities
    );
    if (FAILED(hres)) {
        std::wcerr << L"Could not set proxy blanket. Error code = 0x" << std::hex << hres << std::endl;
        g_pSvc->Release();
        g_pSvc = NULL;
        g_pLoc->Release();
        g_pLoc = NULL;
        CoUninitialize();
        return false;
    }
    return true;
}

void uninitializeWMI() {
    if (g_pSvc) {
        g_pSvc->Release();
        g_pSvc = NULL;
    }
    if (g_pLoc) {
        g_pLoc->Release();
        g_pLoc = NULL;
    }
    CoUninitialize();
}


int main() {
    setUTF8(); // Set console to UTF-8 early

    if (!initializeWMI()) {
        std::wcerr << L"WMI Initialization Failed. Press any key to exit..." << std::endl;
        std::cin.get(); // Use cin.get() for "press any key" as system("pause") can be problematic
        return 1;
    }

    std::wcout << L"Collecting system information, please wait..." << std::endl;

    printSystemInfo();
    printCPUInfo();
    printMemoryInfo();
    printGPUInfo();
    printDiskInfo(); // Suspected area of the original bug
    printBoardInfo();
    printBIOSInfo();
    printUUID();
    printTPM();
    printSoundDevices();
    printUSBDevices();
    printNetworkAdapters();

    uninitializeWMI();

    std::wcout << L"\nInformation collection complete. Press any key to exit..." << std::endl;
    // system("pause >nul"); // Original pause
    std::wcin.ignore(std::numeric_limits<std::streamsize>::max(), L'\n'); // Clear potential leftover newline
    std::wcin.get(); // Wait for user to press Enter

    return 0;
}