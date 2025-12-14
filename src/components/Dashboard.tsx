'use client';

import { useState, useEffect } from 'react';
import { NetworkInfo } from './NetworkInfo';
import { UploadTask } from '@/lib/uploadService';
import { FileDown, FileUp, Pause, Play, Trash2, File as FileIcon, MessageSquare, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Chat } from './Chat';

type FileItem = {
    name: string;
    size: number;
    mtime: string;
};

type Tab = 'transfer' | 'chat';

export default function Dashboard({ ipAddress }: { ipAddress: string }) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [uploads, setUploads] = useState<UploadTask[]>([]);
    const [_, setTick] = useState(0);
    const [activeTab, setActiveTab] = useState<Tab>('transfer');
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

    useEffect(() => {
        fetchFiles();
        const interval = setInterval(fetchFiles, 5000);
        return () => clearInterval(interval);
    }, []);

    // Wake Lock Logic
    useEffect(() => {
        const isUploading = uploads.some(u => u.status === 'uploading');

        const requestWakeLock = async () => {
            if ('wakeLock' in navigator && !wakeLock) {
                try {
                    const lock = await navigator.wakeLock.request('screen');
                    setWakeLock(lock);
                    console.log('Wake Lock active');
                } catch (err) {
                    console.error('Wake Lock rejected', err);
                }
            }
        };

        const releaseWakeLock = async () => {
            if (wakeLock) {
                await wakeLock.release();
                setWakeLock(null);
                console.log('Wake Lock released');
            }
        };

        if (isUploading) {
            requestWakeLock();
        } else {
            releaseWakeLock();
        }

        return () => { releaseWakeLock(); };
    }, [uploads, wakeLock]);

    const fetchFiles = async () => {
        try {
            const res = await fetch('/api/files');
            if (res.ok) {
                const data = await res.json();
                setFiles(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (fileName: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

        try {
            const res = await fetch('/api/files', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName }),
            });
            if (res.ok) fetchFiles();
            else alert('Failed to delete file');
        } catch (error) {
            console.error(error);
            alert('Error deleting file');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newUploads = Array.from(e.target.files).map(file => {
                const task = new UploadTask(
                    file,
                    (progress, speed) => setTick(t => t + 1),
                    (status) => {
                        setTick(t => t + 1);
                        if (status === 'completed') {
                            fetchFiles();
                            if (navigator.vibrate) navigator.vibrate(200); // Haptic feedback
                        }
                    }
                );
                task.start();
                return task;
            });
            setUploads(prev => [...newUploads, ...prev]);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            <NetworkInfo ipAddress={ipAddress} />

            {/* Mobile Tab Switcher */}
            <div className="flex lg:hidden bg-white/10 p-1 rounded-xl mb-4 sticky top-4 z-10 backdrop-blur-md">
                <button
                    onClick={() => setActiveTab('transfer')}
                    className={cn(
                        "flex-1 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all",
                        activeTab === 'transfer' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                    )}
                >
                    <ArrowRightLeft className="w-4 h-4" /> Transfer
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={cn(
                        "flex-1 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all",
                        activeTab === 'chat' ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                    )}
                >
                    <MessageSquare className="w-4 h-4" /> Chat
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: File Transfer */}
                <div className={cn("space-y-8", activeTab === 'chat' ? 'hidden lg:block' : 'block animate-in fade-in slide-in-from-left-4 duration-300')}>
                    {/* Upload Section */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <FileUp className="w-5 h-5 text-blue-400" /> Send Files
                        </h3>

                        <label className="flex flex-col items-center justify-center w-full h-32 md:h-48 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/5 hover:border-blue-500/50 transition-all group active:scale-95">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <FileUp className="w-8 h-8 mb-2 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                <p className="mb-2 text-sm text-gray-400 group-hover:text-gray-200 text-center px-4">
                                    <span className="font-semibold block md:inline">Tap or Drag to Upload</span>
                                </p>
                            </div>
                            <input type="file" className="hidden" multiple onChange={handleFileSelect} />
                        </label>

                        {/* Upload List */}
                        <div className="mt-6 space-y-3">
                            <AnimatePresence>
                                {uploads.map((task) => (
                                    <motion.div
                                        key={task.uploadId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-black/20 p-4 rounded-lg flex items-center gap-4"
                                    >
                                        <div className="bg-white/10 p-2 rounded">
                                            <FileIcon className="w-5 h-5 text-blue-200" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between mb-1">
                                                <p className="text-sm font-medium text-white truncate max-w-[120px] md:max-w-xs">{task.file.name}</p>
                                                <div className="text-xs text-gray-400 flex gap-2">
                                                    <span className="hidden sm:inline">{task.speed}</span>
                                                    <span>{task.status === 'completed' ? 'Done' : `${Math.round((task.completedChunks / task.totalChunks) * 100)}%`}</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                                                <div
                                                    className={cn("h-1.5 rounded-full transition-all duration-300",
                                                        task.status === 'error' ? 'bg-red-500' :
                                                            task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                                    )}
                                                    style={{ width: `${(task.completedChunks / task.totalChunks) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {task.status === 'uploading' && (
                                                <button onClick={() => task.pause()} className="p-1.5 hover:bg-white/10 rounded text-yellow-500">
                                                    <Pause className="w-4 h-4" />
                                                </button>
                                            )}
                                            {task.status === 'paused' && (
                                                <button onClick={() => task.resume()} className="p-1.5 hover:bg-white/10 rounded text-green-500">
                                                    <Play className="w-4 h-4" />
                                                </button>
                                            )}
                                            {task.status !== 'completed' && (
                                                <button onClick={() => task.cancel()} className="p-1.5 hover:bg-white/10 rounded text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Available Files */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <FileDown className="w-5 h-5 text-green-400" /> Available Files
                        </h3>
                        <div className="space-y-2">
                            {files.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No files shared yet</p>
                            ) : (
                                files.map((file) => (
                                    <a
                                        key={file.name}
                                        href={`/api/download/${file.name}`}
                                        target="_blank"
                                        download
                                        className="block bg-black/20 hover:bg-black/30 transition-all p-4 rounded-lg group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-green-500/10 p-2 rounded text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors shrink-0">
                                                    <FileIcon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white font-medium truncate max-w-[150px] md:max-w-[300px]">{file.name}</p>
                                                    <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FileDown className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                                                <button
                                                    onClick={(e) => handleDelete(file.name, e)}
                                                    className="p-2 hover:bg-red-500/20 rounded-full text-gray-500 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </a>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Chat */}
                <div className={cn("h-full", activeTab === 'transfer' ? 'hidden lg:block' : 'block animate-in fade-in slide-in-from-right-4 duration-300')}>
                    <Chat />
                </div>
            </div>
        </div>
    );
}
