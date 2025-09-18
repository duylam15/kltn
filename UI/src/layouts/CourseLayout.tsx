import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { Card, Tabs, Tag, Skeleton } from "antd";

const tabDefs = [
	{ key: "overview", label: "Tổng quan" },
	{ key: "schedule", label: "Điểm danh" },
	{ key: "assignments", label: "Bài kiểm tra" },
	{ key: "materials", label: "Tài liệu" },
	{ key: "qa", label: "Thảo luận" },
	{ key: "grades", label: "Điểm số" },
	{ key: "friend", label: "Nhóm" },  // 👈 thêm
];

const CourseLayout: React.FC = () => {
	const { courseId } = useParams();
	const location = useLocation();
	const [section, setSection] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	// Xác định tab đang active từ URL
	const activeKey =
		tabDefs.find((t) => location.pathname.endsWith(`/${t.key}`))?.key ??
		"overview";

	// Gọi API lấy dữ liệu lớp học phần
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const res = await fetch(
					`http://localhost:4000/api/v1/course-sections/${courseId}`
				);
				const json = await res.json();
				if (mounted) {
					setSection(json?.data ?? null);
					setLoading(false);
				}
			} catch {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [courseId]);

	return (
		<div style={{ padding: 24 }}>
			<Card
				style={{ marginBottom: 16 }}
				styles={{ body: { padding: 16 } }}
				title={
					loading ? (
						<Skeleton.Input active size="small" style={{ width: 240 }} />
					) : (
						<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
							<span style={{ fontWeight: 700, fontSize: 18 }}>
								{section?.subject?.subjectName ?? "Môn học"}
							</span>
							{section?.subject?.subjectCode && (
								<Tag color="blue">{section.subject.subjectCode}</Tag>
							)}
						</div>
					)
				}
				extra={
					loading ? null : (
						<span style={{ color: "#666" }}>
							{section?.term?.name} • {section?.sectionCode}
						</span>
					)
				}
			/>

			<Tabs
				activeKey={activeKey}
				items={tabDefs.map((t) => ({
					key: t.key,
					label: <NavLink to={t.key}>{t.label}</NavLink>,
				}))}
			/>

			<div style={{ marginTop: 16 }}>
				{/* Truyền props xuống các tab con qua Outlet context */}
				<Outlet context={{ section, loading }} />
			</div>
		</div>
	);
};

export default CourseLayout;
