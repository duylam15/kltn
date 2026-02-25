import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";
import pino from "pino";
import pinoHttp from "pino-http";

import routes from "./routes";
import { notFound } from "./middlewares/notFound";
import errorHandler from "./middlewares/errorHandler";
import { cookieLogger } from "./middlewares/cookieLogger";

const logger = pino({
    transport:
        process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { colorize: true } }
            : undefined,
});

const app = express();

// Middleware
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://quanlyhoctapsgu.cloud",
            "https://www.quanlyhoctapsgu.cloud",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["Set-Cookie"], // ✅ Expose Set-Cookie header
    }),
);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieLogger); // ✅ Add logger

// Routes
app.use("/api/v1", routes);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 + error handler
app.use(notFound);
app.use(errorHandler);

export default app;
