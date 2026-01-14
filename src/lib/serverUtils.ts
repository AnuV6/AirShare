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
    return results;
}

export function getLocalIpAddress() {
    const all = getAllLocalIpAddresses();
    return all.length > 0 ? all[0].address : ip.address(); // Fallback to ip.address() logic if empty
}

