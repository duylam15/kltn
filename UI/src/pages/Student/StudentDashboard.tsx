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
} from "antd";
import type { MenuProps } from "antd";
import { EllipsisOutlined, FolderOpenOutlined, PictureOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/authContext";

const { Text, Title } = Typography;

const API_BASE = "http://localhost:4000/api/v1";
const ORDER_KEY = "studentCourseOrder";
const GRID_GUTTER = 24;
const COL_SPAN = { xs: 24, sm: 12, md: 8, lg: 8, xl: 8 };


/* ===== Types (align with your BE) ===== */
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
  id: number;               // enrollmentId (để hủy)
  sectionId?: number;       // tuỳ API
  courseSectionId?: number; // tuỳ API
  section?: CourseSection;  // 1 số route trả "section"
  courseSection?: CourseSection; // 1 số route trả "courseSection"
};

/* Helpers */
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

  // order từ localStorage
  const initialOrder = useMemo<number[]>(() => {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);
  const [order, setOrder] = useState<number[]>(initialOrder);

  /* 1) Lấy danh sách lớp theo userId */
  useEffect(() => {
    if (!userId) return; // chưa đăng nhập
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get<{ success: boolean; data: Enrollment[] }>(
          `${API_BASE}/sections-enrollments/by-user/${userId}`,
          
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
    })();
  }, [userId, initialOrder.length]);

  /* 2) Lấy giáo viên owner cho từng section */
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
      } catch {
        /* ignore */
      }
    })();
  }, [enrollments]);

  /* 3) Sắp xếp theo order */
  const ordered = useMemo(() => {
    if (!order.length) return enrollments;
    const byId: Record<number, Enrollment> = {};
    enrollments.forEach((e) => (byId[getSectionFrom(e).id] = e));

    const arranged: Enrollment[] = [];
    order.forEach((sid) => byId[sid] && arranged.push(byId[sid]));
    // thêm lớp mới chưa có trong order
    enrollments.forEach((e) => {
      const sid = getSectionFrom(e).id;
      if (!order.includes(sid)) arranged.push(e);
    });
    return arranged;
  }, [order, enrollments]);

  /* Di chuyển vị trí thẻ */
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

  /* Hủy đăng ký theo enrollmentId (khuyên dùng) */
  const onUnenroll = (enrollmentId: number) => {
    Modal.confirm({
      title: "Hủy đăng ký lớp này?",
      okText: "Hủy đăng ký",
      okButtonProps: { danger: true },
      cancelText: "Bỏ qua",
      async onOk() {
        try {
          await axios.delete(`${API_BASE}/sections-enrollments/${enrollmentId}`, {
            withCredentials: true,
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

  /* Menu 3 chấm */
  const cardMenu = (en: Enrollment): MenuProps["items"] => {
    const section = getSectionFrom(en);
    return [
      { key: "move", label: "Di chuyển", onClick: () => setMoveModal({ open: true, secId: section.id }) },
      { type: "divider" as const },
      { key: "unenroll", danger: true, label: "Hủy đăng ký khóa học", onClick: () => onUnenroll(en.id) },
    ];
  };

  /* Header card */
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
            {section.subject?.subjectName || ""}
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

  if (!userId) {
    return (
      <div style={{ padding: 16 }}>
        <Text type="secondary">Vui lòng đăng nhập để xem danh sách lớp.</Text>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: 16 }}>
        <Row gutter={[GRID_GUTTER, GRID_GUTTER]}>
          {ordered.map((en) => {
            const section = getSectionFrom(en);
            return (
              <Col key={section.id} {...COL_SPAN}>
                <Card
                  hoverable
                  style={{ borderRadius: 12, overflow: "hidden" }}
                  bodyStyle={{ padding: 0 }}
                  actions={[
                   
                    <Dropdown
    key="more"
    trigger={["click"]}
    menu={{ items: cardMenu(en) }}
    placement="bottomLeft"
  >
    <div
      onClick={(e) => e.stopPropagation()} // ⛔ Ngăn click lan ra Card
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "flex-end", // cho icon nằm bên trái
        padding: "8px 0",
      }}
    >
      <EllipsisOutlined style={{ fontSize: 20, marginRight:20}} />
    </div>
  </Dropdown>,
                  ]}
                  onClick={() => (window.location.href = `/student/courses/${section.id}`)}
                >
                  <CardHeader en={en} />
                  <div style={{ height: 140, background: "#fff" }} />
                </Card>
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
    </div>
  );
}
