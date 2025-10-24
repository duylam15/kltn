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

const logger = pino({
    transport:
        process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { colorize: true } }
            : undefined,
});

const app = express();

app.set("trust proxy", true);

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
