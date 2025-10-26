import multer from "multer";
import path from "path";

// Nơi lưu file (uploads/)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // nhớ tạo sẵn thư mục uploads/ trong dự án
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// Giới hạn & validate loại file
function fileFilter(req: any, file: Express.Multer.File, cb: any) {
    // nếu dùng cho bài project code → cho phép .zip
    const allowed = [
        ".zip",
        ".rar",
        ".tar.gz",
        ".pdf",
        ".doc",
        ".docx",
        ".ppt",
        ".pptx",
        ".mp4",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
        return cb(new Error("File type not allowed"), false);
    }
    cb(null, true);
}

const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
    },
    fileFilter,
});

export default upload;
