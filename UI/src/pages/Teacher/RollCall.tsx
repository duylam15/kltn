import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Spin,
  Typography,
  Tag,
  Modal,
  Input,
  Tooltip,
  Form,
  DatePicker,
  Space,InputNumber
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  TeamOutlined,
  QrcodeOutlined,
  WarningOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs, { Dayjs } from "dayjs";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";
import { DynamicQr } from "../../pages/Teacher/DynamicQr"; 

const { Title } = Typography;
const API_BASE = "http://localhost:4000/api/v1";

type Session = {
  id: number;
  sectionId: number;
  name?: string | null;
  sessionCode?: string;
  qrCodeUrl?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  createdAt: string;
  updatedAt?: string;
  attendances?: Attendance[];
  expiresAt?: string | Dayjs | null;
   totpSecretBase32?: string | null;
  totpPeriod?: number | null;
  totpDigits?: number | null;
  sessionScore?: number | null;
};

type Attendance = {
  id: number;
  sessionId: number;
  studentId: number;
  status: "present" | "warning" | "late";
  checkedInAt: string;
  distance?: number;
  ipAddress?: string;
  deviceInfo?: string;
  userAgent?: string;
  score?: number;
  isValid?: boolean;
  adjustedBy?: number;
  adjustedAt?: string;
  note?: string;
};

type Student = {
  id: number;
  studentCode: string;
  className: string;
  user: { fullName: string; email: string };
};

type Enrollment = {
  student: Student;
  attendance?: Attendance;
};

export default function RollCall() {
  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);
  const { user } = useAuth();
  const teacherId = user?.id;

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [keyword, setKeyword] = useState("");

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [studentList, setStudentList] = useState<Enrollment[]>([]);
  const [editing, setEditing] = useState<Session | null>(null);

  const [form] = Form.useForm<Session>();
  const [createForm] = Form.useForm<Session>();

  useEffect(() => {
    if (!listModalOpen || !selectedSession?.id) return;
    const t = setInterval(() => fetchStudents(selectedSession.id!), 5000);
    return () => clearInterval(t);
  }, [listModalOpen, selectedSession?.id]);

  useEffect(() => {
    fetchSessions();
  }, [sectionId]);

 const fetchSessions = async () => {
  try {
    setLoading(true);
    const listRes = await axios.get(
      `${API_BASE}/attendance/sections/${sectionId}/sessions`
    );

    if (!listRes.data.success) throw new Error("Failed");

    const sessionsBasic = listRes.data.data;

    // Lấy chi tiết từng session để có totpSecretBase32
    const sessionsWithTotp = await Promise.all(
      sessionsBasic.map(async (s: Session) => {
        try {
          const detailRes = await axios.get(
            `${API_BASE}/attendance/sessions/${s.id}`
          );
          return detailRes.data.success ? detailRes.data.data : s;
        } catch {
          return s; // fallback nếu lỗi
        }
      })
    );

    setSessions(sessionsWithTotp);
  } catch (err) {
    console.error(err);
    toast.error("Không tải được danh sách phiên điểm danh");
  } finally {
    setLoading(false);
  }
};

  const fetchStudents = async (sessionId: number) => {
    try {
      const [enrollRes, sessionRes] = await Promise.all([
        axios.get(`${API_BASE}/sections-enrollments/section/${sectionId}/students`),
        axios.get(`${API_BASE}/attendance/sessions/${sessionId}`),
      ]);

      if (!enrollRes.data?.success) throw new Error("Enrollments failed");
      if (!sessionRes.data?.success) throw new Error("Session failed");

      const freshSession: Session = sessionRes.data.data;
      setSelectedSession(freshSession);

      const attendances: Attendance[] = freshSession.attendances ?? [];
      const merged = enrollRes.data.data.map((enrollment: any) => {
        const attendance = attendances.find(
          (a: Attendance) => a.studentId === enrollment.studentId
        );
        return { ...enrollment, attendance };
      });

      setStudentList(merged);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách sinh viên/điểm danh mới");
    }
  };

  const createSession = async () => {
    try {
      const values = await createForm.validateFields();

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      const accuracy = pos.coords.accuracy ?? null;

      // chặn nếu độ chính xác của GV quá kém
      const MAX_ALLOWED_ACCURACY_FOR_TEACHER = 100; // mét
      if (accuracy == null || accuracy > MAX_ALLOWED_ACCURACY_FOR_TEACHER) {
        toast.error(
          `Không thể lấy vị trí chính xác (Sai số: ${
            Math.round(accuracy || 0)
          }m > ${MAX_ALLOWED_ACCURACY_FOR_TEACHER}m). Vui lòng tắt->bật lại Wi-Fi THỬ.`
        );
        return;
      }

      const payload = {
        sectionId,
        name: values.name?.trim() || null,
        expiresAt: values.expiresAt ? values.expiresAt.toString() : null,
        latitude,
        longitude,
        radius: Number(values.radius) || 100, // lấy từ form
        teacherAccuracy: accuracy, // gửi để server kiểm
        sessionScore: Number(values.sessionScore),
      };

      const res = await axios.post(`${API_BASE}/attendance/sessions`, payload);

      if (res.data.success) {
        toast.success("Tạo phiên điểm danh thành công");
        setCreateModalOpen(false);
        createForm.resetFields();
        fetchSessions();
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      console.error(err);
      toast.error(err?.response?.data?.message || "Tạo phiên thất bại");
    }
  };

  const updateSession = async () => {
    try {
      if (!editing) return;

      const values = await form.validateFields();
      const payload = {
        ...values,
         radius: Number(values.radius),
        expiresAt: values.expiresAt ? dayjs(values.expiresAt).toISOString() : null,
        sessionScore: Number(values.sessionScore),
      };

      await axios.put(`${API_BASE}/attendance/sessions/${editing.id}`, payload);
      toast.success("Cập nhật phiên điểm danh thành công");
      setEditModalOpen(false);
      setEditing(null);
      fetchSessions();
    } catch (err: any) {
      if (err?.errorFields) return;
      console.error(err);
      toast.error("Cập nhật thất bại");
    }
  };

  const deleteSession = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/attendance/sessions/${id}`);
      toast.success("Xóa phiên điểm danh thành công");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Xóa thất bại");
    }
  };

  const handleManualCheckIn = async (studentCode: string) => {
    if (!selectedSession) return;

    const has = studentList.find(
      (x) => x.student.studentCode === studentCode
    )?.attendance;
    if (has) {
      toast.error("Sinh viên đã điểm danh.");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/attendance/manual-check-in`, {
        sessionId: selectedSession.id,
        studentCode,
        teacherId,
        status: "present",
        note: "GV xác nhận thủ công",
      });

      if (res.data.success) {
        toast.success(res.data.message || "Điểm danh thủ công thành công");
        const newAttendance = res.data.data;

        setStudentList((prev) =>
          prev.map((enr) =>
            enr.student.studentCode === studentCode
              ? { ...enr, attendance: newAttendance }
              : enr
          )
        );

        setSelectedSession((prev) => {
          if (!prev) return prev as any;
          const updated = { ...prev };
          if (!updated.attendances) updated.attendances = [];
          const idx = updated.attendances.findIndex(
            (a) => a.studentId === newAttendance.studentId
          );
          if (idx >= 0) updated.attendances[idx] = newAttendance;
          else updated.attendances.push(newAttendance);
          return updated;
        });
      } else {
        toast.error(res.data.message || "Không thể điểm danh thủ công");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Điểm danh thủ công thất bại");
    }
  };

  const handleCancelAttendance = async (studentCode: string) => {
    if (!selectedSession) return;
    if (!teacherId) {
      toast.error("Thiếu teacherId. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/attendance/cancel`, {
        sessionId: selectedSession.id,
        studentCode,
        teacherId,
        reason: "GV hủy điểm danh",
      });

      if (res.data.success) {
        toast.success("Đã hủy điểm danh");

        setStudentList((prev) =>
          prev.map((enr) =>
            enr.student.studentCode === studentCode
              ? { ...enr, attendance: undefined }
              : enr
          )
        );

        const removedStudentId: number | undefined =
          res.data.studentId ??
          studentList.find((s) => s.student.studentCode === studentCode)?.student
            .id;

        setSelectedSession((prev) => {
          if (!prev) return prev as any;
          const updated = { ...prev };
          if (updated.attendances && removedStudentId) {
            updated.attendances = updated.attendances.filter(
              (a) => a.studentId !== removedStudentId
            );
          }
          return updated;
        });
      } else {
        toast.error(res.data.message || "Không thể hủy điểm danh");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Hủy điểm danh thất bại");
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "present":
        return <Tag color="green">Có mặt</Tag>;
      case "warning":
        return <Tag color="orange">Cảnh báo</Tag>;
      case "late":
        return <Tag color="red">Trễ</Tag>;
      default:
        return <Tag color="default">Chưa điểm danh</Tag>;
    }
  };

  const columns = [
    {
      title: "Tên phiên",
      dataIndex: "name",
      key: "name",
      sorter: (a: Session, b: Session) =>
        (a.name || "").localeCompare(b.name || ""),
      render: (text: string, record: Session) => text || `Phiên #${record.id}`,
    },
    {
      title: "Mã phiên",
      dataIndex: "sessionCode",
      key: "sessionCode",
      sorter: (a: Session, b: Session) =>
        (a.sessionCode || "").localeCompare(b.sessionCode || ""),
      render: (text: string) => text || <Tag color="default">N/A</Tag>,
    },{
    title: "Điểm buổi",
    dataIndex: "sessionScore",
    key: "sessionScore",
    width: 110,
    align: "center" as const,
    sorter: (a: Session, b: Session) =>
      (a.sessionScore ?? 0) - (b.sessionScore ?? 0),
    render: (v: number | null | undefined) =>
      v != null ? (
        <Tag color="blue" style={{ fontWeight: 500 }}>
          {v.toFixed(1)}
        </Tag>
      ) : (
        <span style={{ color: "#999" }}>—</span>
      ),
  },
    {
      title: "Bán kính (m)",
      dataIndex: "radius",
      key: "radius",
      width: 120,
      align: "center" as const,
      render: (v: number) => v ?? 50,
    },
    {
      title: "Link điểm danh",
      key: "attendanceLink",
      render: (_: any, record: Session) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            const link = `http://localhost:5173/diemdanh?sessionId=${record.id}`;
            navigator.clipboard.writeText(link);
            toast.success("Đã copy link điểm danh");
          }}
        >
          Copy link
        </Button>
      ),
    },
    {
      title: "Số lượng điểm danh",
      key: "attendanceCount",
      align: "center" as const,
      sorter: (a: Session, b: Session) =>
        (a.attendances?.length || 0) - (b.attendances?.length || 0),
      render: (_: any, record: Session) => record.attendances?.length || 0,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a: Session, b: Session) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Hết hạn",
      dataIndex: "expiresAt",
      key: "expiresAt",
      sorter: (a: Session, b: Session) => {
        const aTime =
          typeof a.expiresAt === "string"
            ? a.expiresAt
            : a.expiresAt
            ? a.expiresAt.toISOString()
            : "0";
        const bTime =
          typeof b.expiresAt === "string"
            ? b.expiresAt
            : b.expiresAt
            ? b.expiresAt.toISOString()
            : "0";
        return new Date(aTime).getTime() - new Date(bTime).getTime();
      },
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: any, record: Session) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Tooltip title="Xem QR Code">
            <Button
              icon={<QrcodeOutlined />}
              size="small"
              onClick={() => {
                setSelectedSession(record);
                setQrModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Danh sách sinh viên">
            <Button
              icon={<TeamOutlined />}
              size="small"
              onClick={() => {
                setSelectedSession(record);
                fetchStudents(record.id);
                setListModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditing(record);
                form.setFieldsValue({
                  ...record,
                  radius: record.radius ?? 100,
                  expiresAt: record.expiresAt ? dayjs(record.expiresAt) : null,
                  sessionScore: record.sessionScore ?? 10,
                });
                setEditModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => deleteSession(record.id)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const studentColumns = [
    {
      title: "MSSV",
      dataIndex: ["student", "studentCode"],
      key: "studentCode",
      width: 120,
      fixed: "left" as const,
      sorter: (a: Enrollment, b: Enrollment) =>
        a.student.studentCode.localeCompare(b.student.studentCode),
    },
    {
      title: "Họ tên",
      dataIndex: ["student", "user", "fullName"],
      key: "fullName",
      width: 180,
      sorter: (a: Enrollment, b: Enrollment) =>
        a.student.user.fullName.localeCompare(b.student.user.fullName),
    },
    {
      title: "Email",
      dataIndex: ["student", "user", "email"],
      key: "email",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Lớp",
      dataIndex: ["student", "className"],
      key: "className",
      width: 100,
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 120,
      align: "center" as const,
      filters: [
        { text: "Có mặt", value: "present" },
        { text: "Cảnh báo", value: "warning" },
        { text: "Trễ", value: "late" },
        { text: "Chưa điểm danh", value: "none" },
      ],
      onFilter: (value: any, record: Enrollment) => {
        if (value === "none") return !record.attendance;
        return record.attendance?.status === value;
      },
      render: (_: any, record: Enrollment) => {
        const status = record.attendance?.status;
        const isValid = record.attendance?.isValid ?? true;

        if (!status) {
          return <Tag color="default">Chưa điểm danh</Tag>;
        }

        const statusConfig = {
          present: { color: "green", text: "Có mặt", icon: <CheckCircleOutlined /> },
          warning: { color: "orange", text: "Cảnh báo", icon: <WarningOutlined /> },
          late: { color: "red", text: "Trễ", icon: <ClockCircleOutlined /> },
        } as const;

        const config =
          statusConfig[status] || { color: "default", text: "N/A", icon: null };

        return (
          <Tag color={config.color} icon={config.icon as any}>
            {config.text}
            {!isValid && <span style={{ marginLeft: 4 }}>⚠️</span>}
          </Tag>
        );
      },
    },
    {
      title: "Thời gian",
      key: "checkedInAt",
      width: 160,
      sorter: (a: Enrollment, b: Enrollment) => {
        const aTime = a.attendance?.checkedInAt
          ? new Date(a.attendance.checkedInAt).getTime()
          : 0;
        const bTime = b.attendance?.checkedInAt
          ? new Date(b.attendance.checkedInAt).getTime()
          : 0;
        return aTime - bTime;
      },
      render: (_: any, record: Enrollment) =>
        record.attendance?.checkedInAt ? (
          dayjs(record.attendance.checkedInAt).format("HH:mm:ss DD/MM/YYYY")
        ) : (
          <span style={{ color: "#999" }}>—</span>
        ),
    },
    {
      title: "Khoảng cách",
      key: "distance",
      width: 120,
      align: "center" as const,
      sorter: (a: Enrollment, b: Enrollment) => {
        const aDist = a.attendance?.distance ?? 999999;
        const bDist = b.attendance?.distance ?? 999999;
        return aDist - bDist;
      },
      render: (_: any, record: Enrollment) => {
        const distance = record.attendance?.distance;
        if (!distance && distance !== 0)
          return <span style={{ color: "#999" }}>—</span>;

        const isWarning = distance > (selectedSession?.radius || 50);
        return (
          <Tag color={isWarning ? "orange" : "green"}>
            {distance.toFixed(1)}m
            {isWarning && " ⚠️"}
          </Tag>
        );
      },
    },
    {
      title: "Địa chỉ IP",
      key: "ipAddress",
      width: 150,
      render: (_: any, record: Enrollment) => {
        const ip = record.attendance?.ipAddress;
        if (!ip) return <span style={{ color: "#999" }}>—</span>;

        return (
          <Tooltip title={`Device: ${record.attendance?.deviceInfo || "Unknown"}`}>
            <Tag icon={<GlobalOutlined />} color="blue">
              {ip}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Điểm",
      key: "score",
      width: 100,
      align: "center" as const,
      sorter: (a: Enrollment, b: Enrollment) => {
        const aScore = a.attendance?.score ?? 0;
        const bScore = b.attendance?.score ?? 0;
        return aScore - bScore;
      },
      render: (_: any, record: Enrollment) => {
        const score = record.attendance?.score;

        if (score === null || score === undefined) {
          return <span style={{ color: "#999" }}>—</span>;
        }

        let color: any = "default";
        if (score >= 9) color = "green";
        else if (score >= 7) color = "blue";
        else if (score >= 5) color = "orange";
        else color = "red";

        return (
          <Tag color={color} style={{ fontWeight: "bold", fontSize: 14 }}>
            {score.toFixed(1)}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 170,
      fixed: "right" as const,
      render: (_: any, record: Enrollment) => {
        const hasAtt = !!record.attendance;
        return (
          <Space size="small">
            {hasAtt ? (
              <Button
                type="default"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleCancelAttendance(record.student.studentCode)}
              >
                Đã điểm danh
              </Button>
            ) : (
              <Button
                type="primary"
                size="small"
                onClick={() => handleManualCheckIn(record.student.studentCode)}
                icon={<CheckCircleOutlined />}
              >
                Điểm danh
              </Button>
            )}

            {record.attendance && (
              <Tooltip title="Xem chi tiết">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    Modal.info({
                      title: "Chi tiết điểm danh",
                      width: 600,
                      content: (
                        <div style={{ marginTop: 16 }}>
                          <p>
                            <strong>Sinh viên:</strong>{" "}
                            {record.student.user.fullName}
                          </p>
                          <p>
                            <strong>MSSV:</strong> {record.student.studentCode}
                          </p>
                          <p>
                            <strong>Trạng thái:</strong>{" "}
                            {getStatusTag(record.attendance?.status || "")}
                          </p>
                          <p>
                            <strong>Thời gian:</strong>{" "}
                            {dayjs(record.attendance?.checkedInAt).format(
                              "HH:mm:ss DD/MM/YYYY"
                            )}
                          </p>
                          {record.attendance?.distance !== undefined && (
                            <p>
                              <strong>Khoảng cách:</strong>{" "}
                              {record.attendance?.distance?.toFixed(2)}m
                            </p>
                          )}
                          {record.attendance?.ipAddress && (
                            <p>
                              <strong>IP:</strong>{" "}
                              {record.attendance?.ipAddress}
                            </p>
                          )}
                          {record.attendance?.deviceInfo && (
                            <p>
                              <strong>Thiết bị:</strong>{" "}
                              {record.attendance?.deviceInfo}
                            </p>
                          )}
                          {record.attendance?.score !== null &&
                            record.attendance?.score !== undefined && (
                              <p>
                                <strong>Điểm:</strong>{" "}
                                {record.attendance?.score}
                              </p>
                            )}
                          {!record.attendance?.isValid && (
                            <p style={{ color: "red" }}>
                              <WarningOutlined /> <strong>Cảnh báo:</strong>{" "}
                              Điểm danh có vấn đề
                            </p>
                          )}
                        </div>
                      ),
                    });
                  }}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const filteredSessions = sessions.filter(
    (s) =>
      !keyword ||
      s.name?.toLowerCase().includes(keyword.toLowerCase()) ||
      s.sessionCode?.toLowerCase().includes(keyword.toLowerCase())
  );

  const getStatistics = () => {
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => {
      if (!s.expiresAt) return true;
      const expireTime =
        typeof s.expiresAt === "string"
          ? s.expiresAt
          : s.expiresAt.toISOString();
      return dayjs(expireTime).isAfter(dayjs());
    }).length;
    const expiredSessions = totalSessions - activeSessions;
    const totalAttendances = sessions.reduce(
      (sum, s) => sum + (s.attendances?.length || 0),
      0
    );
    const avgAttendancePerSession =
      totalSessions > 0 ? totalAttendances / totalSessions : 0;

    return {
      totalSessions,
      activeSessions,
      expiredSessions,
      totalAttendances,
      avgAttendancePerSession,
    };
  };

  const stats = getStatistics();

  if (loading) return <Spin tip="Đang tải..." />;

  return (
    <div style={{ padding: 16 }}>
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
            <CalendarOutlined style={{ fontSize: 14, color: "#1890ff" }} />
            <span>Tổng phiên:</span>
            <strong>{stats.totalSessions}</strong>
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
            <span>Đang hoạt động:</span>
            <strong style={{ color: "#52c41a" }}>{stats.activeSessions}</strong>
          </div>

          {stats.expiredSessions > 0 && (
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
              <ClockCircleOutlined style={{ fontSize: 14, color: "#ff4d4f" }} />
              <span>Đã hết hạn:</span>
              <strong style={{ color: "#ff4d4f" }}>
                {stats.expiredSessions}
              </strong>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên/mã phiên..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchSessions}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              createForm.resetFields();
              setCreateModalOpen(true);
            }}
          >
            Tạo phiên điểm danh
          </Button>
        </div>
      </div>

      <Table<Session>
        dataSource={filteredSessions}
        columns={columns}
        rowKey="id"
        bordered
        pagination={{ pageSize: 10 }}
      />

      {/* Modal QR */}
<Modal
  title="QR Code điểm danh (Động - Cập nhật mỗi 10 giây)"
  open={qrModalOpen}
  onCancel={() => setQrModalOpen(false)}
  footer={null}
  width={500}
  centered // ← Ant Design tự động căn giữa theo chiều dọc
  bodyStyle={{ 
    padding: 24,
    display: "flex",
    justifyContent: "center",  // ← Căn giữa ngang
    alignItems: "center",      // ← Căn giữa dọc
    minHeight: 400,            // Đảm bảo Modal đủ cao
  }}
>
  {selectedSession?.totpSecretBase32 ? (
    <DynamicQr
    sessionId={selectedSession.sectionId}
      secretBase32={selectedSession.totpSecretBase32}
      period={selectedSession.totpPeriod ?? 10}
      digits={selectedSession.totpDigits ?? 6}
      size={320}
    />
  ) : selectedSession?.qrCodeUrl ? (
    <div style={{ textAlign: "center" }}>
      <img
        src={`http://localhost:4000${selectedSession.qrCodeUrl}`}
        alt="QR Code động"
        width={320}
        height={320}
      />
      <p style={{ color: "orange", marginTop: 8 }}>
        Warning: Không có TOTP → đang dùng QR tĩnh
      </p>
    </div>
  ) : (
    <p>Không có QR để hiển thị</p>
  )}
</Modal>


      {/* Modal danh sách sinh viên */}
      <Modal
        title={`Danh sách điểm danh - ${
          selectedSession?.name || `Phiên #${selectedSession?.id}`
        }`}
        open={listModalOpen}
        onCancel={() => setListModalOpen(false)}
        footer={null}
        width={1200}
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        <Table<Enrollment>
          dataSource={studentList}
          columns={studentColumns}
          rowKey={(record) => record.student.id}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          bordered
          scroll={{ x: 1600, y: 500 }}
          size="small"
        />
      </Modal>

      {/* Modal sửa phiên */}
      <Modal
  title="Chỉnh sửa phiên điểm danh"
  open={editModalOpen}
  onCancel={() => setEditModalOpen(false)}
  onOk={updateSession}
  okText="Lưu"
>
  <Form form={form} layout="vertical">
    <Form.Item label="Mã phiên" name="sessionCode">
      <Input disabled />
    </Form.Item>

    <Form.Item label="Tên phiên" name="name">
      <Input placeholder="VD: Buổi học CSDL ngày 25/09" />
    </Form.Item>

    <Form.Item
      label="Bán kính cho phép (m)"
      name="radius"
      rules={[
        { required: true, message: "Vui lòng nhập bán kính" },
        {
          type: "number",
          transform: (v) => Number(v),
          min: 20,
          max: 500,
          message: "20–500 m",
        },
      ]}
    >
      <InputNumber
        style={{ width: "100%" }}
        min={20}
        max={500}
        placeholder="VD: 100"
      />
    </Form.Item>

    <Form.Item label="Ngày hết hạn" name="expiresAt">
      <DatePicker showTime style={{ width: "100%" }} />
    </Form.Item>

    {/* ⬇️ Thêm điểm buổi */}
    <Form.Item
      label="Điểm buổi"
      name="sessionScore"
      rules={[
        { required: true, message: "Vui lòng nhập điểm" },
        {
          type: "number",
          transform: (v) => Number(v),
          min: 0,
          max: 10,
          message: "0–10 điểm",
        },
      ]}
    >
      <InputNumber
        style={{ width: "100%" }}
        min={0}
        max={10}
        step={0.5}
        placeholder="VD: 10"
      />
    </Form.Item>
  </Form>
</Modal>



      {/* Modal tạo phiên */}
     <Modal
  title="Tạo phiên điểm danh mới"
  open={createModalOpen}
  onCancel={() => setCreateModalOpen(false)}
  onOk={createSession}
  okText="Tạo mới"
>
  <Form
    form={createForm}
    layout="vertical"
    initialValues={{ radius: 100, sessionScore: 10 }}  // ⬅️ mặc định 10
  >
    <Form.Item
      label="Tên phiên điểm danh"
      name="name"
      rules={[{ required: true, message: "Vui lòng nhập tên phiên điểm danh" }]}
    >
      <Input placeholder="VD: Buổi học CSDL ngày 25/09" />
    </Form.Item>

    <Form.Item
      label="Ngày hết hạn"
      name="expiresAt"
      rules={[{ required: true, message: "Vui lòng nhập ngày hết hạn" }]}
    >
      <DatePicker showTime style={{ width: "100%" }} />
    </Form.Item>

    <Form.Item
      label="Bán kính cho phép (m)"
      name="radius"
      rules={[
        { required: true, message: "Vui lòng nhập bán kính" },
        {
          type: "number",
          transform: (v) => Number(v),
          min: 20,
          max: 500,
          message: "20–500 m",
        },
      ]}
    >
      <Input type="number" placeholder="VD: 100" />
    </Form.Item>

    {/* ⬇️ Điểm buổi */}
    <Form.Item
      label="Điểm buổi (tối đa)"
      name="sessionScore"
      rules={[
        { required: true, message: "Vui lòng nhập điểm" },
        {
          type: "number",
          transform: (v) => Number(v),
          min: 0,
          max: 10,
          message: "0–10 điểm",
        },
      ]}
    >
      <Input type="number" step="0.5" placeholder="VD: 10" />
    </Form.Item>
  </Form>
</Modal>

    </div>
  );
}