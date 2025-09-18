import React, { useEffect, useState } from "react";
import { Row, Col, Card, Tag } from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
const navigate = useNavigate()
  useEffect(() => {
    fetch("http://localhost:4000/api/v1/sections-enrollments/student/1/courses")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.data || []);
      });
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        {courses.map((item) => (
          <Col span={8} key={item.id}>
            <Card
              hoverable
              onClick={() => navigate(`/student/courses/${item.section.id}`)}
              styles={{ body: { minHeight: 150, padding: 24 } }}
              bodyStyle={{ padding: 24 }}
            >
              {/* Tên môn học */}
              <h2 style={{ color: "#2F4C7E", marginBottom: 8 }}>
                {item.section.subject.subjectName}
              </h2>

              {/* Kỳ học */}
              <p style={{ color: "#666", marginBottom: 12 }}>
                {item.section.term.name}
              </p>

              {/* Nhóm */}
              <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>
                {`Nhóm ${item.section.sectionCode}`}
              </Tag>
            </Card>
          </Col>
        ))}
      </Row>

    </div>
  );
};

export default Dashboard;
