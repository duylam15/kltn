import multer from "multer";
import path from "path";
import fs from "fs-extra";

// Đảm bảo thư mục uploads tồn tại
fs.ensureDirSync("uploads/");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                "-" +
                uniqueSuffix +
                path.extname(file.originalname)
        );
    },
});

function fileFilter(req: any, file: Express.Multer.File, cb: any) {
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
    const ext = path.extname(file.originalname).toLowerCase();
    const base = file.originalname.toLowerCase();

    if (ext === ".gz" && base.endsWith(".tar.gz")) {
        return cb(null, true);
    }
    if (!allowed.includes(ext)) {
        return cb(new Error("File type not allowed"), false);
    }
    cb(null, true);
}

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter,
});

export default upload;
