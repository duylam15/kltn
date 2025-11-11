// src/pages/Student/StudentDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Card,
  Dropdown,
  Avatar,
  Row,
  Col,
  Spin,
  Typography,
  Modal,
  Select,
  message,
  Button,
  Input,
  Space,
} from "antd";
import type { MenuProps } from "antd";
import {
  EllipsisOutlined,
  FolderOpenOutlined,
  PictureOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";

const { Text, Title } = Typography;
const { Search } = Input;

const API_BASE = "http://localhost:4000/api/v1";
const ORDER_KEY = "studentCourseOrder";
const GRID_GUTTER = 24;
// 3 thẻ / hàng trên màn hình >= lg
const COL_SPAN = { xs: 24, sm: 12, md: 8, lg: 8, xl: 8 };

/* ===== Types ===== */
type User = { id: number; fullName: string; email: string; avatar?: string };
type Teacher = { id: number; user: User };
type SectionInstructor = {
  sectionId: number;
  teacherId: number;
  role: "owner" | "co" | "ta";
  teacher: Teacher;
};

type Subject = { code?: string; subjectName?: string };
type Term = { name?: string };
type CourseSection = { id: number; name?: string; subject?: Subject; term?: Term };

type Enrollment = {
  id: number; // enrollmentId
  sectionId?: number;
  courseSectionId?: number;
  section?: CourseSection;
  courseSection?: CourseSection;
};

const getSectionFrom = (en: Enrollment): CourseSection =>
  en.section ||
  en.courseSection ||
  ({ id: Number(en.sectionId ?? en.courseSectionId) } as CourseSection);

export default function StudentDashboard() {
  const { user } = useAuth();
  const userId = user?.id;

  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teachers, setTeachers] = useState<Record<number, SectionInstructor | null>>({});
  const [moveModal, setMoveModal] = useState<{ open: boolean; secId?: number }>({ open: false });

  // Modal tham gia lớp
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // Thứ tự thẻ (lưu localStorage)
  const initialOrder = useMemo<number[]>(() => {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);
  const [order, setOrder] = useState<number[]>(initialOrder);

  /** 1) Tải danh sách lớp của SV theo userId */
  async function fetchCourses() {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get<{ success: boolean; data: Enrollment[] }>(
        `${API_BASE}/sections-enrollments/by-user/${userId}`
        // { withCredentials: true } // bật nếu endpoint cần cookie
      );
      const data = res.data?.data ?? [];
      setEnrollments(data);

      // init order nếu chưa có
      if (!initialOrder.length && data.length) {
        const ids = data
          .map((e) => getSectionFrom(e).id)
          .filter((id) => Number.isFinite(id));
        setOrder(ids);
        localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
      }
    } catch (e) {
      console.error(e);
      message.error("Không tải được danh sách lớp.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /** 2) Tải giáo viên owner cho từng section */
  useEffect(() => {
    if (!enrollments.length) return;
    (async () => {
      try {
        const pairs = await Promise.all(
          enrollments.map(async (en) => {
            const secId = getSectionFrom(en).id;
            if (!secId) return [NaN, null] as const;
            try {
              const r = await axios.get<{ success: boolean; data: SectionInstructor }>(
                `${API_BASE}/sections-instructors/section/${secId}/teacher`,
                { withCredentials: true }
              );
              return [secId, r.data?.data ?? null] as const;
            } catch {
              return [secId, null] as const;
            }
          })
        );
        const map: Record<number, SectionInstructor | null> = {};
        pairs.forEach(([sid, ins]) => Number.isFinite(sid) && (map[sid] = ins));
        setTeachers(map);
      } catch {/* ignore */}
    })();
  }, [enrollments]);

  /** 3) Sắp xếp theo thứ tự đã lưu */
  const ordered = useMemo(() => {
    if (!order.length) return enrollments;
    const byId: Record<number, Enrollment> = {};
    enrollments.forEach((e) => (byId[getSectionFrom(e).id] = e));

    const arranged: Enrollment[] = [];
    order.forEach((sid) => byId[sid] && arranged.push(byId[sid]));
    // cộng thêm lớp mới chưa có trong order
    enrollments.forEach((e) => {
      const sid = getSectionFrom(e).id;
      if (!order.includes(sid)) arranged.push(e);
    });
    return arranged;
  }, [order, enrollments]);

  /** Đổi vị trí thẻ */
  const onMove = (secId: number, newPos: number) => {
    const base = order.length ? order : ordered.map((e) => getSectionFrom(e).id);
    const current = [...base];
    const idx = current.indexOf(secId);
    if (idx === -1) return;
    current.splice(idx, 1);
    current.splice(newPos, 0, secId);
    setOrder(current);
    localStorage.setItem(ORDER_KEY, JSON.stringify(current));
    setMoveModal({ open: false, secId: undefined });
  };

  /** Hủy đăng ký theo enrollmentId */
  const onUnenroll = (enrollmentId: number) => {
    Modal.confirm({
      title: "Hủy đăng ký lớp này?",
      okText: "Hủy đăng ký",
      okButtonProps: { danger: true },
      cancelText: "Bỏ qua",
      async onOk() {
        try {
          await axios.delete(`${API_BASE}/sections-enrollments/${enrollmentId}`, {
            
          });
          message.success("Đã hủy đăng ký.");
          setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
          const leftIds = ordered
            .filter((e) => e.id !== enrollmentId)
            .map((e) => getSectionFrom(e).id);
          setOrder(leftIds);
          localStorage.setItem(ORDER_KEY, JSON.stringify(leftIds));
        } catch (e) {
          console.error(e);
          message.error("Hủy đăng ký thất bại.");
        }
      },
    });
  };

  /** Menu 3 chấm */
  const cardMenu = (en: Enrollment): MenuProps["items"] => {
    const section = getSectionFrom(en);
    return [
      { key: "move", label: "Di chuyển", onClick: () => setMoveModal({ open: true, secId: section.id }) },
      { type: "divider" as const },
      { key: "unenroll", danger: true, label: "Hủy đăng ký khóa học", onClick: () => onUnenroll(en.id) },
    ];
  };

  /** Header card (tiêu đề + avatar GV) */
  const CardHeader = ({ en }: { en: Enrollment }) => {
    const section = getSectionFrom(en);
    const ins = teachers[section.id];
    const teacherName = ins?.teacher?.user?.fullName || "—";
    const teacherAvatar = ins?.teacher?.user?.avatar;

    return (
      <div style={{ position: "relative", color: "#fff" }}>
        <div
          style={{
            background: "linear-gradient(135deg,#0a66c2,#0a83d2)",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            padding: "16px 16px 56px 16px",
            minHeight: 110,
          }}
        >
          <Title level={4} style={{ color: "#fff", margin: 0 }}>
            {section.name || section.subject?.subjectName || section.subject?.code || `Lớp #${section.id}`}
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.9)" }}>
            {section.term?.name || ""}
          </Text>
          <div style={{ marginTop: 6 }}>
            <Text style={{ color: "#fff" }}>{teacherName}</Text>
          </div>
        </div>

        <div style={{ position: "absolute", right: 12, top: 56 }}>
          <Avatar size={64} src={teacherAvatar} style={{ border: "3px solid #fff" }}>
            {teacherName?.[0]}
          </Avatar>
        </div>
      </div>
    );
  };

  /** Tham gia lớp bằng mã */
 async function handleJoinByCode(code: string, uId?: number) {
  const trimmed = (code || "").trim();
  if (!trimmed) return message.warning("Nhập mã lớp");
  if (!uId)    return message.error("Thiếu userId. Vui lòng đăng nhập lại.");

  try {
    const res = await axios.post(
      `${API_BASE}/course-sections/join-public`,
      { code: trimmed, userId: uId },
      { withCredentials: false }
    );
    if (res.data?.success) {
      message.success("Tham gia lớp thành công");
      setJoinOpen(false);
      setJoinCode("");
      await fetchCourses();  // cập nhật lưới thẻ lớp
    } else {
      message.error(res.data?.message || "Không thể tham gia lớp");
    }
  } catch (e: any) {
    message.error(e?.response?.data?.message || "Mã lớp không hợp lệ");
  }
}

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 16 }}>
        {/* Header + nút tham gia */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Title level={4} style={{ margin: 0 }}>Lớp học của tôi</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setJoinOpen(true)}>
            Tham gia lớp
          </Button>
        </div>

        <Row gutter={[GRID_GUTTER, GRID_GUTTER]}>
          {ordered.map((en) => {
  const section = getSectionFrom(en);

  return (
    <Col key={section.id} {...COL_SPAN}>
      {/* khung bao ngoài để đặt nút 3 chấm chồng lên Card */}
      <div style={{ position: "relative" }}>
        {/* Nút 3 chấm nổi, nằm ngoài Card và chồng lên */}
        <Dropdown
          trigger={["click"]}
          placement="bottomLeft"
          menu={{
            items: cardMenu(en),
            onClick: async ({ key, domEvent }) => {
              domEvent.stopPropagation(); // không đè onClick Card
              if (key.startsWith("move-")) {
                setMoveModal({ open: true, secId: getSectionFrom(en).id });
              }
              if (key.startsWith("unenroll-")) {
                onUnenroll(en.id);
              }
            },
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}     // tránh kích hoạt onClick của Card
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 5,                              // 🔸 cao hơn Card
              padding: 5,
              height: 26,
              borderRadius: 999,
              background: "rgba(255,255,255,0.9)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              cursor: "pointer",
            }}
          >
            <EllipsisOutlined style={{ fontSize: 18 }} />
          </div>
        </Dropdown>

        {/* Card */}
        <Card
          hoverable
          style={{ borderRadius: 12, overflow: "hidden" }} 
            styles={{ body: { padding: 0 } }}
          onClick={() => (window.location.href = `/student/courses/${section.id}`)}
        >
          <CardHeader en={en} />
          <div style={{ height: 140, background: "#fff" }} />
        </Card>
      </div>
    </Col>
  );
})}

        </Row>
      </div>

      {/* Modal di chuyển */}
      <Modal
        open={moveModal.open}
        title="Di chuyển thẻ lớp"
        onCancel={() => setMoveModal({ open: false })}
        okButtonProps={{ style: { display: "none" } }}
        cancelText="Đóng"
      >
        <Text>Chọn vị trí mới trong lưới:</Text>
        <Select
          style={{ width: "100%", marginTop: 8 }}
          placeholder="Chọn vị trí"
          onChange={(val) => moveModal.secId && onMove(moveModal.secId, Number(val))}
          options={Array.from({ length: ordered.length }, (_, i) => ({
            value: i,
            label: `Vị trí ${i + 1}`,
          }))}
        />
        <div style={{ marginTop: 8, color: "#888" }}>
          * Thứ tự này được lưu trên trình duyệt của bạn (local).
        </div>
      </Modal>

      {/* Modal tham gia lớp */}
      <Modal
        open={joinOpen}
        title="Tham gia lớp học"
        okText="Tham gia"
        onCancel={() => setJoinOpen(false)}
        onOk={() => handleJoinByCode(joinCode, userId)}
        okButtonProps={{ disabled: !joinCode.trim() }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text type="secondary">Bạn đang đăng nhập bằng:</Text>
          <Space>
            <Avatar>{(user?.fullName || "U")[0]}</Avatar>
            <div>
              <div style={{ fontWeight: 600 }}>{user?.fullName || "User"}</div>
              <Text type="secondary">{user?.email}</Text>
            </div>
          </Space>

          <div style={{ marginTop: 12 }}>
            <Text strong>Mã lớp</Text>
            <Search
              style={{ marginTop: 6 }}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Nhập mã lớp do GV cung cấp"
              enterButton="Tham gia"
              onSearch={(val) => handleJoinByCode(val, userId)}
              allowClear
            />
          </div>
        </Space>
      </Modal>
    </Spin>
  );
}
