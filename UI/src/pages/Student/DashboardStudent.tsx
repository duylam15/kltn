import { useEffect, useState } from "react";
import {
  Card,
  Spin,
  Typography,
  Row,
  Col,
  Tag,
  Button,
  Input,
  Select,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  ReloadOutlined,
  SearchOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/authContext";
import instance from "../../utils/axiosInstance";

const { Title, Text } = Typography;
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
      const res = await instance.get(
        `/sections-enrollments/student/${user.student.id}/courses`
      );
      if (res.data.success) {
        setData(res.data.data);
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

  if (loading) return <Spin tip="Đang tải..." />;
  if (!data.length) return <p>Không tìm thấy dữ liệu</p>;

  // Lọc dữ liệu
  const filteredData = data.filter((enrollment) => {
    const section = enrollment.section;
    const lowerQ = keyword.toLowerCase();

    const matchKeyword =
      keyword === "" ||
      section.sectionName?.toLowerCase().includes(lowerQ) ||
      section.sectionCode?.toLowerCase().includes(lowerQ) ||
      section.subject.subjectName?.toLowerCase().includes(lowerQ) ||
      section.subject.subjectCode?.toLowerCase().includes(lowerQ);

    const matchStatus =
      (!statusFilter && section.status !== "completed") ||
      (statusFilter && section.status === statusFilter);

    const matchTerm = !termFilter || section.term?.id === termFilter;

    return matchKeyword && matchStatus && matchTerm;
  });

  // Lấy danh sách học kỳ duy nhất
  const uniqueTerms = Array.from(
    new Set(data.map((e) => e.section.term?.id).filter(Boolean))
  );

  return (
    <div style={{ padding: 16 }}>
      {/* Thanh công cụ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Title level={3}>
          <BookOutlined /> Lớp học phần của tôi
        </Title>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo mã lớp, tên lớp, môn học..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 250 }}
          />

          <Select
            allowClear
            placeholder="Lọc theo trạng thái"
            style={{ width: 150 }}
            value={statusFilter ?? undefined}
            onChange={(value) => setStatusFilter(value)}
          >
            <Option value="planned">Planned</Option>
            <Option value="ongoing">Ongoing</Option>
            <Option value="finished">Finished</Option>
            <Option value="completed">Completed</Option>
          </Select>

          <Select
            allowClear
            placeholder="Lọc theo học kỳ"
            style={{ width: 180 }}
            value={termFilter ?? undefined}
            onChange={(value) => setTermFilter(value)}
          >
            {uniqueTerms.map((termId) => {
              const term = data.find((e) => e.section.term?.id === termId)?.section.term;
              return (
                <Option key={termId} value={termId}>
                  {term?.name}
                </Option>
              );
            })}
          </Select>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setKeyword("");
              setStatusFilter(null);
              setTermFilter(null);
              fetchData();
            }}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Danh sách lớp học */}
      <Row gutter={[16, 16]} wrap>
        {filteredData.map((enrollment) => {
          const section = enrollment.section;
          const scheduleText = Object.entries(section.schedule || {})
            .map(([day, time]) => `${day}: ${time}`)
            .join(", ");

          return (
            <Col xs={24} sm={12} md={10} lg={8} key={section.id}>
              <Card
                hoverable
                style={{
                  borderRadius: 8,
                  border: "1px solid #dbeafe",
                  boxShadow: "none",
                  transition: "box-shadow 0.3s",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
                bodyStyle={{ padding: 0 }}
                onClick={() => navigate(`/student/courses/${section.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Header với màu nền */}
                <div style={{
                  height: 80,
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: "16px",
                }} className="bg-[#47689c]">
                  <div>
                    <Title level={5} style={{
                      margin: 0,
                      color: "white",
                      fontSize: 20,
                      fontWeight: 400,
                      lineHeight: 1.2
                    }}>
                      {section.subject.subjectName}
                    </Title>
                    <Text style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 13,
                      display: "block",
                      marginTop: 2
                    }}>
                      {section.sectionName}
                    </Text>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <Text style={{
                      fontSize: 13,
                      color: "#5f6368",
                      display: "block",
                      marginBottom: 4
                    }}>
                      {section.instructors?.[0]?.teacher?.user?.fullName || "Chưa có giảng viên"}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: "#5f6368"
                    }}>
                      {section.term.name}
                    </Text>
                  </div>

                  <div style={{
                    borderTop: "1px solid #e0e0e0",
                    paddingTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Tag
                        style={{
                          margin: 0,
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 12
                        }}
                      >
                        {section.subject.subjectCode}
                      </Tag>
                      <Tag
                        style={{
                          margin: 0,
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 12
                        }}
                      >
                        {section.subject.credits} TC
                      </Tag>
                    </div>
                    <Text style={{ fontSize: 11, color: "#5f6368" }}>
                      {section.currentStudents}/{section.maxStudents}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}