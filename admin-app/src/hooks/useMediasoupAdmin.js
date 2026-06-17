import { useEffect, useRef } from "react";
import io from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import useAdminStore from "../store/useAdminStore";

// const SERVER_URL = "https://stream.mogiro.site";
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3003";

export const useMediasoupAdmin = () => {
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const consumeTransportRef = useRef(null);
  const isLoadingDeviceRef = useRef(false);
  const isCreatingTransportRef = useRef(false);

  const { setStatus, setSocketId, addStream, removeStream, setActiveStreams } =
    useAdminStore();

  useEffect(() => {
    console.log("Initializing admin socket connection to:", SERVER_URL);
    socketRef.current = io(SERVER_URL);

    socketRef.current.on("connection-success", async ({ socketId }) => {
      console.log("Connected as admin:", socketId);
      setSocketId(socketId);
      setStatus("Connected");

      // Initial load of active streams
      socketRef.current.emit("get-active-streams", async (streams) => {
        console.log("Existing streams:", streams.length);
        for (const streamInfo of streams) {
          await consumeStream(streamInfo);
        }
      });
    });

    socketRef.current.on("new-stream", async (streamInfo) => {
      console.log("New stream detected:", streamInfo.socketId);
      await consumeStream(streamInfo);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Admin socket connection error:", error);
    });

    socketRef.current.on("stream-closed", ({ socketId }) => {
      console.log("Stream closed:", socketId);
      removeStream(socketId);
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
    const device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities });
    deviceRef.current = device;
    console.log("Mediasoup device loaded for admin");
    return device;
  };

  const createRecvTransport = async () => {
    return new Promise((resolve) => {
      console.log("Creating receive transport...");
      socketRef.current.emit(
        "createWebRtcTransport",
        { sender: false },
        async ({ params }) => {
          if (params.error) {
            console.error("Recv transport error:", params.error);
            return;
          }
          const transport = deviceRef.current.createRecvTransport(params);

          transport.on(
            "connect",
            async ({ dtlsParameters }, callback, errback) => {
              try {
                console.log("Recv transport connecting...");
                socketRef.current.emit("transport-connect", { dtlsParameters });
                callback();
              } catch (error) {
                errback(error);
              }
            },
          );

          transport.on("connectionstatechange", (state) => {
            console.log("Recv transport connection state:", state);
            if (state === "failed") {
              console.error(
                "WebRTC Recv Transport failed! Check ICE/NAT configuration on server.",
              );
              transport.close();
            }
          });

          consumeTransportRef.current = transport;
          resolve(transport);
        },
      );
    });
  };

  const consumeStream = async ({ socketId, producerId, kind, streamerName, latitude, longitude }) => {
    try {
      // Ensure device is loaded
      while (isLoadingDeviceRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!deviceRef.current) {
        isLoadingDeviceRef.current = true;
        try {
          const routerRtpCapabilities = await getRouterRtpCapabilities();
          await createDevice(routerRtpCapabilities);
        } finally {
          isLoadingDeviceRef.current = false;
        }
      }

      // Ensure transport is created
      while (isCreatingTransportRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!consumeTransportRef.current) {
        isCreatingTransportRef.current = true;
        try {
          await createRecvTransport();
        } finally {
          isCreatingTransportRef.current = false;
        }
      }

      const { rtpCapabilities } = deviceRef.current;

      socketRef.current.emit(
        "transport-consume",
        {
          rtpCapabilities,
          remoteProducerId: producerId,
        },
        async ({ params }) => {
          if (params.error) {
            console.error("Cannot consume:", params.error);
            return;
          }

          const consumer = await consumeTransportRef.current.consume(params);

          console.log("Consumer paused (before):", consumer.paused);

          await consumer.resume();

          console.log("Consumer paused (after):", consumer.paused);

          socketRef.current.emit("consumer-resume", {
            consumerId: consumer.id,
          });

          const { track } = consumer;
          const stream = new MediaStream([track]);

          addStream({
            socketId,
            producerId,
            kind,
            streamerName,
            latitude,
            longitude,
            stream,
            consumer,
          });
        },
      );
    } catch (error) {
      console.error("Consume failed:", error);
    }
  };

  return { consumeStream };
};
