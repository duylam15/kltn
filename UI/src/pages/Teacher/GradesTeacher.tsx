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
  List,
  Card,
  Row,
  Col,
  Tooltip,
  Grid,
  message,
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
  BarChartOutlined,
  ReloadOutlined,
  UserOutlined,
  LineChartOutlined,
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { MenuProps, TableColumnsType } from 'antd';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/authContext';
import instance from '../../utils/axiosInstance';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { EditableCell } from '../../components/EditableCell';
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;


// ============================================================
// TYPES
// ============================================================

interface AttendanceSession {
  id: number;
  name: string | null;
  sessionCode: string;
  sessionScore: number | null;
  createdAt: string;
  sectionId: number; // ✅ THÊM field này
}

interface Assignment {
  id: number;
  title: string;
  type: string;
  maxScore: number;
  dueDate: string | null;
  sectionLinks?: Array<{ // ✅ THÊM field này
    sectionId: number;
  }>;
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
  student: {
    group:any
  };
  user: {
    fullName: string;
    email: string | null;
  };
  studentGrades: StudentGrade[];
}

// ============================================================
// COMPONENT
// ============================================================

export default function GradesTeacher() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);

  // Data states
  const [gradeColumns, setGradeColumns] = useState<GradeColumn[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableColumns, setAvailableColumns] = useState<GradeColumn[]>([]);

  // Dialog states
  const [openColumnDialog, setOpenColumnDialog] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<GradeColumn | null>(null);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Form
  const [form] = Form.useForm();

  // Form states
  const [columnForm, setColumnForm] = useState({
    name: '',
    type: 'attendance_final' as GradeColumn['type'],
    method: 'auto_average' as GradeColumn['method'],
    maxScore: 10,
    weight: 0.1,
    displayOrder: 0,
  });

  const [selectedSessions, setSelectedSessions] = useState<Array<{ attendance_session_id: number; weight: number; max_score?: number }>>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<Array<{ assignment_id: number; weight: number; max_score?: number }>>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<Array<{ source_column_id: number; weight: number }>>([]);

  const [keyword, setKeyword] = useState("");
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();

  // ============================================================
  // ✅ LOAD DATA - ĐÃ SỬA ĐỂ LỌC THEO SECTION
  // ============================================================

  useEffect(() => {
    if (sectionId) {
      loadGradeColumns();
      loadStudentGrades();
      loadAttendanceSessions();
      loadAssignments();
    }
  }, [sectionId]);

  useEffect(() => {
    if (gradeColumns.length > 0) {
      const available = gradeColumns.filter(
        col => !selectedColumn || col.id !== selectedColumn.id
      );
      setAvailableColumns(available);
    }
  }, [gradeColumns, selectedColumn]);

  const loadGradeColumns = async () => {
    try {
      const response = await instance.get(
        `/grade-columns`,
        { params: { section_id: sectionId, limit: 100 } }
      );
      if (response.data.success) {
        setGradeColumns(response.data.data);
      }
    } catch (err: any) {
      console.error('Không thể tải cột điểm:', err);
    }
  };

  const loadStudentGrades = async () => {
    try {
      setLoading(true);
      const response = await instance.get(
        `/students-grades`,
        { params: { section_id: sectionId, limit: 1000 } }
      );
      if (response.data.success) {
        const gradesData = response.data.data;
        const studentMap = new Map<number, Student>();

        gradesData.forEach((grade: StudentGrade) => {
          const studentId = grade.studentId;
          if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
              id: grade.student.id,
              userId: grade.student.userId,
              studentCode: grade.student.studentCode,
              student: grade.student,
              user: grade.student.user,
              studentGrades: [],
            } as any);
          }
          studentMap.get(studentId)!.studentGrades.push(grade);
        });

        console.log("gradesDaxxxxxta"  , gradesData);

        setStudents(Array.from(studentMap.values()));
      }
    } catch (err: any) {
      toast.error('Không thể tải điểm sinh viên');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ SỬA: Chỉ load buổi điểm danh của section hiện tại
  const loadAttendanceSessions = async () => {
    try {
      const response = await instance.get(`/attendance/sections/${sectionId}/sessions`);
      if (response.data.success) {
        // ✅ Filter chỉ lấy sessions của section hiện tại
        const sessionsOfCurrentSection = response.data.data.filter(
          (session: AttendanceSession) => session.sectionId === sectionId
        );
        setAttendanceSessions(sessionsOfCurrentSection);

        console.log(`✅ Loaded ${sessionsOfCurrentSection.length} attendance sessions for section ${sectionId}`);
      }
    } catch (err: any) {
      console.error('Không thể tải danh sách điểm danh:', err);
      toast.error('Không thể tải danh sách điểm danh');
    }
  };

  // ✅ SỬA: Chỉ load assignments của section hiện tại
  const loadAssignments = async () => {
    try {
      const response = await instance.get(
        `/assignments`,
        {
          params: {
            section_id: sectionId, // ✅ Đã có param này rồi, backend cần xử lý đúng
            limit: 100
          }
        }
      );
      if (response.data.success) {
        // ✅ Double-check: Filter assignments thuộc section hiện tại
        const assignmentsOfCurrentSection = response.data.data.filter(
          (assignment: Assignment) => {
            // Kiểm tra xem assignment có link đến section hiện tại không
            if (assignment.sectionLinks && assignment.sectionLinks.length > 0) {
              return assignment.sectionLinks.some(link => link.sectionId === sectionId);
            }
            return false; // Nếu không có sectionLinks thì không lấy
          }
        );

        setAssignments(assignmentsOfCurrentSection);

        console.log(`✅ Loaded ${assignmentsOfCurrentSection.length} assignments for section ${sectionId}`);
      }
    } catch (err: any) {
      console.error('Không thể tải danh sách bài tập:', err);
      toast.error('Không thể tải danh sách bài tập');
    }
  };

  // ============================================================
  // CRUD OPERATIONS - GIỮ NGUYÊN
  // ============================================================

  const handleCreateColumn = async () => {
    try {
      await form.validateFields();
      setLoading(true);

      // Validation dựa trên type
      if (columnForm.type === 'attendance_final') {
        if (columnForm.method === 'auto_sum' && selectedSessions.length === 0) {
          toast.error('Vui lòng chọn ít nhất một buổi điểm danh');
          setLoading(false);
          return;
        }
        if (columnForm.method === 'auto_average' && selectedAssignments.length === 0) {
          toast.error('Vui lòng chọn ít nhất một bài tập');
          setLoading(false);
          return;
        }
        if (columnForm.method === 'weighted_average' && (selectedSessions.length === 0 || selectedAssignments.length === 0)) {
          toast.error('Vui lòng chọn ít nhất một buổi điểm danh VÀ một bài tập');
          setLoading(false);
          return;
        }
      }

      if (columnForm.type === 'project' && columnForm.method !== 'manual') {
        if (columnForm.method === 'auto_average' && selectedAssignments.length === 0) {
          toast.error('Vui lòng chọn ít nhất một bài tập đồ án');
          setLoading(false);
          return;
        }
      }

      if (columnForm.type === 'process' && selectedDependencies.length === 0) {
        toast.error('Vui lòng chọn các cột điểm (chuyên cần, đồ án)');
        setLoading(false);
        return;
      }

      // Tạo payload
      const payload: any = {
        section_id: sectionId,
        name: columnForm.name,
        type: columnForm.type,
        method: columnForm.method,
        max_score: columnForm.maxScore,
        weight: columnForm.weight,
        display_order: columnForm.displayOrder,
      };

      // Thêm nguồn điểm tùy theo type và method
      if (selectedSessions.length > 0) {
        payload.attendance_sessions = selectedSessions;
      }

      if (selectedAssignments.length > 0) {
        payload.assignments = selectedAssignments;
      }

      if (selectedDependencies.length > 0) {
        payload.dependencies = selectedDependencies;
      }

      // Gọi API tạo cột
      const response = await instance.post(
        `/grade-columns`,
        payload
      );

      if (response.data.success) {
        toast.success('Tạo cột điểm thành công');
        setOpenColumnDialog(false);
        resetColumnForm();
        await loadGradeColumns();

        // Tự động tính điểm cho cột mới
        if (columnForm.method !== 'manual') {
          await handleCalculateGrades(response.data.data.id);
        }

        await loadStudentGrades();
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
      await form.validateFields();
      setLoading(true);

      const payload: any = {
        name: columnForm.name,
        method: columnForm.method,
        max_score: columnForm.maxScore,
        weight: columnForm.weight,
        display_order: columnForm.displayOrder,
      };

      if (selectedSessions.length > 0) {
        payload.attendance_sessions = selectedSessions;
      }

      if (selectedAssignments.length > 0) {
        payload.assignments = selectedAssignments;
      }

      if (selectedDependencies.length > 0) {
        payload.dependencies = selectedDependencies;
      }

      const response = await instance.patch(
        `/grade-columns/${selectedColumn.id}`,
        payload
      );

      if (response.data.success) {
        toast.success('Cập nhật cột điểm thành công');
        setOpenColumnDialog(false);
        resetColumnForm();
        await loadGradeColumns();

        if (columnForm.method !== 'manual') {
          await handleCalculateGrades(selectedColumn.id);
        }

        await loadStudentGrades();
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
      await instance.delete(`/grade-columns/${columnId}`);
      toast.success('Xóa cột điểm thành công');
      await loadGradeColumns();
      await loadStudentGrades();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa cột điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateGrades = async (columnId: number) => {
    try {
      setLoading(true);
      const response = await instance.post(
        `/grade-calculation/calculate`,
        {
          grade_column_id: columnId,
          force_recalculate: true,
        }
      );

      if (response.data.success) {
        const result = response.data.data;
        toast.success(
          `Tính điểm thành công: ${result.successful}/${result.total} sinh viên`
        );
        await loadStudentGrades();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tính điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateAllGrades = async () => {
    try {
      setLoading(true);
      const response = await instance.post(
        `/grade-calculation/calculate-all`,
        {
          section_id: sectionId,
          force_recalculate: true,
        }
      );

      if (response.data.success) {
        const results = response.data.data;
        let totalSuccess = 0;
        let totalFailed = 0;

        Object.values(results).forEach((result: any) => {
          totalSuccess += result.successful || 0;
          totalFailed += result.failed || 0;
        });

        toast.success(
          `Tính điểm hoàn tất: ${totalSuccess} thành công, ${totalFailed} thất bại`
        );

        await loadStudentGrades();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tính điểm');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewCalculation = async (studentId: number, columnId: number) => {
    try {
      setLoading(true);
      const response = await instance.post(
        `/grade-calculation/preview`,
        {
          student_id: studentId,
          grade_column_id: columnId,
        }
      );

      if (response.data.success) {
        setPreviewData(response.data.data);
        setOpenPreviewDialog(true);
      }
    } catch (err: any) {
      toast.error('Không thể xem trước tính điểm');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ✅ UPDATE: EXCEL ĐỘNG - HỆ SỐ CỘT QT LẤY TỪ DB
  // ============================================================
  const handleExportGrades = async () => {
    try {
      setLoading(true);

      // 1. GỌI API LẤY THÔNG TIN LỚP HỌC PHẦN
      const sectionResponse = await instance.get(`/course-sections/${sectionId}`);

      if (!sectionResponse.data.success) {
        throw new Error("Không thể lấy thông tin lớp học phần");
      }

      const sectionData = sectionResponse.data.data;
      const subject = sectionData.subject;
      const term = sectionData.term;

      const mainInstructor = sectionData.instructors?.find((i: any) => i.role === 'owner') || sectionData.instructors?.[0];
      const teacherName = mainInstructor?.teacher?.user?.fullName || "";
      const teacherCode = mainInstructor?.teacher?.teacherCode || "";

      // 2. CẤU HÌNH THÔNG TIN TỪ API
      const SCHOOL_NAME = "TRƯỜNG ĐẠI HỌC SÀI GÒN";
      const SEMESTER = term?.name || "";
      const COURSE_ID = subject?.subjectCode || "";
      const COURSE_NAME = subject?.subjectName || "";
      const GROUP_ID = sectionData.sectionName || "";
      const CREDITS = subject?.credits?.toString() || "0";
      const LECTURER = teacherCode && teacherName ? `${teacherCode} - ${teacherName}` : (teacherName || "Chưa phân công");

      const FONT_FAMILY = 'Calibri';

      // 3. KHỞI TẠO WORKBOOK
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('BangDiem');
      sheet.properties.defaultRowHeight = 15;

      const thinBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // 4. XỬ LÝ LOGIC CỘT & HỆ SỐ
      // Tìm cột quá trình để lấy trọng số
      const processColumn = gradeColumns.find(col => col.type === 'process');
      const componentColumns = gradeColumns.filter(col => col.type !== 'process');

      // ✅ LẤY HỆ SỐ ĐỘNG (Mặc định 0.5 nếu chưa cấu hình)
      const processWeight = processColumn?.weight ?? 0.5;
      const processPercent = Math.round(processWeight * 100);

      const numberOfCompCols = componentColumns.length;
      const finalColIndex = 7 + numberOfCompCols;

      // 5. SETUP ĐỘ RỘNG CỘT
      const colWidths = [
        { idx: 1, width: 5 },  // STT
        { idx: 2, width: 10 }, // Mã MH
        { idx: 3, width: 14 }, // Mã SV
        { idx: 4, width: 22 }, // Họ lót
        { idx: 5, width: 10 }, // Tên
        { idx: 6, width: 10 }, // Mã Lớp
      ];

      colWidths.forEach(c => {
        sheet.getColumn(c.idx).width = c.width;
      });

      for (let i = 0; i < numberOfCompCols; i++) {
        sheet.getColumn(7 + i).width = 10;
      }

      sheet.getColumn(finalColIndex).width = 15;

      // 6. HEADER TĨNH (Rows 1-8)
      sheet.mergeCells('C1:D1');
      const cellUbnd = sheet.getCell('C1');
      cellUbnd.value = "UBND THÀNH PHỐ HỒ CHÍ MINH";
      cellUbnd.alignment = { horizontal: 'center' };
      cellUbnd.font = { name: FONT_FAMILY, size: 11 };

      sheet.mergeCells('F1:I1');
      const cellQuocHieu = sheet.getCell('G1');
      cellQuocHieu.value = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
      cellQuocHieu.alignment = { horizontal: 'center' };
      cellQuocHieu.font = { name: FONT_FAMILY, size: 11, bold: true };

      sheet.mergeCells('C2:D2');
      const cellTruong = sheet.getCell('C2');
      cellTruong.value = SCHOOL_NAME;
      cellTruong.alignment = { horizontal: 'center' };
      cellTruong.font = { name: FONT_FAMILY, size: 11, bold: true };

      sheet.mergeCells('F2:I2');
      const cellTieuNgu = sheet.getCell('G2');
      cellTieuNgu.value = "Độc lập - Tự do - Hạnh phúc";
      cellTieuNgu.alignment = { horizontal: 'center' };
      cellTieuNgu.font = { name: FONT_FAMILY, size: 11, bold: true, underline: true };

      sheet.mergeCells(`A4:${sheet.getColumn(finalColIndex).letter}4`);
      const titleCell = sheet.getCell('A4');
      titleCell.value = "BẢNG ĐIỂM QUÁ TRÌNH";
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.font = { name: FONT_FAMILY, size: 16, bold: true };

      sheet.mergeCells(`A5:${sheet.getColumn(finalColIndex).letter}5`);
      const semCell = sheet.getCell('A5');
      semCell.value = SEMESTER;
      semCell.alignment = { horizontal: 'center', vertical: 'middle' };
      semCell.font = { name: FONT_FAMILY, size: 13, bold: true };

      sheet.getCell('A7').value = `Học phần: ${COURSE_ID} - ${COURSE_NAME} - ${GROUP_ID}`;
      sheet.getCell('A7').font = { name: FONT_FAMILY, size: 11, bold: true };

      sheet.getCell('G7').value = `Số tín chỉ: ${CREDITS}`;
      sheet.getCell('G7').font = { name: FONT_FAMILY, size: 11 };

      sheet.getCell('A8').value = `Giảng viên: ${LECTURER}`;
      sheet.getCell('A8').font = { name: FONT_FAMILY, size: 11, bold: true };

      // ✅ G8: Hiển thị hệ số động
      sheet.getCell('G8').value = `Hệ số điểm QT: ${processWeight} (${processPercent}%)`;
      sheet.getCell('G8').font = { name: FONT_FAMILY, size: 11 };

      // 🛑 DÒNG 9 ĐỂ TRỐNG 🛑

      // 7. HEADER BẢNG (Bắt đầu từ Row 10)
      const headers = [
        { name: "STT", colIdx: 1 },
        { name: "Mã MH", colIdx: 2 },
        { name: "Mã SV", colIdx: 3 },
        { name: "Họ lót", colIdx: 4 },
        { name: "Tên", colIdx: 5 },
        { name: "Mã Lớp", colIdx: 6 },
      ];

      headers.forEach(h => {
        sheet.getCell(10, h.colIdx).value = h.name;
        sheet.mergeCells(10, h.colIdx, 12, h.colIdx);
      });

      if (numberOfCompCols > 0) {
        sheet.getCell(10, 7).value = "Các điểm bộ phận";
        sheet.mergeCells(10, 7, 10, 7 + numberOfCompCols - 1);
      }

      // ✅ Header Cột cuối: Hiển thị hệ số động
      sheet.getCell(10, finalColIndex).value = `Điểm quá trình (${processWeight})`;
      sheet.mergeCells(10, finalColIndex, 12, finalColIndex);

      componentColumns.forEach((col, index) => {
        const colIdx = 7 + index;
        sheet.getCell(11, colIdx).value = col.name;
        sheet.getCell(12, colIdx).value = col.weight;
      });

      sheet.getRow(10).height = 30;

      for (let r = 10; r <= 12; r++) {
        for (let c = 1; c <= finalColIndex; c++) {
          const cell = sheet.getCell(r, c);
          cell.border = thinBorder;
          cell.font = { name: FONT_FAMILY, size: 11, bold: true };
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true
          };
        }
      }

      // 8. ĐỔ DỮ LIỆU (Bắt đầu từ Row 13)
      students.forEach((student, index) => {
        const rowIndex = 13 + index;
        const fullName = student.user?.fullName || "";
        const nameParts = fullName.trim().split(" ");
        const firstName = nameParts.length > 0 ? nameParts.pop() : "";
        const lastName = nameParts.join(" ");

        const cellSTT = sheet.getCell(rowIndex, 1);
        cellSTT.value = index + 1;
        cellSTT.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };

        const cellMaMH = sheet.getCell(rowIndex, 2);
        cellMaMH.value = COURSE_ID;
        cellMaMH.alignment = { horizontal: 'center', vertical: 'middle' };

        const cellMaSV = sheet.getCell(rowIndex, 3);
        cellMaSV.value = Number(student.studentCode);
        cellMaSV.alignment = { horizontal: 'center', vertical: 'middle' };

        const cellHo = sheet.getCell(rowIndex, 4);
        cellHo.value = lastName;
        cellHo.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

        const cellTen = sheet.getCell(rowIndex, 5);
        cellTen.value = firstName;
        cellTen.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

        const cellLop = sheet.getCell(rowIndex, 6);
        cellLop.value = "DKP1242";
        cellLop.alignment = { horizontal: 'center', vertical: 'middle' };

        // Cột thành phần
        componentColumns.forEach((col, colIdx) => {
          const grade = student.studentGrades.find(g => g.gradeColumnId === col.id);
          let val = 0;
          if (grade && grade.score !== null) {
            val = grade.isOverridden && grade.overriddenScore !== null
              ? grade.overriddenScore
              : grade.score;
          }
          const cellGrade = sheet.getCell(rowIndex, 7 + colIdx);
          cellGrade.value = val;
          cellGrade.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
        });

        // Cột quá trình
        let processScore = 0;
        if (processColumn) {
          const grade = student.studentGrades.find(g => g.gradeColumnId === processColumn.id);
          if (grade && grade.score !== null) {
            processScore = grade.isOverridden && grade.overriddenScore !== null
              ? grade.overriddenScore
              : grade.score;
          }
        }
        const cellFinal = sheet.getCell(rowIndex, finalColIndex);
        cellFinal.value = processScore;
        cellFinal.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };

        // Style
        for (let c = 1; c <= finalColIndex; c++) {
          const cell = sheet.getCell(rowIndex, c);
          cell.border = thinBorder;
          cell.font = { name: FONT_FAMILY, size: 11 };
        }
      });

      // 9. XUẤT FILE
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `DQT_${COURSE_ID}_${GROUP_ID}_export.xlsx`);

      toast.success('Xuất file Excel thành công');
    } catch (err: any) {
      console.error("Lỗi xuất Excel:", err);
      toast.error('Không thể xuất file');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // HANDLER LƯU ĐIỂM - GIỮ NGUYÊN
  // ============================================================

  const handleSaveGrade = async (
    studentId: number,
    columnId: number,
    score: number,
    note?: string
  ) => {
    try {
      const response = await instance.patch(
        `/students-grades`,
        {
          student_id: studentId,
          grade_column_id: columnId,
          score,
          note,
        }
      );

      if (response.data.success) {
        const updatedGrade = response.data.data;

        setStudents(prevStudents => {
          const newStudents = prevStudents.map(student => {
            if (student.id !== studentId) return student;

            const gradeIndex = student.studentGrades.findIndex(
              g => g.gradeColumnId === columnId
            );

            if (gradeIndex >= 0) {
              const newGrades = [...student.studentGrades];
              newGrades[gradeIndex] = {
                ...newGrades[gradeIndex],
                score: updatedGrade?.score,
                maxScore: updatedGrade?.maxScore,
                note: updatedGrade?.note,
                isOverridden: updatedGrade?.isOverridden || false,
                overriddenScore: updatedGrade?.overriddenScore,
                isAutoCalculated: updatedGrade?.isAutoCalculated || false,
                calculatedAt: updatedGrade?.calculatedAt,
              };

              return {
                ...student,
                studentGrades: newGrades,
              };
            } else {
              return {
                ...student,
                studentGrades: [
                  ...student.studentGrades,
                  {
                    id: updatedGrade.id,
                    studentId: updatedGrade.studentId,
                    gradeColumnId: updatedGrade.gradeColumnId,
                    score: updatedGrade.score,
                    maxScore: updatedGrade.maxScore,
                    note: updatedGrade.note || null,
                    isOverridden: updatedGrade.isOverridden || false,
                    overriddenScore: updatedGrade.overriddenScore || null,
                    isAutoCalculated: updatedGrade.isAutoCalculated || false,
                    calculatedAt: updatedGrade.calculatedAt || null,
                    gradeColumn: updatedGrade.gradeColumn,
                  },
                ],
              };
            }
          });

          return newStudents;
        });

        await loadStudentGrades();
        toast.success('Cập nhật điểm thành công');
      }
    } catch (err: any) {
      console.error('Error saving grade:', err);
      toast.error(err.response?.data?.message || 'Không thể cập nhật điểm');
      throw err;
    }
  };

  console.log(students);

  // ============================================================
  // FORM HELPERS - GIỮ NGUYÊN (phần còn lại)
  // ============================================================

  const resetColumnForm = () => {
    setColumnForm({
      name: '',
      type: 'attendance_final',
      method: 'auto_average',
      maxScore: 10,
      weight: 0.1,
      displayOrder: 0,
    });
    form.resetFields();
    setSelectedColumn(null);
    setSelectedSessions([]);
    setSelectedAssignments([]);
    setSelectedDependencies([]);
  };

  const openEditDialog = async (column: GradeColumn) => {
    setSelectedColumn(column);

    const formValues = {
      name: column.name,
      type: column.type,
      method: column.method,
      maxScore: column.maxScore,
      weight: column.weight,
      displayOrder: column.displayOrder,
    };

    setColumnForm(formValues);
    form.setFieldsValue(formValues);

    try {
      const response = await instance.get(`/grade-columns/${column.id}`);
      if (response.data.success) {
        const columnDetail = response.data.data;

        if (columnDetail.attendanceSessions && columnDetail.attendanceSessions.length > 0) {
          setSelectedSessions(
            columnDetail.attendanceSessions.map((item: any) => ({
              attendance_session_id: item.attendanceSessionId,
              weight: item.weight,
              max_score: item.maxScore,
            }))
          );
        }

        if (columnDetail.assignments && columnDetail.assignments.length > 0) {
          setSelectedAssignments(
            columnDetail.assignments.map((item: any) => ({
              assignment_id: item.assignmentId,
              weight: item.weight,
              max_score: item.maxScore,
            }))
          );
        }

        if (columnDetail.dependentColumns && columnDetail.dependentColumns.length > 0) {
          setSelectedDependencies(
            columnDetail.dependentColumns.map((item: any) => ({
              source_column_id: item.sourceColumnId,
              weight: item.weight,
            }))
          );
        }
      }
    } catch (err) {
      console.error('Không thể load chi tiết cột điểm:', err);
    }

    setOpenColumnDialog(true);
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getColumnTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      attendance_final: 'cyan',
      project: 'orange',
      process: 'green',
    };
    return colors[type] || 'default';
  };

  const getColumnTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      attendance_final: 'Chuyên cần',
      project: 'Đồ án',
      process: 'Quá trình',
    };
    return labels[type] || type;
  };

  const getMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      manual: 'Nhập tay',
      auto_sum: 'Cộng tổng',
      auto_average: 'Trung bình',
      weighted_average: 'Trung bình có trọng số',
    };
    return labels[method] || method;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleToggleSession = (sessionId: number) => {
    setSelectedSessions((prev) => {
      const exists = prev.find(s => s.attendance_session_id === sessionId);
      if (exists) {
        return prev.filter(s => s.attendance_session_id !== sessionId);
      } else {
        const session = attendanceSessions.find(s => s.id === sessionId);
        return [
          ...prev,
          {
            attendance_session_id: sessionId,
            weight: 1,
            max_score: session?.sessionScore || undefined,
          },
        ];
      }
    });
  };

  const handleToggleAssignment = (assignmentId: number) => {
    setSelectedAssignments((prev) => {
      const exists = prev.find(a => a.assignment_id === assignmentId);
      if (exists) {
        return prev.filter(a => a.assignment_id !== assignmentId);
      } else {
        const assignment = assignments.find(a => a.id === assignmentId);
        return [
          ...prev,
          {
            assignment_id: assignmentId,
            weight: 1,
            max_score: assignment?.maxScore || undefined,
          },
        ];
      }
    });
  };

  const handleToggleDependency = (columnId: number) => {
    setSelectedDependencies((prev) => {
      const exists = prev.find(d => d.source_column_id === columnId);
      if (exists) {
        return prev.filter(d => d.source_column_id !== columnId);
      } else {
        let defaultWeight = 0.1;
        const column = availableColumns.find(c => c.id === columnId);
        if (column) {
          defaultWeight = column.weight || 0.1;
        }
        return [...prev, { source_column_id: columnId, weight: defaultWeight }];
      }
    });
  };

  const shouldShowSourceSelection = () => {
    if (columnForm.type === 'attendance_final') {
      return columnForm.method !== 'manual';
    }
    if (columnForm.type === 'project') {
      return columnForm.method === 'auto_average';
    }
    if (columnForm.type === 'process') {
      return true;
    }
    return false;
  };

  const getSourceSelectionTitle = () => {
    if (columnForm.type === 'attendance_final') {
      if (columnForm.method === 'auto_sum') return 'Chọn buổi điểm danh';
      if (columnForm.method === 'auto_average') return 'Chọn bài tập';
      if (columnForm.method === 'weighted_average') return 'Chọn nguồn điểm (Điểm danh + Bài tập)';
    }
    if (columnForm.type === 'project') {
      return 'Chọn bài tập đồ án';
    }
    if (columnForm.type === 'process') {
      return 'Chọn cột điểm (Chuyên cần + Đồ án)';
    }
    return 'Chọn nguồn điểm';
  };

  const getColumnMenuItems = (column: GradeColumn): MenuProps['items'] => [
    {
      key: 'calculate',
      label: 'Tính điểm lại',
      icon: <CalculatorOutlined />,
      onClick: () => handleCalculateGrades(column.id),
      disabled: column.method === 'manual',
    },
    {
      key: 'edit',
      label: 'Chỉnh sửa',
      icon: <EditOutlined />,
      onClick: () => openEditDialog(column),
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

  // ============================================================
  // ✅ TABLE CONFIGURATION - ĐÃ SỬA
  // ============================================================

  const getTableColumns = (): TableColumnsType<Student> => {
    const fixedColumns: TableColumnsType<Student> = [
      {
        title: "STT",
        key: "stt",
        align: "center",
        render: (_: any, __: Student, index: number) => index + 1,
      },
      {
        title: "Mã SV",
        dataIndex: "studentCode",
        key: "studentCode",
        ellipsis: true,
        render: (text: string) => (
          <Tooltip title={text}>
            <Text strong>{text}</Text>
          </Tooltip>
        ),
      },
      {
        title: "Họ và tên",
        dataIndex: ["user", "fullName"],
        key: "fullName",
        ellipsis: true,
        render: (text: string) => (
          <Tooltip title={text}>
            <Text strong>{text}</Text>
          </Tooltip>
        ),
      },
      {
        title: "Email",
        dataIndex: ["user", "email"],
        key: "email",
        ellipsis: true,
        render: (text: string) => (
          <Tooltip title={text || '-'}>
            <Text type="secondary">{text || '-'}</Text>
          </Tooltip>
        ),
      },
      {
        title: "Nhóm học tập",
        key: "className",
        ellipsis: true,
        render: (_: any, student: Student) => {

          console.log("🔍 DATA STUDENT ROW:", student);

          return (
            <Tooltip title={student.student.group?.groupName || '-'}>
              <Text type="secondary">{student.student.group?.groupName || '-'}</Text>
            </Tooltip>
          );
        },
        sorter: (a: Student, b: Student) => {
          const groupA = a.student.group?.groupName || '';
          const groupB = b.student.group?.groupName || '';
          return groupA.localeCompare(groupB);
        }

      },


    ];

    // ✅ SỬA: Sử dụng EditableCell component
    const gradeColumnsConfig: TableColumnsType<Student> = gradeColumns.map((col) => ({
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
      width: col.method === 'manual' ? 180 : 150, // ✅ Rộng hơn cho cột manual
      align: "center" as const,
      render: (_: any, student: Student) => {
        const grade = student.studentGrades.find(g => g.gradeColumnId === col.id);

        // ✅ SỬ DỤNG EditableCell
        return (
          <EditableCell
            student={student}
            column={col}
            grade={grade}
            onSave={handleSaveGrade}
            globalLoading={loading}
            onPreviewCalculation={handlePreviewCalculation}
          />
        );
      },
      sorter: (a: Student, b: Student) => {
        const gradeA = a.studentGrades.find(g => g.gradeColumnId === col.id)?.score || 0;
        const gradeB = b.studentGrades.find(g => g.gradeColumnId === col.id)?.score || 0;
        return gradeA - gradeB;
      }
    }));

    return [...fixedColumns, ...gradeColumnsConfig];
  };

  // ============================================================
  // STATISTICS
  // ============================================================

  const getStatistics = () => {
    const totalStudents = students.length;
    const totalColumns = gradeColumns.length;

    let totalScores = 0;
    let totalGrades = 0;

    students.forEach(student => {
      student.studentGrades.forEach(grade => {
        if (grade.score !== null) {
          const displayScore = grade.isOverridden && grade.overriddenScore !== null
            ? grade.overriddenScore
            : grade.score;
          const percentage = (displayScore / grade.maxScore) * 100;
          totalScores += percentage;
          totalGrades++;
        }
      });
    });

    const averageScore = totalGrades > 0 ? totalScores / totalGrades : 0;

    return {
      totalStudents,
      totalColumns,
      averageScore,
    };
  };

  const stats = getStatistics();

  // ============================================================
  // RENDER
  // ============================================================

  if (loading && students.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  const filteredStudents = students.filter((student) => {
    if (!keyword) return true;
    const searchText = keyword.toLowerCase();
    console.log(student);
    return (
      student.studentCode?.toLowerCase().includes(searchText) ||
      student.user.fullName?.toLowerCase().includes(searchText) ||
      student.user.email?.toLowerCase().includes(searchText) ||
      student.student.group?.groupName?.toLowerCase().includes(searchText)
    );
  });

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
        flexWrap: 'wrap',
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
            <UserOutlined style={{ fontSize: 14, color: "#1890ff" }} />
            <span>Sinh viên:</span>
            <strong>{stats.totalStudents}</strong>
          </div>
        </div>

        <Space wrap>
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
            onClick={() => {
              loadGradeColumns();
              loadStudentGrades();
            }}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button
            icon={<CalculatorOutlined />}
            onClick={handleCalculateAllGrades}
            loading={loading}
            type="dashed"
          >
            Tính tất cả
          </Button>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={handleExportGrades}
            loading={loading}
            style={{ borderColor: '#52c41a', color: '#52c41a' }}
          >
            Xuất Excel
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
      <div className="h-full flex flex-col">
        <Table<Student>
          dataSource={filteredStudents}
          columns={getTableColumns()}
          rowKey="id"
          bordered
          loading={loading}
          scroll={{
            y: "100%",
            x: screens.lg ? undefined : "max-content",
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sinh viên`,
          }}
        />
      </div>


      {/* Dialog Create/Edit Column */}
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
            {loading ? 'Đang xử lý...' : (selectedColumn ? 'Cập nhật' : 'Tạo mới')}
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
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên cột điểm' }]}
              >
                <Input
                  value={columnForm.name}
                  onChange={(e) => setColumnForm({ ...columnForm, name: e.target.value })}
                  placeholder="VD: Điểm danh, Bài tập, Chuyên cần..."
                />
              </Form.Item>

              <Form.Item
                label="Loại cột điểm"
                name="type"
                rules={[{ required: true }]}
              >
                <Select
                  value={columnForm.type}
                  onChange={(value) => {
                    setColumnForm({
                      ...columnForm,
                      type: value,
                      method: value === 'process' ? 'weighted_average' : 'auto_average',
                    });
                    setSelectedSessions([]);
                    setSelectedAssignments([]);
                    setSelectedDependencies([]);
                  }}
                  disabled={!!selectedColumn}
                >
                  <Option value="attendance_final">
                    Chuyên cần (Điểm danh + Bài tập)
                  </Option>
                  <Option value="project">
                    Đồ án
                  </Option>
                  <Option value="process">
                    Quá trình (Tổng hợp)
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Phương thức tính"
                name="method"
                rules={[
                  {
                    required: columnForm.type !== 'process',
                    message: 'Vui lòng chọn phương thức tính'
                  }
                ]}
                style={{
                  display: columnForm.type === 'process' ? 'none' : 'block'
                }}
              >
                <Select
                  value={columnForm.method}
                  onChange={(value) => {
                    setColumnForm({ ...columnForm, method: value });
                    setSelectedSessions([]);
                    setSelectedAssignments([]);
                    setSelectedDependencies([]);
                  }}
                  disabled={columnForm.type === 'process'}
                >
                  {columnForm.type === 'attendance_final' && (
                    <>
                      <Option value="auto_sum">Cộng tổng (điểm danh)</Option>
                      <Option value="auto_average">Trung bình (bài tập)</Option>
                      <Option value="weighted_average">Chuyên cần = (Điểm danh + Bài tập) / 2</Option>
                    </>
                  )}
                  {columnForm.type === 'project' && (
                    <>
                      <Option value="manual">Nhập thủ công</Option>
                      <Option value="auto_average">Tính từ bài tập đồ án</Option>
                    </>
                  )}
                  {columnForm.type === 'process' && (
                    <Option value="weighted_average">Trung bình có trọng số</Option>
                  )}
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Điểm tối đa"
                    name="maxScore"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      value={columnForm.maxScore}
                      onChange={(value) => setColumnForm({ ...columnForm, maxScore: value || 10 })}
                      min={0}
                      max={100}
                      step={0.1}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Hệ số"
                    name="weight"
                    tooltip="VD: 0.1 = 10%, 0.4 = 40%, 0.5 = 50%"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      value={columnForm.weight}
                      onChange={(value) => setColumnForm({ ...columnForm, weight: value || 0 })}
                      min={0}
                      max={1}
                      step={0.1}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Thứ tự hiển thị"
                name="displayOrder"
              >
                <InputNumber
                  value={columnForm.displayOrder}
                  onChange={(value) => setColumnForm({ ...columnForm, displayOrder: value || 0 })}
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            {/* Right Column - Source Selection */}
            {shouldShowSourceSelection() && (
              <Col xs={24} md={14}>
                <Title level={5} style={{ color: '#1890ff', marginBottom: 16 }}>
                  {getSourceSelectionTitle()}
                </Title>

                {/* Attendance Sessions - auto_sum */}
                {columnForm.type === 'attendance_final' && columnForm.method === 'auto_sum' && (
                  <div>
                    <Alert
                      message={`Đã chọn: ${selectedSessions.length}/${attendanceSessions.length} buổi`}
                      type="info"
                      style={{ marginBottom: 16 }}
                    />

                    {attendanceSessions.length === 0 ? (
                      <Alert message="Chưa có buổi điểm danh nào" type="warning" />
                    ) : (
                      <Card
                        bordered
                        size="small"
                        style={{ maxHeight: 400, overflow: 'auto' }}
                        bodyStyle={{ padding: 0 }}
                      >
                        <List
                          dataSource={attendanceSessions}
                          renderItem={(session) => {
                            const isSelected = selectedSessions.some(s => s.attendance_session_id === session.id);
                            return (
                              <List.Item
                                style={{ padding: '12px 16px', cursor: 'pointer' }}
                                onClick={() => handleToggleSession(session.id)}
                              >
                                <Checkbox checked={isSelected} />
                                <List.Item.Meta
                                  title={
                                    <Space>
                                      <Text strong>{session.name || `Buổi ${session.sessionCode}`}</Text>
                                      {isSelected && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                    </Space>
                                  }
                                  description={
                                    <Space>
                                      <Tag color="blue">{session.sessionScore || 0} điểm</Tag>
                                      <Text type="secondary">{formatDate(session.createdAt)}</Text>
                                    </Space>
                                  }
                                />
                              </List.Item>
                            );
                          }}
                        />
                      </Card>
                    )}
                  </div>
                )}

                {/* Assignments - auto_average */}
                {((columnForm.type === 'attendance_final' && columnForm.method === 'auto_average') ||
                  (columnForm.type === 'project' && columnForm.method === 'auto_average')) && (
                    <div>
                      <Alert
                        message={`Đã chọn: ${selectedAssignments.length}/${assignments.length} bài tập`}
                        type="info"
                        style={{ marginBottom: 16 }}
                      />

                      {assignments.length === 0 ? (
                        <Alert message="Chưa có bài tập nào" type="warning" />
                      ) : (
                        <Card
                          bordered
                          size="small"
                          style={{ maxHeight: 400, overflow: 'auto' }}
                          bodyStyle={{ padding: 0 }}
                        >
                          <List
                            dataSource={assignments}
                            renderItem={(assignment) => {
                              const isSelected = selectedAssignments.some(a => a.assignment_id === assignment.id);
                              return (
                                <List.Item
                                  style={{ padding: '12px 16px', cursor: 'pointer' }}
                                  onClick={() => handleToggleAssignment(assignment.id)}
                                >
                                  <Checkbox checked={isSelected} />
                                  <List.Item.Meta
                                    title={
                                      <Space>
                                        <Text strong>{assignment.title}</Text>
                                        {isSelected && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                      </Space>
                                    }
                                    description={
                                      <Space>
                                        <Tag color="purple">{assignment.type}</Tag>
                                        <Tag color="blue">{assignment.maxScore} điểm</Tag>
                                        {assignment.dueDate && (
                                          <Text type="secondary">Hạn: {formatDate(assignment.dueDate)}</Text>
                                        )}
                                      </Space>
                                    }
                                  />
                                </List.Item>
                              );
                            }}
                          />
                        </Card>
                      )}
                    </div>
                  )}

                {/* Weighted Average cho Attendance Final */}
                {columnForm.type === 'attendance_final' && columnForm.method === 'weighted_average' && (
                  <div>
                    <Card
                      title={
                        <Space>
                          <Text strong>Buổi điểm danh (Cộng tổng)</Text>
                          <Tag color="blue">{selectedSessions.length} đã chọn</Tag>
                        </Space>
                      }
                      size="small"
                      style={{ marginBottom: 16 }}
                    >
                      {attendanceSessions.length === 0 ? (
                        <Alert message="Chưa có buổi điểm danh nào" type="warning" showIcon />
                      ) : (
                        <div style={{ maxHeight: 250, overflow: 'auto' }}>
                          <List
                            dataSource={attendanceSessions}
                            renderItem={(session) => {
                              const isSelected = selectedSessions.some(s => s.attendance_session_id === session.id);
                              return (
                                <List.Item
                                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                                  onClick={() => handleToggleSession(session.id)}
                                >
                                  <Checkbox checked={isSelected} />
                                  <List.Item.Meta
                                    title={
                                      <Space>
                                        <Text strong>{session.name || `Buổi ${session.sessionCode}`}</Text>
                                        {isSelected && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                      </Space>
                                    }
                                    description={
                                      <Space>
                                        <Tag color="blue">{session.sessionScore || 0} điểm</Tag>
                                        <Text type="secondary">{formatDate(session.createdAt)}</Text>
                                      </Space>
                                    }
                                  />
                                </List.Item>
                              );
                            }}
                          />
                        </div>
                      )}
                    </Card>

                    <Card
                      title={
                        <Space>
                          <Text strong>Bài tập (Trung bình)</Text>
                          <Tag color="purple">{selectedAssignments.length} đã chọn</Tag>
                        </Space>
                      }
                      size="small"
                    >
                      {assignments.length === 0 ? (
                        <Alert message="Chưa có bài tập nào" type="warning" showIcon />
                      ) : (
                        <div style={{ maxHeight: 250, overflow: 'auto' }}>
                          <List
                            dataSource={assignments}
                            renderItem={(assignment) => {
                              const isSelected = selectedAssignments.some(a => a.assignment_id === assignment.id);
                              return (
                                <List.Item
                                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                                  onClick={() => handleToggleAssignment(assignment.id)}
                                >
                                  <Checkbox checked={isSelected} />
                                  <List.Item.Meta
                                    title={
                                      <Space>
                                        <Text strong>{assignment.title}</Text>
                                        {isSelected && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                      </Space>
                                    }
                                    description={
                                      <Space>
                                        <Tag color="purple">{assignment.type}</Tag>
                                        <Tag color="blue">{assignment.maxScore} điểm</Tag>
                                        {assignment.dueDate && (
                                          <Text type="secondary">Hạn: {formatDate(assignment.dueDate)}</Text>
                                        )}
                                      </Space>
                                    }
                                  />
                                </List.Item>
                              );
                            }}
                          />
                        </div>
                      )}
                    </Card>

                    {(selectedSessions.length > 0 || selectedAssignments.length > 0) && (
                      <Alert
                        message="Công thức tính điểm chuyên cần"
                        description={
                          <div style={{ marginTop: 8 }}>
                            {selectedSessions.length > 0 && (
                              <div>
                                <Text strong>Điểm danh (cộng tổng): </Text>
                                <Text>
                                  {selectedSessions.map((s, idx) => {
                                    const session = attendanceSessions.find(ses => ses.id === s.attendance_session_id);
                                    return (
                                      <span key={s.attendance_session_id}>
                                        {idx > 0 && ' + '}
                                        {session?.name || `Buổi ${session?.sessionCode}`} ({session?.sessionScore || 0} điểm)
                                      </span>
                                    );
                                  })}
                                </Text>
                              </div>
                            )}
                            {selectedAssignments.length > 0 && (
                              <div style={{ marginTop: 4 }}>
                                <Text strong>Bài tập (trung bình): </Text>
                                <Text>
                                  {selectedAssignments.map((a, idx) => {
                                    const assignment = assignments.find(asn => asn.id === a.assignment_id);
                                    return (
                                      <span key={a.assignment_id}>
                                        {idx > 0 && ' + '}
                                        {assignment?.title}
                                      </span>
                                    );
                                  })} / {selectedAssignments.length}
                                </Text>
                              </div>
                            )}
                            <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0f0f0', borderRadius: 4 }}>
                              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                                Bước 1: Tính điểm danh (cộng tổng các buổi)
                              </Text>
                              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
                                AttendanceScore = Buổi 1 + Buổi 2 + ...
                              </Text>
                              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                                Bước 2: Tính điểm bài tập (trung bình)
                              </Text>
                              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
                                HomeworkScore = (Bài 1 + Bài 2 + ...) / Số bài tập
                              </Text>
                              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                                Bước 3: Tính điểm chuyên cần cuối cùng
                              </Text>
                              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                                FinalScore = (AttendanceScore + HomeworkScore) / 2
                              </Text>
                            </div>
                          </div>
                        }
                        type="success"
                        showIcon
                        style={{ marginTop: 16 }}
                      />
                    )}
                  </div>
                )}

                {/* Dependencies for Process */}
                {columnForm.type === 'process' && (
                  <div>
                    <Alert
                      message={`Đã chọn: ${selectedDependencies.length}/${availableColumns.length} cột`}
                      type="info"
                      style={{ marginBottom: 16 }}
                    />

                    {availableColumns.length === 0 ? (
                      <Alert message="Chưa có cột điểm nào khác.   Vui lòng tạo cột điểm chuyên cần hoặc đồ án trước." type="warning" />
                    ) : (
                      <Card
                        bordered
                        size="small"
                        style={{ maxHeight: 400, overflow: 'auto' }}
                        bodyStyle={{ padding: 0 }}
                      >
                        <List
                          dataSource={availableColumns}
                          renderItem={(col) => {
                            const isSelected = selectedDependencies.some(d => d.source_column_id === col.id);
                            const selectedDep = selectedDependencies.find(d => d.source_column_id === col.id);
                            return (
                              <List.Item style={{ padding: '12px 16px' }}>
                                <div style={{ width: '100%' }}>
                                  <div
                                    style={{ cursor: 'pointer', marginBottom: isSelected ? 8 : 0 }}
                                    onClick={() => handleToggleDependency(col.id)}
                                  >
                                    <Checkbox checked={isSelected} />
                                    <Space style={{ marginLeft: 8 }}>
                                      <Text strong>{col.name}</Text>
                                      <Tag color={getColumnTypeColor(col.type)}>
                                        {getColumnTypeLabel(col.type)}
                                      </Tag>
                                      {isSelected && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                    </Space>
                                  </div>
                                </div>
                              </List.Item>
                            );
                          }}
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

      {/* Preview Calculation Dialog */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined />
            <span>Chi tiết cách tính điểm</span>
          </Space>
        }
        open={openPreviewDialog}
        onCancel={() => {
          setOpenPreviewDialog(false);
          setPreviewData(null);
        }}
        width={700}
        footer={[
          <Button key="close" type="primary" onClick={() => {
            setOpenPreviewDialog(false);
            setPreviewData(null);
          }}>
            Đóng
          </Button>,
        ]}
      >
        {previewData && (
          <div>
            <Alert
              message={`Phương thức: ${getMethodLabel(previewData.method)}`}
              type="info"
              style={{ marginBottom: 16 }}
            />

            <Card title="Công thức" size="small" style={{ marginBottom: 16 }}>
              <code style={{ fontSize: 14, background: '#f5f5f5', padding: 8, display: 'block', borderRadius: 4 }}>
                {previewData.formula}
              </code>
            </Card>

            <Card title="Các thành phần" size="small" style={{ marginBottom: 16 }}>
              <List
                dataSource={previewData.components}
                renderItem={(comp: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={comp.name}
                      description={
                        <Space direction="vertical">
                          <Text>Điểm: {comp.score}</Text>
                          {comp.maxScore && <Text>Điểm tối đa: {comp.maxScore}</Text>}
                          {comp.weight && <Text>Trọng số: {comp.weight}</Text>}
                          {comp.weightedScore && <Text strong>= {comp.weightedScore}</Text>}
                          {comp.normalizedScore && <Text>Chuẩn hóa: {comp.normalizedScore.toFixed(2)}</Text>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Card
              size="small"
              style={{
                background: '#e6f7ff',
                borderColor: '#91d5ff',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">Điểm cuối cùng</Text>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff', marginTop: 8 }}>
                  {previewData.calculatedScore} / 10
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}