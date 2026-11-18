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
  Avatar,
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
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  LayoutDashboard,
  AlertCircle,
  UserCheck,
  MessageSquare,
} from "lucide-react";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const API_BASE = "http://localhost:4000/api/v1";

export default function OverviewStudent() {
  const navigate = useNavigate();
  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>(
    dayjs().format("DD/MM/YYYY HH:mm")
  );
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [myGroup, setMyGroup] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGroups: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    totalMaterials: 0,
    totalSessions: 0,
    activeSessions: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    myAttendanceRate: 0,
    publishedGradeColumns: 0,
    totalGradeColumns: 0,
    myAvgGradePercent: 0,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);

  useEffect(() => {
    if (sectionId) {
      fetchStudentOverview();
    }
  }, [sectionId]);

  const fetchStudentOverview = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("accessToken");
      const reqConfig = {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      };

      // 1. Lấy thông tin user hiện tại để xác định studentId
      const meRes = await axios.get(`${API_BASE}/auths/me`, reqConfig);
      const meData = meRes.data?.data || meRes.data;
      const currentStudentId = meData?.student?.id || meData?.studentId;

      // 2. Gọi song song các API dữ liệu của lớp học phần
      const [
        sectionRes,
        studentsRes,
        groupsRes,
        assignmentsRes,
        materialsRes,
        sessionsRes,
        gradesRes,
      ] = await Promise.all([
        axios
          .get(`${API_BASE}/course-sections/${sectionId}`, reqConfig)
          .catch(() => ({ data: { data: null } })),
        axios.get(
          `${API_BASE}/sections-enrollments/section/${sectionId}/students`,
          reqConfig
        ),
        axios.get(
          `${API_BASE}/sections-groups/sections/${sectionId}/groups`,
          reqConfig
        ),
        currentStudentId
          ? axios.get(
              `${API_BASE}/assignments/section/${sectionId}/student/${currentStudentId}`,
              reqConfig
            )
          : axios.get(
              `${API_BASE}/sections-assignments/sections/${sectionId}/assignments`,
              reqConfig
            ),
        axios.get(`${API_BASE}/materials/class/${sectionId}`, reqConfig),
        axios.get(
          `${API_BASE}/attendance/sections/${sectionId}/sessions`,
          reqConfig
        ),
        axios
          .get(
            `${API_BASE}/grades/sections/${sectionId}/gradebook?includeUnpublished=false`,
            reqConfig
          )
          .catch(() => ({ data: { data: null } })),
      ]);

      const section = sectionRes.data?.data;
      const students = studentsRes.data?.data || [];
      const groups = groupsRes.data?.data || [];
      const rawAssignments = assignmentsRes.data?.data || [];
      const rawMaterials = materialsRes.data?.data || [];
      const sessions = sessionsRes.data?.data || [];
      const gradeBook = gradesRes.data?.data;

      setCourseInfo(section);

      // Lọc bài tập & tài liệu đang mở cho sinh viên
      const openAssignments = rawAssignments.filter(
        (a: any) => a.isOpen !== false
      );
      const openMaterials = rawMaterials.filter((m: any) => m.isOpen !== false);

      // Xác định nhóm của sinh viên hiện tại
      const myEnrollment = students.find(
        (s: any) =>
          Number(s.studentId) === Number(currentStudentId) ||
          Number(s.student?.id) === Number(currentStudentId)
      );
      const currentGroupId = myEnrollment?.groupId;

      if (currentGroupId) {
        const foundGroup = groups.find(
          (g: any) => Number(g.id) === Number(currentGroupId)
        );
        setMyGroup(
          foundGroup || { id: currentGroupId, groupName: `Nhóm #${currentGroupId}` }
        );

        const membersInSameGroup = students.filter(
          (s: any) => Number(s.groupId) === Number(currentGroupId)
        );
        setGroupMembers(membersInSameGroup);
      } else {
        setMyGroup(null);
        setGroupMembers([]);
      }

      // Thống kê bài tập đã nộp của sinh viên
      const completedAssignments = openAssignments.filter(
        (a: any) =>
          (a.submissions && a.submissions.length > 0) ||
          a.hasSubmitted === true ||
          a.submissionStatus === "submitted"
      ).length;

      // Thống kê điểm danh cá nhân
      const activeSessions = sessions.filter((s: any) => {
        if (!s.expiresAt) return true;
        return dayjs(s.expiresAt).isAfter(dayjs());
      }).length;

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;

      sessions.forEach((session: any) => {
        const myRecord = session.attendances?.find(
          (att: any) => Number(att.studentId) === Number(currentStudentId)
        );
        if (myRecord) {
          if (myRecord.status === "present") presentCount++;
          else if (myRecord.status === "late") lateCount++;
          else absentCount++;
        } else if (
          session.expiresAt &&
          dayjs(session.expiresAt).isBefore(dayjs())
        ) {
          absentCount++;
        }
      });

      const myAttendanceRate =
        sessions.length > 0
          ? ((presentCount + lateCount * 0.5) / sessions.length) * 100
          : 0;

      // Thống kê điểm số cá nhân (chỉ tính các cột đã công bố)
      const publishedCols =
        gradeBook?.columns?.filter((c: any) => c.isPublished) || [];
      let myAvgGradePercent = 0;

      if (gradeBook?.students && currentStudentId) {
        const myGradeRow = gradeBook.students.find(
          (st: any) =>
            Number(st.studentId) === Number(currentStudentId) ||
            Number(st.id) === Number(currentStudentId)
        );

        if (myGradeRow?.columns) {
          const validScores = Object.values(myGradeRow.columns).filter(
            (col: any) => col && col.score !== null && col.score !== undefined
          );
          if (validScores.length > 0) {
            myAvgGradePercent =
              validScores.reduce(
                (sum: number, col: any) => sum + Number(col.percentage || 0),
                0
              ) / validScores.length;
          }
        }
      }

      setStats({
        totalStudents: students.length,
        totalGroups: groups.length,
        totalAssignments: openAssignments.length,
        completedAssignments,
        totalMaterials: openMaterials.length,
        totalSessions: sessions.length,
        activeSessions,
        presentCount,
        lateCount,
        absentCount,
        myAttendanceRate,
        publishedGradeColumns: publishedCols.length,
        totalGradeColumns: gradeBook?.columns?.length || publishedCols.length,
        myAvgGradePercent,
      });

      // Hoạt động gần đây của lớp
      const recentActs = [
        ...sessions.slice(0, 5).map((s: any) => ({
          type: "attendance",
          title: `Buổi điểm danh: ${s.name || `Phiên #${s.id}`}`,
          time: s.createdAt,
          color: "#2563eb",
        })),
        ...openAssignments.slice(0, 5).map((a: any) => ({
          type: "assignment",
          title: `Bài tập mới: ${a.title}`,
          time: a.createdAt || a.assignedAt,
          color: "#7c3aed",
        })),
        ...openMaterials.slice(0, 5).map((m: any) => ({
          type: "material",
          title: `Tài liệu mới: ${
            m.material?.title || m.title || "Tài liệu học tập"
          }`,
          time: m.assignedAt || m.createdAt,
          color: "#ea580c",
        })),
      ]
        .filter((item) => item.time)
        .sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        )
        .slice(0, 8);

      setRecentActivities(recentActs);

      // Deadline sắp tới của sinh viên
      const upcoming = openAssignments
        .filter((a: any) => a.dueDate && dayjs(a.dueDate).isAfter(dayjs()))
        .sort(
          (a: any, b: any) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )
        .slice(0, 5);

      setUpcomingDeadlines(upcoming);
      setLastUpdated(dayjs().format("DD/MM/YYYY HH:mm"));
    } catch (err) {
      console.error("Lỗi tải dữ liệu overview sinh viên:", err);
      toast.error("Không thể tải dữ liệu tổng quan lớp học");
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
          Đang tải dữ liệu tổng quan học tập...
        </span>
      </div>
    );
  }

  const assignmentCompletionRate =
    stats.totalAssignments > 0
      ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
      : 0;

  const attendanceColor =
    stats.myAttendanceRate >= 80
      ? "#10b981"
      : stats.myAttendanceRate >= 50
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1.3,
                }}
              >
                Tổng quan học tập
              </h2>
              {courseInfo?.sectionCode && (
                <Tag
                  color="blue"
                  style={{ margin: 0, borderRadius: 6, fontWeight: 600 }}
                >
                  {courseInfo.sectionCode}
                </Tag>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
              {courseInfo?.subject?.subjectName
                ? `${courseInfo.subject.subjectName} · `
                : ""}
              Cập nhật lúc {lastUpdated}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {stats.activeSessions > 0 && (
            <Button
              type="primary"
              icon={<UserCheck size={15} />}
              onClick={() => navigate(`/student/courses/${sectionId}/attendance`)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 8,
                fontWeight: 500,
              }}
            >
              Điểm danh ngay ({stats.activeSessions} phiên đang mở)
            </Button>
          )}
          <Button
            icon={<RefreshCw size={14} />}
            onClick={fetchStudentOverview}
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
      </div>

      {/* 4 KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Sĩ số lớp học"
            value={stats.totalStudents}
            footerText={`Tổng cộng ${stats.totalGroups} nhóm học tập`}
            icon={<Users size={20} />}
            iconBg="#eff6ff"
            iconColor="#2563eb"
            onClick={() => navigate(`/student/courses/${sectionId}/members`)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Nhóm của bạn"
            value={
              myGroup
                ? myGroup.groupName || myGroup.groupCode || `Nhóm #${myGroup.id}`
                : "Chưa có nhóm"
            }
            valueColor={myGroup ? "#0f172a" : "#ea580c"}
            valueSize={myGroup ? 22 : 19}
            footerText={
              myGroup
                ? `${groupMembers.length}/${myGroup.maxMembers || 6} thành viên trong nhóm`
                : "Bấm để chọn & tham gia nhóm"
            }
            footerWarning={!myGroup}
            icon={<Layers size={20} />}
            iconBg="#ecfdf5"
            iconColor="#10b981"
            onClick={() => navigate(`/student/courses/${sectionId}/groups`)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Bài tập đã nộp"
            value={`${stats.completedAssignments}/${stats.totalAssignments}`}
            footerText={`Hoàn thành ${assignmentCompletionRate}% bài tập`}
            icon={<FileText size={20} />}
            iconBg="#f5f3ff"
            iconColor="#7c3aed"
            onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Tài liệu học tập"
            value={stats.totalMaterials}
            footerText="Sẵn sàng tải xuống & xem trực tuyến"
            icon={<FolderOpen size={20} />}
            iconBg="#fff7ed"
            iconColor="#ea580c"
            onClick={() => navigate(`/student/courses/${sectionId}/materials`)}
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
                Chuyên cần của bạn
              </span>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() =>
                  navigate(`/student/courses/${sectionId}/attendance`)
                }
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
                <div style={{ fontSize: 26, fontWeight: 700, color: "#10b981" }}>
                  {stats.presentCount}
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b" }}>Có mặt</div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  borderLeft: "1px solid #e2e8f0",
                  borderRight: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 700, color: "#f59e0b" }}>
                  {stats.lateCount}
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b" }}>Đi trễ</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#ef4444" }}>
                  {stats.absentCount}
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b" }}>Vắng mặt</div>
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
                  Tỷ lệ tham gia ({stats.presentCount + stats.lateCount}/
                  {stats.totalSessions} buổi)
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: attendanceColor,
                  }}
                >
                  {stats.myAttendanceRate.toFixed(1)}%
                </span>
              </div>
              <Progress
                percent={Number(stats.myAttendanceRate.toFixed(1))}
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
                Kết quả học tập
              </span>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => navigate(`/student/courses/${sectionId}/grades`)}
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
                  {stats.publishedGradeColumns}
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b" }}>
                  Cột điểm đã công bố
                </div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  borderLeft: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 700, color: "#7c3aed" }}>
                  {stats.myAvgGradePercent.toFixed(1)}%
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b" }}>
                  Mức đạt trung bình
                </div>
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
                  Tiến độ điểm số hiện tại
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#7c3aed",
                  }}
                >
                  {stats.myAvgGradePercent.toFixed(1)}%
                </span>
              </div>
              <Progress
                percent={Number(stats.myAvgGradePercent.toFixed(1))}
                strokeColor="#7c3aed"
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
        {/* Cột 1: Hoạt động mới trong lớp */}
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
                Hoạt động mới trong lớp
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

        {/* Cột 2: Deadline sắp tới */}
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
                Deadline sắp tới
              </span>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() =>
                  navigate(`/student/courses/${sectionId}/assignments`)
                }
                style={{ padding: 0, fontWeight: 500 }}
              >
                Tất cả
              </Button>
            }
          >
            {upcomingDeadlines.length === 0 ? (
              <Empty
                description="Không có deadline nào sắp tới"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ marginTop: 60 }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upcomingDeadlines.map((item: any) => {
                  const daysLeft = dayjs(item.dueDate).diff(dayjs(), "day");
                  const isUrgent = daysLeft <= 3;
                  const isSubmitted =
                    (item.submissions && item.submissions.length > 0) ||
                    item.hasSubmitted === true;

                  return (
                    <div
                      key={item.id}
                      onClick={() =>
                        navigate(`/student/courses/${sectionId}/assignments`)
                      }
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#f8fafc",
                        border: "1px solid #f1f5f9",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#cbd5e1";
                        e.currentTarget.style.background = "#f1f5f9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#f1f5f9";
                        e.currentTarget.style.background = "#f8fafc";
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 8,
                          background: isSubmitted
                            ? "#ecfdf5"
                            : isUrgent
                            ? "#fef2f2"
                            : "#eff6ff",
                          color: isSubmitted
                            ? "#10b981"
                            : isUrgent
                            ? "#ef4444"
                            : "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {isSubmitted ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <Clock size={18} />
                        )}
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
                            Hạn: {dayjs(item.dueDate).format("DD/MM/YYYY HH:mm")}
                          </span>
                          {isSubmitted ? (
                            <Tag
                              color="green"
                              style={{ margin: 0, borderRadius: 6, fontSize: 11 }}
                            >
                              Đã nộp bài
                            </Tag>
                          ) : (
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
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* Cột 3: Thành viên nhóm */}
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
                <Users size={17} color="#10b981" />
                {myGroup
                  ? `Thành viên ${myGroup.groupName || "nhóm"}`
                  : "Nhóm học tập"}
              </span>
            }
            extra={
              <Button
                type="link"
                size="small"
                icon={<MessageSquare size={14} />}
                onClick={() => navigate(`/student/courses/${sectionId}/chat`)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 0,
                  fontWeight: 500,
                }}
              >
                Phòng chat
              </Button>
            }
          >
            {groupMembers.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {groupMembers.map((member: any, index: number) => {
                  const fullName =
                    member.student?.user?.fullName ||
                    member.fullName ||
                    "Sinh viên";
                  const studentCode =
                    member.student?.studentCode || member.studentCode || "";

                  return (
                    <div
                      key={member.studentId || member.id || index}
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          minWidth: 0,
                        }}
                      >
                        <Avatar
                          size={36}
                          style={{
                            background: index === 0 ? "#2563eb" : "#10b981",
                            color: "#fff",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {fullName.charAt(0).toUpperCase()}
                        </Avatar>
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
                            {fullName}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {studentCode}
                          </div>
                        </div>
                      </div>

                      <Tag
                        color="green"
                        style={{
                          margin: 0,
                          borderRadius: 6,
                          fontSize: 11.5,
                        }}
                      >
                        Thành viên
                      </Tag>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ paddingTop: 32, textAlign: "center" }}>
                <Empty
                  description="Bạn chưa tham gia nhóm nào trong lớp học phần này"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button
                    type="primary"
                    onClick={() =>
                      navigate(`/student/courses/${sectionId}/groups`)
                    }
                    style={{ borderRadius: 8 }}
                  >
                    Chọn nhóm học tập
                  </Button>
                </Empty>
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
  valueColor = "#0f172a",
  valueSize = 26,
  footerText,
  footerWarning = false,
  icon,
  iconBg,
  iconColor,
  onClick,
}: {
  title: string;
  value: number | string;
  valueColor?: string;
  valueSize?: number;
  footerText: string;
  footerWarning?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}) {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
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
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              color: "#64748b",
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: valueSize,
              fontWeight: 700,
              color: valueColor,
              lineHeight: 1.25,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
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
          color: footerWarning ? "#ea580c" : "#64748b",
        }}
      >
        {footerWarning ? (
          <AlertCircle size={14} color="#ea580c" />
        ) : (
          <CheckCircle2 size={14} color="#10b981" />
        )}
        <span>{footerText}</span>
      </div>
    </Card>
  );
}