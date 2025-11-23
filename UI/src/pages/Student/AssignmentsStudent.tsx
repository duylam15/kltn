import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useNavigate } from "react-router-dom";

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
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
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

  useEffect(() => {
    filterAssignments();
  }, [searchTerm, filterStatus, filterType, assignments]);

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
        setFilteredAssignments(data.data);
      } else {
        setError("Không thể tải danh sách bài tập");
      }
    } catch (err) {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    let filtered = [...assignments];

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter((a) =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((a) => a.type === filterType);
    }

    setFilteredAssignments(filtered);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Không có hạn";
    const date = dayjs(dateString);
    const now = dayjs();
    const diffDays = date.diff(now, "day");

    if (diffDays === 0) return `Hôm nay ${date.format("HH:mm")}`;
    if (diffDays === 1) return `Ngày mai ${date.format("HH:mm")}`;
    if (diffDays === -1) return `Hôm qua ${date.format("HH:mm")}`;
    return date.format("DD/MM/YYYY HH:mm");
  };

  const getTypeText = (type: AssignmentType) => {
    const typeMap = {
      exercise: "Bài tập",
      quiz: "Kiểm tra",
      project: "Dự án",
      exam: "Thi",
    };
    return typeMap[type];
  };

  const getTypeColor = (type: AssignmentType) => {
    const colorMap = {
      exercise: "bg-blue-100 text-blue-700",
      quiz: "bg-purple-100 text-purple-700",
      project: "bg-green-100 text-green-700",
      exam: "bg-red-100 text-red-700",
    };
    return colorMap[type];
  };

  const getStatusText = (status: AssignmentStatus) => {
    const statusMap = {
      not_started: "Chưa làm",
      in_progress: "Đang làm",
      completed: "Đã hoàn thành",
      overdue: "Quá hạn",
    };
    return statusMap[status];
  };

  const getStatusColor = (status: AssignmentStatus) => {
    const colorMap = {
      not_started: "text-gray-600",
      in_progress: "text-blue-600",
      completed: "text-green-600",
      overdue: "text-red-600",
    };
    return colorMap[status];
  };

  const getStatusIcon = (status: AssignmentStatus) => {
    const iconMap = {
      not_started: "📋",
      in_progress: "⏳",
      completed: "✅",
      overdue: "⚠️",
    };
    return iconMap[status];
  };


  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-4 py-4">
          <h1 className="text-xl font-normal text-gray-800">Bài tập</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Tìm kiếm bài tập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-400"
          />

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-400"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="not_started">Chưa làm</option>
            <option value="in_progress">Đang làm</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="overdue">Quá hạn</option>
          </select>

          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-400"
          >
            <option value="all">Tất cả loại</option>
            <option value="exercise">Bài tập</option>
            <option value="quiz">Kiểm tra</option>
            <option value="project">Dự án</option>
            <option value="exam">Thi</option>
          </select>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Hiển thị {filteredAssignments.length} / {assignments.length} bài tập
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <p className="text-gray-600">
              {searchTerm || filterStatus !== "all" || filterType !== "all"
                ? "Không tìm thấy bài tập nào"
                : "Chưa có bài tập nào"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (assignment.isOverdue && !assignment.allowLateSubmission) return; // ❌ chặn vào nếu quá hạn và không cho nộp trễ
                  navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`);
                }}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl">
                      {getStatusIcon(assignment.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate mb-1">
                        {assignment.title}
                      </h3>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${getTypeColor(assignment.type)}`}>
                        {getTypeText(assignment.type)}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {assignment.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}

                  {/* Info */}
                  <div className="space-y-1.5 mb-3 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Câu hỏi:</span>
                      <span className="font-medium">{assignment.totalQuestions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Điểm:</span>
                      <span className="font-medium">{assignment.totalPoints}</span>
                    </div>
                    {assignment.dueDate && (
                      <div className={`flex items-center justify-between ${assignment.isOverdue ? "text-red-600" : ""}`}>
                        <span>Hạn nộp:</span>
                        <span className="font-medium">{formatDate(assignment.dueDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="pt-3 border-t">
                    <div className={`text-xs font-medium text-center ${getStatusColor(assignment.status)}`}>
                      {getStatusText(assignment.status)}
                    </div>

                    {/* Submission Info */}
                    {assignment.submission && (
                      <div className="mt-2 text-xs text-gray-600 text-center">
                        {assignment.submission.completedAt ? (
                          <>
                            <div>Điểm: {assignment.submission.score || "Chưa chấm"} / {assignment.submission.maxScore}</div>
                            <div className="text-green-600 mt-0.5">
                              Nộp lúc {dayjs(assignment.submission.completedAt).format("DD/MM HH:mm")}
                            </div>
                          </>
                        ) : assignment.submission.startedAt ? (
                          <div className="text-blue-600">
                            Tiến độ: {assignment.submission.progress}%
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Action Button */}
                    {assignment.canSubmit && !assignment.submission?.completedAt ? (
                      !assignment.isOverdue || assignment.allowLateSubmission ? (
                        <button
                          className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`);
                          }}
                        >
                          {assignment.submission?.startedAt ? "Tiếp tục làm" : "Bắt đầu"}
                        </button>
                      ) : (
                        <div className="w-full mt-3 py-2 bg-gray-300 text-gray-500 rounded text-xs font-medium text-center cursor-not-allowed">
                          Quá hạn - không thể làm bài
                        </div>
                      )
                    ) : null}

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}