'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: number;
}

export function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [senderName, setSenderName] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Generate a random generic name if not set
        if (!localStorage.getItem('chat_sender')) {
            const names = ['Device A', 'Device B', 'Phone', 'Laptop'];
            const randomName = names[Math.floor(Math.random() * names.length)] + ' ' + Math.floor(Math.random() * 100);
            localStorage.setItem('chat_sender', randomName);
            setSenderName(randomName);
        } else {
            setSenderName(localStorage.getItem('chat_sender')!);
        }

        fetchMessages();
        const interval = setInterval(fetchMessages, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/messages');
            if (res.ok) {
                const data = await res.json();
                // Avoid re-rendering if length is same (simple checks)
                setMessages(prev => {
                    if (prev.length === data.length) return prev;
                    return data;
                });
            }
        } catch (e) {
            console.error("Chat error", e);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newMessage, sender: senderName }),
            });
            setNewMessage('');
            fetchMessages();
        } catch (e) {
            console.error("Send error", e);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" /> Local Chat
            </h3>

            <div
                ref={scrollRef}
                className="flex-1 bg-black/20 rounded-lg p-4 mb-4 overflow-y-auto max-h-[300px] min-h-[200px] space-y-3"
            >
                {messages.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm">No messages yet. Say hi!</p>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === senderName ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 break-words whitespace-pre-wrap ${msg.sender === senderName ? 'bg-purple-500/20 text-purple-100' : 'bg-white/10 text-gray-200'}`}>
                                <p className="text-xs text-purple-300/70 mb-1">{msg.sender}</p>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSend} className="flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50"
                />
                <button
                    type="submit"
                    className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
