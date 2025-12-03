import React, { useEffect, useMemo, useState } from "react";
import { Spin, Tag, Select, Alert } from "antd";
import {
  FileText,
  Download,
  Calendar,
  ExternalLink,
  Link2,
  Eye,
  AlertCircle,
  User,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import instance from "../../utils/axiosInstance";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const FILE_HOST = "http://localhost:4000";

type Material = {
  id: number;
  title: string;
  description?: string | null;
  fileName?: string | null;
  filePath?: string | null;
  fileType?: string | null;
  fileSize?: number;
  link?: string | null;
  uploadedAt: string;
  isPublic?: boolean;
  category?: string;
  chapterId?: number;
  downloadCount?: number;
  uploadedBy?: number;
  uploader?: {
    id: number;
    fullName: string;
    email?: string | null;
  };
};

export default function MaterialsStudent({ sectionId: propId }: { sectionId?: number }) {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const sectionId = useMemo(() => propId ?? Number(path.split("/")[3]), [propId, path]);

  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!sectionId) return;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await instance.get<{ success: boolean; data: Material[] }>(
          `/materials/class/${sectionId}/open`,
          { withCredentials: true }
        );
        if (res.data?.success) {
          const list = (res.data.data ?? []).sort(
            (a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)
          );
          setMaterials(list);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải tài liệu:", err);
        setError(err.response?.data?.message || "Không thể tải danh sách tài liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, [sectionId]);

  const filteredMaterials = useMemo(() => {
    if (selectedCategory === "all") return materials;
    return materials.filter((m) => (m.category || "other") === selectedCategory);
  }, [materials, selectedCategory]);

  // Helper functions
  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      lecture: "Bài giảng",
      exercise: "Bài tập",
      reference: "Tài liệu tham khảo",
      exam: "Đề thi",
      other: "Khác",
    };
    return labels[cat] || cat;
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      lecture: "from-blue-500 to-indigo-600",
      exercise: "from-green-500 to-emerald-600",
      reference: "from-purple-500 to-pink-600",
      exam: "from-red-500 to-orange-600",
      other: "from-gray-500 to-slate-600",
    };
    return colors[cat] || colors.other;
  };

  // Categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    materials.forEach((m) => cats.add(m.category || "other"));
    return [
      { value: "all", label: "Tất cả tài liệu" },
      ...Array.from(cats).map((c) => ({
        value: c,
        label: getCategoryLabel(c),
      })),
    ];
  }, [materials]);

  const buildFileUrl = (m: Material) => {
    if (m.link) return m.link;
    if (m.filePath) {
      if (/^https?:\/\//i.test(m.filePath)) return m.filePath;
      return `${FILE_HOST}/${m.filePath.replace(/^\/+/, "")}`;
    }
    if (m.fileName) return `${FILE_HOST}/uploads/${m.fileName}`;
    return "";
  };

  const isExternalLink = (m: Material) => {
    return !!m.link || (m.filePath && /^https?:\/\//i.test(m.filePath));
  };

  // Lấy icon từ /public dựa vào file type
  const getFileIconPath = (m: Material) => {
    if (isExternalLink(m)) return "/public/link.png";

    const mt = (m.fileType || "").toLowerCase();
    const fn = (m.fileName || "").toLowerCase();

    if (mt.includes("pdf") || fn.endsWith(".pdf")) return "/public/pdf.png";
    if (mt.includes("word") || /\.(doc|docx)$/i.test(fn)) return "/public/word.png";
    if (mt.includes("powerpoint") || /\.(ppt|pptx)$/i.test(fn)) return "/public/powerpoint.png";
    if (mt.includes("excel") || /\.(xls|xlsx)$/i.test(fn)) return "/public/excel.png";
    if (mt.startsWith("image/") || /\.(png|jpg|jpeg|gif)$/i.test(fn)) return "/public/image.png";
    if (mt.startsWith("video/") || /\.(mp4|mkv|avi)$/i.test(fn)) return "/public/video.png";
    if (mt.startsWith("audio/") || /\.(mp3|wav)$/i.test(fn)) return "/public/audio.png";
    return "/public/file.png";
  };

  const getFileTypeLabel = (m: Material) => {
    if (isExternalLink(m)) return "LINK";

    const mt = (m.fileType || "").toUpperCase();
    if (mt.includes("PDF") || (m.fileName || "").toLowerCase().endsWith(".pdf")) return "PDF";
    if (mt.includes("WORD") || /\.(doc|docx)$/i.test(m.fileName || "")) return "WORD";
    if (mt.includes("POWERPOINT") || /\.(ppt|pptx)$/i.test(m.fileName || "")) return "PPT";
    if (mt.includes("EXCEL") || /\.(xls|xlsx)$/i.test(m.fileName || "")) return "EXCEL";
    if (mt.startsWith("IMAGE")) return "IMAGE";
    if (mt.startsWith("VIDEO")) return "VIDEO";
    if (mt.startsWith("AUDIO")) return "AUDIO";
    return "FILE";
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Group by category
  const groupedMaterials = useMemo(() => {
    return filteredMaterials.reduce<Record<string, Material[]>>((acc, m) => {
      const cat = m.category || "other";
      (acc[cat] ||= []).push(m);
      return acc;
    }, {});
  }, [filteredMaterials]);

  const MaterialCard = ({ material }: { material: Material }) => {
    const url = buildFileUrl(material);
    const isLink = isExternalLink(material);
    const iconPath = getFileIconPath(material);

    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* File Icon - Fixed size */}
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
              <img
                src={iconPath}
                alt={getFileTypeLabel(material)}
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  // Fallback to default icon if image not found
                  e.currentTarget.src = "/public/file.png";
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title & Category Tag */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  {material.title}
                </h3>
                <Tag
                  bordered={false}
                  className="! m-0 flex-shrink-0"
                  color={isLink ? "blue" : "default"}
                >
                  {getFileTypeLabel(material)}
                </Tag>
              </div>

              {/* File Name - Always visible */}
              <p className="text-sm text-gray-700 font-medium mb-2 break-all">
                {isLink ? (
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 flex-shrink-0" />
                    {material.fileName || "Liên kết bên ngoài"}
                  </span>
                ) : (
                  material.fileName || "Tệp không có tên"
                )}
              </p>

              {/* Description */}
              {material.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {material.description}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3. 5 h-3.5" />
                  <span>{dayjs(material.uploadedAt).format("DD/MM/YYYY")}</span>
                </div>

                {material.uploader && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3. 5" />
                    <span>{material.uploader.fullName}</span>
                  </div>
                )}

                {material.fileSize && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{formatFileSize(material.fileSize)}</span>
                  </div>
                )}

                {material.downloadCount != null && material.downloadCount > 0 && (
                  <div className="flex items-center gap-1. 5">
                    <Download className="w-3.5 h-3.5" />
                    <span>{material.downloadCount} lượt tải</span>
                  </div>
                )}
              </div>

              {/* Action Buttons - Always visible */}
              <div className="flex gap-2">
                {url && (
                  <>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isLink ? (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Mở liên kết
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Xem tài liệu
                        </>
                      )}
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spin size="large" />
          <p className="text-sm text-gray-500">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 ">
      {/* Filter */}
      <div className="mb-6 flex items-center gap-3 bg-white  shadow-sm">
        <span className="text-sm font-medium text-gray-700">Danh mục:</span>
        <Select
          style={{ minWidth: 200 }}
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={categories}
        />
        <span className="ml-auto text-sm text-gray-500">
          {filteredMaterials.length} tài liệu
        </span>
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có tài liệu</h3>
          <p className="text-gray-500 text-sm">
            Giảng viên chưa đăng tải tài liệu nào cho danh mục này
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMaterials)
            .sort((a, b) => {
              const catOrder = ["lecture", "exercise", "reference", "exam", "other"];
              return catOrder.indexOf(a[0]) - catOrder.indexOf(b[0]);
            })
            .map(([category, items]) => (
              <div key={category}>
                {/* Materials Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {items.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}