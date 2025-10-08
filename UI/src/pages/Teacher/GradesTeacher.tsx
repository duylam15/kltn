import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Alert,
  Spin,
  Checkbox,
  Dropdown,
  Space,
  Typography,
  Divider,
  List,
  Card,
  Row,
  Col,
  Tooltip,
  Collapse,
  Switch,
  Grid,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalculatorOutlined,
  DownloadOutlined,
  MoreOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  DownOutlined,
  BookOutlined,
  BarChartOutlined,
  ReloadOutlined,
  UserOutlined,
  LineChartOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { MenuProps, TableColumnsType } from 'antd';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/authContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const API_BASE_URL = 'http://localhost:4000/api/v1';

interface AttendanceSession {
  id: number;
  name: string;
  sessionCode: string;
  createdAt: string;
  attendances: any[];
}

interface Assignment {
  id: number;
  title: string;
  maxScore: number;
  dueDate: string;
  submissions: any[];
}

interface GradeColumn {
  id: number;
  name: string;
  type: string;
  maxScore: number;
  weight: number | null;
  calculationMethod: string;
  isPublished: boolean;
  displayOrder: number;
  attendanceSessions?: any[];
  assignments?: any[];
  parentLinks?: any[];
  studentGrades?: any[];
}

interface Student {
  studentId: number;
  studentCode: string;
  fullName: string;
  email: string;
  columns: {
    [key: string]: {
      columnId: number;
      score: number | null;
      maxScore: number;
      percentage: number | null;
      isOverridden: boolean;
      note: string | null;
    };
  };
}

interface GradeBook {
  columns: GradeColumn[];
  students: Student[];
}

export default function GradesTeacher() {
  const [loading, setLoading] = useState(false);
 const { user } = useAuth(); // ✅ thêm dòng này
  const teacherId = user?.id; // ID của giáo viên hiện tại
  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);
  // Data states
  const [gradeBook, setGradeBook] = useState<GradeBook | null>(null);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableColumns, setAvailableColumns] = useState<GradeColumn[]>([]);

  // Dialog states
  const [openColumnDialog, setOpenColumnDialog] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<GradeColumn | null>(null);

  // Form
  const [form] = Form.useForm();

  // Form states
  const [columnForm, setColumnForm] = useState({
    name: '',
    type: 'attendance',
    description: '',
    maxScore: 10,
    weight: 10,
    calculationMethod: 'average',
    bestNCount: null as number | null,
    dropLowest: 0,
    isPublished: false,
    displayOrder: 0,
  });

  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);
  const [originalSessions, setOriginalSessions] = useState<number[]>([]);
  const [originalAssignments, setOriginalAssignments] = useState<number[]>([]);
  const [originalColumns, setOriginalColumns] = useState<number[]>([]);
  const [itemWeight, setItemWeight] = useState(1);
  const [keyword, setKeyword] = useState("");
  const { useBreakpoint } = Grid;

  const screens = useBreakpoint();

  const sortColumns = (columns: GradeColumn[]) => {
    const typeOrder: { [key: string]: number } = {
      attendance: 1,
      assignment: 2,
      midterm: 3,
      final: 4,
      project: 5,
      participation: 6,
      custom: 7,
    };

    return [...columns].sort((a, b) => {
      const typeComparison = (typeOrder[a.type] || 999) - (typeOrder[b.type] || 999);
      if (typeComparison !== 0) return typeComparison;
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.name.localeCompare(b.name, 'vi');
    });
  };

  // Load data on mount
  useEffect(() => {
    loadGradeBook();
    loadAttendanceSessions();
    loadAssignments();
  }, []);

  // Update available columns when gradeBook changes
  useEffect(() => {
    if (gradeBook) {
      const available = gradeBook.columns.filter(
        col => !selectedColumn || col.id !== selectedColumn.id
      );
      setAvailableColumns(sortColumns(available));
    }
  }, [gradeBook, selectedColumn]);

  // API Calls
  const loadGradeBook = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/grades/sections/${sectionId}/gradebook?includeUnpublished=true`
      );
      if (response.data.success) {
        setGradeBook(response.data.data);
      }
    } catch (err: any) {
      toast.error('Không thể tải bảng điểm');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceSessions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance/sections/${sectionId}/sessions`);
      if (response.data.success) {
        setAttendanceSessions(response.data.data);
      }
    } catch (err: any) {
      console.error('Không thể tải danh sách điểm danh:', err);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/assignments/sections/${sectionId}/assignments`
      );
      console.log('Assignments response:', response.data);
      console.log('Assignments response:', sectionId);
      if (response.data.success) {
        setAssignments(response.data.data);
      }
    } catch (err: any) {
      console.error('Không thể tải danh sách bài tập:', err);
    }
  };

  const handleCreateColumn = async () => {
    try {
      setLoading(true);

      // Validation
      if (columnForm.type === 'attendance' && selectedSessions.length === 0) {
        toast.error('Vui lòng chọn ít nhất một buổi điểm danh');
        setLoading(false);
        return;
      }

      if (columnForm.type === 'assignment' && selectedAssignments.length === 0) {
        toast.error('Vui lòng chọn ít nhất một bài tập');
        setLoading(false);
        return;
      }

      if ((columnForm.type === 'midterm' || columnForm.type === 'final' || columnForm.type === 'custom')
        && selectedColumns.length === 0) {
        toast.error('Vui lòng chọn ít nhất một cột điểm để tính toán');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/grades/columns`, {
        sectionId,
        ...columnForm,
      });

      if (response.data.success) {
        const newColumnId = response.data.data.id;
        console.log('Created column:', newColumnId);

        if (columnForm.type === 'attendance' && selectedSessions.length > 0) {
          console.log('Adding attendance sessions:', selectedSessions);
          await axios.post(`${API_BASE_URL}/grades/columns/${newColumnId}/attendance-sessions`, {
            sessionIds: selectedSessions,
            weight: itemWeight,
          });
        } else if (columnForm.type === 'assignment' && selectedAssignments.length > 0) {
          console.log('Adding assignments:', selectedAssignments);
          await axios.post(`${API_BASE_URL}/grades/columns/${newColumnId}/assignments`, {
            assignmentIds: selectedAssignments,
            weight: itemWeight,
          });
        } else if (
          (columnForm.type === 'midterm' || columnForm.type === 'final' || columnForm.type === 'custom') &&
          selectedColumns.length > 0
        ) {
          console.log('Adding linked columns:', selectedColumns);
          const linkResponse = await axios.post(`${API_BASE_URL}/grades/columns/${newColumnId}/linked-columns`, {
            childColumnIds: selectedColumns,
            weight: itemWeight,
          });
          console.log('Link response:', linkResponse.data);
        }

        console.log('Calculating grades for column:', newColumnId);
        const calculateResponse = await axios.post(`${API_BASE_URL}/grades/columns/${newColumnId}/calculate`);
        console.log('Calculate response:', calculateResponse.data);

        toast.success('Tạo cột điểm thành công');
        setOpenColumnDialog(false);
        resetColumnForm();

        setTimeout(() => {
          loadGradeBook();
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error creating column:', err);
      toast.error(err.response?.data?.message || 'Không thể tạo cột điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateColumn = async () => {
    if (!selectedColumn) return;
    try {
      setLoading(true);

      const response = await axios.put(
        `${API_BASE_URL}/grades/columns/${selectedColumn.id}`,
        columnForm
      );

      if (response.data.success) {
        if (columnForm.type === 'attendance') {
          const sessionsToRemove = originalSessions.filter(
            id => !selectedSessions.includes(id)
          );
          const sessionsToAdd = selectedSessions.filter(
            id => !originalSessions.includes(id)
          );

          for (const sessionId of sessionsToRemove) {
            await axios.delete(
              `${API_BASE_URL}/grades/columns/${selectedColumn.id}/attendance-sessions/${sessionId}`
            );
          }

          if (sessionsToAdd.length > 0) {
            await axios.post(
              `${API_BASE_URL}/grades/columns/${selectedColumn.id}/attendance-sessions`,
              { sessionIds: sessionsToAdd, weight: itemWeight }
            );
          }
        }
        else if (columnForm.type === 'assignment') {
          const assignmentsToRemove = originalAssignments.filter(
            id => !selectedAssignments.includes(id)
          );
          const assignmentsToAdd = selectedAssignments.filter(
            id => !originalAssignments.includes(id)
          );

          for (const assignmentId of assignmentsToRemove) {
            await axios.delete(
              `${API_BASE_URL}/grades/columns/${selectedColumn.id}/assignments/${assignmentId}`
            );
          }

          if (assignmentsToAdd.length > 0) {
            await axios.post(
              `${API_BASE_URL}/grades/columns/${selectedColumn.id}/assignments`,
              { assignmentIds: assignmentsToAdd, weight: itemWeight }
            );
          }
        }
        else if (columnForm.type === 'midterm' || columnForm.type === 'final' || columnForm.type === 'custom') {
          const columnsToRemove = originalColumns.filter(
            id => !selectedColumns.includes(id)
          );
          const columnsToAdd = selectedColumns.filter(
            id => !originalColumns.includes(id)
          );

          for (const columnId of columnsToRemove) {
            await axios.delete(
              `${API_BASE_URL}/grades/columns/${selectedColumn.id}/linked-columns/${columnId}`
            );
          }

          if (columnsToAdd.length > 0) {
            await axios.post(
              `${API_BASE_URL}/grades/columns/${selectedColumn.id}/linked-columns`,
              { childColumnIds: columnsToAdd, weight: itemWeight }
            );
          }
        }

        await axios.post(`${API_BASE_URL}/grades/columns/${selectedColumn.id}/calculate`);

        toast.success('Cập nhật cột điểm thành công');
        setOpenColumnDialog(false);
        resetColumnForm();
        loadGradeBook();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật cột điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteColumn = async (columnId: number) => {

    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/grades/columns/${columnId}`);
      toast.success('Xóa cột điểm thành công');
      loadGradeBook();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa cột điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (column: GradeColumn) => {
    try {
      setLoading(true);
      await axios.patch(`${API_BASE_URL}/grades/columns/${column.id}/publish`, {
        isPublished: !column.isPublished,
      });
      toast.success(`${column.isPublished ? 'Ẩn' : 'Công bố'} điểm thành công`);
      loadGradeBook();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể thay đổi trạng thái công bố');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateGrades = async (columnId: number) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/grades/columns/${columnId}/calculate`);
      if (response.data.success) {
        toast.success('Tính điểm thành công');
        loadGradeBook();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tính điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleExportGrades = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/grades/sections/${sectionId}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `grades-section-${sectionId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Xuất điểm thành công');
    } catch (err: any) {
      toast.error('Không thể xuất điểm');
    }
  };

  const resetColumnForm = () => {
    setColumnForm({
      name: '',
      type: 'attendance',
      description: '',
      maxScore: 10,
      weight: 0,
      calculationMethod: 'average',
      bestNCount: null,
      dropLowest: 0,
      isPublished: false,
      displayOrder: 0,
    });
    form.resetFields();
    setSelectedColumn(null);
    setSelectedSessions([]);
    setSelectedAssignments([]);
    setSelectedColumns([]);
    setOriginalSessions([]);
    setOriginalAssignments([]);
    setOriginalColumns([]);
    setItemWeight(1);
  };

  const openEditDialog = async (column: GradeColumn) => {
    setSelectedColumn(column);
    const formValues = {
      name: column.name,
      type: column.type,
      description: '',
      maxScore: column.maxScore,
      weight: column.weight || 0,
      calculationMethod: column.calculationMethod,
      bestNCount: null,
      dropLowest: 0,
      isPublished: column.isPublished,
      displayOrder: column.displayOrder,
    };
    setColumnForm(formValues);
    form.setFieldsValue(formValues);

    try {
      if (column.type === 'attendance') {
        const response = await axios.get(
          `${API_BASE_URL}/grades/columns/${column.id}/attendance-sessions`
        );
        if (response.data.success) {
          const sessionIds = response.data.data.map((item: any) => item.sessionId);
          setSelectedSessions(sessionIds);
          setOriginalSessions(sessionIds);
        }
      } else if (column.type === 'assignment') {
        const response = await axios.get(
          `${API_BASE_URL}/grades/columns/${column.id}/assignments`
        );
        if (response.data.success) {
          const assignmentIds = response.data.data.map((item: any) => item.assignmentId);
          setSelectedAssignments(assignmentIds);
          setOriginalAssignments(assignmentIds);
        }
      } else if (column.type === 'midterm' || column.type === 'final' || column.type === 'custom') {
        const response = await axios.get(
          `${API_BASE_URL}/grades/columns/${column.id}/linked-columns`
        );
        if (response.data.success) {
          const columnIds = response.data.data.map((item: any) => item.childColumnId);
          setSelectedColumns(columnIds);
          setOriginalColumns(columnIds);
        }
      }
    } catch (err) {
      console.error('Không thể load nguồn điểm:', err);
    }

    setOpenColumnDialog(true);
  };

  const getColumnTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      attendance: 'blue',
      assignment: 'purple',
      midterm: 'orange',
      final: 'red',
      project: 'cyan',
      participation: 'green',
      custom: 'default',
    };
    return colors[type] || 'default';
  };

  const getColumnTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      attendance: 'Điểm danh',
      assignment: 'Bài tập',
      midterm: 'Giữa kì',
      final: 'Cuối kì',
      project: 'Dự án',
      participation: 'Tham gia',
      custom: 'Tùy chỉnh',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleSession = (sessionId: number) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleToggleAssignment = (assignmentId: number) => {
    setSelectedAssignments((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const handleToggleColumn = (columnId: number) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const getSelectionChanges = () => {
    if (columnForm.type === 'attendance') {
      const added = selectedSessions.filter(id => !originalSessions.includes(id));
      const removed = originalSessions.filter(id => !selectedSessions.includes(id));
      return { added, removed, hasChanges: added.length > 0 || removed.length > 0 };
    } else if (columnForm.type === 'assignment') {
      const added = selectedAssignments.filter(id => !originalAssignments.includes(id));
      const removed = originalAssignments.filter(id => !selectedAssignments.includes(id));
      return { added, removed, hasChanges: added.length > 0 || removed.length > 0 };
    } else if (columnForm.type === 'midterm' || columnForm.type === 'final' || columnForm.type === 'custom') {
      const added = selectedColumns.filter(id => !originalColumns.includes(id));
      const removed = originalColumns.filter(id => !selectedColumns.includes(id));
      return { added, removed, hasChanges: added.length > 0 || removed.length > 0 };
    }
    return { added: [], removed: [], hasChanges: false };
  };

  const shouldShowSourceSelection = () => {
    return ['attendance', 'assignment', 'midterm', 'final', 'custom'].includes(columnForm.type);
  };

  const getColumnMenuItems = (column: GradeColumn): MenuProps['items'] => [
    {
      key: 'publish',
      label: column.isPublished ? 'Ẩn điểm' : 'Công bố điểm',
      icon: column.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />,
      onClick: () => handleTogglePublish(column),
    },
    {
      key: 'edit',
      label: 'Chỉnh sửa',
      icon: <EditOutlined />,
      onClick: () => openEditDialog(column),
    },
    {
      key: 'calculate',
      label: 'Tính điểm lại',
      icon: <CalculatorOutlined />,
      onClick: () => handleCalculateGrades(column.id),
    },
    { type: 'divider' },
    {
      key: 'delete',
      label: 'Xóa cột',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDeleteColumn(column.id),
    },
  ];

  // Table columns configuration
  const getTableColumns = (): TableColumnsType<Student> => {
    const fixedColumns: TableColumnsType<Student> = [
      {
        title: "STT",
        key: "stt",
        fixed: "left",
        align: "center",
        responsive: ["sm"], // chỉ hiện từ sm trở lên
        render: (_: any, __: Student, index: number) => index + 1,
      },
      {
        title: "Mã SV",
        dataIndex: "studentCode",
        key: "studentCode",
        fixed: "left",
        ellipsis: true,
        responsive: ["xs", "sm", "md"], // hiện cả mobile
        render: (text: string) => (
          <Tooltip title={text}>
            <Text strong>{text}</Text>
          </Tooltip>
        ),
      },
      {
        title: "Họ và tên",
        dataIndex: "fullName",
        key: "fullName",
        fixed: "left",
        ellipsis: true,
        responsive: ["xs", "sm", "md"], // luôn hiện
        render: (text: string) => (
          <Tooltip title={text}>
            <Text strong>{text}</Text>
          </Tooltip>
        ),
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        ellipsis: true,
        responsive: ["md"], // ẩn trên mobile nhỏ
        render: (text: string) => (
          <Tooltip title={text}>
            <Text type="secondary">{text}</Text>
          </Tooltip>
        ),
      },
    ];


    const gradeColumns: TableColumnsType<Student> = sortColumns(
      gradeBook?.columns || []
    ).map((col) => ({
      title: (
        <div style={{ textAlign: "center" }}>
          <Space direction="vertical" size={0}>
            <Space>
              <Text strong>{col.name}</Text>
              <Dropdown
                menu={{ items: getColumnMenuItems(col) }}
                trigger={["click"]}
              >
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            </Space>
          </Space>
        </div>
      ),
      key: `grade-${col.id}`,
      align: "center" as const,
      ellipsis: true,
      render: (_: any, student: Student) => {
        const grade = student.columns[col.name];
        return grade && grade.score !== null && grade.score !== undefined ? (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Text
              strong={grade.isOverridden}
              style={{
                color: grade.isOverridden
                  ? "#fa8c16"
                  : grade.percentage && grade.percentage >= 50
                    ? "#52c41a"
                    : "#f5222d",
              }}
            >
              {grade.score.toFixed(1)}/{grade.maxScore}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({grade.percentage?.toFixed(1)}%)
            </Text>
            {col.weight && col.weight > 0 && (
              <Tag color="blue" style={{ fontSize: 10 }}>
                Trọng số: {col.weight}%
              </Tag>
            )}
            {grade.isOverridden && (
              <Tag color="warning" style={{ fontSize: 10 }}>
                Ghi đè
              </Tag>
            )}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    }));

    return [...fixedColumns, ...gradeColumns];
  };

  if (loading && !gradeBook) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  // Thêm đoạn code này sau các useEffect, trước phần return

  // Calculate statistics
  const getStatistics = () => {
    if (!gradeBook) {
      return {
        totalStudents: 0,
        totalColumns: 0,
        publishedColumns: 0,
        averageScore: 0,
        completionRate: 0,
      };
    }

    const totalStudents = gradeBook.students.length;
    const totalColumns = gradeBook.columns.length;
    const publishedColumns = gradeBook.columns.filter(col => col.isPublished).length;

    // Tính điểm trung bình của tất cả sinh viên trên tất cả các cột
    let totalScores = 0;
    let totalGrades = 0;

    gradeBook.students.forEach(student => {
      Object.values(student.columns).forEach(grade => {
        if (grade.score !== null && grade.score !== undefined) {
          totalScores += grade.percentage || 0;
          totalGrades++;
        }
      });
    });

    const averageScore = totalGrades > 0 ? totalScores / totalGrades : 0;

    // Tính tỷ lệ hoàn thành (có bao nhiêu % ô điểm đã được điền)
    const totalCells = totalStudents * totalColumns;
    const filledCells = totalGrades;
    const completionRate = totalCells > 0 ? (filledCells / totalCells) * 100 : 0;

    return {
      totalStudents,
      totalColumns,
      publishedColumns,
      averageScore,
      completionRate,
    };
  };

  const stats = getStatistics();

  return (
    <div
      style={{
        paddingLeft: 16,
        paddingRight: 16,
        overflow: "hidden",    
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        gap: 16,
      }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#000",
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: "6px 10px",
              background: "#fff",
            }}
          >
            <BarChartOutlined style={{ fontSize: 14, color: "#52c41a" }} />
            <span>Cột điểm:</span>
            <strong>{stats.totalColumns}</strong>
            <span style={{ fontSize: 11, color: "#888" }}>
              ({stats.publishedColumns} công bố)
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#000",
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: "6px 10px",
              background: "#fff",
            }}
          >
            <LineChartOutlined
              style={{
                fontSize: 14,
                color: stats.averageScore >= 50 ? "#52c41a" : "#ff4d4f",
              }}
            />
            <span>Điểm TB:</span>
            <strong
              style={{
                color: stats.averageScore >= 50 ? "#52c41a" : "#ff4d4f",
              }}
            >
              {stats.averageScore.toFixed(1)}%
            </strong>
          </div>
        </div>

        <Space>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo mã SV, tên, email..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={loadGradeBook}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={handleExportGrades}
            style={{ borderColor: '#52c41a', color: '#52c41a' }}
          >
            Xuất CSV
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetColumnForm();
              setOpenColumnDialog(true);
            }}
          >
            Thêm cột điểm
          </Button>
        </Space>
      </div>

      {/* Grade Table */}
      {gradeBook && (() => {
        const filteredStudents = gradeBook.students.filter((student) => {
          if (!keyword) return true;
          const searchText = keyword.toLowerCase();
          return (
            student.studentCode?.toLowerCase().includes(searchText) ||
            student.fullName?.toLowerCase().includes(searchText) ||
            student.email?.toLowerCase().includes(searchText)
          );
        });

        return (
          <Table<Student>
            dataSource={filteredStudents}
            columns={getTableColumns()}
            rowKey="studentId"
            bordered
            scroll={{
              y: 'calc(100vh - 330px)',
              x: screens.lg ? undefined : "max-content", // 👈 máy tính bỏ scroll.x
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} sinh viên`,
            }}
          />
        );
      })()}

      <Modal
        title={
          <Space>
            <BarChartOutlined />
            <span>{selectedColumn ? 'Chỉnh sửa cột điểm' : 'Tạo cột điểm mới'}</span>
          </Space>
        }
        open={openColumnDialog}
        onCancel={() => {
          setOpenColumnDialog(false);
          resetColumnForm();
        }}
        width={shouldShowSourceSelection() ? 1000 : 600}
        centered
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}
        footer={[
          <Button key="cancel" onClick={() => {
            setOpenColumnDialog(false);
            resetColumnForm();
          }}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={selectedColumn ? handleUpdateColumn : handleCreateColumn}
            disabled={!columnForm.name}
          >
            {loading ? 'Đang xử lý...' : (selectedColumn ? 'Cập nhật & Tính lại' : 'Tạo mới')}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={24}>
            {/* Left Column - Basic Info */}
            <Col xs={24} md={shouldShowSourceSelection() ? 10 : 24}>
              <Title level={5} style={{ color: '#1890ff', marginBottom: 16 }}>
                Thông tin cơ bản
              </Title>

              <Form.Item
                label="Tên cột điểm"
                required
                tooltip="VD: Điểm danh, Bài tập, Giữa kì..."
              >
                <Input
                  value={columnForm.name}
                  onChange={(e) => setColumnForm({ ...columnForm, name: e.target.value })}
                  placeholder="Nhập tên cột điểm"
                />
              </Form.Item>

              <Form.Item label="Loại cột điểm" required>
                <Select
                  value={columnForm.type}
                  onChange={(value) => {
                    setColumnForm({ ...columnForm, type: value });
                    setSelectedSessions([]);
                    setSelectedAssignments([]);
                    setSelectedColumns([]);
                  }}
                  disabled={!!selectedColumn}
                >
                  <Option value="attendance">Điểm danh</Option>
                  <Option value="assignment">Bài tập</Option>
                  <Option value="midterm">Giữa kì</Option>
                  <Option value="final">Cuối kì</Option>
                  <Option value="project">Dự án</Option>
                  <Option value="participation">Tham gia</Option>
                  <Option value="custom">Tùy chỉnh</Option>
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Điểm tối đa">
                    <InputNumber
                      value={columnForm.maxScore}
                      onChange={(value) => setColumnForm({ ...columnForm, maxScore: value || 0 })}
                      min={0}
                      step={0.1}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Trọng số (%)" tooltip="Tỷ trọng trong điểm tổng kết">
                    <InputNumber
                      value={columnForm.weight}
                      onChange={(value) => setColumnForm({ ...columnForm, weight: value || 0 })}
                      min={0}
                      max={100}
                      step={0.1}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            {/* Right Column - Source Selection */}
            {shouldShowSourceSelection() && (
              <Col xs={24} md={14}>
                <Title level={5} style={{ color: '#1890ff', marginBottom: 16 }}>
                  {columnForm.type === 'attendance' && 'Chọn buổi điểm danh'}
                  {columnForm.type === 'assignment' && 'Chọn bài tập'}
                  {(columnForm.type === 'midterm' || columnForm.type === 'final' || columnForm.type === 'custom') && 'Chọn các cột điểm'}
                </Title>

                {/* Attendance Sessions Selection */}
                {columnForm.type === 'attendance' && (
                  <div >
                    <Alert
                      message={
                        <span>
                          Chọn các buổi điểm danh để tính vào cột điểm này.
                          <br />
                          Đã chọn: <Text strong>{selectedSessions.length}/{attendanceSessions.length}</Text>
                          {selectedColumn && getSelectionChanges().hasChanges && (
                            <div style={{ marginTop: 8, color: '#fa8c16', fontSize: 12 }}>
                              ⚠️ Có thay đổi: +{getSelectionChanges().added.length} thêm,
                              -{getSelectionChanges().removed.length} xóa
                            </div>
                          )}
                        </span>
                      }
                      type="info"
                      icon={<BarChartOutlined />}
                      style={{ marginBottom: 16 }}
                    />

                    {attendanceSessions.length === 0 ? (
                      <Alert message="Chưa có buổi điểm danh nào trong lớp học này" type="warning" />
                    ) : (
                      <Card
                        bordered
                        size="small"
                        style={{ maxHeight: 250, overflow: 'auto' }}
                        bodyStyle={{ padding: 0 }}
                      >
                        <List
                          dataSource={attendanceSessions}
                          renderItem={(session) => (
                            <List.Item
                              style={{ padding: '12px 16px', cursor: 'pointer' }}
                              onClick={() => handleToggleSession(session.id)}
                            >
                              <Checkbox
                                checked={selectedSessions.includes(session.id)}
                                onChange={() => handleToggleSession(session.id)}
                              />
                              <List.Item.Meta
                                title={
                                  <Space>
                                    <Text strong>{session.name || `Buổi ${session.sessionCode}`}</Text>
                                    {selectedSessions.includes(session.id) && (
                                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    )}
                                  </Space>
                                }
                                description={
                                  <Space direction="vertical" size={4}>
                                    <Text type="secondary">
                                      Mã: {session.sessionCode} • {formatDate(session.createdAt)}
                                    </Text>
                                    <Tag color="blue" style={{ width: 'fit-content' }}>
                                      {session.attendances.length} sinh viên đã điểm danh
                                    </Tag>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}
                  </div>
                )}

                {/* Assignments Selection */}
                {columnForm.type === 'assignment' && (
                  <div>
                    <Alert
                      message={
                        <span>
                          Chọn các bài tập để tính vào cột điểm này.
                          <br />
                          Đã chọn: <Text strong>{selectedAssignments.length}/{assignments.length}</Text>
                          {selectedColumn && getSelectionChanges().hasChanges && (
                            <div style={{ marginTop: 8, color: '#fa8c16', fontSize: 12 }}>
                              ⚠️ Có thay đổi: +{getSelectionChanges().added.length} thêm,
                              -{getSelectionChanges().removed.length} xóa
                            </div>
                          )}
                        </span>
                      }
                      type="info"
                      icon={<BarChartOutlined />}
                      style={{ marginBottom: 16 }}
                    />

                    {assignments.length === 0 ? (
                      <Alert message="Chưa có bài tập nào trong lớp học này" type="warning" />
                    ) : (
                      <Card
                        bordered
                        size="small"
                        style={{ maxHeight: 250, overflow: 'auto' }}
                        bodyStyle={{ padding: 0 }}
                      >
                        <List
                          dataSource={assignments}
                          renderItem={(assignment) => (
                            <List.Item
                              style={{ padding: '12px 16px', cursor: 'pointer' }}
                              onClick={() => handleToggleAssignment(assignment.id)}
                            >
                              <Checkbox
                                checked={selectedAssignments.includes(assignment.id)}
                                onChange={() => handleToggleAssignment(assignment.id)}
                              />
                              <List.Item.Meta
                                title={
                                  <Space>
                                    <Text strong>{assignment.title}</Text>
                                    {selectedAssignments.includes(assignment.id) && (
                                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    )}
                                  </Space>
                                }
                                description={
                                  <Space direction="vertical" size={4}>
                                    <Text type="secondary">
                                      Điểm tối đa: {assignment.maxScore} • Hạn: {formatDate(assignment.dueDate)}
                                    </Text>
                                    <Tag color="purple" style={{ width: 'fit-content' }}>
                                      {assignment.submissions.length} bài nộp
                                    </Tag>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}
                  </div>
                )}

                {/* Grade Columns Selection */}
                {(columnForm.type === 'midterm' || columnForm.type === 'final' || columnForm.type === 'custom') && (
                  <div>
                    <Alert
                      message={
                        <span>
                          Chọn các cột điểm để tính vào cột này.
                          <br />
                          Đã chọn: <Text strong>{selectedColumns.length}/{availableColumns.length}</Text>
                          {selectedColumn && getSelectionChanges().hasChanges && (
                            <div style={{ marginTop: 8, color: '#fa8c16', fontSize: 12 }}>
                              ⚠️ Có thay đổi: +{getSelectionChanges().added.length} thêm,
                              -{getSelectionChanges().removed.length} xóa
                            </div>
                          )}
                        </span>
                      }
                      type="info"
                      icon={<BarChartOutlined />}
                      style={{ marginBottom: 16 }}
                    />

                    {availableColumns.length === 0 ? (
                      <Alert message="Chưa có cột điểm nào khác trong lớp học này" type="warning" />
                    ) : (
                      <Card
                        bordered
                        size="small"
                        style={{ maxHeight: 400, overflow: 'auto' }}
                        bodyStyle={{ padding: 0 }}
                      >
                        <List
                          dataSource={availableColumns}
                          renderItem={(col) => (
                            <List.Item
                              style={{ padding: '12px 16px', cursor: 'pointer' }}
                              onClick={() => handleToggleColumn(col.id)}
                            >
                              <Checkbox
                                checked={selectedColumns.includes(col.id)}
                                onChange={() => handleToggleColumn(col.id)}
                              />
                              <List.Item.Meta
                                title={
                                  <Space>
                                    <Text strong>{col.name}</Text>
                                    <Tag color={getColumnTypeColor(col.type)}>
                                      {getColumnTypeLabel(col.type)}
                                    </Tag>
                                    {selectedColumns.includes(col.id) && (
                                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    )}
                                  </Space>
                                }
                                description={
                                  <Space direction="vertical" size={4}>
                                    <Text type="secondary">
                                      Điểm tối đa: {col.maxScore}
                                      {col.weight && ` • Trọng số: ${col.weight}%`}
                                    </Text>
                                    <Tag color="cyan" style={{ width: 'fit-content' }}>
                                      {col.studentGrades?.length || 0} sinh viên có điểm
                                    </Tag>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}
                  </div>
                )}
              </Col>
            )}
          </Row>
        </Form>
      </Modal>
    </div>
  );
}