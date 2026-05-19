# Like-TikTok Real-time Streaming Platform

A scalable real-time video streaming platform using **Mediasoup SFU**, **React**, and **Socket.IO**.

## Features

- **Client App**: TikTok-style mobile-first UI for streamers.
- **Admin App**: CCTV-style grid dashboard for monitoring multiple streams.
- **Backend**: Mediasoup SFU for low-latency, high-scalability video forwarding.

## Prerequisites

- Node.js (v16+)
- npm or yarn

## Installation & Running

### 1. Server
```bash
cd server
npm install
node index.js
```

### 2. Client App (Streamer)
```bash
cd client-app
npm install
npm run dev
```

### 3. Admin App (Dashboard)
```bash
cd admin-app
npm install
npm run dev
```

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS 4, Lucide React, Zustand.
- **Backend**: Node.js, Express, Socket.IO, Mediasoup.
- **Signaling**: Socket.IO.
- **Media**: WebRTC (via Mediasoup SFU).

## Architecture

The project uses a Selective Forwarding Unit (SFU) architecture. Each streamer sends one set of media tracks to the server, which then forwards them to any number of authorized viewers (Admin) without re-encoding, ensuring high performance and low latency.
