"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const routes_1 = __importDefault(require("./routes"));
const notFound_1 = require("./middlewares/notFound");
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const cookieLogger_1 = require("./middlewares/cookieLogger");
const logger = (0, pino_1.default)({
    transport: process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
});
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"], // ✅ Expose Set-Cookie header
}));
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.use((0, cookie_parser_1.default)());
app.use((0, pino_http_1.default)({ logger }));
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(cookieLogger_1.cookieLogger); // ✅ Add logger
// Routes
app.use("/api/v1", routes_1.default);
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});
// 404 + error handler
app.use(notFound_1.notFound);
app.use(errorHandler_1.default);
exports.default = app;
