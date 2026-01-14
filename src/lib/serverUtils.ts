import ip from 'ip';
import os from 'os';

export interface NetworkInterface {
    name: string;
    address: string;
}

export function getAllLocalIpAddresses(): NetworkInterface[] {
    const interfaces = os.networkInterfaces();
    const results: NetworkInterface[] = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            // Skip internal (non-127.0.0.1) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                results.push({ name, address: iface.address });
            }
        }
    }

    // Sort to prioritize real LAN interfaces
    return results.sort((a, b) => {
        const priority = (name: string) => {
            const n = name.toLowerCase();
            if (n.includes('wi-fi') || n.includes('wifi')) return 2; // Top priority
            if (n.includes('ethernet')) return 1; // Second priority
            if (n.includes('virtual') || n.includes('vmware') || n.includes('vethernet') || n.includes('wsl')) return -1; // Low priority
            return 0; // Neutral
        };
        return priority(b.name) - priority(a.name);
    });
}

export function getLocalIpAddress() {
    const all = getAllLocalIpAddresses();
    return all.length > 0 ? all[0].address : ip.address(); // Fallback to ip.address() logic if empty
}

