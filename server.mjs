import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from the welp directory
dotenv.config({ path: path.join(__dirname, ".env.local") });
dotenv.config({ path: path.join(__dirname, ".env") });

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import mongoose from "mongoose";
import { initSocket } from "./src/lib/socketServer.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const mongoUri = process.env.MONGOURI || process.env.MONGO_URI;
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log("📦 Connected to MongoDB from unified server");
    } catch (err) {
      console.error("❌ MongoDB connection error:", err.message);
    }
  } else {
    console.warn("⚠️ Warning: MONGOURI environment variable is not defined in .env.local");
  }

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Initialize socket.io using shared socketServer
  initSocket(server);

  server.listen(port, () => {
    console.log(`> Welp WFH Virtual Office ready on http://${hostname}:${port}`);
  });
});
