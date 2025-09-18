import { NavLink, Outlet, useParams } from "react-router-dom";
import { Tabs } from "antd";

const CourseDetail = () => {
	const { courseId } = useParams();

	const items = [
		{ key: "overview", label: "Tổng quan" },
		{ key: "materials", label: "Tài liệu" },
		{ key: "assignments", label: "Bài tập" },
		{ key: "exams", label: "Bài kiểm tra" },
		{ key: "grades", label: "Điểm số" },
		{ key: "qa", label: "Thảo luận" },
		{ key: "schedule", label: "Lịch & Điểm danh" },
	];

	return (
		<div style={{ padding: 24 }}>
			<h2>Chi tiết môn học #{courseId}</h2>
			<Tabs
				items={items.map((t) => ({
					key: t.key,
					label: <NavLink to={t.key}>{t.label}</NavLink>,
				}))}
			/>
			<div style={{ marginTop: 24 }}>
				<Outlet />
			</div>
		</div>
	);
};

export default CourseDetail;
