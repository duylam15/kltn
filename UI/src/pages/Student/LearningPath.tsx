import React, { useState, useEffect } from 'react';
import { Card, Steps, Progress, Button, Typography, Row, Col, Timeline, Tag, Space, Divider, List, Avatar } from 'antd';
import { BookOutlined, TrophyOutlined, ClockCircleOutlined, CheckCircleOutlined, PlayCircleOutlined, StarOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const LearningPath = () => {
	const [currentStep, setCurrentStep] = useState(1);
	const [learningPaths, setLearningPaths] = useState([]);
	const [recommendations, setRecommendations] = useState([]);
	const [achievements, setAchievements] = useState([]);

	useEffect(() => {
		// Mock learning path data
		const mockLearningPaths = [
			{
				id: 1,
				title: 'Lộ trình Lập trình viên Full-stack',
				description: 'Lộ trình toàn diện từ cơ bản đến nâng cao cho lập trình viên Full-stack',
				progress: 65,
				estimatedTime: '18 tháng',
				difficulty: 'Trung bình',
				status: 'in-progress',
				steps: [
					{
						id: 1,
						title: 'Nền tảng lập trình',
						subjects: ['CS101 - Lập trình căn bản', 'CS102 - Lập trình hướng đối tượng'],
						status: 'completed',
						progress: 100,
						duration: '3 tháng'
					},
					{
						id: 2,
						title: 'Cấu trúc dữ liệu và Thuật toán',
						subjects: ['CS201 - Cấu trúc dữ liệu', 'CS202 - Thuật toán'],
						status: 'in-progress',
						progress: 70,
						duration: '4 tháng'
					},
					{
						id: 3,
						title: 'Phát triển Web Frontend',
						subjects: ['CS301 - HTML/CSS/JS', 'CS302 - React.js'],
						status: 'upcoming',
						progress: 0,
						duration: '3 tháng'
					},
					{
						id: 4,
						title: 'Phát triển Web Backend',
						subjects: ['CS401 - Node.js', 'CS402 - Database'],
						status: 'upcoming',
						progress: 0,
						duration: '4 tháng'
					},
					{
						id: 5,
						title: 'DevOps và Triển khai',
						subjects: ['CS501 - Docker', 'CS502 - Cloud Computing'],
						status: 'upcoming',
						progress: 0,
						duration: '2 tháng'
					},
					{
						id: 6,
						title: 'Dự án thực tế',
						subjects: ['CS601 - Capstone Project'],
						status: 'upcoming',
						progress: 0,
						duration: '2 tháng'
					}
				]
			}
		];

		const mockRecommendations = [
			{
				id: 1,
				title: 'JavaScript ES6+ for Beginners',
				platform: 'Coursera',
				duration: '4 tuần',
				rating: 4.8,
				price: 'Miễn phí',
				thumbnail: 'https://via.placeholder.com/100',
				reason: 'Phù hợp với lộ trình Frontend hiện tại của bạn'
			},
			{
				id: 2,
				title: 'React - The Complete Guide',
				platform: 'Udemy',
				duration: '8 tuần',
				rating: 4.9,
				price: '799,000 VND',
				thumbnail: 'https://via.placeholder.com/100',
				reason: 'Bổ sung kiến thức React cho bước tiếp theo'
			},
			{
				id: 3,
				title: 'Data Structures and Algorithms',
				platform: 'YouTube',
				duration: '6 tuần',
				rating: 4.7,
				price: 'Miễn phí',
				thumbnail: 'https://via.placeholder.com/100',
				reason: 'Củng cố kiến thức thuật toán đang học'
			}
		];

		const mockAchievements = [
			{
				id: 1,
				title: 'Hoàn thành nền tảng lập trình',
				description: 'Đã hoàn thành tất cả môn học nền tảng',
				icon: <TrophyOutlined style={{ color: '#ffd700' }} />,
				date: '2024-01-10',
				points: 100
			},
			{
				id: 2,
				title: 'Học giỏi sinh viên',
				description: 'Đạt điểm trung bình >= 8.5',
				icon: <StarOutlined style={{ color: '#ff6b6b' }} />,
				date: '2024-01-05',
				points: 50
			},
			{
				id: 3,
				title: 'Tích cực tham gia',
				description: 'Tham gia diễn đàn và thảo luận tích cực',
				icon: <CheckCircleOutlined style={{ color: '#4ecdc4' }} />,
				date: '2023-12-28',
				points: 30
			}
		];

		setLearningPaths(mockLearningPaths);
		setRecommendations(mockRecommendations);
		setAchievements(mockAchievements);
	}, []);

	const getStepStatus = (stepStatus) => {
		switch (stepStatus) {
			case 'completed':
				return 'finish';
			case 'in-progress':
				return 'process';
			case 'upcoming':
				return 'wait';
			default:
				return 'wait';
		}
	};

	const getStepIcon = (stepStatus) => {
		switch (stepStatus) {
			case 'completed':
				return <CheckCircleOutlined />;
			case 'in-progress':
				return <PlayCircleOutlined />;
			default:
				return <ClockCircleOutlined />;
		}
	};

	return (
		<div className="learning-path-page">
			<div className="page-header" style={{ marginBottom: 24 }}>
				<Title level={2}>Lộ trình học tập thông minh</Title>
				<Text type="secondary">
					Lộ trình cá nhân hóa và đề xuất học tập phù hợp với mục tiêu nghề nghiệp
				</Text>
			</div>

			<Row gutter={16}>
				{/* Main Learning Path */}
				<Col span={16}>
					<Card title="Lộ trình học tập của bạn" style={{ marginBottom: 16 }}>
						{learningPaths.map(path => (
							<div key={path.id}>
								<div style={{ marginBottom: 16 }}>
									<Title level={4}>{path.title}</Title>
									<Paragraph>{path.description}</Paragraph>

									<Row gutter={16} style={{ marginBottom: 16 }}>
										<Col span={8}>
											<div>
												<Text type="secondary">Tiến độ tổng quan</Text>
												<Progress
													percent={path.progress}
													strokeColor="#52c41a"
													style={{ margin: '8px 0' }}
												/>
											</div>
										</Col>
										<Col span={8}>
											<Space direction="vertical" size="small">
												<Text type="secondary">Thời gian dự kiến</Text>
												<Text strong>{path.estimatedTime}</Text>
											</Space>
										</Col>
										<Col span={8}>
											<Space direction="vertical" size="small">
												<Text type="secondary">Độ khó</Text>
												<Tag color="orange">{path.difficulty}</Tag>
											</Space>
										</Col>
									</Row>
								</div>

								<Divider />

								<Steps
									current={currentStep}
									direction="vertical"
									size="small"
								>
									{path.steps.map(step => (
										<Step
											key={step.id}
											title={step.title}
											status={getStepStatus(step.status)}
											icon={getStepIcon(step.status)}
											description={
												<div>
													<div style={{ marginBottom: 8 }}>
														{step.subjects.map(subject => (
															<Tag key={subject} style={{ marginBottom: 4 }}>
																{subject}
															</Tag>
														))}
													</div>
													{step.status !== 'upcoming' && (
														<Progress
															percent={step.progress}
															size="small"
															showInfo={false}
															strokeColor={step.status === 'completed' ? '#52c41a' : '#1890ff'}
														/>
													)}
													<Text type="secondary" style={{ fontSize: '12px' }}>
														Thời gian: {step.duration}
													</Text>
												</div>
											}
										/>
									))}
								</Steps>
							</div>
						))}
					</Card>
				</Col>

				{/* Sidebar */}
				<Col span={8}>
					{/* Achievements */}
					<Card title="Thành tích đã đạt được" size="small" style={{ marginBottom: 16 }}>
						<Timeline size="small">
							{achievements.map(achievement => (
								<Timeline.Item
									key={achievement.id}
									dot={achievement.icon}
								>
									<div>
										<Text strong>{achievement.title}</Text>
										<br />
										<Text type="secondary" style={{ fontSize: '12px' }}>
											{achievement.description}
										</Text>
										<br />
										<Text type="secondary" style={{ fontSize: '12px' }}>
											{achievement.date} • +{achievement.points} điểm
										</Text>
									</div>
								</Timeline.Item>
							))}
						</Timeline>
					</Card>

					{/* Course Recommendations */}
					<Card title="Khóa học đề xuất" size="small">
						<List
							size="small"
							dataSource={recommendations}
							renderItem={(item) => (
								<List.Item>
									<List.Item.Meta
										avatar={<Avatar src={item.thumbnail} shape="square" />}
										title={
											<Text strong style={{ fontSize: '14px' }}>
												{item.title}
											</Text>
										}
										description={
											<div>
												<Space size="small" wrap>
													<Tag size="small">{item.platform}</Tag>
													<Text type="secondary" style={{ fontSize: '12px' }}>
														{item.duration}
													</Text>
													<Text type="secondary" style={{ fontSize: '12px' }}>
														⭐ {item.rating}
													</Text>
												</Space>
												<div style={{ marginTop: 4 }}>
													<Text style={{ fontSize: '12px', color: '#1890ff' }}>
														{item.price}
													</Text>
												</div>
												<Text type="secondary" style={{ fontSize: '11px' }}>
													{item.reason}
												</Text>
											</div>
										}
									/>
								</List.Item>
							)}
						/>

						<Button type="link" style={{ padding: 0, marginTop: 8 }}>
							Xem thêm khóa học đề xuất
						</Button>
					</Card>
				</Col>
			</Row>
		</div>
	);
};

export default LearningPath;