import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Video,
  Music,
  File,
  FolderOpen,
  Search,
  ChevronDown,
  ExternalLink,
  Download,
  Calendar,
  BookOpen,
  AlertCircle,
  X,
  Eye,
  LayoutGrid,
  List as ListIcon,
  ChevronsUpDown,
  Sparkles,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const API_BASE = "http://localhost:4000/api/v1";
const FILE_HOST = "http://localhost:4000";
const PREVIEW_HOST = `${FILE_HOST}/uploads`;

type Material = {
  id: number;
  title: string;
  description?: string | null;
  fileName?: string | null;
  filePath?: string | null;
  fileType?: string | null;
  uploadedAt: string;
  isPublic?: boolean;
  uploadedBy?: number;
};

type FileCategory = "ALL" | "PDF" | "SLIDE" | "DOC" | "MEDIA";

export default function MaterialsStudent({
  sectionId: propId,
}: {
  sectionId?: number;
}) {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const sectionId = useMemo(
    () => propId ?? Number(path.split("/")[3]),
    [propId, path]
  );

  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<string>("Tất cả");
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [error, setError] = useState<string>("");

 useEffect(() => {
    if (!sectionId) return;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("token") ||
          sessionStorage.getItem("accessToken");

        const res = await axios.get<{ success: boolean; data: Material[] }>(
          `${API_BASE}/materials/class/${sectionId}/open`,
          {
            withCredentials: true,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (res.data?.success) {
          const list = (res.data.data ?? []).sort(
            (a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)
          );
          setMaterials(list);
          setExpandedIds(new Set());
        }
      } catch (err: any) {
        console.error("Lỗi khi tải tài liệu:", err);
        setError(
          err.response?.data?.message || "Không thể tải danh sách tài liệu"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [sectionId]);
  // Helpers xử lý đường dẫn và định dạng tệp
  const buildFileUrl = (m: Material) => {
    if (m.filePath) {
      if (/^https?:\/\//i.test(m.filePath)) return m.filePath;
      return `${FILE_HOST}/${m.filePath.replace(/^\/+/, "")}`;
    }
    if (m.fileName) return `${FILE_HOST}/uploads/${m.fileName}`;
    return "";
  };

  const getFileMeta = (m: Material) => {
    const mt = (m.fileType || "").toLowerCase();
    const fn = (m.fileName || "").toLowerCase();

    if (mt.includes("pdf") || fn.endsWith(".pdf")) {
      return {
        category: "PDF" as FileCategory,
        label: "PDF",
        icon: FileText,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        iconBg: "bg-rose-50 text-rose-600 border-rose-100",
        canInlinePreview: true,
        previewKind: "pdf" as const,
      };
    }
    if (mt.includes("powerpoint") || /\.(ppt|pptx)$/i.test(fn)) {
      return {
        category: "SLIDE" as FileCategory,
        label: "SLIDE",
        icon: Presentation,
        badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
        iconBg: "bg-orange-50 text-orange-600 border-orange-100",
        canInlinePreview: false,
        previewKind: "none" as const,
      };
    }
    if (mt.includes("word") || /\.(doc|docx)$/i.test(fn)) {
      return {
        category: "DOC" as FileCategory,
        label: "WORD",
        icon: FileText,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        iconBg: "bg-blue-50 text-blue-600 border-blue-100",
        canInlinePreview: false,
        previewKind: "none" as const,
      };
    }
    if (mt.includes("excel") || /\.(xls|xlsx|csv)$/i.test(fn)) {
      return {
        category: "DOC" as FileCategory,
        label: "EXCEL",
        icon: FileSpreadsheet,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
        canInlinePreview: false,
        previewKind: "none" as const,
      };
    }
    if (mt.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(fn)) {
      return {
        category: "MEDIA" as FileCategory,
        label: "HÌNH ẢNH",
        icon: ImageIcon,
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        iconBg: "bg-purple-50 text-purple-600 border-purple-100",
        canInlinePreview: true,
        previewKind: "image" as const,
      };
    }
    if (mt.startsWith("video/") || /\.(mp4|mkv|avi|mov|webm)$/i.test(fn)) {
      return {
        category: "MEDIA" as FileCategory,
        label: "VIDEO",
        icon: Video,
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
        canInlinePreview: true,
        previewKind: "video" as const,
      };
    }
    if (mt.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/i.test(fn)) {
      return {
        category: "MEDIA" as FileCategory,
        label: "AUDIO",
        icon: Music,
        badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
        iconBg: "bg-cyan-50 text-cyan-600 border-cyan-100",
        canInlinePreview: true,
        previewKind: "audio" as const,
      };
    }
    return {
      category: "DOC" as FileCategory,
      label: (m.fileType || "TỆP").toUpperCase(),
      icon: File,
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      iconBg: "bg-slate-100 text-slate-600 border-slate-200",
      canInlinePreview: false,
      previewKind: "none" as const,
    };
  };

  const previewImageFor = (m: Material) => {
    const fn = (m.fileName || "").toLowerCase();
    const mt = (m.fileType || "").toLowerCase();
    if (mt.includes("pdf") || fn.endsWith(".pdf"))
      return `${PREVIEW_HOST}/imagesPDF.png`;
    if (mt.includes("powerpoint") || /\.(ppt|pptx)$/i.test(fn))
      return `${PREVIEW_HOST}/imagePP.png`;
    if (mt.includes("word") || /\.(doc|docx)$/i.test(fn))
      return `${PREVIEW_HOST}/imageDOC.png`;
    if (mt.includes("excel") || /\.(xls|xlsx|csv)$/i.test(fn))
      return `${PREVIEW_HOST}/imageExcel.png`;
    if (mt.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/i.test(fn))
      return `${PREVIEW_HOST}/imageAudio.png`;
    if (mt.startsWith("video/") || /\.(mp4|mkv|avi|mov|webm)$/i.test(fn))
      return `${PREVIEW_HOST}/imageVideo.png`;
    if (mt.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(fn)) {
      const url = buildFileUrl(m);
      return url || `${PREVIEW_HOST}/imageTemp.jpg`;
    }
    return `${PREVIEW_HOST}/imageTemp.jpg`;
  };

  // Danh sách chủ đề từ title
  const topics = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => set.add(m.title?.trim() || "Khác"));
    return ["Tất cả", ...Array.from(set)];
  }, [materials]);

  // Lọc theo chủ đề, định dạng & từ khóa tìm kiếm
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const topicMatch =
        selectedTopic === "Tất cả" ||
        (m.title?.trim() || "Khác") === selectedTopic;

      const meta = getFileMeta(m);
      const categoryMatch =
        selectedCategory === "ALL" || meta.category === selectedCategory;

      const query = searchQuery.toLowerCase().trim();
      const searchMatch =
        !query ||
        (m.title || "").toLowerCase().includes(query) ||
        (m.description || "").toLowerCase().includes(query) ||
        (m.fileName || "").toLowerCase().includes(query);

      return topicMatch && categoryMatch && searchMatch;
    });
  }, [materials, selectedTopic, selectedCategory, searchQuery]);

  // Nhóm tài liệu theo chủ đề
  const groups = useMemo(() => {
    return filteredMaterials.reduce<Record<string, Material[]>>((acc, m) => {
      const key = (m.title || "Khác").trim().toLowerCase();
      (acc[key] ||= []).push(m);
      return acc;
    }, {});
  }, [filteredMaterials]);

  const titleLabel = useMemo(() => {
    const map: Record<string, string> = {};
    filteredMaterials.forEach((m) => {
      const key = (m.title || "Khác").trim().toLowerCase();
      if (!map[key]) map[key] = m.title || "Khác";
    });
    return map;
  }, [filteredMaterials]);

  const orderedGroups = useMemo(
    () =>
      Object.entries(groups).sort(
        (a, b) =>
          +new Date(b[1][0]?.uploadedAt || 0) -
          +new Date(a[1][0]?.uploadedAt || 0)
      ),
    [groups]
  );

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (expandedIds.size === filteredMaterials.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredMaterials.map((m) => m.id)));
    }
  };

  const isRecent = (dateStr: string) =>
    dayjs().diff(dayjs(dateStr), "day") <= 3;

  // Loading Skeleton
  if (loading) {
    return (
      <div className="w-full px-6 py-6 space-y-5">
        <div className="h-20 bg-slate-100 animate-pulse rounded-2xl border border-slate-200/60" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg"
            />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-slate-100/80 animate-pulse rounded-xl border border-slate-200/60"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-5 space-y-5">
      {/* Compact Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-900 leading-snug">
                Tài liệu học tập
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                {materials.length} tài liệu
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kho học liệu, bài giảng và tài nguyên được giảng viên chia sẻ cho lớp học phần
            </p>
          </div>
        </div>

        {/* Search & View Switcher */}
        {materials.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm tên tài liệu, mô tả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {viewMode === "list" && filteredMaterials.length > 1 && (
              <button
                onClick={toggleExpandAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                title="Mở rộng hoặc thu gọn tất cả"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {expandedIds.size === filteredMaterials.length
                    ? "Thu gọn"
                    : "Mở tất cả"}
                </span>
              </button>
            )}

            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Hiển thị dạng danh sách"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Hiển thị dạng lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bộ lọc chủ đề & Định dạng tệp */}
      {materials.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200/80">
          {/* Chủ đề */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-medium text-slate-400 mr-1 shrink-0">
              Chủ đề:
            </span>
            {topics.map((topic) => {
              const active = selectedTopic === topic;
              return (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-slate-50/70 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>

          {/* Định dạng */}
          <div className="flex items-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
            {(
              [
                { id: "ALL", label: "Tất cả" },
                { id: "PDF", label: "PDF" },
                { id: "SLIDE", label: "Slide" },
                { id: "DOC", label: "Tài liệu" },
                { id: "MEDIA", label: "Media" },
              ] as { id: FileCategory; label: string }[]
            ).map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    active
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Danh sách tài liệu */}
      {filteredMaterials.length === 0 ? (
        <div className="w-full bg-white rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {searchQuery || selectedTopic !== "Tất cả" || selectedCategory !== "ALL"
              ? "Không tìm thấy tài liệu phù hợp"
              : "Chưa có tài liệu khả dụng"}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || selectedTopic !== "Tất cả" || selectedCategory !== "ALL"
              ? "Thử thay đổi từ khóa tìm kiếm, định dạng hoặc chọn chủ đề khác."
              : "Giảng viên chưa đăng tải tài liệu nào cho lớp học phần này."}
          </p>
          {(searchQuery ||
            selectedTopic !== "Tất cả" ||
            selectedCategory !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTopic("Tất cả");
                setSelectedCategory("ALL");
              }}
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-7">
          {orderedGroups.map(([gkey, items]) => (
            <section key={gkey} className="space-y-3">
              {/* Tiêu đề chủ đề */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    {titleLabel[gkey] || "Khác"}
                  </h2>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                    {items.length}
                  </span>
                </div>
              </div>

              {/* VIEW MODE: GRID */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((m) => {
                    const url = buildFileUrl(m);
                    const meta = getFileMeta(m);
                    const FileIcon = meta.icon;

                    return (
                      <div
                        key={m.id}
                        className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col overflow-hidden"
                      >
                        <div className="relative h-36 bg-slate-100 border-b border-slate-100 overflow-hidden">
                          <img
                            src={previewImageFor(m)}
                            alt={m.fileName || m.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-white/95 backdrop-blur-xs shadow-2xs ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </span>
                            {isRecent(m.uploadedAt) && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500 text-white shadow-2xs flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Mới
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-start gap-2">
                              <FileIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                                {m.description || m.fileName || "Tài liệu học tập"}
                              </h3>
                            </div>
                            {m.fileName && m.description && (
                              <p className="text-xs text-slate-500 mt-1 truncate">
                                {m.fileName}
                              </p>
                            )}
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {dayjs(m.uploadedAt).format("DD/MM/YYYY")}
                            </span>

                            {url && (
                              <div className="flex items-center gap-1.5">
                                {meta.canInlinePreview && (
                                  <button
                                    onClick={() => setPreviewMaterial(m)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Xem
                                  </button>
                                )}
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Mở tab mới"
                                  className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={url}
                                  download={m.fileName || true}
                                  title="Tải xuống"
                                  className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* VIEW MODE: LIST (ACCORDION) */
                <div className="space-y-2.5">
                  {items.map((m) => {
                    const isOpen = expandedIds.has(m.id);
                    const url = buildFileUrl(m);
                    const meta = getFileMeta(m);
                    const FileIcon = meta.icon;

                    return (
                      <div
                        key={m.id}
                        className={`bg-white rounded-xl border transition-all overflow-hidden ${
                          isOpen
                            ? "border-blue-300 shadow-xs ring-1 ring-blue-500/10"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Hàng tiêu đề */}
                        <div
                          onClick={() => toggleExpand(m.id)}
                          className="p-3.5 sm:p-4 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/70 transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div
                              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.iconBg}`}
                            >
                              <FileIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {m.description ||
                                    m.fileName ||
                                    "(Không có mô tả)"}
                                </p>
                                {isRecent(m.uploadedAt) && (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Mới
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border ${meta.badgeClass}`}
                                >
                                  {meta.label}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {dayjs(m.uploadedAt).format("DD/MM/YYYY")}
                                  <span className="text-slate-400">
                                    ({dayjs(m.uploadedAt).fromNow()})
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {url && !isOpen && (
                              <a
                                href={url}
                                download={m.fileName || true}
                                onClick={(e) => e.stopPropagation()}
                                title="Tải nhanh"
                                className="hidden sm:inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                                isOpen ? "rotate-180 text-blue-600" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Nội dung chi tiết khi mở rộng */}
                        {isOpen && (
                          <div className="px-4 pb-4 pt-3 bg-slate-50/70 border-t border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200/80">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <img
                                  src={previewImageFor(m)}
                                  alt={m.fileName || "preview"}
                                  className="w-24 h-16 object-cover rounded-lg border border-slate-200/80 bg-slate-100 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 truncate">
                                    {m.fileName || "(Không có tên tệp)"}
                                  </p>
                                  {m.description && m.fileName && (
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 whitespace-pre-wrap">
                                      {m.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {url && (
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  {meta.canInlinePreview && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewMaterial(m);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      Xem nhanh
                                    </button>
                                  )}
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Mở tài liệu
                                  </a>
                                  <a
                                    href={url}
                                    download={m.fileName || true}
                                    onClick={(e) => e.stopPropagation()}
                                    title="Tải xuống"
                                    className="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Modal Xem nhanh (PDF / Ảnh / Video / Audio) */}
      {previewMaterial && (
        <div
          onClick={() => setPreviewMaterial(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {previewMaterial.description || previewMaterial.fileName}
                </h3>
                {previewMaterial.fileName && (
                  <p className="text-xs text-slate-500 truncate">
                    {previewMaterial.fileName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={buildFileUrl(previewMaterial)}
                  download={previewMaterial.fileName || true}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải về
                </a>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-4 min-h-[420px]">
              {(() => {
                const meta = getFileMeta(previewMaterial);
                const url = buildFileUrl(previewMaterial);
                if (meta.previewKind === "pdf") {
                  return (
                    <iframe
                      src={url}
                      title={previewMaterial.fileName || "PDF Preview"}
                      className="w-full h-[70vh] rounded-lg bg-white border border-slate-200"
                    />
                  );
                }
                if (meta.previewKind === "image") {
                  return (
                    <img
                      src={url}
                      alt={previewMaterial.fileName || "Preview"}
                      className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm"
                    />
                  );
                }
                if (meta.previewKind === "video") {
                  return (
                    <video
                      src={url}
                      controls
                      className="max-h-[70vh] max-w-full rounded-lg bg-black"
                    />
                  );
                }
                if (meta.previewKind === "audio") {
                  return (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
                        <Music className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-medium text-slate-800">
                        {previewMaterial.fileName}
                      </p>
                      <audio src={url} controls className="w-80" />
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}