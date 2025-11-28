import React, { useEffect, useMemo, useState } from "react";
import { Table, Tag, Typography, Spin, message } from "antd";
import dayjs from "dayjs";
import api from "../../utils/api"; // axios instance có token
import { useAuth } from "../../context/authContext";

const { Title } = Typography;

type AttendanceItem = {
  attendanceId: number;
  sessionId: number;
  sessionName: string;
  createdAt: string;
  expiresAt: string | null;
  status: "present" | "absent" | "late" | "excused" | "pending";
  note: string | null;
};

export default function AttendanceStudent({
  sectionId: propSectionId,
}: {
  sectionId?: number;
}) {
  // sectionId lấy giống ClassList: /student/courses/:id/attendance (ví dụ)
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const sectionId = useMemo(
    () => propSectionId ?? Number(path.split("/")[3]),
    [propSectionId, path]
  );

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AttendanceItem[]>([]);
  const { user } = useAuth(); // user chứa { id, fullName, email,... }
  const userId = user?.id;

useEffect(() => {
  if (!sectionId || !userId) return;

  (async () => {
    try {
      setLoading(true);

      // 1) Từ userId -> gọi API lấy studentId
      const stu = await api.get<{ success: boolean; data: { id: number } }>(
        `/students/user/${userId}`
      );

      const studentId = stu.data?.data?.id;

      console.log("Debug IDs:", { userId, studentId, sectionId });

      if (!studentId) {
        message.error("Tài khoản này chưa có hồ sơ sinh viên.");
        return;
      }

      // 2) Lấy danh sách điểm danh
      const att = await api.get<{ success: boolean; data: AttendanceItem[] }>(
        `/attendance/section/${sectionId}/student/${studentId}`
      );

      if (att.data?.success) {
        setRows(att.data.data || []);
      }
    } catch (err) {
      console.error("Fetch attendance failed:", err);
      message.error("Tải danh sách điểm danh thất bại.");
    } finally {
      setLoading(false);
    }
  })();
}, [sectionId, userId]);


  
  

  const columns = [
    {
      title: "Buổi học",
      dataIndex: "sessionName",
      key: "sessionName",
      width: 280,
      ellipsis: true,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val: string) => dayjs(val).format("DD/MM/YYYY HH:mm"),
      width: 170,
    },
    {
      title: "Hết hạn",
      dataIndex: "expiresAt",
      key: "expiresAt",
      render: (val: string | null) =>
        val ? dayjs(val).format("DD/MM/YYYY HH:mm") : "-",
      width: 170,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: AttendanceItem["status"]) => {
        let color: any = "default";
        if (status === "present") color = "green";
        else if (status === "absent") color = "red";
        else if (status === "late") color = "orange";
        else if (status === "excused") color = "blue";
        else if (status === "pending") color = "gold";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
      width: 130,
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (note: string | null) => note ?? "",
    },
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 16 }}>
        <Title level={4}>Danh sách điểm danh</Title>
        <Table
          rowKey="attendanceId"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </Spin>
  );
}
