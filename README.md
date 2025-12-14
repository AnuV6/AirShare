# 🌬️ Air Share 🚀

**Air Share** is a high-speed, local file-sharing application designed for the modern web. Share files securely between your computer and mobile devices over your local WiFi network—no internet required.

![Air Share](https://github.com/user-attachments/assets/3b963da5-fc27-48e9-93ff-6cdb646f9a7d)

## ✨ Features

- **🚀 Turbo Speed**: Optimized for mobile devices with huge chunk support (5MB+).
- **🔒 Secure & Local**: Files never leave your local network.
- **📱 Mobile First**: Tabbed "Transfer" & "Chat" interface for phones.
- **💬 Real-Time Chat**: Send links and text messages instantly between devices.
- **🛡️ Crash-Proof**: Atomic file writing ensuring zero corruption.
- **🔋 Wake Lock**: Keeps your screen alive during transfers.

## 🛠️ Installation & Usage

### 1. Requirements
- Node.js 18+ installed on your computer.

### 2. Setup
```bash
git clone https://github.com/yourusername/air-share.git
cd air-share
npm install
```

### 3. Run (Production Mode)
For the best speed and stability:
```bash
npm run build
npm run start:network
```

Access the app via the **QR Code** shown on the dashboard or go to `http://<YOUR_IP>:3000`.

### 4. Development
```bash
npm run dev:network
```

## 📱 PWA Support
Open **Air Share** in your mobile browser (Chrome/Safari) and tap **"Add to Home Screen"** to install it as a native-like app.

---
Built with Next.js, Tailwind CSS, and Framer Motion.
