import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { Card, Tabs, Tag, Skeleton, Typography } from "antd";
import instance from "../utils/axiosInstance";

const tabDefs = [
	{ key: "overview", label: "Tổng quan" },          // cái nhìn chung
	{ key: "students", label: "Sinh viên" },          // quản lý sinh viên
	{ key: "groups", label: "Nhóm học tập" },         // nhóm nhỏ
	{ key: "roll-call", label: "Điểm danh" },         // điểm danh
	{ key: "materials", label: "Tài liệu" },          // tài liệu / slide
	{ key: "chat", label: "Thảo luận" },              // thảo luận nhóm/lớp
	{ key: "assignments", label: "Bài tập" }, 			// giao & làm bài
	{ key: "grades", label: "Điểm số" },              // bảng điểm cuối
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
				const res = await instance.get(
					`/course-sections/${courseId}`
				);
				const json = await res.data;
				console.log("Fetched section data:", json);
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

export default CourseLayout;
