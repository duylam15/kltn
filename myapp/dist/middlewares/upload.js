"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// Đảm bảo thư mục uploads tồn tại
fs_extra_1.default.ensureDirSync("uploads/");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname +
            "-" +
            uniqueSuffix +
            path_1.default.extname(file.originalname));
    },
});
function fileFilter(req, file, cb) {
    const allowed = [
        ".zip",
        ".rar",
        ".pdf",
        ".doc",
        ".docx",
        ".ppt",
        ".pptx",
        ".mp4",
    ];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const base = file.originalname.toLowerCase();
    if (ext === ".gz" && base.endsWith(".tar.gz")) {
        return cb(null, true);
    }
    if (!allowed.includes(ext)) {
        return cb(new Error("File type not allowed"), false);
    }
    cb(null, true);
}
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter,
});
exports.default = upload;
