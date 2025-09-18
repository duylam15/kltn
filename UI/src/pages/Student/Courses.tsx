import React, { useState } from 'react';
import { Card, Row, Col, Tag, Progress, Input, Select, Avatar, List, Button, Rate } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  TrophyOutlined
} from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Dữ liệu mẫu
  const courses = [
    {
      id: 1,
      name: 'Lập trình hướng đối tượng',
      code: 'IT3103',
      credits: 3,
      semester: 'HK1-2023',
      teacher: {
        name: 'TS. Nguyễn Văn A',
        avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=teacher1'
      },
      progress: 85,
      grade: 8.5,
      status: 'active',
      description: 'Môn học cung cấp kiến thức cơ bản về lập trình hướng đối tượng với Java',
      schedule: 'Thứ 2, 4 (7:00-9:30)',
      room: 'Phòng 301-A2',
      assignments: 8,
      completedAssignments: 7,
      difficulty: 4
    },
    {
      id: 2,
      name: 'Cơ sở dữ liệu',
      code: 'IT3090',
      credits: 3,
      semester: 'HK1-2023',
      teacher: {
        name: 'ThS. Trần Thị B',
        avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=teacher2'
      },
      progress: 70,
      grade: 7.8,
      status: 'active',
      description: 'Thiết kế và quản lý cơ sở dữ liệu, SQL, NoSQL',
      schedule: 'Thứ 3, 5 (13:00-15:30)',
      room: 'Phòng 205-A1',
      assignments: 6,
      completedAssignments: 4,
      difficulty: 3
    },
    {
      id: 3,
      name: 'Công nghệ phần mềm',
      code: 'IT3180',
      credits: 3,
      semester: 'HK1-2023',
      teacher: {
        name: 'PGS.TS. Lê Văn C',
        avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=teacher3'
      },
      progress: 92,
      grade: 9.2,
      status: 'active',
      description: 'Quy trình phát triển phần mềm, phân tích thiết kế hệ thống',
      schedule: 'Thứ 6 (7:00-11:30)',
      room: 'Phòng 401-A3',
      assignments: 5,
      completedAssignments: 5,
      difficulty: 5
    },
    {
      id: 4,
      name: 'Cấu trúc dữ liệu và giải thuật',
      code: 'IT3070',
      credits: 4,
      semester: 'HK2-2022',
      teacher: {
        name: 'TS. Phạm Văn D',
        avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=teacher4'
      },
      progress: 100,
      grade: 8.0,
      status: 'completed',
      description: 'Các cấu trúc dữ liệu cơ bản và thuật toán',
      schedule: 'Đã hoàn thành',
      room: '-',
      assignments: 10,
      completedAssignments: 10,
      difficulty: 4
    }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = filterSemester === 'all' || course.semester === filterSemester;
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;

    return matchesSearch && matchesSemester && matchesStatus;
  });

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'active': return 'green';
      case 'completed': return 'blue';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  const getStatusText = (status: any) => {
    switch (status) {
      case 'active': return 'Đang học';
      case 'completed': return 'Đã hoàn thành';
      case 'pending': return 'Chờ bắt đầu';
      default: return status;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Quản lý Học phần</h1>
        <div style={{ display: 'flex', gap: 16 }}>
          <Search
            placeholder="Tìm kiếm môn học..."
            allowClear
            style={{ width: 300 }}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="Học kỳ"
            style={{ width: 150 }}
            value={filterSemester}
            onChange={setFilterSemester}
          >
            <Option value="all">Tất cả học kỳ</Option>
            <Option value="HK1-2023">HK1-2023</Option>
            <Option value="HK2-2022">HK2-2022</Option>
          </Select>
          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            value={filterStatus}
            onChange={setFilterStatus}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="active">Đang học</Option>
            <Option value="completed">Đã hoàn thành</Option>
            <Option value="pending">Chờ bắt đầu</Option>
          </Select>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {filteredCourses.map(course => (
          <Col span={12} key={course.id}>
            <Card
              hoverable
              actions={[
                <Button type="link" href={`/courses/${course.id}`}>Xem chi tiết</Button>,
                <Button type="link" href={`/assignments?course=${course.id}`}>Bài tập</Button>,
                <Button type="link" href={`/documents?course=${course.id}`}>Tài liệu</Button>
              ]}
            >
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: 8 }}>
                      {course.name}
                      <Tag color="blue" style={{ marginLeft: 8 }}>{course.code}</Tag>
                    </h3>
                    <Tag color={getStatusColor(course.status)}>
                      {getStatusText(course.status)}
                    </Tag>
                    <Tag>{course.credits} tín chỉ</Tag>
                    <Tag>{course.semester}</Tag>
                  </div>
                  {course.status === 'completed' && (
                    <div style={{ textAlign: 'center' }}>
                      <TrophyOutlined style={{ fontSize: 24, color: '#faad14' }} />
                      <div style={{ fontSize: 16, fontWeight: 'bold', color: '#faad14' }}>
                        {course.grade}/10
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p style={{ color: '#666', marginBottom: 16 }}>{course.description}</p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Avatar src={course.teacher.avatar} size="small" />
                  <span style={{ marginLeft: 8 }}>{course.teacher.name}</span>
                </div>
                <div style={{ color: '#666', fontSize: 12 }}>
                  <ClockCircleOutlined /> {course.schedule}
                  {course.room !== '-' && <span> • 📍 {course.room}</span>}
                </div>
              </div>

              {course.status === 'active' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Tiến độ học tập</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress percent={course.progress} size="small" />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: '#666' }}>
                    <span>Bài tập: {course.completedAssignments}/{course.assignments}</span>
                    <div>
                      <span style={{ marginRight: 8 }}>Độ khó:</span>
                      <Rate disabled defaultValue={course.difficulty} style={{ fontSize: 12 }} />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {filteredCourses.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#666' }}>
          <BookOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p>Không tìm thấy môn học nào phù hợp</p>
        </div>
      )}
    </div>
  );
};

export default Courses;