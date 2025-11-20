// uploadAvatar.ts
import multer from "multer";

const storage = multer.memoryStorage();

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // ví dụ 5MB
}).single("file"); // 👈 TÊN FIELD = "file"
