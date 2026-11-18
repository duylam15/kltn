import { useEffect, useState, useMemo } from "react";
import { Card, Spin, Row, Col, Tag, Button, Input, Select, Empty } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BookOpen,
  Search,
  RefreshCw,
  User,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../../context/authContext";

const { Option } = Select;

type Term = {
  id: number;
  code: string;
  name: string;
};

type Instructor = {
  teacher: {
    user: {
      fullName: string;
    };
  };
};

type Section = {
  id: number;
  sectionCode: string;
  sectionName: string;
  status: string;
  schedule: Record<string, string>;
  currentStudents: number;
  maxStudents: number;
  subject: {
    subjectCode: string;
    subjectName: string;
    credits: number;
  };
  term: Term;
  instructors: Instructor[];
};

type EnrollmentData = {
  section: Section;
  enrolledAt: string;
  status: string;
};

const STATUS_META: Record<
  string,
  {
    label: string;
    gradient: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  ongoing: {
    label: "Đang học",
    gradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
    badgeBg: "rgba(255, 255, 255, 0.22)",
    badgeText: "#ffffff",
  },
  planned: {
    label: "Sắp mở",
    gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    badgeBg: "rgba(255, 255, 255, 0.22)",
    badgeText: "#ffffff",
  },
  finished: {
    label: "Đã kết thúc",
    gradient: "linear-gradient(135deg, #475569 0%, #334155 100%)",
    badgeBg: "rgba(255, 255, 255, 0.18)",
    badgeText: "#f1f5f9",
  },
  completed: {
    label: "Hoàn thành",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
    badgeBg: "rgba(255, 255, 255, 0.22)",
    badgeText: "#ffffff",
  },
};

export default function Dashboard() {
  const [data, setData] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [termFilter, setTermFilter] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!user?.id || !user?.student?.id) {
        setLoading(false);
        return;
      }
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("accessToken");

      const res = await axios.get(
        `http://localhost:4000/api/v1/sections-enrollments/student/${user.student.id}/courses`,
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.data.success) {
        setData(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi gọi API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Lọc dữ liệu
  const filteredData = useMemo(() => {
    return data.filter((enrollment) => {
      const section = enrollment.section;
      const lowerQ = keyword.toLowerCase().trim();
      const matchKeyword =
        !lowerQ ||
        section.sectionName?.toLowerCase().includes(lowerQ) ||
        section.sectionCode?.toLowerCase().includes(lowerQ) ||
        section.subject?.subjectName?.toLowerCase().includes(lowerQ) ||
        section.subject?.subjectCode?.toLowerCase().includes(lowerQ);

      const matchStatus =
        (!statusFilter && section.status !== "completed") ||
        (statusFilter && section.status === statusFilter);

      const matchTerm = !termFilter || section.term?.id === termFilter;

      return matchKeyword && matchStatus && matchTerm;
    });
  }, [data, keyword, statusFilter, termFilter]);

  // Lấy danh sách học kỳ duy nhất
  const uniqueTerms = useMemo(() => {
    const map = new Map<number, Term>();
    data.forEach((e) => {
      if (e.section.term?.id) {
        map.set(e.section.term.id, e.section.term);
      }
    });
    return Array.from(map.values());
  }, [data]);

  // Thống kê nhanh
  const totalCredits = useMemo(
    () =>
      filteredData.reduce(
        (sum, item) => sum + (item.section.subject?.credits || 0),
        0
      ),
    [filteredData]
  );

  const ongoingCount = useMemo(
    () => data.filter((item) => item.section.status === "ongoing").length,
    [data]
  );

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
          Đang tải danh sách lớp học phần...
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: "4px 4px 24px 4px",
      }}
    >
      {/* Header & Tóm tắt nhanh */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
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
            <BookOpen size={20} />
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
              Lớp học phần của tôi
            </h2>
            <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
              Đang theo học {ongoingCount} lớp · Hiển thị {filteredData.length}{" "}
              học phần ({totalCredits} tín chỉ)
            </p>
          </div>
        </div>

        {/* Bộ lọc gọn 1 hàng */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Input
            allowClear
            prefix={<Search size={15} color="#94a3b8" />}
            placeholder="Tìm mã lớp, tên môn học..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 240, borderRadius: 8 }}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 145 }}
            value={statusFilter ?? undefined}
            onChange={(value) => setStatusFilter(value ?? null)}
          >
            <Option value="ongoing">Đang học</Option>
            <Option value="planned">Sắp mở</Option>
            <Option value="finished">Đã kết thúc</Option>
            <Option value="completed">Hoàn thành</Option>
          </Select>
          <Select
            allowClear
            placeholder="Tất cả học kỳ"
            style={{ width: 175 }}
            value={termFilter ?? undefined}
            onChange={(value) => setTermFilter(value ?? null)}
          >
            {uniqueTerms.map((term) => (
              <Option key={term.id} value={term.id}>
                {term.name}
              </Option>
            ))}
          </Select>
          <Button
            icon={<RefreshCw size={14} />}
            onClick={() => {
              setKeyword("");
              setStatusFilter(null);
              setTermFilter(null);
              fetchData();
            }}
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

      {/* Danh sách lớp học phần */}
      {filteredData.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            border: "1px dashed #cbd5e1",
            padding: "56px 16px",
            textAlign: "center",
          }}
        >
          <Empty
            description={
              <span style={{ color: "#64748b", fontSize: 13.5 }}>
                {data.length === 0
                  ? "Bạn chưa đăng ký lớp học phần nào"
                  : "Không tìm thấy lớp học phần khớp bộ lọc"}
              </span>
            }
          >
            {data.length > 0 && (
              <Button
                type="primary"
                onClick={() => {
                  setKeyword("");
                  setStatusFilter(null);
                  setTermFilter(null);
                }}
                style={{ borderRadius: 8 }}
              >
                Xóa bộ lọc
              </Button>
            )}
          </Empty>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredData.map((enrollment) => {
            const section = enrollment.section;
            const meta =
              STATUS_META[section.status] || {
                label: section.status,
                gradient: "linear-gradient(135deg, #475569 0%, #334155 100%)",
                badgeBg: "rgba(255, 255, 255, 0.2)",
                badgeText: "#ffffff",
              };

            const instructorNames =
              section.instructors
                ?.map((ins) => ins.teacher?.user?.fullName)
                .filter(Boolean)
                .join(", ") || "Chưa phân công giảng viên";

            const scheduleEntries = Object.entries(section.schedule || {});
            const scheduleText =
              scheduleEntries.length > 0
                ? scheduleEntries
                    .map(([day, time]) => `${day}: ${time}`)
                    .join(" · ")
                : "Chưa cập nhật lịch học";

            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={section.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/student/courses/${section.id}`)}
                  styles={{
                    body: {
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    },
                  }}
                  style={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    height: "100%",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px -5px rgba(15, 23, 42, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Card Banner Header */}
                  <div
                    style={{
                      background: meta.gradient,
                      padding: "16px 18px",
                      color: "#ffffff",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 112,
                    }}
                  >
                    {/* Top Row: Section Code + Status Badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          letterSpacing: 0.3,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "rgba(15, 23, 42, 0.22)",
                          color: "#ffffff",
                        }}
                      >
                        {section.sectionCode}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: meta.badgeBg,
                          color: meta.badgeText,
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>

                    {/* Subject & Section Name */}
                    <div>
                      <h3
                        title={section.subject?.subjectName}
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#ffffff",
                          lineHeight: 1.35,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {section.subject?.subjectName}
                      </h3>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "rgba(255, 255, 255, 0.88)",
                          marginTop: 3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {section.sectionName}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div
                    style={{
                      padding: "14px 18px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {/* Giảng viên */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "#334155",
                        }}
                      >
                        <User
                          size={14}
                          color="#64748b"
                          style={{ flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {instructorNames}
                        </span>
                      </div>

                      {/* Học kỳ */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12.5,
                          color: "#64748b",
                        }}
                      >
                        <Calendar
                          size={14}
                          color="#64748b"
                          style={{ flexShrink: 0 }}
                        />
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {section.term?.name || "Chưa có học kỳ"}
                        </span>
                      </div>

                      {/* Lịch học */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12.5,
                          color: "#64748b",
                        }}
                      >
                        <Clock
                          size={14}
                          color="#64748b"
                          style={{ flexShrink: 0 }}
                        />
                        <span
                          title={scheduleText}
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {scheduleText}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div
                      style={{
                        paddingTop: 12,
                        borderTop: "1px solid #f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Tag
                          color="blue"
                          style={{
                            margin: 0,
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Layers size={11} />
                          {section.subject?.subjectCode}
                        </Tag>
                        <Tag
                          style={{
                            margin: 0,
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 500,
                            background: "#f8fafc",
                            color: "#475569",
                            borderColor: "#e2e8f0",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <GraduationCap size={12} />
                          {section.subject?.credits} TC
                        </Tag>
                      </div>

                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#64748b",
                        }}
                      >
                        <Users size={13} />
                        <span>
                          {section.currentStudents}/{section.maxStudents}
                        </span>
                        <ArrowUpRight size={14} color="#2563eb" />
                      </div>
                    </div>
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