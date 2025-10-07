import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  Tabs,
  Space,
  Tag,
  Checkbox,
  Divider,
  Tooltip,
  Empty,
  Alert,
  Row,
  Col,
  Statistic,
  Input,
  Typography,
  Badge,
  List,
  Popover,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalculatorOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SaveOutlined,
  SettingOutlined,
  CloseOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const API_BASE_URL = 'http://localhost:4000/api/v1';

// ==================== INTERFACES ====================
interface Assignment {
  id: number;
  title: string;
  description: string;
  type: string;
  dueDate: string;
  maxScore: number;
  sectionLinks: {
    sectionId: number;
    isOpen: boolean;
  }[];
}

interface AttendanceSession {
  id: number;
  name: string;
  sessionCode: string;
  createdAt: string;
  expiresAt: string;
  attendances: {
    studentId: number;
    status: string;
  }[];
}

interface GradeColumn {
  id?: number;
  name: string;
  type: string;
  weight: number;
  maxScore: number;
  order: number;
  isAutoCalculated: boolean;
  attendanceScoreMethod?: string;
  assignmentScoreMethod?: string;
  attendanceConfig?: any;
  assignmentConfig?: any;
  description?: string;
  attendanceSessions?: {
    id: number;
    sessionId: number;
    session: {
      id: number;
      name: string;
      sessionCode: string;
    };
  }[];
  assignments?: {
    id: number;
    assignmentId: number;
    assignment: {
      id: number;
      title: string;
      type: string;
    };
  }[];
  _count?: {
    grades: number;
  };
}

interface Student {
  studentId: number;
  studentCode: string;
  fullName: string;
  email: string;
  grades: {
    columnId: number;
    score: number | null;
    maxScore: number;
    isAutoCalculated: boolean;
  }[];
  summary: {
    totalScore: number | null;
    finalGrade: string | null;
    rank: number | null;
    isPassed: boolean;
  };
}

interface GradeData {
  columns: GradeColumn[];
  students: Student[];
}

// ==================== MAIN COMPONENT ====================
export default function GradesTeacher() {
  const [loading, setLoading] = useState(false);
  const [sectionId] = useState(100);

  // State cho Grade Columns
  const [gradeColumns, setGradeColumns] = useState<GradeColumn[]>([]);
  const [editingColumns, setEditingColumns] = useState<GradeColumn[]>([]);

  // State cho Assignments và Attendance
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);

  // State cho Grades
  const [gradeData, setGradeData] = useState<GradeData | null>(null);

  // Modal states
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<GradeColumn | null>(null);
  const [saveTemplateModalVisible, setSaveTemplateModalVisible] = useState(false);

  // Form instances
  const [saveTemplateForm] = Form.useForm();

  // Temp state for selection
  const [tempSelectedItems, setTempSelectedItems] = useState<number[]>([]);

  // ==================== FETCH DATA ====================
  useEffect(() => {
    initializeGradeColumns();
    fetchGrades();
  }, [sectionId]);

  const initializeGradeColumns = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/sections/${sectionId}/grade-columns`);

      if (response.data.success && response.data.data.length > 0) {
        setGradeColumns(response.data.data);
      } else {
        await applyDefaultTemplate();
      }
    } catch (error: any) {
      message.error('Không thể tải cấu hình điểm: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyDefaultTemplate = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/grade-templates/1/apply`, {
        sectionId,
      });

      if (response.data.success) {
        message.success('Đã áp dụng cấu hình mặc định');
        const columnsResponse = await axios.get(
          `${API_BASE_URL}/sections/${sectionId}/grade-columns`
        );
        if (columnsResponse.data.success) {
          setGradeColumns(columnsResponse.data.data);
        }
      }
    } catch (error: any) {
      console.error('Error applying default template:', error);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/grades/sections/${sectionId}/grades`);
      if (response.data.success) {
        setGradeData(response.data.data);
      }
    } catch (error: any) {
      message.error('Không thể tải bảng điểm: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentsAndSessions = async () => {
    try {
      const [assignmentsRes, attendanceRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/assignments/`),
        axios.get(`${API_BASE_URL}/attendance/sections/${sectionId}/sessions`),
      ]);

      if (assignmentsRes.data.success) {
        const filteredAssignments = assignmentsRes.data.data.filter((assignment: any) =>
          assignment.sectionLinks.some((link: any) => link.sectionId === sectionId)
        );
        setAssignments(filteredAssignments);
      }

      if (attendanceRes.data.success) {
        setAttendanceSessions(attendanceRes.data.data);
      }
    } catch (error: any) {
      message.error('Không thể tải dữ liệu: ' + error.message);
    }
  };

  // ==================== HANDLE OPEN SELECT MODAL ====================
  const handleOpenSelectModal = async (column: GradeColumn) => {
    setSelectedColumn(column);
    await fetchAssignmentsAndSessions();

    // Get current selections
    if (column.type === 'attendance') {
      const currentSessions = column.attendanceSessions?.map((s) => s.sessionId) || [];
      setTempSelectedItems(currentSessions);
    } else if (['assignment', 'quiz', 'midterm', 'final', 'project'].includes(column.type)) {
      const currentAssignments = column.assignments?.map((a) => a.assignmentId) || [];
      setTempSelectedItems(currentAssignments);
    }

    setSelectModalVisible(true);
  };

  // ==================== HANDLE SAVE SELECTION ====================
  const handleSaveSelection = async () => {
    if (!selectedColumn || !selectedColumn.id) return;
    console.log(selectedColumn.id)
    try {
      setLoading(true);

      if (selectedColumn.type === 'attendance') {
        // Assign attendance sessions
        const sessionIds = tempSelectedItems.map((sessionId, index) => ({
          sessionId,
          weight: 1,
          isRequired: true,
          order: index,
        }));

        await axios.post(
          `${API_BASE_URL}/grade-columns/${selectedColumn.id}/attendance-sessions`,
          { sessionIds }
        );

        message.success('Gán buổi điểm danh thành công!');
      } else if (['assignment', 'quiz', 'midterm', 'final', 'project'].includes(selectedColumn.type)) {
        // Assign assignments
        const assignmentIds = tempSelectedItems.map((assignmentId, index) => ({
          assignmentId,
          weight: 1,
          isRequired: true,
          isExtraCredit: false,
          order: index,
        }));

        await axios.post(
          `${API_BASE_URL}/grade-columns/${selectedColumn.id}/assignments`,
          { assignmentIds }
        );

        message.success('Gán bài tập thành công!');
      }

      // Recalculate if auto
      if (selectedColumn.isAutoCalculated) {
        await axios.post(`${API_BASE_URL}/grade-columns/${selectedColumn.id}/recalculate`);
      }

      // Reload
      await initializeGradeColumns();
      await fetchGrades();

      setSelectModalVisible(false);
      setTempSelectedItems([]);
    } catch (error: any) {
      message.error('Lưu thất bại: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== HANDLE EDIT CONFIGURATION ====================
  const handleOpenConfigModal = async () => {
    await fetchAssignmentsAndSessions();
    setEditingColumns(
      gradeColumns.map((col) => ({
        ...col,
      }))
    );
    setConfigModalVisible(true);
  };

  const handleAddColumn = () => {
    const newColumn: GradeColumn = {
      name: '',
      type: 'custom',
      weight: 0,
      maxScore: 10,
      order: editingColumns.length,
      isAutoCalculated: false,
    };
    setEditingColumns([...editingColumns, newColumn]);
  };

  const handleRemoveColumn = (index: number) => {
    const newColumns = editingColumns.filter((_, i) => i !== index);
    setEditingColumns(newColumns);
  };

  const handleUpdateColumn = (index: number, field: string, value: any) => {
    const newColumns = [...editingColumns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setEditingColumns(newColumns);
  };

  // ==================== HANDLE SAVE CONFIGURATION ====================
  const handleSaveConfiguration = () => {
    const totalWeight = editingColumns.reduce((sum, col) => sum + col.weight, 0);
    if (totalWeight !== 100) {
      message.error(`Tổng trọng số phải bằng 100% (hiện tại: ${totalWeight}%)`);
      return;
    }

    const hasEmptyName = editingColumns.some((col) => !col.name.trim());
    if (hasEmptyName) {
      message.error('Vui lòng nhập tên cho tất cả các cột');
      return;
    }

    setSaveTemplateModalVisible(true);
  };

  const handleSaveAsNewTemplate = async (values: any) => {
    try {
      setLoading(true);

      const columnsData = editingColumns.map((col, index) => ({
        name: col.name,
        type: col.type,
        weight: col.weight,
        maxScore: col.maxScore,
        order: index,
        isVisible: true,
        isEditable: true,
        isAutoCalculated: col.isAutoCalculated,
        autoUpdate: true,
        attendanceScoreMethod:
          col.type === 'attendance' ? (col.attendanceScoreMethod || 'percentage') : undefined,
        attendanceConfig:
          col.type === 'attendance'
            ? {
              statusWeights: {
                present: 1.0,
                late: 0.5,
                absent: 0,
                warning: 0.3,
              },
              roundingRule: 'round',
              minScore: 0,
            }
            : undefined,
        assignmentScoreMethod: ['assignment', 'quiz', 'midterm', 'final', 'project'].includes(
          col.type
        )
          ? col.assignmentScoreMethod || 'average'
          : undefined,
        assignmentConfig: ['assignment', 'quiz', 'midterm', 'final', 'project'].includes(col.type)
          ? {
            roundingRule: 'round',
            minScore: 0,
            dropLowest: 0,
          }
          : undefined,
        description: col.description,
      }));

      const formula: any = {};
      editingColumns.forEach((col) => {
        if (col.type === 'attendance') formula.attendance = col.weight;
        if (col.type === 'assignment') formula.assignment = col.weight;
        if (col.type === 'quiz') formula.quiz = col.weight;
        if (col.type === 'midterm') formula.midterm = col.weight;
        if (col.type === 'final') formula.final = col.weight;
        if (col.type === 'project') formula.project = col.weight;
      });

      const templateData = {
        name: values.templateName,
        description: values.description || `Cấu hình tùy chỉnh - ${new Date().toLocaleDateString()}`,
        department: values.department,
        subjectCode: values.subjectCode,
        isPublic: values.isPublic || false,
        columns: columnsData,
        formula: {
          formula,
          gradeScale: {
            A: 8.5,
            'B+': 8.0,
            B: 7.0,
            'C+': 6.5,
            C: 5.5,
            'D+': 5.0,
            D: 4.0,
            F: 0,
          },
          passingScore: 5.0,
        },
      };

      const createResponse = await axios.post(`${API_BASE_URL}/grade-templates`, templateData);

      if (createResponse.data.success) {
        const newTemplateId = createResponse.data.data.id;
        message.success('Tạo cấu hình mới thành công!');

        const applyResponse = await axios.post(
          `${API_BASE_URL}/grade-templates/${newTemplateId}/apply`,
          { sectionId }
        );

        if (applyResponse.data.success) {
          message.success('Áp dụng cấu hình mới thành công!');
          await initializeGradeColumns();
          await fetchGrades();

          setSaveTemplateModalVisible(false);
          setConfigModalVisible(false);
          saveTemplateForm.resetFields();
        }
      }
    } catch (error: any) {
      message.error('Lưu cấu hình thất bại: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== UPDATE MANUAL GRADE ====================
  const handleUpdateGrade = async (columnId: number, studentId: number, score: number) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/grades`, {
        columnId,
        studentId,
        score,
      });

      if (response.data.success) {
        message.success('Cập nhật điểm thành công!');
        fetchGrades();
      }
    } catch (error: any) {
      message.error('Cập nhật điểm thất bại: ' + error.message);
    }
  };

  // ==================== EXPORT GRADES ====================
  const handleExportGrades = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/sections/${sectionId}/grades/export?format=csv`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `grades-section${sectionId}-${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Xuất file thành công!');
    } catch (error: any) {
      message.error('Xuất file thất bại: ' + error.message);
    }
  };

  // ==================== RENDER COLUMN HEADER WITH SELECTION ====================
  const renderColumnHeader = (col: GradeColumn) => {
    const canSelect =
      col.type === 'attendance' ||
      ['assignment', 'quiz', 'midterm', 'final', 'project'].includes(col.type);

    const selectedCount =
      col.type === 'attendance'
        ? col.attendanceSessions?.length || 0
        : col.assignments?.length || 0;

    return (
      <div style={{ textAlign: 'center' }}>
        <Space direction="vertical" size={4}>
          <strong>{col.name}</strong>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ({col.weight}%)
          </Text>

          {canSelect && (
            <Button
              type="link"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => handleOpenSelectModal(col)}
              style={{ padding: 0, height: 'auto' }}
            >
              {selectedCount > 0 ? (
                <Badge count={selectedCount} showZero>
                  <Text style={{ fontSize: 11 }}>
                    {col.type === 'attendance' ? 'Chọn điểm danh' : 'Chọn bài tập'}
                  </Text>
                </Badge>
              ) : (
                <Text type="danger" style={{ fontSize: 11 }}>
                  {col.type === 'attendance' ? 'Chọn điểm danh' : 'Chọn bài tập'}
                </Text>
              )}
            </Button>
          )}

          {col.isAutoCalculated && (
            <Tag color="green" style={{ fontSize: 10 }}>
              Tự động
            </Tag>
          )}
        </Space>
      </div>
    );
  };

  // ==================== RENDER GRADE TABLE ====================
  const gradeTableColumns: ColumnsType<Student> = [
    {
      title: 'MSSV',
      dataIndex: 'studentCode',
      key: 'studentCode',
      width: 120,
      fixed: 'left',
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
      fixed: 'left',
    },
    ...(gradeData?.columns || []).map((col) => ({
      title: renderColumnHeader(col),
      key: `col-${col.id}`,
      width: 150,
      align: 'center' as const,
      render: (student: Student) => {
        const grade = student.grades.find((g) => g.columnId === col.id);
        return (
          <div>
            {!grade?.isAutoCalculated && col.id ? (
              <InputNumber
                size="small"
                min={0}
                max={col.maxScore}
                step={0.1}
                value={grade?.score ?? undefined}
                placeholder="-"
                onChange={(value) => {
                  if (value !== null) {
                    handleUpdateGrade(col.id!, student.studentId, value);
                  }
                }}
                style={{ width: '100%' }}
              />
            ) : (
              <Space direction="vertical" size={0}>
                <span style={{ fontWeight: 'bold', fontSize: 16 }}>
                  {grade?.score?.toFixed(1) ?? '-'}
                </span>
                <Tag color="green" style={{ fontSize: 10 }}>
                  Auto
                </Tag>
              </Space>
            )}
          </div>
        );
      },
    })),
    {
      title: 'Tổng điểm',
      key: 'totalScore',
      width: 100,
      fixed: 'right',
      align: 'center' as const,
      render: (student: Student) => (
        <strong style={{ color: '#1890ff', fontSize: 18 }}>
          {student.summary.totalScore?.toFixed(2) ?? '-'}
        </strong>
      ),
    },
    {
      title: 'Xếp loại',
      key: 'finalGrade',
      width: 100,
      fixed: 'right',
      align: 'center' as const,
      render: (student: Student) => (
        <Tag
          color={
            student.summary.finalGrade === 'A'
              ? 'green'
              : student.summary.finalGrade?.startsWith('B')
                ? 'blue'
                : student.summary.finalGrade?.startsWith('C')
                  ? 'orange'
                  : 'red'
          }
          style={{ fontSize: 16, fontWeight: 'bold' }}
        >
          {student.summary.finalGrade ?? '-'}
        </Tag>
      ),
    },
    {
      title: 'Hạng',
      key: 'rank',
      width: 80,
      fixed: 'right',
      align: 'center' as const,
      render: (student: Student) => (
        <Tag color="cyan" style={{ fontSize: 14 }}>
          #{student.summary.rank ?? '-'}
        </Tag>
      ),
    },
  ];

  // ==================== RENDER ====================
  return (
    <div style={{ minHeight: '100vh' }}>
      <Card
        title={
          <Space>
            <span style={{ fontSize: 20, fontWeight: 'bold' }}>
              📊 Quản lý điểm - Section {sectionId}
            </span>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleOpenConfigModal}
              loading={loading}
            >
              Sửa cấu hình
            </Button>

            <Button icon={<ReloadOutlined />} onClick={() => fetchGrades()}>
              Làm mới
            </Button>

            <Button icon={<FileExcelOutlined />} onClick={handleExportGrades}>
              Xuất Excel
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="📊 Bảng điểm" key="1">
            <Alert
              message="💡 Hướng dẫn"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>
                    Click <strong>"Chọn điểm danh"</strong> hoặc <strong>"Chọn bài tập"</strong> ở
                    header cột để chọn buổi/bài tập nào được tính vào cột đó
                  </li>
                  <li>Cột có tag "Tự động" sẽ tự tính điểm khi gán xong</li>
                  <li>Cột không có tag "Tự động" có thể nhập điểm thủ công</li>
                  <li>
                    Click <strong>"Sửa cấu hình"</strong> để thay đổi số cột, trọng số, thêm/xóa cột
                  </li>
                </ul>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* Statistics */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Tổng sinh viên"
                    value={gradeData?.students.length || 0}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Số cột điểm"
                    value={gradeColumns.length}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Điểm TB cao nhất"
                    value={
                      gradeData && gradeData.students.length > 0
                        ? Math.max(
                          ...gradeData.students.map((s) => s.summary.totalScore || 0)
                        ).toFixed(2)
                        : '-'
                    }
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Tỷ lệ đạt"
                    value={
                      gradeData && gradeData.students.length > 0
                        ? (
                          (gradeData.students.filter((s) => s.summary.isPassed).length /
                            gradeData.students.length) *
                          100
                        ).toFixed(1)
                        : '0'
                    }
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            {gradeData ? (
              <Table
                columns={gradeTableColumns}
                dataSource={gradeData.students}
                rowKey="studentId"
                loading={loading}
                scroll={{ x: 1500, y: 600 }}
                pagination={{
                  pageSize: 20,
                  showTotal: (total) => `Tổng ${total} sinh viên`,
                  showSizeChanger: true,
                  showQuickJumper: true,
                }}
                bordered
                size="middle"
              />
            ) : (
              <Empty description="Chưa có dữ liệu điểm" />
            )}
          </TabPane>

          <TabPane tab="⚙️ Cấu hình hiện tại" key="2">
            <Alert
              message="Cấu hình cột điểm"
              description="Hiển thị cấu hình điểm hiện tại của lớp học. Click 'Sửa cấu hình' để thay đổi."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Table
              dataSource={gradeColumns}
              rowKey={(record) => record.id || record.name}
              pagination={false}
              bordered
              columns={[
                {
                  title: 'STT',
                  key: 'order',
                  width: 60,
                  render: (_, __, index) => index + 1,
                },
                {
                  title: 'Tên cột',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text, record: any) => (
                    <Space direction="vertical" size={0}>
                      <strong>{text}</strong>
                      <Tag color="blue">{record.type}</Tag>
                    </Space>
                  ),
                },
                {
                  title: 'Trọng số (%)',
                  dataIndex: 'weight',
                  key: 'weight',
                  width: 120,
                  render: (weight) => <strong style={{ color: '#1890ff' }}>{weight}%</strong>,
                },
                {
                  title: 'Đã gán',
                  key: 'assigned',
                  width: 200,
                  render: (_, record) => {
                    if (record.type === 'attendance') {
                      return (
                        <Badge count={record.attendanceSessions?.length || 0} showZero>
                          <Tag color="blue">Buổi điểm danh</Tag>
                        </Badge>
                      );
                    }
                    if (['assignment', 'quiz', 'midterm', 'final', 'project'].includes(record.type)) {
                      return (
                        <Badge count={record.assignments?.length || 0} showZero>
                          <Tag color="green">Bài tập</Tag>
                        </Badge>
                      );
                    }
                    return '-';
                  },
                },
                {
                  title: 'Tự động tính',
                  dataIndex: 'isAutoCalculated',
                  key: 'isAutoCalculated',
                  width: 120,
                  render: (isAuto) => (
                    <Tag color={isAuto ? 'green' : 'default'}>
                      {isAuto ? 'Tự động' : 'Thủ công'}
                    </Tag>
                  ),
                },
              ]}
            />

            <Divider />

            <Alert
              message="Tổng trọng số"
              description={
                <Space>
                  <span>
                    Tổng:{' '}
                    <strong style={{ fontSize: 18, color: '#1890ff' }}>
                      {gradeColumns.reduce((sum, col) => sum + col.weight, 0)}%
                    </strong>
                  </span>
                  {gradeColumns.reduce((sum, col) => sum + col.weight, 0) === 100 ? (
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                  ) : (
                    <CloseOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                  )}
                </Space>
              }
              type={
                gradeColumns.reduce((sum, col) => sum + col.weight, 0) === 100
                  ? 'success'
                  : 'warning'
              }
              showIcon
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* ==================== MODAL: SELECT SESSIONS/ASSIGNMENTS ==================== */}
      <Modal
        title={
          selectedColumn
            ? `Chọn ${selectedColumn.type === 'attendance' ? 'buổi điểm danh' : 'bài tập'
            } cho cột: ${selectedColumn.name}`
            : ''
        }
        open={selectModalVisible}
        onCancel={() => {
          setSelectModalVisible(false);
          setTempSelectedItems([]);
        }}
        onOk={handleSaveSelection}
        width={700}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Alert
          message={`Chọn các ${selectedColumn?.type === 'attendance' ? 'buổi điểm danh' : 'bài tập'
            } muốn tính vào cột này`}
          description={
            selectedColumn?.isAutoCalculated
              ? 'Sau khi lưu, hệ thống sẽ tự động tính điểm cho cột này.'
              : 'Cột này cần nhập điểm thủ công.'
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {selectedColumn?.type === 'attendance' ? (
          // Attendance Sessions List
          <Checkbox.Group
            value={tempSelectedItems}
            onChange={(values) => setTempSelectedItems(values as number[])}
            style={{ width: '100%' }}
          >
            <List
              dataSource={attendanceSessions}
              renderItem={(session) => (
                <List.Item>
                  <Checkbox value={session.id} style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <Tag color="blue">{session.sessionCode}</Tag>
                        <strong>{session.name}</strong>
                      </Space>
                      <Text type="secondary">
                        {session.attendances.length} SV đã điểm danh
                      </Text>
                    </Space>
                  </Checkbox>
                </List.Item>
              )}
              bordered
            />
          </Checkbox.Group>
        ) : (
          // Assignments List
          <Checkbox.Group
            value={tempSelectedItems}
            onChange={(values) => setTempSelectedItems(values as number[])}
            style={{ width: '100%' }}
          >
            <List
              dataSource={assignments}
              renderItem={(assignment) => (
                <List.Item>
                  <Checkbox value={assignment.id} style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <Tag color="green">{assignment.type}</Tag>
                        <strong>{assignment.title}</strong>
                      </Space>
                      <Text type="secondary">Điểm tối đa: {assignment.maxScore}</Text>
                    </Space>
                  </Checkbox>
                </List.Item>
              )}
              bordered
            />
          </Checkbox.Group>
        )}

        <Divider />

        <Alert
          message="Đã chọn"
          description={`${tempSelectedItems.length} ${selectedColumn?.type === 'attendance' ? 'buổi điểm danh' : 'bài tập'
            }`}
          type="success"
          showIcon
        />
      </Modal>

      {/* ==================== MODAL: EDIT CONFIGURATION ==================== */}
      <Modal
        title="⚙️ Sửa cấu hình điểm"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setConfigModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveConfiguration}
            loading={loading}
          >
            Lưu cấu hình mới
          </Button>,
        ]}
      >
        <Alert
          message="Chỉnh sửa cấu hình"
          description="Thêm, xóa, sửa các cột điểm. Sau khi lưu, hệ thống sẽ tạo template mới và áp dụng cho lớp này."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {editingColumns.map((col, index) => (
            <Card
              key={index}
              size="small"
              title={
                <Space>
                  <Tag color="blue">Cột {index + 1}</Tag>
                  <Input
                    placeholder="Tên cột"
                    value={col.name}
                    onChange={(e) => handleUpdateColumn(index, 'name', e.target.value)}
                    style={{ width: 200 }}
                  />
                </Space>
              }
              extra={
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveColumn(index)}
                >
                  Xóa
                </Button>
              }
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong>Loại cột:</Text>
                    <Select
                      value={col.type}
                      onChange={(value) => handleUpdateColumn(index, 'type', value)}
                      style={{ width: '100%' }}
                    >
                      <Option value="attendance">📋 Điểm danh</Option>
                      <Option value="assignment">📝 Bài tập</Option>
                      <Option value="quiz">📄 Kiểm tra</Option>
                      <Option value="midterm">📘 Giữa kỳ</Option>
                      <Option value="final">📕 Cuối kỳ</Option>
                      <Option value="project">💼 Đồ án</Option>
                      <Option value="participation">🙋 Tham gia</Option>
                      <Option value="custom">⚙️ Tùy chỉnh</Option>
                    </Select>
                  </Space>
                </Col>

                <Col span={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong>Trọng số (%):</Text>
                    <InputNumber
                      min={0}
                      max={100}
                      value={col.weight}
                      onChange={(value) => handleUpdateColumn(index, 'weight', value || 0)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>

                <Col span={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong>Điểm tối đa:</Text>
                    <InputNumber
                      min={0}
                      max={100}
                      value={col.maxScore}
                      onChange={(value) => handleUpdateColumn(index, 'maxScore', value || 10)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>

                <Col span={4}>
                  <Space direction="vertical" size={4}>
                    <Text strong>Tự động:</Text>
                    <Checkbox
                      checked={col.isAutoCalculated}
                      onChange={(e) =>
                        handleUpdateColumn(index, 'isAutoCalculated', e.target.checked)
                      }
                    >
                      Tự động
                    </Checkbox>
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}

          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={handleAddColumn}
            style={{ height: 50 }}
          >
            Thêm cột điểm
          </Button>

          <Alert
            message="Tổng trọng số"
            description={
              <Space>
                <span style={{ fontSize: 16 }}>
                  Tổng:{' '}
                  <strong style={{ fontSize: 20, color: '#1890ff' }}>
                    {editingColumns.reduce((sum, col) => sum + col.weight, 0)}%
                  </strong>
                </span>
                {editingColumns.reduce((sum, col) => sum + col.weight, 0) === 100 ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />
                ) : (
                  <CloseOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />
                )}
              </Space>
            }
            type={
              editingColumns.reduce((sum, col) => sum + col.weight, 0) === 100
                ? 'success'
                : 'warning'
            }
            showIcon
          />
        </Space>
      </Modal>

      {/* ==================== MODAL: SAVE TEMPLATE ==================== */}
      <Modal
        title="💾 Lưu cấu hình mới"
        open={saveTemplateModalVisible}
        onCancel={() => {
          setSaveTemplateModalVisible(false);
          saveTemplateForm.resetFields();
        }}
        onOk={() => saveTemplateForm.submit()}
        okText="Lưu và áp dụng"
        cancelText="Hủy"
        width={600}
      >
        <Alert
          message="Tạo template mới"
          description="Hệ thống sẽ tạo template mới từ cấu hình và tự động áp dụng cho lớp học này."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={saveTemplateForm}
          layout="vertical"
          onFinish={handleSaveAsNewTemplate}
          initialValues={{
            templateName: `Cấu hình duylam15 - ${new Date().toLocaleDateString()}`,
            isPublic: false,
          }}
        >
          <Form.Item
            name="templateName"
            label="Tên cấu hình"
            rules={[{ required: true, message: 'Vui lòng nhập tên cấu hình' }]}
          >
            <Input placeholder="VD: Mẫu CNTT 4 cột" prefix="📋" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả chi tiết về cấu hình này..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="Khoa">
                <Input placeholder="VD: CNTT" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subjectCode" label="Mã môn">
                <Input placeholder="VD: IT101" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isPublic" valuePropName="checked">
            <Checkbox>Công khai cấu hình (Cho phép GV khác sử dụng)</Checkbox>
          </Form.Item>

          <Divider />

          <Alert
            message="Xem trước cấu hình"
            description={
              <div>
                <p>
                  <strong>Số cột:</strong> {editingColumns.length}
                </p>
                <p>
                  <strong>Tổng trọng số:</strong>{' '}
                  {editingColumns.reduce((sum, col) => sum + col.weight, 0)}%
                </p>
                <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                  {editingColumns.map((col, i) => (
                    <li key={i}>
                      {col.name} ({col.type}) - {col.weight}%
                    </li>
                  ))}
                </ul>
              </div>
            }
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  );
}