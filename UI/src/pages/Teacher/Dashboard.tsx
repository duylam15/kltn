import { useEffect, useState } from "react";
import { Card, Spin, Typography, Row, Col } from "antd";
import { create } from './../../../../myapp/src/modules/term/term.controller';
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get("http://localhost:4000/api/v1/teachers/100/groups");
        const json = await res.data;
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Lỗi khi gọi API:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Spin tip="Đang tải..." />;
  if (!data.length) return <p>Không tìm thấy dữ liệu</p>;

  return (
    <div style={{ padding: 16 }}>
      {data.map((subject) => (
        <div key={subject.subjectId} style={{ marginBottom: 40 }}>
          {/* Tiêu đề môn học */}
          <Title level={4} style={{ marginBottom: 16 }}>
            {subject.subjectCode} - {subject.subjectName}
          </Title>

          {/* Hiển thị sections ngang */}
          <Row gutter={[16, 16]} wrap>
            {subject.sections.map((section: any) => (
              <Col xs={24} sm={12} md={8} lg={6} key={section.sectionId}>
                <Card
                  title={section.sectionName}
                  bordered
                  style={{ height: "100%" }}
                  onClick={() => navigate(`/teacher/courses/${section.sectionId}`)} // Chuyển hướng khi click
                >
                  <p>
                    <Text strong>Tên lớp:</Text> {section.sectionName}
                  </p>
                  <p>
                    <Text strong>Kỳ học:</Text> {section.term?.code} - {section.term?.name}
                  </p>
                  <p>
                    <Text strong>Id:</Text> {section.sectionId}
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </div>
  );
}
