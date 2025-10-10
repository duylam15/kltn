import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { Card, Tabs, Tag, Skeleton, Typography } from "antd";

const tabDefs = [
	{ key: "overview", label: "Tổng quan" },          // cái nhìn chung
	{ key: "groups", label: "Nhóm học tập" },         // nhóm nhỏ
	{ key: "roll-call", label: "Điểm danh" },         // điểm danh
	{ key: "materials", label: "Tài liệu" },          // tài liệu / slide
	{ key: "chat", label: "Thảo luận" },              // thảo luận nhóm/lớp
	{ key: "assignments", label: "Bài tập" }, 			// giao & làm bài
];

const CourseLayoutStudent: React.FC = () => {
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
		<div style={{  border: "none" }}>
			<Tabs
				activeKey={activeKey}
				style={{ paddingLeft: 24, paddingRight: 24 }}
				items={tabDefs.map((t) => ({
					key: t.key,
					label: <NavLink to={t.key}>{t.label}</NavLink>,
				}))}
			/>

			<div style={{  }}>
				{/* Truyền props xuống các tab con qua Outlet context */}
				<Outlet context={{ section, loading }} />
			</div>
		</div>
	);
};

export default CourseLayoutStudent;
