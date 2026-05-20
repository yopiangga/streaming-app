import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { createWorker, createRouter } from "./mediasoup.js";
import { handleSignaling } from "./signaling.js";

dotenv.config();
if (fs.existsSync(".env.local")) {
  const envConfig = dotenv.parse(fs.readFileSync(".env.local"));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3003;

let worker;
let router;

const startServer = async () => {
  try {
    worker = await createWorker();
    router = await createRouter();

    handleSignaling(io, router  );

    app.get("/streams", (req, res) => {
      // Logic to get active streams is handled via socket,
      // but we can add a REST endpoint as well if needed.
      res.json({
        message: "Use Socket.IO to get active streams for real-time updates",
      });
    });

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
