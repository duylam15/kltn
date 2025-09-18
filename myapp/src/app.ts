import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
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

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
