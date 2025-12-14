import ip from 'ip';

export function getLocalIpAddress() {
    return ip.address(); // Returns the local network IP
}
