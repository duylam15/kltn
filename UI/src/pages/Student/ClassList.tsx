import React, { useEffect, useState } from "react";
import { Typography, Divider, List, Avatar, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import instance from "../../utils/axiosInstance";

const { Title, Text } = Typography;

type User = { id: number; fullName: string; email: string; avatar?: string };
type Student = { id: number; studentCode: string; className?: string; user: User };
type Enrollment = { id: number; sectionId: number; studentId: number; student: Student };

type SectionInstructor = {
  sectionId: number;
  teacherId: number;
  role: "owner" | "co" | "ta";
  teacher: { id: number; user: Pick<User, "id" | "fullName" | "email"> };
};

export default function ClassList({ sectionId: propId }: { sectionId?: number }) {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const sectionId = propId ?? Number(path.split("/")[3]);

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Enrollment[]>([]);
  const [teacher, setTeacher] = useState<SectionInstructor | null>(null);

  useEffect(() => {
    if (!sectionId) return;
    (async () => {
      try {
        setLoading(true);

        // 1) Gọi API lấy danh sách sinh viên
        const stuRes = await instance.get<{ success: boolean; data: Enrollment[] }>(
          `/sections-enrollments/section/${sectionId}/students`,
        );
        if (stuRes.data?.success) {
          setStudents(stuRes.data.data ?? []);
        }

        // 2) Gọi API lấy giáo viên chính (owner)
        const teacherRes = await instance.get<{ success: boolean; data: SectionInstructor }>(
          `/sections-instructors/section/${sectionId}/teacher`
        );
        if (teacherRes.data?.success) {
          setTeacher(teacherRes.data.data ?? null);
        }

      } catch (err) {
        console.error("Fetch class list failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [sectionId]);

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 16 }}>
        {/* GIÁO VIÊN */}
        <Title level={4}>Giáo viên</Title>
        <List
          itemLayout="horizontal"
          dataSource={teacher ? [teacher] : []}
          locale={{ emptyText: "Chưa có giảng viên" }}
          renderItem={(t) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={<Text strong>{t.teacher.user.fullName}</Text>}
                description={t.teacher.user.email}
              />
            </List.Item>
          )}
        />

        <Divider />

        {/* BẠN HỌC */}
        <Title level={4}>
          Bạn học <Text type="secondary">({students.length} sinh viên)</Text>
        </Title>
        <List
          itemLayout="horizontal"
          dataSource={students}
          locale={{ emptyText: "Chưa có sinh viên" }}
          renderItem={(enr) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={<span>{enr.student.studentCode}_{enr.student.user.fullName}</span>}
                description={enr.student.user.email}
              />
            </List.Item>
          )}
        />
      </div>
    </Spin>
  );
}
