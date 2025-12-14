import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR } from '@/lib/constants';

const MESSAGE_FILE = path.join(UPLOAD_DIR, 'messages.json');

export async function GET() {
    try {
        if (!fs.existsSync(MESSAGE_FILE)) {
            return NextResponse.json([]);
        }
        const data = fs.readFileSync(MESSAGE_FILE, 'utf-8');
        const messages = JSON.parse(data);
        return NextResponse.json(messages);
    } catch (error) {
        return NextResponse.json([]);
    }
}

export async function POST(req: Request) {
    try {
        const { text, sender } = await req.json();
        if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

        let messages = [];
        if (fs.existsSync(MESSAGE_FILE)) {
            const data = fs.readFileSync(MESSAGE_FILE, 'utf-8');
            messages = JSON.parse(data);
        }

        const newMessage = {
            id: Date.now().toString(),
            text,
            sender: sender || 'Anonymous',
            timestamp: Date.now()
        };

        messages.push(newMessage);

        // Ensure upload dir exists
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messages, null, 2));

        return NextResponse.json(newMessage);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
