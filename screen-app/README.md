# screen-app

A React app that **shares your screen** and streams it to the same mediasoup
signaling server as `client-app`. The stream shows up in `admin-app`
automatically — the server relays any producer generically, so no server or
admin changes are needed.

It mirrors `client-app`, with one difference: it captures the screen with
`navigator.mediaDevices.getDisplayMedia()` instead of the camera with
`getUserMedia()`. System/tab audio is captured too when the browser/OS allows it.

## Run

```bash
cd screen-app
npm install
npm run dev
```

The dev server runs on port `5174` (see `.env.local`) to avoid clashing with
`client-app` on `5173`. Set `VITE_SERVER_URL` to your signaling server.

## How it works

1. `useScreenShare` connects to the server over Socket.IO.
2. On "Share Screen", it calls `getDisplayMedia`, loads a mediasoup device,
   creates a send transport, and **produces** the screen video (and audio) track.
3. The server emits `new-stream` to admins, who consume it like any other stream.
4. Stopping (button, or the browser's native "Stop sharing" bar) closes the
   producers and transport.

## Notes

- Screen capture requires a **secure context**: `localhost` or HTTPS. Over plain
  HTTP on a LAN IP, `getDisplayMedia` is unavailable.
- Screen sharing is a desktop-browser feature; most mobile browsers don't
  support `getDisplayMedia`.
