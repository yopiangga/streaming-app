import { useEffect, useRef } from "react";
import io from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import useStreamStore from "../store/useStreamStore";

// const SERVER_URL = "https://stream.mogiro.site";
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3003";

export const useMediasoup = () => {
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const producerTransportRef = useRef(null);
  const videoProducerRef = useRef(null);
  const audioProducerRef = useRef(null);
  const {
    setStatus,
    setSocketId,
    setLive,
    setStream,
    facingMode,
    setFacingMode,
  } = useStreamStore();

  useEffect(() => {
    console.log("Initializing socket connection to:", SERVER_URL);
    socketRef.current = io(SERVER_URL);

    socketRef.current.on("connection-success", ({ socketId }) => {
      console.log("Connected to server:", socketId);
      setSocketId(socketId);
      setStatus("Disconnected");
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const getRouterRtpCapabilities = () => {
    return new Promise((resolve) => {
      socketRef.current.emit("getRouterRtpCapabilities", (data) => {
        resolve(data);
      });
    });
  };

  const createDevice = async (routerRtpCapabilities) => {
    try {
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities });
      deviceRef.current = device;
      console.log("Mediasoup device loaded");
      return device;
    } catch (error) {
      console.error("Error creating device:", error);
    }
  };

  const createSendTransport = async () => {
    return new Promise((resolve) => {
      console.log("Creating send transport...");
      socketRef.current.emit(
        "createWebRtcTransport",
        { sender: true },
        async ({ params }) => {
          if (params.error) {
            console.error("Transport creation error:", params.error);
            return;
          }

          const transport = deviceRef.current.createSendTransport(params);

          transport.on(
            "connect",
            async ({ dtlsParameters }, callback, errback) => {
              try {
                console.log("Transport connecting...");
                socketRef.current.emit("transport-connect", { dtlsParameters });
                callback();
              } catch (error) {
                errback(error);
              }
            },
          );

          transport.on(
            "produce",
            async ({ kind, rtpParameters, appData }, callback, errback) => {
              try {
                console.log(`Transport producing ${kind}...`);
                socketRef.current.emit(
                  "transport-produce",
                  { kind, rtpParameters, appData },
                  ({ id }) => {
                    callback({ id });
                  },
                );
              } catch (error) {
                errback(error);
              }
            },
          );

          transport.on("connectionstatechange", (state) => {
            console.log("Send transport connection state:", state);
            if (state === "failed") {
              console.error(
                "WebRTC Transport failed! Check ICE/NAT configuration on server.",
              );
              transport.close();
            }
          });

          producerTransportRef.current = transport;
          resolve(transport);
        },
      );
    });
  };

  const startStream = async () => {
    try {
      const streamerName = useStreamStore.getState().streamerName?.trim();
      if (!streamerName) {
        console.warn("Streamer name is required before going live.");
        return;
      }

      setStatus("Connecting");

      // Try to get the streamer's geolocation (non-blocking on failure)
      const location = await new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ latitude: null, longitude: null });
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          (err) => {
            console.warn("Geolocation unavailable:", err.message);
            resolve({ latitude: null, longitude: null });
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          // facingMode: useStreamStore.getState().facingMode
          facingMode: "environment",
        },
        audio: true,
      });

      setStream(stream);

      const routerRtpCapabilities = await getRouterRtpCapabilities();
      await createDevice(routerRtpCapabilities);
      await createSendTransport();

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack) {
        videoProducerRef.current = await producerTransportRef.current.produce({
          track: videoTrack,
          appData: { streamerName, ...location },
        });
      }

      if (audioTrack) {
        audioProducerRef.current = await producerTransportRef.current.produce({
          track: audioTrack,
          appData: { streamerName, ...location },
        });
      }

      setStatus("Live");
      setLive(true);
    } catch (error) {
      console.error("Start stream failed:", error);
      setStatus("Disconnected");
    }
  };

  const stopStream = () => {
    if (videoProducerRef.current) videoProducerRef.current.close();
    if (audioProducerRef.current) audioProducerRef.current.close();
    if (producerTransportRef.current) producerTransportRef.current.close();

    const { stream } = useStreamStore.getState();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setStream(null);
    setLive(false);
    setStatus("Disconnected");
  };

  const switchCamera = async () => {
    try {
      const storeState = useStreamStore.getState();
      const currentFacingMode = storeState.facingMode;
      const newFacingMode =
        currentFacingMode === "user" ? "environment" : "user";
      setFacingMode(newFacingMode);

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: newFacingMode,
        },
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      const currentStoreState = useStreamStore.getState();
      const currentStream = currentStoreState.stream;

      if (currentStream) {
        const oldVideoTrack = currentStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          currentStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        currentStream.addTrack(newVideoTrack);
        // Force update UI by creating a new MediaStream reference
        setStream(new MediaStream(currentStream.getTracks()));
      }

      if (currentStoreState.isLive && videoProducerRef.current) {
        await videoProducerRef.current.replaceTrack({ track: newVideoTrack });
      }
    } catch (error) {
      console.error("Failed to switch camera:", error);
    }
  };

  return { startStream, stopStream, switchCamera, videoProducerRef, audioProducerRef };
};
