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
    setError("");
    try {
      const res = await instance.get(
        `/assignments/section/${sectionId}/student/${studentId}`,
      );
      const data: ApiResponse = await res.data;

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

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }

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
    const completed = assignments.filter((a) => a.status === "completed").length;
    const inProgress = assignments.filter((a) => a.status === "in_progress").length;
    const overdue = assignments.filter((a) => a.status === "overdue").length;

    return { totalAssignments, completed, inProgress, overdue };
  };

  // 🔥 Hàm xử lý click vào assignment
  const handleAssignmentClick = (assignment: Assignment, e: React.MouseEvent) => {
    // Ngăn chặn event bubbling nếu click vào button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    // Nếu có submission (đã từng làm bài), cho phép xem chi tiết/lịch sử
    if (assignment.submission?.startedAt) {
      navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`);
    }
    // Nếu chưa có submission và còn hạn, cho phép làm bài
    else if (assignment.canSubmit) {
      navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`);
    }
    // Nếu hết hạn và chưa làm, vẫn cho xem chi tiết
    else {
      navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`);
    }
  };

  // 🔥 Hàm xác định button action và text
  const getActionButton = (assignment: Assignment) => {
    // Trường hợp 1: Đã hoàn thành - Xem lịch sử
    if (assignment.submission?.completedAt) {
      return {
        text: "Xem lịch sử",
        icon: <HistoryOutlined />,
        type: "default" as const,
        onClick: () => navigate(`/student/courses/${sectionId}/assignments/${assignment.id}/history`),
      };
    }

    // Trường hợp 2: Đang làm - Tiếp tục
    if (assignment.submission?.startedAt && !assignment.submission?.completedAt) {
      if (assignment.canSubmit) {
        return {
          text: "Tiếp tục làm",
          icon: <PlayCircleOutlined />,
          type: "primary" as const,
          onClick: () => navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`),
        };
      } else {
        return {
          text: "Xem lịch sử",
          icon: <HistoryOutlined />,
          type: "default" as const,
          onClick: () => navigate(`/student/courses/${sectionId}/assignments/${assignment.id}/history`),
        };
      }
    }

    // Trường hợp 3: Chưa làm và còn hạn - Bắt đầu
    if (assignment.canSubmit) {
      return {
        text: "Bắt đầu làm",
        icon: <PlayCircleOutlined />,
        type: "primary" as const,
        onClick: () => navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`),
      };
    }

    // Trường hợp 4: Hết hạn và chưa làm - Xem chi tiết
    if (assignment.isOverdue) {
      return {
        text: "Đã hết hạn",
        icon: <WarningOutlined />,
        type: "default" as const,
        onClick: () => navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`),
        disabled: true,
      };
    }

    // Default: Xem chi tiết
    return {
      text: "Xem chi tiết",
      icon: <FileTextOutlined />,
      type: "default" as const,
      onClick: () => navigate(`/student/courses/${sectionId}/assignments/${assignment.id}`),
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
      {/* Statistics Bar - Giống GroupList */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          marginTop: -16,
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm bài tập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
            style={{ width: 150 }}
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
            style={{ width: 120 }}
          >
            <Option value="all">Tất cả loại</Option>
            <Option value="exercise">Bài tập</Option>
            <Option value="quiz">Kiểm tra</Option>
            <Option value="project">Dự án</Option>
            <Option value="exam">Thi</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchAssignments}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "#fff2f0",
            border: "1px solid #ffccc7",
            borderRadius: 4,
            color: "#ff4d4f",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

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

            return (
              <Col key={assignment.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                <Badge.Ribbon
                  text={isUrgent ? "🔥 Gấp" : statusConfig.text}
                  color={isUrgent ? "red" : statusConfig.color}
                >
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
                              <TrophyOutlined /> Điểm tối đa
                            </span>
                            <span style={{ fontWeight: 600, color: "#F39C12" }}>
                              {assignment.totalPoints}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                            <span style={{ color: "#95A5A6" }}>
                              <FieldTimeOutlined /> Thời gian làm bài
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

                      {/* 🔥 Action Button - Đã update logic */}
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
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}