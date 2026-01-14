'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Copy } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils'; // We'll implement this if not already

interface NetworkInfoProps {
    ipAddresses: { name: string; address: string }[];
    port?: number;
}

export function NetworkInfo({ ipAddresses, port = 3000 }: NetworkInfoProps) {
    const [selectedIp, setSelectedIp] = useState(ipAddresses[0]?.address || 'localhost');
    const url = `http://${selectedIp}:${port}`;
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-white shadow-xl">
            <h2 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Connect & Share
            </h2>
            <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="bg-white p-2 rounded-lg shrink-0">
                    <QRCodeSVG value={url} size={120} />
                </div>
                <div className="flex-1 space-y-3 w-full min-w-0">
                    <p className="text-sm text-gray-300">
                        Scan this code or open the link below on other devices to share files.
                    </p>

                    {/* Network Selection Dropdown */}
                    {ipAddresses.length > 1 && (
                        <div className="relative">
                            <select
                                value={selectedIp}
                                onChange={(e) => setSelectedIp(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                            >
                                {ipAddresses.map((ip) => (
                                    <option key={ip.address} value={ip.address} className="bg-slate-900 text-white">
                                        {ip.name} - {ip.address}
                                    </option>
                                ))}
                            </select>
                            {/* Custom arrow if needed, but standard usually fine or just simple styling */}
                        </div>
                    )}

                    <div
                        onClick={copyToClipboard}
                        className="flex items-center justify-between bg-black/30 p-3 rounded-lg cursor-pointer hover:bg-black/40 transition-all group"
                    >
                        <code className="text-blue-300 font-mono text-sm break-all truncate">{url}</code>
                        <Copy className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0 ml-2" />
                    </div>
                    {copied && <span className="text-xs text-green-400">Copied to clipboard!</span>}
                </div>
            </div>
        </div>
    );
}
