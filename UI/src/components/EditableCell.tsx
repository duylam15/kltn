import React, { useState, useEffect } from 'react';
import {
  Button,
  Tag,
  Input,
  Select,
  InputNumber,
  Space,
  Typography,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  InfoCircleOutlined,
  CheckOutlined,      // ✅ THÊM
  CloseOutlined,      // ✅ THÊM
} from '@ant-design/icons';
import toast from 'react-hot-toast';
import { Pen } from 'lucide-react';
const {  Text } = Typography;

// ============================================================
// TYPES
// ============================================================

interface AttendanceSession {
  id: number;
  name: string | null;
  sessionCode: string;
  sessionScore: number | null;
  createdAt: string;
}

interface Assignment {
  id: number;
  title: string;
  type: string;
  maxScore: number;
  dueDate: string | null;
}

interface GradeColumn {
  id: number;
  sectionId: number;
  name: string;
  type: 'attendance_final' | 'project' | 'process';
  method: 'manual' | 'auto_sum' | 'auto_average' | 'weighted_average';
  maxScore: number;
  weight: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  attendanceSessions?: Array<{
    id: number;
    attendanceSessionId: number;
    weight: number;
    maxScore: number | null;
    attendanceSession: AttendanceSession;
  }>;
  assignments?: Array<{
    id: number;
    assignmentId: number;
    weight: number;
    maxScore: number | null;
    assignment: Assignment;
  }>;
  dependentColumns?: Array<{
    sourceColumnId: number;
    weight: number;
    sourceColumn: {
      id: number;
      name: string;
      type: string;
    };
  }>;
}

interface StudentGrade {
  id: number;
  studentId: number;
  gradeColumnId: number;
  score: number | null;
  maxScore: number;
  isAutoCalculated: boolean;
  calculatedAt: string | null;
  isOverridden: boolean;
  overriddenScore: number | null;
  note: string | null;
  gradeColumn: {
    id: number;
    name: string;
    type: string;
    weight: number;
  };
  student?: {
    id: number;
    userId: number;
    studentCode: string;
    user: {
      fullName: string;
      email: string | null;
    };
  };
}

interface Student {
  id: number;
  userId: number;
  studentCode: string;
  user: {
    fullName: string;
    email: string | null;
  };
  studentGrades: StudentGrade[];
}


export const EditableCell = ({
  student,
  column,
  grade,
  onSave,
  globalLoading,
  onPreviewCalculation,
}: {
  student: Student;
  column: GradeColumn;
  grade?: StudentGrade;
  onSave: (studentId: number, columnId: number, score: number, note?: string) => Promise<void>;
  globalLoading: boolean;
  onPreviewCalculation: (studentId: number, columnId: number) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(grade?.score?.toString() || '');
  const [note, setNote] = useState(grade?.note || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(grade?.score?.toString() || '');
    setNote(grade?.note || '');
  }, [grade?.score, grade?.note]);

  const handleSave = async () => {
    const numValue = parseFloat(value);
    if (value && (isNaN(numValue) || numValue < 0 || numValue > column.maxScore)) {
      toast.error(`Điểm phải từ 0 đến ${column.maxScore}`);
      return;
    }
    if (!value) {
      toast.error('Vui lòng nhập điểm');
      return;
    }
    setSaving(true);
    try {
      await onSave(student.id, column.id, numValue, note);
      setEditing(false);
    } catch (error) {
      toast.error('Lỗi khi lưu điểm');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(grade?.score?.toString() || '');
    setNote(grade?.note || '');
    setEditing(false);
  };

  // 1. KHI ĐANG EDIT (Input)
  if (editing) {
    return (
      <div style={{ padding: '4px' }} onClick={(e) => e.stopPropagation()}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <InputNumber
            value={value}
            onChange={(val) => setValue(val?.toString() || '')}
            min="0"
            max={column.maxScore.toString()}
            step={0.5}
            size="small"
            style={{ width: '100%' }}
            placeholder={`0-${column.maxScore}`}
            autoFocus
            onPressEnter={handleSave}
            disabled={saving || globalLoading}
          />
          <Space size={4} style={{ width: '100%', justifyContent: 'center' }}>
            <Button type="primary" size="small" onClick={handleSave} loading={saving} icon={<CheckOutlined />} disabled={globalLoading}>Lưu</Button>
            <Button size="small" onClick={handleCancel} disabled={saving || globalLoading} icon={<CloseOutlined />}>Hủy</Button>
          </Space>
        </Space>
      </div>
    );
  }

  // 2. KHI CHƯA CÓ ĐIỂM VÀ LÀ NHẬP TAY (Manual) -> ✅ Thêm Pen icon
  if ((!grade || grade.score === null) && column.method === 'manual') {
    return (
      <div
        onClick={() => setEditing(true)}
        style={{
          cursor: 'pointer',
          padding: '8px',
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed #d9d9d9',
          borderRadius: 4,
          transition: 'all 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#1890ff';
          e.currentTarget.style.background = '#f0f5ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#d9d9d9';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* ✅ Thay đổi icon tại đây */}
          <Pen size={12} /> Nhấp để nhập
        </Text>
      </div>
    );
  }

  // 3. KHI KHÔNG CÓ ĐIỂM (Auto)
  if (!grade || grade.score === null) {
    return (
      <div style={{ padding: '8px', textAlign: 'center' }}>
        <Text type="secondary">-</Text>
      </div>
    );
  }

  // 4. KHI ĐÃ CÓ ĐIỂM -> ✅ Thêm Pen icon vào hiển thị và Tooltip
  const displayScore = grade.isOverridden && grade.overriddenScore !== null
    ? grade.overriddenScore
    : grade.score;
  const percentage = (displayScore / grade.maxScore) * 100;

  return (
    <div
      onClick={() => column.method === 'manual' && setEditing(true)}
      style={{
        cursor: column.method === 'manual' ? 'pointer' : 'default',
        padding: '4px',
      }}
    >
      <Tooltip
        title={
          <div>
            {/* ✅ Thêm icon vào trong Tooltip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Điểm: {displayScore.toFixed(2)}/{grade.maxScore}</span>
              {column.method === 'manual' && <Pen size={14} color="#faad14" />}
            </div>

            <div>Phần trăm: {percentage.toFixed(1)}%</div>
            {grade.isOverridden && <div>⚠️ Điểm đã sửa</div>}
            {grade.note && <div>Ghi chú: {grade.note}</div>}
            {column.method === 'manual' && <div style={{ marginTop: 4, fontSize: 11 }}>💡 Nhấp để chỉnh sửa</div>}

            {grade.isAutoCalculated && (
              <div style={{ marginTop: 8 }}>
                <Button
                  size="small"
                  type="link"
                  icon={<InfoCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewCalculation(student.id, column.id);
                  }}
                  style={{ padding: 0, height: 'auto', color: '#fff' }}
                >
                  Xem chi tiết tính điểm
                </Button>
              </div>
            )}
          </div>
        }
      >
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          {/* ✅ Thêm icon cạnh số điểm hiển thị để dễ nhận biết */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Text
              strong={grade.isOverridden || column.method === 'manual'}
              style={{
                color: grade.isOverridden
                  ? "#fa8c16"
                  : percentage >= 50
                    ? "#52c41a"
                    : "#f5222d",
              }}
            >
              {displayScore.toFixed(1)}
            </Text>
            {/* Chỉ hiện cây bút mờ nếu là nhập tay */}
            {column.method === 'manual' && (
              <Pen size={14} style={{ opacity: 0.6 }} />
            )}
          </div>
          {grade.isOverridden && (
            <Tag color="warning" style={{ fontSize: 10 }}>
              Đã sửa
            </Tag>
          )}
        </Space>
      </Tooltip>
    </div>
  );
};