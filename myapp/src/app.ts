import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import pino from "pino";
import pinoHttp from "pino-http";
import routes from "./routes";
import { notFound } from "./middlewares/notFound";
import errorHandler from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import path from "path";

const logger = pino({
    transport:
        process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { colorize: true } }
            : undefined,
});

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173", // 👈 FE chạy trên Vite
        credentials: true, // 👈 Cho phép gửi cookie
    })
);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(cookieParser()); 
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
