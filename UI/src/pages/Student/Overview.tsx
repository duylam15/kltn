import { useOutletContext } from "react-router-dom";
import { Card, List, Avatar } from "antd";

type ContextType = { section: any; loading: boolean };

export default function Overview() {
	const { section, loading } = useOutletContext<ContextType>();

	if (loading) return <p>Đang tải...</p>;
	if (!section) return <p>Không tìm thấy dữ liệu</p>;

	return (
		<div>
			<Card title="Thông tin chung" style={{ marginBottom: 16 }}>
				<p>
					<b>Kỳ học:</b> {section.term.name}
				</p>
				<p>
					<b>Lịch học:</b>{" "}
					{section.schedule
						.map((s: any) => `${s.day} ${s.start}-${s.end} (${s.room})`)
						.join(", ")}
				</p>
			</Card>

			<Card title="Giảng viên phụ trách">
				<List
					itemLayout="horizontal"
					dataSource={section.instructors}
					renderItem={(inst: any) => (
						<List.Item>
							<List.Item.Meta
								avatar={<Avatar src={inst.teacher.user.avatarUrl} />}
								title={inst.teacher.user.fullName}
								description={`${inst.teacher.department} • Vai trò: ${inst.role}`}
							/>
						</List.Item>
					)}
				/>
			</Card>
		</div>
	);
}
