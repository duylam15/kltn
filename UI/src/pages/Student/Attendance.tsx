import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Select, Typography, Space, Progress, Statistic, Row, Col, Calendar, Badge } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Attendance = () => {
	const [attendanceData, setAttendanceData] = useState([]);
	const [selectedCourse, setSelectedCourse] = useState('all');
	const [selectedSemester, setSelectedSemester] = useState('2024-1');
	const [statistics, setStatistics] = useState({});

	// Mock data
	useEffect(() => {
		const mockData = [
			{
				key: 1,
				date: '2024-01-15',
				time: '07:30 - 09:00',
				course: 'Lập trình căn bản',
				courseCode: 'CS101',
				lesson: 'Bài 1: Giới thiệu về lập trình',
				status: 'present',
				checkInTime: '07:28',
				instructor: 'TS. Nguyễn Văn A',
				classroom: 'A101'
			},
			{
				key: 2,
				date: '2024-01-17',
				time: '09:15 - 10:45',
				course: 'Cấu trúc dữ liệu',
				courseCode: 'CS201',
				lesson: 'Bài 3: Stack và Queue',
				status: 'late',
				checkInTime: '09:25',
				instructor: 'ThS. Trần Thị B',
				classroom: 'B205'
			},
			{
				key: 3,
				date: '2024-01-19',
				time: '13:30 - 15:00',
				course: 'Trí tuệ nhân tạo',
				courseCode: 'CS301',
				lesson: 'Bài 5: Machine Learning cơ bản',
				status: 'absent',
				checkInTime: null,
				instructor: 'PGS. Lê Văn C',
				classroom: 'C302'
			},
			{
				key: 4,
				date: '2024-01-22',
				time: '07:30 - 09:00',
				course: 'Lập trình căn bản',
				courseCode: 'CS101',
				lesson: 'Bài 2: Biến và kiểu dữ liệu',
				status: 'present',
				checkInTime: '07:25',
				instructor: 'TS. Nguyễn Văn A',
				classroom: 'A101'
			},
			{
				key: 5,
				date: '2024-01-24',
				time: '09:15 - 10:45',
				course: 'Cấu trúc dữ liệu',
				courseCode: 'CS201',
				lesson: 'Bài 4: Tree và Graph',
				status: 'present',
				checkInTime: '09:10',
				instructor: 'ThS. Trần Thị B',
				classroom: 'B205'
			}
		];

		setAttendanceData(mockData);

		// Calculate statistics
		const stats = {
			totalSessions: mockData.length,
			presentSessions: mockData.filter(item => item.status === 'present').length,
			lateSessions: mockData.filter(item => item.status === 'late').length,
			absentSessions: mockData.filter(item => item.status === 'absent').length
		};
		stats.attendanceRate = ((stats.presentSessions + stats.lateSessions) / stats.totalSessions * 100).toFixed(1);

		setStatistics(stats);
	}, []);

	const getStatusTag = (status) => {
		const statusMap = {
			present: { color: 'green', icon: <CheckCircleOutlined />, text: 'Có mặt' },
			late: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Muộn' },
			absent: { color: 'red', icon: <CloseCircleOutlined />, text: 'Vắng' }
		};

		const statusInfo = statusMap[status];
		return (
			<Tag color={statusInfo.color} icon={statusInfo.icon}>
				{statusInfo.text}
			</Tag>
		);
	};

	const columns = [
		{
			title: 'Ngày',
			dataIndex: 'date',
			key: 'date',
			render: (date) => new Date(date).toLocaleDateString('vi-VN'),
			sorter: (a, b) => new Date(a.date) - new Date(b.date),
		},
		{
			title: 'Thời gian',
			dataIndex: 'time',
			key: 'time',
		},
		{
			title: 'Môn học',
			key: 'course',
			render: (record) => (
				<div>
					<Text strong>{record.course}</Text>
					<br />
					<Text type="secondary" style={{ fontSize: '12px' }}>
						{record.courseCode}
					</Text>
				</div>
			),
		},
		{
			title: 'Bài học',
			dataIndex: 'lesson',
			key: 'lesson',
		},
		{
			title: 'Phòng học',
			dataIndex: 'classroom',
			key: 'classroom',
		},
		{
			title: 'Giảng viên',
			dataIndex: 'instructor',
			key: 'instructor',
		},
		{
			title: 'Trạng thái',
			dataIndex: 'status',
			key: 'status',
			render: (status) => getStatusTag(status),
			filters: [
				{ text: 'Có mặt', value: 'present' },
				{ text: 'Muộn', value: 'late' },
				{ text: 'Vắng', value: 'absent' },
			],
			onFilter: (value, record) => record.status === value,
		},
		{
			title: 'Giờ check-in',
			dataIndex: 'checkInTime',
			key: 'checkInTime',
			render: (time) => time || '-',
		},
	];

	// Filter data based on selected course
	const filteredData = selectedCourse === 'all'
		? attendanceData
		: attendanceData.filter(item => item.courseCode === selectedCourse);

	// Calendar data for attendance visualization
	const getListData = (value) => {
		const dateStr = value.format('YYYY-MM-DD');
		const dayData = attendanceData.filter(item => item.date === dateStr);

		return dayData.map(item => ({
			type: item.status === 'present' ? 'success' : item.status === 'late' ? 'warning' : 'error',
			content: `${item.courseCode} - ${item.status === 'present' ? 'Có mặt' : item.status === 'late' ? 'Muộn' : 'Vắng'}`,
		}));
	};

	const dateCellRender = (value) => {
		const listData = getListData(value);
		return (
			<ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
				{listData.map((item, index) => (
					<li key={index}>
						<Badge status={item.type} text={item.content} style={{ fontSize: '10px' }} />
					</li>
				))}
			</ul>
		);
	};

	return (
		<div className="attendance-page">
			<div className="page-header" style={{ marginBottom: 24 }}>
				<Title level={2}>Điểm danh và xem điểm</Title>
				<Text type="secondary">
					Theo dõi thông tin điểm danh và kết quả học tập
				</Text>
			</div>

			{/* Statistics Cards */}
			<Row gutter={16} style={{ marginBottom: 24 }}>
				<Col span={6}>
					<Card>
						<Statistic
							title="Tổng số buổi học"
							value={statistics.totalSessions}
							prefix={<CalendarOutlined />}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title="Có mặt"
							value={statistics.presentSessions}
							valueStyle={{ color: '#3f8600' }}
							prefix={<CheckCircleOutlined />}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title="Đi muộn"
							value={statistics.lateSessions}
							valueStyle={{ color: '#cf1322' }}
							prefix={<ClockCircleOutlined />}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title="Tỷ lệ tham dự"
							value={statistics.attendanceRate}
							suffix="%"
							valueStyle={{ color: statistics.attendanceRate >= 80 ? '#3f8600' : '#cf1322' }}
						/>
						<Progress
							percent={parseFloat(statistics.attendanceRate)}
							showInfo={false}
							strokeColor={statistics.attendanceRate >= 80 ? '#52c41a' : '#ff4d4f'}
						/>
					</Card>
				</Col>
			</Row>

			{/* Filters */}
			<Card style={{ marginBottom: 24 }}>
				<Space size="large">
					<div>
						<Text strong>Học kỳ: </Text>
						<Select
							value={selectedSemester}
							onChange={setSelectedSemester}
							style={{ width: 150 }}
						>
							<Option value="2024-1">Học kỳ 1 - 2024</Option>
							<Option value="2023-2">Học kỳ 2 - 2023</Option>
						</Select>
					</div>

					<div>
						<Text strong>Môn học: </Text>
						<Select
							value={selectedCourse}
							onChange={setSelectedCourse}
							style={{ width: 200 }}
						>
							<Option value="all">Tất cả môn học</Option>
							<Option value="CS101">CS101 - Lập trình căn bản</Option>
							<Option value="CS201">CS201 - Cấu trúc dữ liệu</Option>
							<Option value="CS301">CS301 - Trí tuệ nhân tạo</Option>
						</Select>
					</div>
				</Space>
			</Card>

			<Row gutter={16}>
				{/* Attendance Table */}
				<Col span={16}>
					<Card title="Chi tiết điểm danh">
						<Table
							columns={columns}
							dataSource={filteredData}
							pagination={{
								pageSize: 10,
								showSizeChanger: true,
								showTotal: (total, range) =>
									`${range[0]}-${range[1]} của ${total} buổi học`,
							}}
							scroll={{ x: 1000 }}
						/>
					</Card>
				</Col>

				{/* Calendar View */}
				<Col span={8}>
					<Card title="Lịch điểm danh" style={{ height: 'fit-content' }}>
						<Calendar
							fullscreen={false}
							dateCellRender={dateCellRender}
						/>
					</Card>
				</Col>
			</Row>
		</div>
	);
};

export default Attendance;