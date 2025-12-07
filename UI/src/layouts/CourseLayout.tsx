import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { Tabs } from "antd";
import instance from "../utils/axiosInstance";

const tabDefs = [
	{ key: "overview", label: "Tổng quan" },
	{ key: "students", label: "Sinh viên" },
	{ key: "groups", label: "Nhóm học tập" },
	{ key: "roll-call", label: "Điểm danh" },
	{ key: "materials", label: "Tài liệu" },
	{ key: "chat", label: "Thảo luận" },
	{ key: "assignments", label: "Bài tập" },
	{ key: "grades", label: "Điểm số" },
];

const CourseLayout: React.FC = () => {
	const { courseId } = useParams();
	const location = useLocation();
	const [section, setSection] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	// ⭐ Detect tab bằng include thay vì endsWith
	const activeKey = (() => {
		for (const t of tabDefs) {
			if (location.pathname.includes(`/${t.key}`)) return t.key;
		}
		return "overview";
	})();

	// Fetch lớp học phần
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const res = await instance.get(`/course-sections/${courseId}`);
				const json = await res.data;
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
		<div style={{ border: "none" }}>
			<Tabs
				activeKey={activeKey}
				style={{ paddingLeft: 24, paddingRight: 24 }}
				items={tabDefs.map((t) => ({
					key: t.key,
					label: <NavLink to={t.key}>{t.label}</NavLink>,
				}))}
			/>

			<div>
				<Outlet context={{ section, loading }} />
			</div>
		</div>
	);
};

export default CourseLayout;
