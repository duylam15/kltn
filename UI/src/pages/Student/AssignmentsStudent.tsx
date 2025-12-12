import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Spin,
  Row,
  Col,
  Space,
  Tooltip,
  Progress,
  Badge,
  Flex,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  TrophyOutlined,
  CheckOutlined,
  FieldTimeOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/authContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useNavigate } from "react-router-dom";
import { Clock, Timer, TimerIcon } from "lucide-react";
import instance from "../../utils/axiosInstance";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Option } = Select;

type AssignmentType = "exercise" | "quiz" | "project" | "exam";
type AssignmentStatus = "not_started" | "in_progress" | "completed" | "overdue";

interface Section {
  id: number;
}

interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
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
  attempt?: number;
  isFinal?: boolean;
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
  submissions?: Submission[];
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
    filterAndSortAssignments();
  }, [searchTerm, filterStatus, filterType, assignments]);

  // 🔥 HÀM LẤY DANH SÁCH SUBMISSIONS CỦA STUDENT CHO ASSIGNMENT
  const fetchSubmissionsForAssignment = async (assignmentId: number): Promise<Submission[]> => {
    try {
      const res = await instance.get<{ success: boolean; data: Submission[] }>(
        `/assignments/${assignmentId}/student/${studentId}/submissions`
      );

      if (res.data.success && res.data.data) {
        // Sắp xếp theo thời gian mới nhất
        return res.data.data.sort(
          (a, b) => new Date(b.submittedAt || b.startedAt || '').getTime() -
            new Date(a.submittedAt || a.startedAt || '').getTime()
        );
      }
      return [];
    } catch (err) {
      console.error(`Lỗi khi lấy submissions cho assignment ${assignmentId}:`, err);
      return [];
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await instance.get(
        `/assignments/section/${sectionId}/student/${studentId}`,
      );
      const data: ApiResponse = await res.data;

      if (data.success) {
        // 🔥 Lấy submissions cho từng assignment
        const assignmentsWithSubmissions = await Promise.all(
          data.data.map(async (assignment) => {
            const submissions = await fetchSubmissionsForAssignment(assignment.id);
            return {
              ...assignment,
              submissions: submissions,
              submission: submissions.length > 0 ? submissions[0] : null, // Latest submission
            };
          })
        );

        setAssignments(assignmentsWithSubmissions);
        setFilteredAssignments(assignmentsWithSubmissions);
      } else {
        setError("Không thể tải danh sách bài tập");
      }
    } catch (err) {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 HÀM TÍNH SỐ LẦN LÀM BÀI CÒN LẠI
  const getRemainingAttempts = (assignment: Assignment): number => {
    if (assignment.maxAttempts === 0) return 999; // Không giới hạn

    // Đếm số lần đã nộp bài (completed submissions)
    const completedAttempts = assignment.submissions?.filter(
      sub => sub.completedAt !== null
    )?.length || 0;

    return Math.max(0, assignment.maxAttempts - completedAttempts);
  };

  // 🔥 HÀM KIỂM TRA CÓ SUBMISSION ĐANG LÀM DỞ KHÔNG
  const hasInProgressSubmission = (assignment: Assignment): boolean => {
    return assignment.submissions?.some(
      sub => sub.startedAt && !sub.completedAt
    ) || false;
  };

  // 🔥 HÀM KIỂM TRA CÓ SUBMISSION ĐÃ HOÀN THÀNH KHÔNG
  const hasCompletedSubmission = (assignment: Assignment): boolean => {
    return assignment.submissions?.some(
      sub => sub.completedAt !== null
    ) || false;
  };

  // 🔥 HÀM KIỂM TRA CÓ THỂ LÀM (LẠI) BÀI KHÔNG
  const canDoAssignment = (assignment: Assignment): boolean => {
    const remainingAttempts = getRemainingAttempts(assignment);
    return remainingAttempts > 0 && !assignment.isOverdue;
  };

  // 🔥 HÀM KIỂM TRA CÓ THỂ XEM LỊCH SỬ KHÔNG
  // Điều kiện: Có submission VÀ bài tập cho phép xem đáp án sau khi nộp
  const canViewHistory = (assignment: Assignment): boolean => {
    const hasSubmissions = (assignment.submissions?.length || 0) > 0;
    return hasSubmissions && assignment.showAnswersAfterSubmit === true;
  };

  // 🔥 SẮP XẾP: Chưa làm/còn lần làm lên trên, đã làm hết/hết hạn xuống dưới
  const filterAndSortAssignments = () => {
    let filtered = [...assignments];

    // Filter theo search
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter theo status
    if (filterStatus !== "all") {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }

    // Filter theo type
    if (filterType !== "all") {
      filtered = filtered.filter((a) => a.type === filterType);
    }

    // 🔥 SẮP XẾP THEO ƯU TIÊN
    filtered.sort((a, b) => {
      const aRemaining = getRemainingAttempts(a);
      const bRemaining = getRemainingAttempts(b);
      const aCanDo = canDoAssignment(a);
      const bCanDo = canDoAssignment(b);

      // 1. Bài còn làm được lên trên
      if (aCanDo && !bCanDo) return -1;
      if (!aCanDo && bCanDo) return 1;

      // 2. Trong cùng nhóm, chưa làm lên trước đã làm
      const aHasCompleted = hasCompletedSubmission(a);
      const bHasCompleted = hasCompletedSubmission(b);

      if (!aHasCompleted && bHasCompleted) return -1;
      if (aHasCompleted && !bHasCompleted) return 1;

      // 3. Sắp xếp theo deadline (gần nhất lên trước)
      if (a.dueDate && b.dueDate) {
        return dayjs(a.dueDate).diff(dayjs(b.dueDate));
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return 0;
    });

    setFilteredAssignments(filtered);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Không có hạn";
    const date = dayjs(dateString);
    const now = dayjs();
    const diffDays = date.diff(now, "day");
    const diffHours = date.diff(now, "hour");

    if (diffHours < 0) return date.format("DD/MM/YYYY");
    if (diffHours < 24) return `${diffHours}h nữa`;
    if (diffDays === 1) return "Ngày mai";
    if (diffDays < 7) return `${diffDays} ngày nữa`;
    return date.format("DD/MM/YYYY");
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

  const getTypeConfig = (type: AssignmentType) => {
    const configMap = {
      exercise: { color: "#4A90E2", bg: "#E8F4FF", icon: "📝" },
      quiz: { color: "#9B59B6", bg: "#F4EBFF", icon: "✍️" },
      project: { color: "#27AE60", bg: "#E8F8F0", icon: "💼" },
      exam: { color: "#E74C3C", bg: "#FFEAEA", icon: "🎓" },
    };
    return configMap[type];
  };

  const getStatusConfig = (status: AssignmentStatus) => {
    const configMap = {
      not_started: { text: "Chưa bắt đầu", color: "#95A5A6", bg: "#F8F9FA" },
      in_progress: { text: "Đang làm", color: "#3498DB", bg: "#EBF5FB" },
      completed: { text: "Hoàn thành", color: "#27AE60", bg: "#EAFAF1" },
      overdue: { text: "Quá hạn", color: "#E74C3C", bg: "#FADBD8" },
    };
    return configMap[status];
  };

  const getStatistics = () => {
    const totalAssignments = assignments.length;
    const completed = assignments.filter((a) => {
      const remaining = getRemainingAttempts(a);
      return hasCompletedSubmission(a) && remaining === 0;
    }).length;
    const inProgress = assignments.filter((a) => hasInProgressSubmission(a)).length;
    const overdue = assignments.filter((a) => a.isOverdue && !hasCompletedSubmission(a)).length;

    return { totalAssignments, completed, inProgress, overdue };
  };

  // 🔥 HÀM XỬ LÝ CLICK VÀO ASSIGNMENT
  const handleAssignmentClick = (assignment: Assignment, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`);
  };

  // 🔥 HÀM XÁC ĐỊNH BUTTON ACTION (CẢI THIỆN - CHỈ HIỂN THỊ XEM LỊCH SỬ KHI showAnswersAfterSubmit = true)
  const getActionButton = (assignment: Assignment) => {
    const remainingAttempts = getRemainingAttempts(assignment);
    const hasCompleted = hasCompletedSubmission(assignment);
    const hasInProgress = hasInProgressSubmission(assignment);
    const canDo = canDoAssignment(assignment);
    const showHistory = canViewHistory(assignment); // 🔥 Kiểm tra điều kiện xem lịch sử

    // Trường hợp 1: Đã làm hết số lần
    if (remainingAttempts === 0 && hasCompleted) {
      // 🔥 Nếu cho phép xem đáp án → Hiển thị "Xem lịch sử"
      if (showHistory) {
        return {
          text: "Xem lịch sử",
          icon: <HistoryOutlined />,
          type: "default" as const,
          onClick: () => navigate(`/student/courses/${sectionId}/assignments/${assignment.id}/history`),
          disabled: false,
        };
      }
      // 🔥 Nếu KHÔNG cho phép xem đáp án → Hiển thị "Đã làm" (disabled)
      return {
        text: "Đã làm",
        icon: <CheckOutlined />,
        type: "default" as const,
        onClick: () => { },
        disabled: true,
      };
    }

    // Trường hợp 2: Đã làm nhưng còn lần làm → Cho phép "Làm lại"
    if (hasCompleted && canDo) {
      return {
        text: remainingAttempts === 999
          ? "Làm lại"
          : `Làm lại (${remainingAttempts} lần)`,
        icon: <PlayCircleOutlined />,
        type: "primary" as const,
        onClick: () => navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`),
        disabled: false,
      };
    }

    // Trường hợp 3: Đang làm dở → Tiếp tục làm
    if (hasInProgress && canDo) {
      return {
        text: "Tiếp tục làm",
        icon: <PlayCircleOutlined />,
        type: "primary" as const,
        onClick: () => navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`),
        disabled: false,
      };
    }

    // Trường hợp 4: Chưa làm lần nào và còn hạn → Bắt đầu
    if (!hasCompleted && !hasInProgress && canDo) {
      return {
        text: "Bắt đầu làm",
        icon: <PlayCircleOutlined />,
        type: "primary" as const,
        onClick: () => navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`),
        disabled: false,
      };
    }

    // Trường hợp 5: Hết hạn
    if (assignment.isOverdue) {
      // 🔥 Nếu có submission và cho phép xem đáp án → Hiển thị "Xem lịch sử"
      if (showHistory) {
        return {
          text: "Xem lịch sử",
          icon: <HistoryOutlined />,
          type: "default" as const,
          onClick: () => navigate(`/student/courses/${sectionId}/assignments/${assignment.id}/history`),
          disabled: false,
        };
      }
      // 🔥 Nếu không → Hiển thị "Đã hết hạn" (disabled)
      return {
        text: "Đã hết hạn",
        icon: <WarningOutlined />,
        type: "default" as const,
        onClick: () => { },
        disabled: true,
      };
    }

    // Default
    return {
      text: "Xem chi tiết",
      icon: <FileTextOutlined />,
      type: "default" as const,
      onClick: () => navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`),
      disabled: false,
    };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Spin tip="Đang tải..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Statistics Bar */}
      <Flex
        wrap="wrap"
        gap={12}
        className="flex-col sm:flex-row items-start sm:items-center w-full mb-4 -mt-4"
      >
        {/* Stats - Left side */}
        <Flex gap={8} wrap="wrap" className="w-full sm:w-auto">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#000",
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: "6px 10px",
              background: "#fff",
            }}
          >
            <BookOutlined style={{ fontSize: 14, color: "#1890ff" }} />
            <span>Tổng bài tập:</span>
            <strong>{stats.totalAssignments}</strong>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#000",
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: "6px 10px",
              background: "#fff",
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 14, color: "#52c41a" }} />
            <span>Hoàn thành:</span>
            <strong style={{ color: "#52c41a" }}>{stats.completed}</strong>
            <span style={{ fontSize: 11, color: "#888" }}>
              / {stats.totalAssignments}
            </span>
          </div>

          {stats.inProgress > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "#000",
                border: "1px solid #ddd",
                borderRadius: 6,
                padding: "6px 10px",
                background: "#fff",
              }}
            >
              <ClockCircleOutlined style={{ fontSize: 14, color: "#1890ff" }} />
              <span>Đang làm:</span>
              <strong style={{ color: "#1890ff" }}>{stats.inProgress}</strong>
            </div>
          )}

          {stats.overdue > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "#000",
                border: "1px solid #ddd",
                borderRadius: 6,
                padding: "6px 10px",
                background: "#fff",
              }}
            >
              <WarningOutlined style={{ fontSize: 14, color: "#ff4d4f" }} />
              <span>Quá hạn:</span>
              <strong style={{ color: "#ff4d4f" }}>{stats.overdue}</strong>
            </div>
          )}
        </Flex>

        {/* Actions - Right side */}
        <Flex
          gap={8}
          wrap="wrap"
          className="w-full sm:w-auto sm:ml-auto"
        >
          {/* Search */}
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm bài tập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-52"
            size="middle"
          />

          {/* Filters */}
          <Flex gap={8} wrap="wrap" className="w-full sm:w-auto">
            <Select
              value={filterStatus}
              onChange={(value) => setFilterStatus(value)}
              className="w-full sm:w-auto"
              size="middle"
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="not_started">Chưa làm</Option>
              <Option value="in_progress">Đang làm</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="overdue">Quá hạn</Option>
            </Select>

            <Select
              value={filterType}
              onChange={(value) => setFilterType(value)}
              className="w-full sm:w-auto"
              size="middle"
            >
              <Option value="all">Tất cả loại</Option>
              <Option value="exercise">Bài tập</Option>
              <Option value="quiz">Kiểm tra</Option>
              <Option value="project">Dự án</Option>
              <Option value="exam">Thi</Option>
            </Select>

            <Button
              icon={<ReloadOutlined />}
              onClick={fetchAssignments}
              size="middle"
              className="w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </Flex>
        </Flex>
      </Flex>

      {/* Assignments Grid */}
      {filteredAssignments.length === 0 ? (
        <Card
          style={{
            textAlign: "center",
            padding: "60px 20px",
            borderRadius: 16,
            border: "2px dashed #E0E0E0",
            background: "#fff",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
          <h3 style={{ color: "#95A5A6", fontSize: 18, fontWeight: 500 }}>
            {searchTerm || filterStatus !== "all" || filterType !== "all"
              ? "Không tìm thấy bài tập nào"
              : "Chưa có bài tập nào"}
          </h3>
          <p style={{ color: "#BDC3C7", fontSize: 14 }}>
            {searchTerm || filterStatus !== "all" || filterType !== "all"
              ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
              : "Các bài tập mới sẽ xuất hiện tại đây"}
          </p>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredAssignments.map((assignment) => {
            const typeConfig = getTypeConfig(assignment.type);
            const statusConfig = getStatusConfig(assignment.status);
            const isUrgent =
              assignment.dueDate &&
              dayjs(assignment.dueDate).diff(dayjs(), "hour") < 24 &&
              dayjs(assignment.dueDate).diff(dayjs(), "hour") > 0;
            const actionButton = getActionButton(assignment);
            const remainingAttempts = getRemainingAttempts(assignment);

            return (
              <Col key={assignment.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    border: "1px solid #E8E8E8",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    height: "100%",
                  }}
                  bodyStyle={{ padding: 0 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                  }}
                >
                  {/* Type Badge */}
                  <div
                    style={{
                      background: typeConfig.bg,
                      padding: "12px 16px",
                      borderBottom: `3px solid ${typeConfig.color}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{typeConfig.icon}</span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: typeConfig.color,
                        }}
                      >
                        {getTypeText(assignment.type).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: 16 }}>
                    {/* Title */}
                    <Tooltip title={assignment.title}>
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#2C3E50",
                          marginBottom: 12,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {assignment.title}
                      </h3>
                    </Tooltip>

                    {/* Meta Info */}
                    <div style={{ marginBottom: 12 }}>
                      <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ color: "#95A5A6" }}>
                            <FileTextOutlined /> Câu hỏi
                          </span>
                          <span style={{ fontWeight: 600, color: "#34495E" }}>
                            {assignment.totalQuestions}
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ color: "#95A5A6" }}>
                            <FieldTimeOutlined /> Thời gian
                          </span>
                          <span style={{ fontWeight: 600, color: "#F39C12" }}>
                            {assignment.timeLimit ? `${assignment.timeLimit} phút` : "Không giới hạn"}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ color: "#95A5A6" }}>
                            <CalendarOutlined /> Hạn nộp
                          </span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: assignment.isOverdue
                                ? "#E74C3C"
                                : isUrgent
                                  ? "#E67E22"
                                  : "#27AE60",
                            }}
                          >
                            {formatDate(assignment.dueDate)}
                          </span>
                        </div>

                        {/* 🔥 Hiển thị số lần làm còn lại */}
                        {assignment.maxAttempts > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                            <span style={{ color: "#95A5A6" }}>
                              <HistoryOutlined /> Số lần còn lại
                            </span>
                            <span
                              style={{
                                fontWeight: 600,
                                color: remainingAttempts === 0 ? "#E74C3C" : "#3498DB",
                              }}
                            >
                              {remainingAttempts === 0
                                ? "Đã hết"
                                : `${remainingAttempts}/${assignment.maxAttempts}`}
                            </span>
                          </div>
                        )}

                      </Space>
                    </div>

                    {/* Progress Bar */}
                    {assignment.submission?.progress ? (
                      <div style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                            fontSize: 11,
                            color: "#7F8C8D",
                          }}
                        >
                          <span>Tiến độ</span>
                          <span style={{ fontWeight: 600 }}>
                            {assignment.submission.progress}%
                          </span>
                        </div>
                        <Progress
                          percent={assignment.submission.progress}
                          size="small"
                          strokeColor={{
                            "0%": "#667eea",
                            "100%": "#764ba2",
                          }}
                          showInfo={false}
                        />
                      </div>
                    ) : null}

                    {/* 🔥 Action Button */}
                    <Button
                      type={actionButton.type}
                      block
                      icon={actionButton.icon}
                      disabled={actionButton.disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        actionButton.onClick();
                      }}
                      style={{
                        borderRadius: 8,
                        height: 38,
                        fontWeight: 500,
                        background:
                          actionButton.type === "primary"
                            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            : undefined,
                        border: "none",
                      }}
                    >
                      {actionButton.text}
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}