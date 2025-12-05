"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOpenBySection = exports.isOriginalOfRoot = exports.getRootId = exports.pad4 = exports.toInt = void 0;
exports.getMaterials = getMaterials;
exports.getMaterial = getMaterial;
exports.createMaterial = createMaterial;
exports.updateMaterial = updateMaterial;
exports.deleteMaterial = deleteMaterial;
exports.uploadMaterial = uploadMaterial;
exports.assignMaterialToClass = assignMaterialToClass;
exports.getMaterialsByClass = getMaterialsByClass;
exports.updateMaterialVisibility = updateMaterialVisibility;
exports.getMaterialsByTeacher = getMaterialsByTeacher;
exports.listPublicMaterialsGrouped = listPublicMaterialsGrouped;
exports.copyMaterial = copyMaterial;
exports.createMaterialFromLink = createMaterialFromLink;
exports.getMaterialsBySubject = getMaterialsBySubject;
exports.getMaterialsByChapter = getMaterialsByChapter;
const materialService = __importStar(require("./materials.service"));
const client_1 = require("../../../prisma/client");
const bigint_1 = require("../../../utils/bigint");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const response_1 = require("../../../utils/response");
const server_1 = require("../../../server");
async function getMaterials(req, res) {
    try {
        const materials = await materialService.getAllMaterials();
        res.json({ success: true, data: (0, bigint_1.jsonSafe)(materials) });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function getMaterial(req, res) {
    try {
        const id = parseInt(req.params.id);
        const material = await materialService.getMaterialById(id);
        res.json({ success: true, data: (0, bigint_1.jsonSafe)(material) });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function createMaterial(req, res) {
    try {
        const material = await materialService.createMaterial(req.body);
        res.json({ success: true, data: (0, bigint_1.jsonSafe)(material) });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function updateMaterial(req, res) {
    try {
        const id = parseInt(req.params.id);
        const material = await materialService.updateMaterial(id, req.body);
        res.json({ success: true, data: (0, bigint_1.jsonSafe)(material) });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function deleteMaterial(req, res) {
    try {
        const id = parseInt(req.params.id);
        await materialService.deleteMaterial(id);
        res.json({ success: true, message: "Deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function uploadMaterial(req, res) {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ success: false, message: "No file uploaded" });
        }
        const { sectionId, title, description, uploadedBy, originalMaterialId, } = req.body;
        const material = await client_1.prisma.material.create({
            data: {
                title,
                description,
                fileName: req.file.originalname,
                filePath: req.file.path,
                fileSize: BigInt(req.file.size),
                fileType: req.file.mimetype,
                uploadedBy: Number(uploadedBy),
                originalMaterialId: originalMaterialId || Date.now().toString(),
            },
        });
        res.json({ success: true, data: (0, bigint_1.jsonSafe)(material) });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function assignMaterialToClass(req, res) {
    try {
        const { courseSectionId, materialId, assignedBy } = req.body;
        if (!assignedBy) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin assignedBy",
            });
        }
        // ✅ Kiểm tra material có tồn tại không
        const material = await client_1.prisma.material.findUnique({
            where: { id: Number(materialId) },
        });
        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Tài liệu không tồn tại",
            });
        }
        // ✅ Kiểm tra quyền
        const isOwner = material.uploadedBy === Number(assignedBy);
        const isPublic = material.isPublic;
        if (!isOwner && !isPublic) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền gán tài liệu này (chỉ gán được tài liệu của mình hoặc tài liệu public)",
            });
        }
        // ✅ Kiểm tra trùng
        const existing = await client_1.prisma.courseMaterial.findUnique({
            where: {
                courseSectionId_materialId: {
                    courseSectionId: Number(courseSectionId),
                    materialId: Number(materialId),
                },
            },
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Tài liệu này đã được gán vào lớp rồi",
            });
        }
        // ✅ Tạo liên kết và lấy danh sách sinh viên
        const { courseMaterial, studentsNotified } = await materialService.assignMaterialToClass(Number(courseSectionId), Number(materialId), Number(assignedBy));
        // 🔥 Phát thông báo realtime cho toàn bộ lớp
        server_1.io.to(`section_${courseSectionId}`).emit("newMaterial", {
            material: {
                id: courseMaterial.material.id,
                title: courseMaterial.material.title,
                description: courseMaterial.material.description,
                category: courseMaterial.material.category,
                filePath: courseMaterial.material.filePath,
                fileType: courseMaterial.material.fileType,
            },
            section: {
                id: courseMaterial.courseSection.id,
                sectionCode: courseMaterial.courseSection.sectionCode,
                sectionName: courseMaterial.courseSection.sectionName,
                subject: courseMaterial.courseSection.subject,
            },
            assignedBy: {
                id: courseMaterial.assigner.id,
                fullName: courseMaterial.assigner.fullName,
            },
            message: `Tài liệu mới: ${courseMaterial.material.title}`,
            timestamp: new Date(),
        });
        // 🔥 Phát notification riêng cho từng sinh viên
        studentsNotified.forEach((student) => {
            server_1.io.to(`user_${student.userId}`).emit("newNotification", {
                type: "system",
                title: `Tài liệu mới: ${courseMaterial.material.title}`,
                message: `${courseMaterial.assigner.fullName} đã chia sẻ tài liệu mới`,
                sectionId: courseSectionId,
                createdAt: new Date(),
            });
        });
        res.json({
            success: true,
            data: courseMaterial,
            studentsNotified: studentsNotified.length,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function getMaterialsByClass(req, res) {
    try {
        const courseSectionId = parseInt(req.params.courseSectionId);
        const materials = await client_1.prisma.courseMaterial.findMany({
            where: { courseSectionId },
            include: { material: true },
        });
        res.json({
            success: true,
            data: (0, bigint_1.jsonSafe)(materials), // sẽ có { id, courseSectionId, materialId, isOpen, assignedAt, material: {...} }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function updateMaterialVisibility(req, res) {
    try {
        const { courseSectionId, materialId, isOpen } = req.body;
        const updated = await materialService.toggleMaterialVisibility(Number(courseSectionId), Number(materialId), Boolean(isOpen));
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function getMaterialsByTeacher(req, res) {
    try {
        const teacherId = parseInt(req.params.teacherId);
        const materials = await client_1.prisma.material.findMany({
            where: { uploadedBy: teacherId },
            orderBy: { uploadedAt: "desc" },
        });
        res.json({ success: true, data: (0, bigint_1.jsonSafe)(materials) });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
const toInt = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
exports.toInt = toInt;
const pad4 = (id) => String(id).padStart(4, "0");
exports.pad4 = pad4;
// Xác định rootId chuẩn khi cần
const getRootId = (m) => String(m.originalMaterialId ?? `ROOT-MAT-${(0, exports.pad4)(m.id)}`);
exports.getRootId = getRootId;
// Kiểm tra m có phải “bản gốc” của rootId không
const isOriginalOfRoot = (m, rootId) => rootId === `ROOT-MAT-${(0, exports.pad4)(m.id)}`;
exports.isOriginalOfRoot = isOriginalOfRoot;
async function listPublicMaterialsGrouped(req, res, next) {
    try {
        const { keyword = "", type, page = "1", size = "20", userId, } = req.query;
        const p = Math.max(parseInt(page, 10) || 1, 1);
        const s = Math.min(Math.max(parseInt(size, 10) || 20, 1), 100);
        const currentUserId = Number(userId);
        if (!currentUserId || Number.isNaN(currentUserId)) {
            return res
                .status(400)
                .json({ success: false, message: "Thiếu hoặc sai userId" });
        }
        // 1) Lấy tất cả "root" (gốc) mà user hiện tại đã có trong Tủ của tôi
        const myRows = await client_1.prisma.material.findMany({
            where: { uploadedBy: currentUserId },
            select: { id: true, originalMaterialId: true },
        });
        const myRootSet = new Set(myRows.map((m) => String(m.originalMaterialId ?? m.id)));
        // 2) Điều kiện truy vấn danh sách công khai (khác uploader hiện tại)
        const wherePublic = {
            isPublic: true,
            NOT: { uploadedBy: currentUserId }, // không lấy đồ chính mình
        };
        if (type) {
            wherePublic.fileType = String(type);
        }
        if (keyword) {
            wherePublic.OR = [
                { title: { contains: String(keyword), mode: "insensitive" } },
                {
                    description: {
                        contains: String(keyword),
                        mode: "insensitive",
                    },
                },
            ];
        }
        // 3) Lấy dữ liệu công khai (để grouping & lọc tiếp ở bước 4)
        //    Nếu data quá lớn, có thể thêm phân trang ở query này rồi grouping client-side,
        //    nhưng để đúng yêu cầu “lọc root đã có” thì dễ nhất là grouping phía BE trước rồi phân trang.
        const pubRows = await client_1.prisma.material.findMany({
            where: wherePublic,
            include: {
                uploader: { select: { id: true, fullName: true, email: true } },
            },
            orderBy: { uploadedAt: "desc" }, // để khi không có bản gốc thì ưu tiên mới nhất
        });
        // 4) Loại bỏ tất cả tài liệu công khai có root trùng với Tủ của tôi
        const filtered = pubRows.filter((m) => {
            const rootId = String(m.originalMaterialId ?? m.id);
            return !myRootSet.has(rootId);
        });
        // 5) Nhóm theo root, ưu tiên "bản gốc" (m.originalMaterialId == null).
        //    Nếu trong nhóm không có bản gốc thì lấy bản mới nhất (vì đã orderBy desc).
        const byRoot = new Map();
        for (const m of filtered) {
            const rootId = String(m.originalMaterialId ?? m.id);
            const existing = byRoot.get(rootId);
            const isOriginal = m.originalMaterialId == null;
            if (!existing) {
                byRoot.set(rootId, m);
            }
            else {
                const existingIsOriginal = existing.originalMaterialId == null;
                if (!existingIsOriginal && isOriginal) {
                    // Ưu tiên bản gốc nếu có
                    byRoot.set(rootId, m);
                }
                // nếu cả 2 đều không phải bản gốc, giữ cái đã có (đang là bản mới nhất do sort desc)
            }
        }
        const grouped = Array.from(byRoot.values());
        // 6) Phân trang sau khi grouping
        const total = grouped.length;
        const start = (p - 1) * s;
        const end = start + s;
        const pageRows = grouped.slice(start, end);
        // 7) Trả về (BigInt-safe)
        return res.json((0, bigint_1.jsonSafe)({
            success: true,
            data: pageRows.map((m) => ({
                id: m.id,
                title: m.title,
                description: m.description,
                fileName: m.fileName,
                filePath: m.filePath,
                fileType: m.fileType,
                fileSize: m.fileSize, // BigInt -> jsonSafe xử lý
                isPublic: m.isPublic,
                uploadedAt: m.uploadedAt, // Date -> jsonSafe xử lý
                originalMaterialId: m.originalMaterialId ?? null,
                uploader: m.uploader
                    ? {
                        id: m.uploader.id,
                        fullName: m.uploader.fullName,
                        email: m.uploader.email,
                    }
                    : null,
            })),
            pagination: { page: p, size: s, total },
        }));
    }
    catch (e) {
        next(e);
    }
}
async function copyMaterial(req, res, next) {
    try {
        const { materialId, userId } = req.body;
        const srcId = (0, exports.toInt)(materialId);
        const uploaderId = (0, exports.toInt)(userId);
        if (!srcId)
            return res
                .status(400)
                .json({ success: false, message: "Thiếu hoặc sai materialId" });
        if (!uploaderId)
            return res
                .status(400)
                .json({ success: false, message: "Thiếu hoặc sai userId" });
        // Lấy nguồn
        const source = await client_1.prisma.material.findUnique({
            where: { id: srcId },
        });
        if (!source) {
            return res
                .status(404)
                .json({
                success: false,
                message: "Material nguồn không tồn tại",
            });
        }
        // Xác định root của chuỗi sao chép
        const rootId = String(source.originalMaterialId ?? source.id.toString());
        // Tạo bản sao (luôn private, giữ liên kết “gốc”)
        try {
            const cloned = await client_1.prisma.material.create({
                data: {
                    title: source.title,
                    description: source.description,
                    fileName: source.fileName,
                    filePath: source.filePath,
                    fileType: source.fileType,
                    fileSize: source.fileSize,
                    uploadedBy: uploaderId, // thuộc "tủ của tôi"
                    originalMaterialId: rootId, // GIỮ LIÊN KẾT GỐC
                    isPublic: false, // mặc định không công khai
                    ...(typeof source.orderBy !== "undefined"
                        ? { orderBy: source.orderBy }
                        : {}),
                },
            });
            return res
                .status(201)
                .json((0, bigint_1.jsonSafe)({ success: true, data: { cloned } }));
        }
        catch (e) {
            // Nếu bạn đang có unique (uploadedBy, originalMaterialId) để chặn trùng trong tủ
            if (e?.code === "P2002") {
                return res
                    .status(409)
                    .json({
                    success: false,
                    message: "Tài liệu đã tồn tại trong tủ của bạn",
                });
            }
            throw e;
        }
    }
    catch (e) {
        next(e);
    }
}
// chỉ lấy tài liệu mở cho SV theo section
exports.listOpenBySection = (0, catchAsync_1.default)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    if (isNaN(sectionId))
        return next(new ApiError_1.default(400, "Invalid sectionId"));
    // Bước 1: Lấy tất cả tài liệu đã mở
    const rows = await client_1.prisma.courseMaterial.findMany({
        where: {
            courseSectionId: sectionId,
            isOpen: true,
        },
        include: {
            material: {
                include: {
                    uploader: {
                        select: { id: true, fullName: true, email: true },
                    },
                },
            },
            assigner: true, // Người gán (để check xem có phải GV dạy lớp không)
        },
        orderBy: {
            material: { uploadedAt: "desc" },
        },
    });
    // Bước 2: Lọc ở application layer
    const validMaterials = rows
        .filter((row) => {
        const mat = row.material;
        // Giữ lại nếu:
        // 1. Tài liệu vẫn public, HOẶC
        // 2. Tài liệu của chính người gán (GV đã upload)
        return (mat.isPublic === true || mat.uploadedBy === row.assignedBy);
    })
        .map((r) => r.material);
    (0, response_1.sendResponse)(res, { success: true, data: (0, bigint_1.jsonSafe)(validMaterials) });
});
// 🆕 Tạo tài liệu từ link (không cần upload file)
async function createMaterialFromLink(req, res) {
    try {
        const { title, description, link, category, isPublic, uploadedBy, subjectId, chapterId, } = req.body;
        // Validate required fields
        if (!title || !link || !uploadedBy) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin: title, link, uploadedBy là bắt buộc",
            });
        }
        const material = await materialService.createMaterialFromLink({
            title,
            description,
            link, // Chỉ là string, không validate
            category: category || "other",
            isPublic: isPublic === true || isPublic === "true",
            uploadedBy: Number(uploadedBy),
            subjectId: subjectId ? Number(subjectId) : undefined,
            chapterId: chapterId ? Number(chapterId) : undefined,
        });
        res.status(201).json({
            success: true,
            data: (0, bigint_1.jsonSafe)(material),
            message: "Tạo tài liệu từ link thành công",
        });
    }
    catch (error) {
        console.error("❌ Error creating material from link:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi tạo tài liệu từ link",
        });
    }
}
// 🆕 Lấy tài liệu theo môn học
async function getMaterialsBySubject(req, res) {
    try {
        const subjectId = parseInt(req.params.subjectId);
        if (isNaN(subjectId)) {
            return res.status(400).json({
                success: false,
                message: "subjectId không hợp lệ",
            });
        }
        const materials = await materialService.getMaterialsBySubject(subjectId);
        res.json({
            success: true,
            data: (0, bigint_1.jsonSafe)(materials),
            total: materials.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
// 🆕 Lấy tài liệu theo chương
async function getMaterialsByChapter(req, res) {
    try {
        const chapterId = parseInt(req.params.chapterId);
        if (isNaN(chapterId)) {
            return res.status(400).json({
                success: false,
                message: "chapterId không hợp lệ",
            });
        }
        const materials = await materialService.getMaterialsByChapter(chapterId);
        res.json({
            success: true,
            data: (0, bigint_1.jsonSafe)(materials),
            total: materials.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
