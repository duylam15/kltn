import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  HelpCircle,
  FolderGit2,
  Award,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  CalendarClock,
  ListChecks,
  Trophy,
  Timer,
  ArrowRight,
  Lock,
  AlertCircle,
  BookCheck,
  X,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

type AssignmentType = "exercise" | "quiz" | "project" | "exam";
type AssignmentStatus = "not_started" | "in_progress" | "completed" | "overdue";

interface Section {
  id: number;
}

interface Submission {
  id: number;
  startedAt: string | null;
  completedAt: string | null;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  autoGraded: boolean;
  feedback: string | null;
  gradedAt: string | null;
  answeredQuestions: number;
  progress: number;
}

interface Assignment {
  id: number;
  title: string;
  description: string | null;
  type: AssignmentType;
  dueDate: string | null;
  maxScore: number;
  passingScore: number | null;
  timeLimit: number | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  showAnswersAfterSubmit: boolean;
  allowLateSubmission: boolean;
  createdAt: string;
  updatedAt: string;
  section: Section;
  assignedAt: string | null;
  isOpen: boolean;
  totalQuestions: number;
  totalPoints: number;
  submission: Submission | null;
  status: AssignmentStatus;
  isOverdue: boolean;
  isCompleted: boolean;
  canSubmit: boolean;
}

interface ApiResponse {
  success: boolean;
  data: Assignment[];
  total: number;
}

export default function AssignmentsStudent() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | AssignmentStatus>("all");
  const [filterType, setFilterType] = useState<"all" | AssignmentType>("all");

  const { user } = useAuth();
  const studentId = user?.student?.id;
  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);
  const navigate = useNavigate();

  useEffect(() => {
    if (sectionId && studentId) {
      fetchAssignments();
    }
  }, [sectionId, studentId]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/v1/assignments/section/${sectionId}/student/${studentId}`,
        {
          credentials: "include",
        }
      );
      const data: ApiResponse = await res.json();
      if (data.success) {
        setAssignments(data.data);
      } else {
        setError("Không thể tải danh sách bài tập");
      }
    } catch (err) {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch =
        !searchTerm.trim() ||
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || a.status === filterStatus;
      const matchesType = filterType === "all" || a.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [assignments, searchTerm, filterStatus, filterType]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Không giới hạn";
    const date = dayjs(dateString);
    const now = dayjs();
    const diffDays = date.startOf("day").diff(now.startOf("day"), "day");

    if (diffDays === 0) return `Hôm nay, ${date.format("HH:mm")}`;
    if (diffDays === 1) return `Ngày mai, ${date.format("HH:mm")}`;
    if (diffDays === -1) return `Hôm qua, ${date.format("HH:mm")}`;
    return date.format("DD/MM/YYYY • HH:mm");
  };

  const getTypeMeta = (type: AssignmentType) => {
    const map = {
      exercise: {
        label: "Bài tập",
        icon: FileText,
        badge: "bg-slate-100 text-slate-700 border-slate-200/80",
      },
      quiz: {
        label: "Kiểm tra",
        icon: HelpCircle,
        badge: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
      },
      project: {
        label: "Dự án",
        icon: FolderGit2,
        badge: "bg-sky-50 text-sky-700 border-sky-200/80",
      },
      exam: {
        label: "Thi",
        icon: Award,
        badge: "bg-rose-50 text-rose-700 border-rose-200/80",
      },
    };
    return map[type];
  };

  const getStatusMeta = (status: AssignmentStatus) => {
    const map = {
      not_started: {
        label: "Chưa làm",
        icon: CircleDashed,
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        iconColor: "text-slate-500 bg-slate-50 border-slate-200",
      },
      in_progress: {
        label: "Đang làm",
        icon: Clock,
        badge: "bg-blue-50 text-blue-700 border-blue-200/80",
        iconColor: "text-blue-600 bg-blue-50 border-blue-200",
      },
      completed: {
        label: "Đã hoàn thành",
        icon: CheckCircle2,
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        iconColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      },
      overdue: {
        label: "Quá hạn",
        icon: AlertTriangle,
        badge: "bg-rose-50 text-rose-700 border-rose-200/80",
        iconColor: "text-rose-600 bg-rose-50 border-rose-200",
      },
    };
    return map[status];
  };

  // Thống kê nhanh
  const completedCount = assignments.filter((a) => a.status === "completed").length;
  const pendingCount = assignments.filter(
    (a) => a.status === "not_started" || a.status === "in_progress"
  ).length;

  if (loading) {
    return (
      <div className="w-full px-6 py-6 space-y-6">
        <div className="h-10 bg-slate-100 animate-pulse rounded-xl w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 bg-slate-100/80 animate-pulse rounded-xl border border-slate-200/60"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6">
      {/* Header & Thống kê tóm tắt */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Bài tập & Kiểm tra
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Danh sách bài tập, bài kiểm tra và dự án được giao trong học phần
          </p>
        </div>

        {assignments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600">
              Tổng số:{" "}
              <span className="font-semibold text-slate-900">
                {assignments.length}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600">
              Hoàn thành:{" "}
              <span className="font-semibold text-emerald-600">
                {completedCount}/{assignments.length}
              </span>
            </div>
            {pendingCount > 0 && (
              <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium">
                Cần làm: {pendingCount}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thanh tìm kiếm & Bộ lọc */}
      {assignments.length > 0 && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mô tả bài tập..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="not_started">Chưa làm</option>
              <option value="in_progress">Đang làm</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="overdue">Quá hạn</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="all">Tất cả phân loại</option>
              <option value="exercise">Bài tập</option>
              <option value="quiz">Kiểm tra</option>
              <option value="project">Dự án</option>
              <option value="exam">Thi</option>
            </select>
          </div>
        </div>
      )}

      {/* Thông báo lỗi */}
      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Danh sách bài tập */}
      {filteredAssignments.length === 0 ? (
        <div className="w-full bg-white rounded-xl border border-dashed border-slate-300 py-14 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <BookCheck className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-800">
            {searchTerm || filterStatus !== "all" || filterType !== "all"
              ? "Không tìm thấy bài tập phù hợp"
              : "Chưa có bài tập nào được giao"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm || filterStatus !== "all" || filterType !== "all"
              ? "Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc."
              : "Khi giảng viên giao bài tập mới, danh sách sẽ hiển thị tại đây."}
          </p>
          {(searchTerm || filterStatus !== "all" || filterType !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterType("all");
              }}
              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssignments.map((assignment) => {
            const typeMeta = getTypeMeta(assignment.type);
            const statusMeta = getStatusMeta(assignment.status);
            const TypeIcon = typeMeta.icon;
            const StatusIcon = statusMeta.icon;

            const isLocked =
              assignment.isOverdue &&
              !assignment.allowLateSubmission &&
              !assignment.submission?.completedAt;

            const canOpen = !isLocked;

            return (
              <div
                key={assignment.id}
                onClick={() => {
                  if (!canOpen) return;
                  navigate(
                    `/student/courses/${sectionId}/assignments/${assignment.id}`
                  );
                }}
                className={`group flex flex-col justify-between bg-white rounded-xl border p-5 transition-all ${
                  isLocked
                    ? "border-slate-200 bg-slate-50/50 opacity-80 cursor-not-allowed"
                    : assignment.status === "in_progress"
                    ? "border-blue-300 shadow-xs hover:shadow-md cursor-pointer"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-md cursor-pointer"
                }`}
              >
                <div>
                  {/* Top: Icon loại bài + Badge trạng thái */}
                  <div className="flex items-start justify-between gap-2 mb-3.5">
                    <div
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${statusMeta.iconColor}`}
                    >
                      <TypeIcon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${typeMeta.badge}`}
                      >
                        {typeMeta.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusMeta.badge}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>

                  {/* Tiêu đề & Mô tả */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {assignment.title}
                    </h3>
                    {assignment.description ? (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {assignment.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-1">
                        Không có mô tả chi tiết
                      </p>
                    )}
                  </div>

                  {/* Thông số bài tập */}
                  <div className="space-y-2 py-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <ListChecks className="w-3.5 h-3.5" /> Số câu hỏi
                      </span>
                      <span className="font-medium text-slate-700">
                        {assignment.totalQuestions} câu
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5" /> Điểm tối đa
                      </span>
                      <span className="font-medium text-slate-700">
                        {assignment.totalPoints} điểm
                      </span>
                    </div>

                    {assignment.timeLimit && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Timer className="w-3.5 h-3.5" /> Thời gian
                        </span>
                        <span className="font-medium text-slate-700">
                          {assignment.timeLimit} phút
                        </span>
                      </div>
                    )}

                    {assignment.dueDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <CalendarClock className="w-3.5 h-3.5" /> Hạn nộp
                        </span>
                        <span
                          className={`font-medium ${
                            assignment.isOverdue && !assignment.isCompleted
                              ? "text-rose-600"
                              : "text-slate-700"
                          }`}
                        >
                          {formatDate(assignment.dueDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Kết quả nộp bài hoặc Nút hành động */}
                <div className="pt-3 mt-1 border-t border-slate-100">
                  {assignment.submission?.completedAt ? (
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/70">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Kết quả:</span>
                        <span className="font-semibold text-slate-900">
                          {assignment.submission.score !== null ? (
                            <span className="text-emerald-600">
                              {assignment.submission.score} /{" "}
                              {assignment.submission.maxScore ??
                                assignment.maxScore}{" "}
                              điểm
                            </span>
                          ) : (
                            <span className="text-amber-600">Chờ chấm điểm</span>
                          )}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 text-right">
                        Đã nộp lúc{" "}
                        {dayjs(assignment.submission.completedAt).format(
                          "HH:mm, DD/MM/YYYY"
                        )}
                      </div>
                    </div>
                  ) : assignment.canSubmit ? (
                    !assignment.isOverdue || assignment.allowLateSubmission ? (
                      <div className="space-y-2.5">
                        {assignment.submission?.startedAt && (
                          <div>
                            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                              <span>Tiến độ đã lưu</span>
                              <span className="font-semibold text-blue-600">
                                {assignment.submission.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{
                                  width: `${assignment.submission.progress}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/student/courses/${sectionId}/assignments/${assignment.id}`
                            );
                          }}
                          className="w-full py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>
                            {assignment.submission?.startedAt
                              ? "Tiếp tục làm bài"
                              : assignment.isOverdue
                              ? "Nộp bài trễ"
                              : "Bắt đầu làm bài"}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full py-2 px-3 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Đã đóng (Quá hạn nộp)</span>
                      </div>
                    )
                  ) : (
                    <div className="w-full py-2 px-3 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium text-center">
                      {getStatusMeta(assignment.status).label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}