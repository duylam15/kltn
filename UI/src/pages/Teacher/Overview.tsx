import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Spin,
  Progress,
  Tag,
  Timeline,
  Empty,
  Button,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Layers,
  FileText,
  FolderOpen,
  CalendarCheck,
  BarChart3,
  Clock,
  Trophy,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  LayoutDashboard,
  AlertCircle,
} from "lucide-react";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const API_BASE = "http://localhost:4000/api/v1";

export default function Overview() {
  const navigate = useNavigate();
  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>(dayjs().format("DD/MM/YYYY HH:mm"));
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGroups: 0,
    studentsWithGroup: 0,
    totalAssignments: 0,
    visibleAssignments: 0,
    totalMaterials: 0,
    visibleMaterials: 0,
    totalSessions: 0,
    activeSessions: 0,
    avgAttendanceRate: 0,
    totalGradeColumns: 0,
    publishedColumns: 0,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);

  useEffect(() => {
    if (sectionId) {
      fetchOverviewData();
    }
  }, [sectionId]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [
        studentsRes,
        groupsRes,
        assignmentsRes,
        materialsRes,
        sessionsRes,
        gradesRes,
      ] = await Promise.all([
        axios.get(`${API_BASE}/sections-enrollments/section/${sectionId}/students`, { headers }),
        axios.get(`${API_BASE}/sections-groups/sections/${sectionId}/groups`, { headers }),
        axios.get(`${API_BASE}/sections-assignments/sections/${sectionId}/assignments`, { headers }),
        axios.get(`${API_BASE}/materials/class/${sectionId}`, { headers }),
        axios.get(`${API_BASE}/attendance/sections/${sectionId}/sessions`, { headers }),
        axios.get(`${API_BASE}/grades/sections/${sectionId}/gradebook?includeUnpublished=true`, { headers }),
      ]);

      const students = studentsRes.data.data || [];
      const groups = groupsRes.data.data || [];
      const assignments = assignmentsRes.data.data || [];
      const materials = materialsRes.data.data || [];
      const sessions = sessionsRes.data.data || [];
      const gradeBook = gradesRes.data.data;

      const studentsWithGroup = students.filter((s: any) => s.groupId).length;
      const visibleAssignments = assignments.filter((a: any) => a.isOpen).length;
      const visibleMaterials = materials.filter((m: any) => m.isOpen).length;
      const activeSessions = sessions.filter((s: any) => {
        if (!s.expiresAt) return true;
        return dayjs(s.expiresAt).isAfter(dayjs());
      }).length;

      const totalAttendances = sessions.reduce(
        (sum: number, s: any) => sum + (s.attendances?.length || 0),
        0
      );
      const avgAttendanceRate =
        sessions.length > 0 && students.length > 0
          ? (totalAttendances / (sessions.length * students.length)) * 100
          : 0;

      setStats({
        totalStudents: students.length,
        totalGroups: groups.length,
        studentsWithGroup,
        totalAssignments: assignments.length,
        visibleAssignments,
        totalMaterials: materials.length,
        visibleMaterials,
        totalSessions: sessions.length,
        activeSessions,
        avgAttendanceRate,
        totalGradeColumns: gradeBook?.columns?.length || 0,
        publishedColumns:
          gradeBook?.columns?.filter((c: any) => c.isPublished).length || 0,
      });

      // Recent activities
      const recentActs = [
        ...sessions.slice(0, 5).map((s: any) => ({
          type: "attendance",
          title: `Điểm danh: ${s.name || `Phiên #${s.id}`}`,
          time: s.createdAt,
          color: "#2563eb",
        })),
        ...assignments.slice(0, 5).map((a: any) => ({
          type: "assignment",
          title: `Bài tập: ${a.title}`,
          time: a.createdAt,
          color: "#7c3aed",
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 8);

      setRecentActivities(recentActs);

      // Upcoming deadlines
      const upcoming = assignments
        .filter((a: any) => a.dueDate && dayjs(a.dueDate).isAfter(dayjs()))
        .sort(
          (a: any, b: any) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )
        .slice(0, 5);

      setUpcomingDeadlines(upcoming);

      // Top students
      if (gradeBook?.students) {
        const studentsWithScores = gradeBook.students
          .map((s: any) => {
            const scores = Object.values(s.columns || {}).filter(
              (col: any) => col && col.score !== null && col.score !== undefined
            );
            const avgScore =
              scores.length > 0
                ? scores.reduce(
                    (sum: number, col: any) => sum + (col.percentage || 0),
                    0
                  ) / scores.length
                : 0;
            return { ...s, avgScore };
          })
          .sort((a: any, b: any) => b.avgScore - a.avgScore)
          .slice(0, 5);

        setTopStudents(studentsWithScores);
      }

      setLastUpdated(dayjs().format("DD/MM/YYYY HH:mm"));
    } catch (err) {
      console.error("Lỗi tải dữ liệu overview:", err);
      toast.error("Không thể tải dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "75vh",
          gap: 12,
        }}
      >
        <Spin size="large" />
        <span style={{ color: "#64748b", fontSize: 13.5 }}>
          Đang tải dữ liệu tổng quan lớp học...
        </span>
      </div>
    );
  }

  const groupPercentage =
    stats.totalStudents > 0
      ? Math.round((stats.studentsWithGroup / stats.totalStudents) * 100)
      : 0;

  const publishedRate =
    stats.totalGradeColumns > 0
      ? Math.round((stats.publishedColumns / stats.totalGradeColumns) * 100)
      : 0;

  const attendanceColor =
    stats.avgAttendanceRate >= 75
      ? "#10b981"
      : stats.avgAttendanceRate >= 50
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: "4px 4px 24px 4px",
      }}
    >
      {/* Compact Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 20px",
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 700,
                color: "#0f172a",
                lineHeight: 1.3,
              }}
            >
              Tổng quan lớp học phần
            </h2>
            <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
              Cập nhật lần cuối lúc {lastUpdated}
            </p>
          </div>
        </div>

        <Button
          icon={<RefreshCw size={14} />}
          onClick={fetchOverviewData}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 8,
            fontWeight: 500,
          }}
        >
          Làm mới
        </Button>
      </div>

      {/* 4 KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Sinh viên trong lớp"
            value={stats.totalStudents}
            footerText={`${stats.studentsWithGroup} sinh viên đã vào nhóm`}
            icon={<Users size={20} />}
            iconBg="#eff6ff"
            iconColor="#2563eb"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Nhóm học tập"
            value={stats.totalGroups}
            footerText={`Tỷ lệ phân nhóm: ${groupPercentage}%`}
            icon={<Layers size={20} />}
            iconBg="#ecfdf5"
            iconColor="#10b981"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Bài tập đã tạo"
            value={stats.totalAssignments}
            footerText={`${stats.visibleAssignments} bài đang mở cho SV`}
            icon={<FileText size={20} />}
            iconBg="#f5f3ff"
            iconColor="#7c3aed"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Tài liệu học tập"
            value={stats.totalMaterials}
            footerText={`${stats.visibleMaterials} tài liệu đang hiển thị`}
            icon={<FolderOpen size={20} />}
            iconBg="#fff7ed"
            iconColor="#ea580c"
          />
        </Col>
      </Row>

      {/* Attendance & Grades Progress Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              height: "100%",
            }}
            styles={{ body: { padding: "18px 20px" } }}
            title={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                <CalendarCheck size={18} color="#2563eb" />
                Tình hình điểm danh
              </span>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => navigate(`/teacher/courses/${sectionId}/roll-call`)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 0,
                  fontWeight: 500,
                }}
              >
                Chi tiết <ArrowRight size={14} />
              </Button>
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                padding: "12px 0",
                background: "#f8fafc",
                borderRadius: 10,
                marginBottom: 18,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a" }}>
                  {stats.totalSessions}
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b" }}>Tổng phiên</div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  borderLeft: "1px solid #e2e8f0",
                  borderRight: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 700, color: "#10b981" }}>
                  {stats.activeSessions}
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b" }}>Đang mở</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#64748b" }}>
                  {Math.max(0, stats.totalSessions - stats.activeSessions)}
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b" }}>Đã đóng</div>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
                  Tỷ lệ chuyên cần trung bình
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: attendanceColor,
                  }}
                >
                  {stats.avgAttendanceRate.toFixed(1)}%
                </span>
              </div>
              <Progress
                percent={Number(stats.avgAttendanceRate.toFixed(1))}
                strokeColor={attendanceColor}
                trailColor="#f1f5f9"
                showInfo={false}
                size={["100%", 8]}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              height: "100%",
            }}
            styles={{ body: { padding: "18px 20px" } }}
            title={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                <BarChart3 size={18} color="#7c3aed" />
                Quản lý bảng điểm
              </span>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => navigate(`/teacher/courses/${sectionId}/grades`)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 0,
                  fontWeight: 500,
                }}
              >
                Bảng điểm <ArrowRight size={14} />
              </Button>
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 12,
                padding: "12px 0",
                background: "#f8fafc",
                borderRadius: 10,
                marginBottom: 18,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a" }}>
                  {stats.totalGradeColumns}
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b" }}>Tổng cột điểm</div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  borderLeft: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 700, color: "#10b981" }}>
                  {stats.publishedColumns}
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b" }}>Đã công bố</div>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
                  Tiến độ công bố điểm
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#10b981",
                  }}
                >
                  {publishedRate}%
                </span>
              </div>
              <Progress
                percent={publishedRate}
                strokeColor="#10b981"
                trailColor="#f1f5f9"
                showInfo={false}
                size={["100%", 8]}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bottom 3 Columns */}
      <Row gutter={[16, 16]}>
        {/* Recent Activities */}
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              height: 440,
            }}
            styles={{
              body: {
                padding: "16px 20px",
                height: "calc(100% - 56px)",
                overflowY: "auto",
              },
            }}
            title={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                <Clock size={17} color="#2563eb" />
                Hoạt động gần đây
              </span>
            }
          >
            {recentActivities.length === 0 ? (
              <Empty
                description="Chưa có hoạt động nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ marginTop: 60 }}
              />
            ) : (
              <Timeline
                items={recentActivities.map((act) => ({
                  color: act.color,
                  children: (
                    <div style={{ paddingBottom: 2 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 500,
                          color: "#1e293b",
                          lineHeight: 1.4,
                        }}
                      >
                        {act.title}
                      </div>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        {dayjs(act.time).fromNow()}
                      </span>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>

        {/* Upcoming Deadlines */}
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              height: 440,
            }}
            styles={{
              body: {
                padding: "12px 16px",
                height: "calc(100% - 56px)",
                overflowY: "auto",
              },
            }}
            title={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                <AlertCircle size={17} color="#ea580c" />
                Hạn nộp sắp tới
              </span>
            }
          >
            {upcomingDeadlines.length === 0 ? (
              <Empty
                description="Không có bài tập sắp hết hạn"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ marginTop: 60 }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upcomingDeadlines.map((item: any) => {
                  const daysLeft = dayjs(item.dueDate).diff(dayjs(), "day");
                  const isUrgent = daysLeft <= 3;

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#f8fafc",
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 8,
                          background: isUrgent ? "#fef2f2" : "#eff6ff",
                          color: isUrgent ? "#ef4444" : "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <Clock size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: "#0f172a",
                            marginBottom: 4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ fontSize: 12, color: "#64748b" }}>
                            {dayjs(item.dueDate).format("DD/MM/YYYY HH:mm")}
                          </span>
                          <Tag
                            color={isUrgent ? "red" : "orange"}
                            style={{ margin: 0, borderRadius: 6, fontSize: 11 }}
                          >
                            {daysLeft === 0
                              ? "Hôm nay"
                              : daysLeft === 1
                              ? "Ngày mai"
                              : `Còn ${daysLeft} ngày`}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* Top Students */}
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              height: 440,
            }}
            styles={{
              body: {
                padding: "12px 16px",
                height: "calc(100% - 56px)",
                overflowY: "auto",
              },
            }}
            title={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                <Trophy size={17} color="#eab308" />
                Sinh viên nổi bật
              </span>
            }
          >
            {topStudents.length === 0 ? (
              <Empty
                description="Chưa có dữ liệu điểm"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ marginTop: 60 }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topStudents.map((student: any, index: number) => {
                  const badgeStyles = [
                    { bg: "#fef3c7", color: "#d97706", border: "#fde68a" }, // Top 1
                    { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" }, // Top 2
                    { bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" }, // Top 3
                  ][index] || { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };

                  return (
                    <div
                      key={student.studentId || index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#f8fafc",
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: badgeStyles.bg,
                            color: badgeStyles.color,
                            border: `1px solid ${badgeStyles.border}`,
                            fontWeight: 700,
                            fontSize: 13.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          #{index + 1}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: "#0f172a",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {student.fullName}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {student.studentCode}
                          </div>
                        </div>
                      </div>

                      <Tag
                        color={
                          student.avgScore >= 80
                            ? "green"
                            : student.avgScore >= 70
                            ? "geekblue"
                            : "orange"
                        }
                        style={{
                          margin: 0,
                          borderRadius: 6,
                          fontWeight: 600,
                          padding: "2px 8px",
                        }}
                      >
                        {student.avgScore.toFixed(1)}%
                      </Tag>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

/** --------------------------------------
 *  Reusable KPI Card
 *  -------------------------------------- */
function KpiCard({
  title,
  value,
  footerText,
  icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: number | string;
  footerText: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card
      style={{
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        height: "100%",
      }}
      styles={{ body: { padding: "16px 20px" } }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>
            {title}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
            {value}
          </div>
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: iconBg,
            color: iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "#64748b",
        }}
      >
        <CheckCircle2 size={14} color="#10b981" />
        <span>{footerText}</span>
      </div>
    </Card>
  );
}