import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Button, Input, Select, Tag, Space, Typography, Divider, Modal, Form, message } from 'antd';
import { PlusOutlined, SearchOutlined, CommentOutlined, LikeOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Forum = () => {
	const [topics, setTopics] = useState([]);
	const [filteredTopics, setFilteredTopics] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [selectedCourse, setSelectedCourse] = useState('all');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [form] = Form.useForm();
	const navigate = useNavigate();

	// Mock data
	useEffect(() => {
		const mockTopics = [
			{
				id: 1,
				title: 'Cách debug code hiệu quả trong Visual Studio Code?',
				content: 'Mình đang gặp khó khăn trong việc debug code, có ai có thể chia sẻ kinh nghiệm không?',
				author: 'Nguyễn Văn A',
				authorAvatar: 'https://via.placeholder.com/40',
				course: 'Lập trình căn bản',
				courseCode: 'CS101',
				category: 'Thảo luận',
				createdAt: '2024-01-15 14:30',
				replies: 12,
				likes: 8,
				lastReply: '2024-01-15 16:45',
				tags: ['debug', 'vscode', 'lập trình'],
				isPinned: true,
				isSolved: false
			},
			{
				id: 2,
				title: 'Giải thích thuật toán Quick Sort',
				content: 'Các bạn có thể giải thích chi tiết về thuật toán Quick Sort không? Mình chưa hiểu rõ phần partition.',
				author: 'Trần Thị B',
				authorAvatar: 'https://via.placeholder.com/40',
				course: 'Cấu trúc dữ liệu',
				courseCode: 'CS201',
				category: 'Hỏi đáp',
				createdAt: '2024-01-14 10:15',
				replies: 5,
				likes: 15,
				lastReply: '2024-01-15 09:20',
				tags: ['quicksort', 'thuật toán', 'sắp xếp'],
				isPinned: false,
				isSolved: true
			},
			{
				id: 3,
				title: 'Chia sẻ tài liệu học Machine Learning',
				content: 'Mình có một số tài liệu hay về ML, chia sẻ cho mọi người cùng học.',
				author: 'Lê Văn C',
				authorAvatar: 'https://via.placeholder.com/40',
				course: 'Trí tuệ nhân tạo',
				courseCode: 'CS301',
				category: 'Chia sẻ',
				createdAt: '2024-01-13 16:00',
				replies: 20,
				likes: 25,
				lastReply: '2024-01-15 11:30',
				tags: ['machine learning', 'tài liệu', 'chia sẻ'],
				isPinned: false,
				isSolved: false
			},
			{
				id: 4,
				title: 'Lỗi "Segmentation fault" khi chạy code C++',
				content: 'Code của mình bị lỗi Segmentation fault, không biết lỗi ở đâu. Có ai giúp mình debug được không?',
				author: 'Phạm Thị D',
				authorAvatar: 'https://via.placeholder.com/40',
				course: 'Lập trình căn bản',
				courseCode: 'CS101',
				category: 'Hỏi đáp',
				createdAt: '2024-01-12 14:20',
				replies: 8,
				likes: 6,
				lastReply: '2024-01-14 08:15',
				tags: ['c++', 'lỗi', 'segfault'],
				isPinned: false,
				isSolved: true
			}
		];

		setTopics(mockTopics);
		setFilteredTopics(mockTopics);
	}, []);

	// Filter topics
	useEffect(() => {
		let filtered = topics;

		if (searchText) {
			filtered = filtered.filter(topic =>
				topic.title.toLowerCase().includes(searchText.toLowerCase()) ||
				topic.content.toLowerCase().includes(searchText.toLowerCase()) ||
				topic.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
			);
		}

		if (selectedCourse !== 'all') {
			filtered = filtered.filter(topic => topic.courseCode === selectedCourse);
		}

		if (selectedCategory !== 'all') {
			filtered = filtered.filter(topic => topic.category === selectedCategory);
		}

		// Sort: pinned first, then by last reply time
		filtered.sort((a, b) => {
			if (a.isPinned && !b.isPinned) return -1;
			if (!a.isPinned && b.isPinned) return 1;
			return new Date(b.lastReply) - new Date(a.lastReply);
		});

		setFilteredTopics(filtered);
	}, [topics, searchText, selectedCourse, selectedCategory]);

	const getCategoryColor = (category) => {
		const colors = {
			'Hỏi đáp': 'blue',
			'Thảo luận': 'green',
			'Chia sẻ': 'orange',
			'Thông báo': 'red'
		};
		return colors[category] || 'default';
	};

	const handleCreateTopic = (values) => {
		const newTopic = {
			id: Date.now(),
			title: values.title,
			content: values.content,
			author: 'Bạn',
			authorAvatar: 'https://via.placeholder.com/40',
			course: values.course,
			courseCode: values.courseCode,
			category: values.category,
			createdAt: new Date().toLocaleString('vi-VN'),
			replies: 0,
			likes: 0,
			lastReply: new Date().toLocaleString('vi-VN'),
			tags: values.tags?.split(',').map(tag => tag.trim()) || [],
			isPinned: false,
			isSolved: false
		};

		setTopics([newTopic, ...topics]);
		setIsModalVisible(false);
		form.resetFields();
		message.success('Tạo chủ đề thành công!');
	};

	const handleTopicClick = (topicId) => {
		navigate(`/forum/topic/${topicId}`);
	};

	return (
		<div className="forum-page">
			<div className="page-header" style={{ marginBottom: 24 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<div>
						<Title level={2}>Diễn đàn hỏi đáp</Title>
						<Text type="secondary">
							Trao đổi học thuật và chia sẻ kinh nghiệm học tập
						</Text>
					</div>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => setIsModalVisible(true)}
					>
						Tạo chủ đề mới
					</Button>
				</div>
			</div>

			{/* Filters */}
			<Card style={{ marginBottom: 24 }}>
				<Space size="large" wrap>
					<Input
						placeholder="Tìm kiếm chủ đề..."
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
						value={selectedCategory}
						onChange={setSelectedCategory}
						style={{ width: 150 }}
						placeholder="Danh mục"
					>
						<Option value="all">Tất cả</Option>
						<Option value="Hỏi đáp">Hỏi đáp</Option>
						<Option value="Thảo luận">Thảo luận</Option>
						<Option value="Chia sẻ">Chia sẻ</Option>
					</Select>
				</Space>
			</Card>

			{/* Topics List */}
			<Card>
				<List
					dataSource={filteredTopics}
					pagination={{
						pageSize: 10,
						showSizeChanger: true,
						showTotal: (total, range) =>
							`${range[0]}-${range[1]} của ${total} chủ đề`,
					}}
					renderItem={(topic) => (
						<List.Item
							key={topic.id}
							className="forum-topic-item"
							style={{
								cursor: 'pointer',
								padding: '16px 0',
								borderLeft: topic.isPinned ? '4px solid #1890ff' : 'none',
								paddingLeft: topic.isPinned ? '16px' : '0'
							}}
							onClick={() => handleTopicClick(topic.id)}
						>
							<List.Item.Meta
								avatar={<Avatar src={topic.authorAvatar} icon={<UserOutlined />} />}
								title={
									<div>
										<Space>
											{topic.isPinned && <Tag color="blue">Ghim</Tag>}
											{topic.isSolved && <Tag color="green">Đã giải quyết</Tag>}
											<Tag color={getCategoryColor(topic.category)}>
												{topic.category}
											</Tag>
										</Space>
										<Title level={4} style={{ margin: '8px 0 4px 0' }}>
											{topic.title}
										</Title>
										<Text type="secondary">
											{topic.content.length > 100
												? `${topic.content.substring(0, 100)}...`
												: topic.content
											}
										</Text>
									</div>
								}
								description={
									<div style={{ marginTop: 12 }}>
										<Space wrap>
											{topic.tags.map(tag => (
												<Tag key={tag} style={{ fontSize: '12px' }}>
													#{tag}
												</Tag>
											))}
										</Space>
										<Divider type="vertical" />
										<Text type="secondary" style={{ fontSize: '12px' }}>
											{topic.course} ({topic.courseCode})
										</Text>
									</div>
								}
							/>

							<div style={{ textAlign: 'right', minWidth: 200 }}>
								<Space direction="vertical" size="small">
									<div>
										<Text strong>{topic.author}</Text>
									</div>
									<Space>
										<span>
											<CommentOutlined /> {topic.replies}
										</span>
										<span>
											<LikeOutlined /> {topic.likes}
										</span>
									</Space>
									<Text type="secondary" style={{ fontSize: '12px' }}>
										<ClockCircleOutlined /> {topic.lastReply}
									</Text>
								</Space>
							</div>
						</List.Item>
					)}
				/>
			</Card>

			{/* Create Topic Modal */}
			<Modal
				title="Tạo chủ đề mới"
				open={isModalVisible}
				onCancel={() => {
					setIsModalVisible(false);
					form.resetFields();
				}}
				footer={null}
				width={600}
			>
				<Form
					form={form}
					layout="vertical"
					onFinish={handleCreateTopic}
				>
					<Form.Item
						name="title"
						label="Tiêu đề"
						rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
					>
						<Input placeholder="Nhập tiêu đề chủ đề..." />
					</Form.Item>

					<Form.Item
						name="category"
						label="Danh mục"
						rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
					>
						<Select placeholder="Chọn danh mục">
							<Option value="Hỏi đáp">Hỏi đáp</Option>
							<Option value="Thảo luận">Thảo luận</Option>
							<Option value="Chia sẻ">Chia sẻ</Option>
						</Select>
					</Form.Item>

					<Form.Item
						name="courseCode"
						label="Môn học"
						rules={[{ required: true, message: 'Vui lòng chọn môn học!' }]}
					>
						<Select placeholder="Chọn môn học">
							<Option value="CS101">CS101 - Lập trình căn bản</Option>
							<Option value="CS201">CS201 - Cấu trúc dữ liệu</Option>
							<Option value="CS301">CS301 - Trí tuệ nhân tạo</Option>
						</Select>
					</Form.Item>

					<Form.Item
						name="tags"
						label="Thẻ tag (phân cách bằng dấu phẩy)"
					>
						<Input placeholder="Ví dụ: lập trình, thuật toán, debug" />
					</Form.Item>

					<Form.Item
						name="content"
						label="Nội dung"
						rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
					>
						<TextArea
							rows={6}
							placeholder="Mô tả chi tiết nội dung chủ đề..."
						/>
					</Form.Item>

					<Form.Item style={{ marginBottom: 0 }}>
						<Space style={{ float: 'right' }}>
							<Button onClick={() => {
								setIsModalVisible(false);
								form.resetFields();
							}}>
								Hủy
							</Button>
							<Button type="primary" htmlType="submit">
								Tạo chủ đề
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
};

export default Forum;