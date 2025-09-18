import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, List, Avatar, Spin } from "antd";
import { TeamOutlined } from "@ant-design/icons";

const Friend: React.FC = () => {
	const { courseId } = useParams(); // chính là sectionId
	const [members, setMembers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchGroupMembers = async () => {
			try {
				// giả sử tạm groupId = 1 (sau này có thể lấy từ enrollment của SV đang login)
				const groupId = 1;
				const res = await fetch(
					`http://localhost:4000/api/v1/sections-enrollments/section/${courseId}/groups/${groupId}/students`
				);
				const json = await res.json();
				setMembers(json.data || []);
			} catch (err) {
				console.error("Failed to fetch group members", err);
			} finally {
				setLoading(false);
			}
		};
		fetchGroupMembers();
	}, [courseId]);

	if (loading) return <Spin size="large" />;

	return (
		<Card
			title={
				<>
					<TeamOutlined /> Thành viên trong nhóm
				</>
			}
		>
			<List
				itemLayout="horizontal"
				dataSource={members}
				renderItem={(m: any) => (
					<List.Item>
						<List.Item.Meta
							avatar={<Avatar src={m.student.user.avatarUrl || undefined} />}
							title={m.student.user.fullName}
							description={`MSSV: ${m.student.studentCode} • Lớp: ${m.student.className}`}
						/>
					</List.Item>
				)}
			/>
		</Card>
	);
};

export default Friend;
