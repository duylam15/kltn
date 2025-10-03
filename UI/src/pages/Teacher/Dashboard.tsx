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
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";

const { Title, Text } = Typography;
const { Option } = Select;

// ...
type Term = {
  id: number;
  code: string;
  name: string;
};

type Section = {
  sectionId: number;
  sectionName: string;
  sectionCode: string;
  status: string;
  term: Term;
  stats: {
    groups: number;
    enrollments: number;
  };
};

type SubjectGroup = {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  sections: Section[];
};

export default function Dashboard() {
  const [data, setData] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [termFilter, setTermFilter] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!user?.teacher?.id) {
        setLoading(false);
        return;
      }
      const res = await axios.get(
        `http://localhost:4000/api/v1/teachers/${user.teacher.id}/groups`
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

  // Lọc và gom nhóm
  const filteredGroups = data.flatMap((subject) =>
    subject.sections
      .filter((section) => {
        const lowerQ = keyword.toLowerCase();

        const matchKeyword =
          keyword === "" ||
          section.sectionName?.toLowerCase().includes(lowerQ) ||
          section.sectionCode?.toLowerCase().includes(lowerQ) ||
          subject.subjectName?.toLowerCase().includes(lowerQ) ||
          subject.subjectCode?.toLowerCase().includes(lowerQ);

        const matchStatus =
          (!statusFilter && section.status !== "completed") ||
          (statusFilter && section.status === statusFilter);

        const matchTerm = !termFilter || section.term?.id === termFilter;

        return matchKeyword && matchStatus && matchTerm;
      })
      .map((section) => ({
        subjectId: subject.subjectId,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        term: section.term,
        section,
      }))
  );

  // Gom lại theo subject + term
  const grouped = filteredGroups.reduce((acc: any, item) => {
    const key = `${item.subjectId}-${item.term.id}`;
    if (!acc[key]) {
      acc[key] = {
        subjectCode: item.subjectCode,
        subjectName: item.subjectName,
        term: item.term,
        sections: [],
      };
    }
    acc[key].sections.push(item.section);
    return acc;
  }, {});

  const uniqueTerms = Array.from(
    new Set(
      data.flatMap((s) => s.sections.map((sec) => sec.term?.id).filter(Boolean))
    )
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
            style={{ width: 300 }}
          />

          <Select
            allowClear
            placeholder="Lọc theo trạng thái"
            style={{ width: 160 }}
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
            style={{ width: 200 }}
            value={termFilter ?? undefined}
            onChange={(value) => setTermFilter(value)}
          >
            {uniqueTerms.map((t) => (
              <Option key={t} value={t}>
                {data
                  .flatMap((s) => s.sections.map((sec) => sec.term))
                  .find((term) => term.id === t)?.name}
              </Option>
            ))}
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

      {/* Danh sách nhóm */}
      {Object.values(grouped).map((g: any, idx) => (
        <div key={idx} style={{ marginBottom: 40 }}>
          <Title
            level={4}
            style={{
              marginBottom: 16,
              padding: "8px 8px",
              borderRadius: 8,
            }}
          >
            {g.subjectCode} - {g.subjectName} ({g.term.name})
          </Title>

          <Row gutter={[16, 16]} wrap>
            {g.sections.map((section: Section) => (
              <Col xs={24} sm={12} md={8} lg={6} key={section.sectionId}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    transition: "all 0.3s",
                    cursor: "pointer",
                  }}
                  bodyStyle={{ padding: 16 }}
                  onClick={() =>
                    navigate(`/teacher/courses/${section.sectionId}`)
                  }
                >
                  <Title
                    level={5}
                    style={{ marginBottom: 8, color: "#1d39c4" }}
                  >
                    {section.sectionName}
                  </Title>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text strong>Mã lớp:</Text>
                    <Text>{section.sectionCode}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text strong>Học kỳ:</Text>
                    <Text>{section.term.name}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text strong>Trạng thái:</Text>
                    <Tag
                      color={
                        section.status === "ongoing"
                          ? "green"
                          : section.status === "planned"
                            ? "blue"
                            : section.status === "finished"
                              ? "volcano"
                              : "default"
                      }
                    >
                      {section.status}
                    </Tag>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </div>
  );
}
