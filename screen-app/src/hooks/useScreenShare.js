import { useEffect, useRef } from "react";
import io from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import useScreenStore from "../store/useScreenStore";

// const SERVER_URL = "https://stream.mogiro.site";
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3003";

export const useScreenShare = () => {
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const producerTransportRef = useRef(null);
  const videoProducerRef = useRef(null);
  const audioProducerRef = useRef(null);

  const { setStatus, setSocketId, setLive, setStream, setHasAudio } =
    useScreenStore();

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
      setStatus("Connecting");

      // Capture the screen (and system/tab audio if the user allows it).
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      setStream(stream);

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      setHasAudio(!!audioTrack);

      // If the user stops sharing via the browser's native "Stop sharing" bar,
      // tear everything down so we don't keep a dead producer alive.
      if (videoTrack) {
        videoTrack.addEventListener("ended", () => stopStream());
      }

      const routerRtpCapabilities = await getRouterRtpCapabilities();
      await createDevice(routerRtpCapabilities);
      await createSendTransport();

      if (videoTrack) {
        videoProducerRef.current = await producerTransportRef.current.produce({
          track: videoTrack,
        });
      }

      if (audioTrack) {
        audioProducerRef.current = await producerTransportRef.current.produce({
          track: audioTrack,
        });
      }

      setStatus("Live");
      setLive(true);
    } catch (error) {
      console.error("Start screen share failed:", error);
      setStatus("Disconnected");
    }
  };

  const stopStream = () => {
    if (videoProducerRef.current) {
      videoProducerRef.current.close();
      videoProducerRef.current = null;
    }
    if (audioProducerRef.current) {
      audioProducerRef.current.close();
      audioProducerRef.current = null;
    }
    if (producerTransportRef.current) {
      producerTransportRef.current.close();
      producerTransportRef.current = null;
    }

    const { stream } = useScreenStore.getState();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setStream(null);
    setLive(false);
    setHasAudio(false);
    setStatus("Disconnected");
  };

  return { startStream, stopStream };
};
