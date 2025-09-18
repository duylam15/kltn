import React, { useState } from 'react';
import { Card, List, Tag, Button, Progress, Modal, Upload, Form, Input, message, Select, DatePicker, Divider } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const Assignments = () => {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [form] = Form.useForm();

  // Dữ liệu mẫu
  const assignments = [
    {
      id: 1,
      title: 'Bài tập lập trình Java - Buổi 5',
      course: 'Lập trình hướng đối tượng',
      courseCode: 'IT3103',
      description: 'Viết chương trình quản lý sinh viên sử dụng OOP trong Java. Yêu cầu áp dụng các nguyên lý kế thừa, đóng gói và đa hình.',
      deadline: '2024-01-20T23:59:59',
      assignedDate: '2024-01-10T00:00:00',
      maxScore: 10,
      type: 'programming',
      status: 'pending',
      priority: 'high',
      submissions: [],
      attachments: [
        { name: 'Yêu cầu bài tập.pdf', url: '/files/requirement.pdf' },
        { name: 'Template code.zip', url: '/files/template.zip' }
      ],
      submissionFormat: ['java', 'zip', 'pdf'],
      requirements: [
        'Sử dụng ngôn ngữ Java',
        'Áp dụng các nguyên lý OOP',
        'Có file README hướng dẫn chạy',
        'Code phải có comment đầy đủ'
      ]
    },
    {
      id: 2,
      title: 'Thiết kế cơ sở dữ liệu - Bài tập 3',
      course: 'Cơ sở dữ liệu',
      courseCode: 'IT3090',
      description: 'Thiết kế CSDL cho hệ thống quản lý thư viện. Bao gồm ERD, các bảng và các truy vấn SQL cơ bản.',
      deadline: '2024-01-22T23:59:59',
      assignedDate: '2024-01-12T00:00:00',
      maxScore: 10,
      type: 'design',
      status: 'submitted',
      priority: 'medium',
      submissions: [
        {
          id: 1,
          submittedAt: '2024-01-18T14:30:00',
          files: ['database_design.pdf', 'sql_queries.sql'],
          note: 'Đã hoàn thành theo yêu cầu',
          score: 8.5,
          feedback: 'Bài làm tốt, ERD rõ ràng. Cần bổ sung thêm một số ràng buộc.'
        }
      ],
      attachments: [
        { name: 'Mẫu ERD.pdf', url: '/files/erd_sample.pdf' }
      ],
      submissionFormat: ['pdf', 'sql', 'docx'],
      requirements: [
        'Vẽ ERD đầy đủ',
        'Tạo các bảng trong SQL',
        'Viết ít nhất 10 truy vấn',
        'Giải thích thiết kế'
      ]
    },
    {
      id: 3,
      title: 'Phân tích yêu cầu hệ thống',
      course: 'Công nghệ phần mềm',
      courseCode: 'IT3180',
      description: 'Phân tích yêu cầu cho hệ thống quản lý bán hàng online. Viết tài liệu SRS theo chuẩn IEEE.',
      deadline: '2024-01-25T23:59:59',
      assignedDate: '2024-01-15T00:00:00',
      maxScore: 10,
      type: 'analysis',
      status: 'pending',
      priority: 'low',
      submissions: [],
      attachments: [
        { name: 'Template SRS.docx', url: '/files/srs_template.docx' },
        { name: 'Hướng dẫn.pdf', url: '/files/guide.pdf' }
      ],
      submissionFormat: ['docx', 'pdf'],
      requirements: [
        'Tuân thủ chuẩn IEEE',
        'Phân tích đầy đủ các yêu cầu',
        'Có use case diagram',
        'Định nghĩa rõ các ràng buộc'
      ]
    }
  ];

  const courses = ['Lập trình hướng đối tượng', 'Cơ sở dữ liệu', 'Công nghệ phần mềm'];

  const filteredAssignments = assignments.filter(assignment => {
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    const matchesCourse = filterCourse === 'all' || assignment.course === filterCourse;
    return matchesStatus && matchesCourse;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'submitted': return 'green';
      case 'overdue': return 'red';
      case 'graded': return 'blue';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chưa nộp';
      case 'submitted': return 'Đã nộp';
      case 'overdue': return 'Quá hạn';
      case 'graded': return 'Đã chấm';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Ưu tiên cao';
      case 'medium': return 'Ưu tiên trung bình';
      case 'low': return 'Ưu tiên thấp';
      default: return priority;
    }
  };

  const getTimeRemaining = (deadline) => {
    const now = dayjs();
    const deadlineDate = dayjs(deadline);
    const diffHours = deadlineDate.diff(now, 'hour');
    const diffDays = deadlineDate.diff(now, 'day');

    if (diffHours < 0) return 'Đã quá hạn';
    if (diffHours < 24) return `Còn ${diffHours} giờ`;
    return `Còn ${diffDays} ngày`;
  };

  const handleSubmit = (values) => {
    console.log('Submitting assignment:', values);
    message.success('Nộp bài thành công!');
    setSubmitModalVisible(false);
    form.resetFields();
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    action: '/api/upload',
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} tải lên thành công.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} tải lên thất bại.`);
      }
    },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Bài tập và Nộp bài</h1>
        <div style={{ display: 'flex', gap: 16 }}>
          <Select
            placeholder="Lọc theo môn học"
            style={{ width: 200 }}
            value={filterCourse}
            onChange={setFilterCourse}
          >
            <Option value="all">Tất cả môn học</Option>
            {courses.map(course => (
              <Option key={course} value={course}>{course}</Option>
            ))}
          </Select>
          <Select
            placeholder="Lọc theo trạng thái"
            style={{ width: 150 }}
            value={filterStatus}
            onChange={setFilterStatus}
          >
            <Option value="all">Tất cả</Option>
            <Option value="pending">Chưa nộp</Option>
            <Option value="submitted">Đã nộp</Option>
            <Option value="graded">Đã chấm</Option>
          </Select>
        </div>
      </div>

      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={filteredAssignments}
        renderItem={(assignment) => (
          <List.Item>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span>{assignment.title}</span>
                    <Tag color="blue" style={{ marginLeft: 8 }}>{assignment.courseCode}</Tag>
                  </div>
                  <div>
                    <Tag color={getStatusColor(assignment.status)}>
                      {getStatusText(assignment.status)}
                    </Tag>
                    <Tag color={getPriorityColor(assignment.priority)}>
                      {getPriorityText(assignment.priority)}
                    </Tag>
                  </div>
                </div>
              }
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    Xem chi tiết
                  </Button>
                  {assignment.status === 'pending' && (
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setSubmitModalVisible(true);
                      }}
                    >
                      Nộp bài
                    </Button>
                  )}
                </div>
              }
            >
              <div style={{ marginBottom: 16 }}>
                <p><strong>Môn học:</strong> {assignment.course}</p>
                <p style={{ color: '#666' }}>{assignment.description}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  <span>Hạn nộp: {dayjs(assignment.deadline).format('DD/MM/YYYY HH:mm')}</span>
                  <Tag color={dayjs(assignment.deadline).diff(dayjs(), 'hour') < 24 ? 'red' : 'green'} style={{ marginLeft: 8 }}>
                    {getTimeRemaining(assignment.deadline)}
                  </Tag>
                </div>
                <div>
                  <span>Điểm tối đa: <strong>{assignment.maxScore}</strong></span>
                </div>
              </div>

              {assignment.status === 'submitted' && assignment.submissions.length > 0 && (
                <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: 12, borderRadius: 6 }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  <span>Đã nộp lúc: {dayjs(assignment.submissions[0].submittedAt).format('DD/MM/YYYY HH:mm')}</span>
                  {assignment.submissions[0].score && (
                    <span style={{ marginLeft: 16 }}>
                      Điểm: <strong style={{ color: '#52c41a' }}>{assignment.submissions[0].score}/{assignment.maxScore}</strong>
                    </span>
                  )}
                </div>
              )}

              {assignment.attachments.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p><strong>Tài liệu đính kèm:</strong></p>
                  {assignment.attachments.map((file, index) => (
                    <Button key={index} icon={<DownloadOutlined />} size="small" style={{ marginRight: 8, marginBottom: 4 }}>
                      {file.name}
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          </List.Item>
        )}
      />

      {/* Modal nộp bài */}
      <Modal
        title={`Nộp bài: ${selectedAssignment?.title}`}
        visible={submitModalVisible}
        onCancel={() => {
          setSubmitModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        {selectedAssignment && (
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 6 }}>
              <h4>Yêu cầu bài tập:</h4>
              <ul>
                {selectedAssignment.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
              <p><strong>Định dạng file chấp nhận:</strong> {selectedAssignment.submissionFormat.join(', ')}</p>
              <p><strong>Hạn nộp:</strong> {dayjs(selectedAssignment.deadline).format('DD/MM/YYYY HH:mm')}</p>
            </div>

            <Form.Item
              name="files"
              label="Tải lên file bài làm"
              rules={[{ required: true, message: 'Vui lòng tải lên ít nhất một file!' }]}
            >
              <Upload {...uploadProps} listType="picture">
                <Button icon={<UploadOutlined />}>Chọn file</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              name="note"
              label="Ghi chú (tùy chọn)"
            >
              <TextArea
                rows={4}
                placeholder="Thêm ghi chú cho bài nộp của bạn..."
              />
            </Form.Item>

            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button onClick={() => setSubmitModalVisible(false)}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                  Nộp bài
                </Button>
              </div>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Assignments;