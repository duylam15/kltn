import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Button, Typography, List, Avatar, Tag, Space, Divider, Upload, message } from 'antd';
import { SearchOutlined, DownloadOutlined, FileTextOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, VideoCameraOutlined, UploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Materials = () => {
	const [materials, setMaterials] = useState([]);
	const [filteredMaterials, setFilteredMaterials] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [selectedCourse, setSelectedCourse] = useState('all');
	const [selectedType, setSelectedType] = useState('all');
	const [loading, setLoading] = useState(false);

	// Mock data
	useEffect(() => {
		const mockMaterials = [
			{
				id: 1,
				title: 'Bài giảng chương 1: Giới thiệu về lập trình',
				description: 'Slide bài giảng về các khái niệm cơ bản của lập trình',
				course: 'Lập trình căn bản',
				courseCode: 'CS101',
				type: 'slide',
				fileType: 'pdf',
				size: '2.5 MB',
				uploadDate: '2024-01-15',
				instructor: 'TS. Nguyễn Văn A',
				downloads: 245,
				category: 'Bài giảng'
			},
			{
				id: 2,
				title: 'Video hướng dẫn cài đặt môi trường lập trình',
				description: 'Video chi tiết về cách cài đặt và cấu hình IDE',
				course: 'Lập trình căn bản',
				courseCode: 'CS101',
				type: 'video',
				fileType: 'mp4',
				size: '125 MB',
				uploadDate: '2024-01-10',
				instructor: 'TS. Nguyễn Văn A',
				downloads: 189,
				category: 'Video hướng dẫn'
			},
			{
				id: 3,
				title: 'Đề cương môn học Cấu trúc dữ liệu',
				description: 'Đề cương chi tiết môn học, mục tiêu và phương pháp đánh giá',
				course: 'Cấu trúc dữ liệu',
				courseCode: 'CS201',
				type: 'document',
				fileType: 'doc',
				size: '1.2 MB',
				uploadDate: '2024-01-08',
				instructor: 'ThS. Trần Thị B',
				downloads: 156,
				category: 'Đề cương'
			},
			{
				id: 4,
				title: 'Bài tập mẫu về Stack và Queue',
				description: 'Tập hợp các bài tập có lời giải chi tiết về Stack và Queue',
				course: 'Cấu trúc dữ liệu',
				courseCode: 'CS201',
				type: 'exercise',
				fileType: 'pdf',
				size: '3.1 MB',
				uploadDate: '2024-01-12',
				instructor: 'ThS. Trần Thị B',
				downloads: 198,
				category: 'Bài tập'
			},
			{
				id: 5,
				title: 'Tài liệu tham khảo về Machine Learning',
				description: 'Sách tham khảo từ các tác giả nổi tiếng về ML',
				course: 'Trí tuệ nhân tạo',
				courseCode: 'CS301',
				type: 'reference',
				fileType: 'pdf',
				size: '15.8 MB',
				uploadDate: '2024-01-05',
				instructor: 'PGS. Lê Văn C',
				downloads: 267,
				category: 'Tài liệu tham khảo'
			}
		];

		setMaterials(mockMaterials);
		setFilteredMaterials(mockMaterials);
	}, []);

	// Filter materials
	useEffect(() => {
		let filtered = materials;

		if (searchText) {
			filtered = filtered.filter(material =>
				material.title.toLowerCase().includes(searchText.toLowerCase()) ||
				material.description.toLowerCase().includes(searchText.toLowerCase()) ||
				material.course.toLowerCase().includes(searchText.toLowerCase())
			);
		}

		if (selectedCourse !== 'all') {
			filtered = filtered.filter(material => material.courseCode === selectedCourse);
		}

		if (selectedType !== 'all') {
			filtered = filtered.filter(material => material.type === selectedType);
		}

		setFilteredMaterials(filtered);
	}, [materials, searchText, selectedCourse, selectedType]);

	const getFileIcon = (fileType) => {
		switch (fileType) {
			case 'pdf':
				return <FilePdfOutlined style={{ color: '#ff4757' }} />;
			case 'doc':
			case 'docx':
				return <FileWordOutlined style={{ color: '#2f3542' }} />;
			case 'xls':
			case 'xlsx':
				return <FileExcelOutlined style={{ color: '#2ed573' }} />;
			case 'mp4':
			case 'avi':
				return <VideoCameraOutlined style={{ color: '#3742fa' }} />;
			default:
				return <FileTextOutlined />;
		}
	};

	const getTypeTag = (type) => {
		const typeMap = {
			slide: { color: 'blue', text: 'Slide bài giảng' },
			video: { color: 'purple', text: 'Video' },
			document: { color: 'green', text: 'Tài liệu' },
			exercise: { color: 'orange', text: 'Bài tập' },
			reference: { color: 'red', text: 'Tham khảo' }
		};

		const typeInfo = typeMap[type] || { color: 'default', text: 'Khác' };
		return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
	};

	const handleDownload = (material) => {
		setLoading(true);
		// Simulate download
		setTimeout(() => {
			message.success(`Đang tải xuống: ${material.title}`);
			setLoading(false);
		}, 1000);
	};

	const uploadProps = {
		name: 'file',
		multiple: false,
		showUploadList: false,
		beforeUpload: (file) => {
			message.success(`${file.name} đã được tải lên thành công`);
			return false;
		},
	};

	return (
		<div className="materials-page">
			<div className="page-header" style={{ marginBottom: 24 }}>
				<Title level={2}>Tài liệu học tập</Title>
				<Text type="secondary">
					Truy cập và tải xuống tài liệu học tập từ các môn học
				</Text>
			</div>

			{/* Filters */}
			<Card style={{ marginBottom: 24 }}>
				<Space size="large" wrap>
					<Input
						placeholder="Tìm kiếm tài liệu..."
						prefix={<SearchOutlined />}
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						style={{ width: 300 }}
						allowClear
					/>

					<Select
						value={selectedCourse}
						onChange={setSelectedCourse}
						style={{ width: 200 }}
						placeholder="Chọn môn học"
					>
						<Option value="all">Tất cả môn học</Option>
						<Option value="CS101">CS101 - Lập trình căn bản</Option>
						<Option value="CS201">CS201 - Cấu trúc dữ liệu</Option>
						<Option value="CS301">CS301 - Trí tuệ nhân tạo</Option>
					</Select>

					<Select
						value={selectedType}
						onChange={setSelectedType}
						style={{ width: 180 }}
						placeholder="Loại tài liệu"
					>
						<Option value="all">Tất cả loại</Option>
						<Option value="slide">Slide bài giảng</Option>
						<Option value="video">Video</Option>
						<Option value="document">Tài liệu</Option>
						<Option value="exercise">Bài tập</Option>
						<Option value="reference">Tham khảo</Option>
					</Select>

					<Upload {...uploadProps}>
						<Button icon={<UploadOutlined />}>
							Tải lên tài liệu
						</Button>
					</Upload>
				</Space>
			</Card>

			{/* Materials List */}
			<Card>
				<List
					itemLayout="vertical"
					dataSource={filteredMaterials}
					pagination={{
						pageSize: 10,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total, range) =>
							`${range[0]}-${range[1]} của ${total} tài liệu`,
					}}
					renderItem={(material) => (
						<List.Item
							key={material.id}
							actions={[
								<Button
									type="primary"
									icon={<DownloadOutlined />}
									onClick={() => handleDownload(material)}
									loading={loading}
								>
									Tải xuống
								</Button>,
								<Text type="secondary">{material.downloads} lượt tải</Text>,
							]}
						>
							<List.Item.Meta
								avatar={
									<Avatar size={48} icon={getFileIcon(material.fileType)} />
								}
								title={
									<Space>
										<Text strong>{material.title}</Text>
										{getTypeTag(material.type)}
									</Space>
								}
								description={
									<div>
										<Text>{material.description}</Text>
										<Divider type="vertical" />
										<Text type="secondary">
											{material.course} ({material.courseCode})
										</Text>
										<Divider type="vertical" />
										<Text type="secondary">GV: {material.instructor}</Text>
									</div>
								}
							/>
							<div style={{ marginTop: 8 }}>
								<Space>
									<Text type="secondary">Kích thước: {material.size}</Text>
									<Divider type="vertical" />
									<Text type="secondary">
										Ngày tải lên: {material.uploadDate}
									</Text>
								</Space>
							</div>
						</List.Item>
					)}
				/>
			</Card>
		</div>
	);
};

export default Materials;