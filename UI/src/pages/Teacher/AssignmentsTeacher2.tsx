import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Spin,
  Typography,
  Tag,
  Modal,
  Input,
  Tooltip,
  Form,
  Popconfirm,
  DatePicker,
  Select,
  Row,
  Col,
  Checkbox,
  Divider,
  Space,
  Card,
  Statistic,
  InputNumber,
  Switch, 
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  ApartmentOutlined,
  FilterOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  GlobalOutlined,      
  LockOutlined,        
  ShareAltOutlined,    
  CopyOutlined,        
  CloudUploadOutlined, 
  FolderOpenOutlined,  
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { FileQuestion } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { v4 as uuidv4 } from "uuid";

const { Title, Text } = Typography;
const { Option } = Select;
const API_BASE = "http://localhost:4000/api/v1";


type Assignment = {
  id: number;
  sectionId?: number;
  title: string;
  description?: string;
  type: "exercise" | "quiz" | "project" | "exam";
  dueDate?: string;
  maxScore: number;
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  createdBy?: number;
  originalAssignmentId?: string;
  shuffleQuestions?: boolean;
  showAnswersAfterSubmit?: boolean;
  allowLateSubmission?: boolean;
  isPublic?: boolean;  // ← THÊM DÒNG NÀY
  createdAt?: string;
  updatedAt?: string;
};

type Section = {
  id: number;
  sectionCode: string;
  sectionName: string;
  subject: {  // ← THÊM DÒNG NÀY
    subjectCode: string;
    subjectName: string;
  };
  term: {  // ← THÊM DÒNG NÀY
    name: string;
  };
};
type Question = {
  id: number;
  content: string;
  type: string;
  difficulty?: "easy" | "medium" | "hard";
  points?: number;
  subjectId?: number;
  chapterId?: number;
  subject?: {
    id: number;
    subjectCode: string;
    subjectName: string;
  };
  chapter?: {
    id: number;
    chapterCode: string;
    chapterName: string;
  };
};

type QuestionSubject = {
  id: number;
  subjectCode: string;
  subjectName: string;
};

type Chapter = {
  id: number;
  subjectId: number;
  chapterCode: string;
  chapterName: string;
};


// 🆕 Type cho auto generate
type ChapterRule = {
  chapterId: number;
  easy: { count: number; pointPerQuestion: number };
  medium: { count: number; pointPerQuestion: number };
  hard: { count: number; pointPerQuestion: number };
};

export default function AssignmentsTeacher2() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [keyword, setKeyword] = useState("");

  const [form] = Form.useForm<any>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignedSectionIds, setAssignedSectionIds] = useState<number[]>([]);
  const [tempSelectedSectionIds, setTempSelectedSectionIds] = useState<number[]>([]);
  const [savingAssignment, setSavingAssignment] = useState(false);

  // State cho câu hỏi
  const [assignedQuestionIds, setAssignedQuestionIds] = useState<number[]>([]);
  const [tempSelectedQuestionIds, setTempSelectedQuestionIds] = useState<number[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionKeyword, setQuestionKeyword] = useState("");

  // 🆕 State cho filter câu hỏi
  const [questionSubjects, setQuestionSubjects] = useState<QuestionSubject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>();
  const [selectedChapterId, setSelectedChapterId] = useState<number | undefined>();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>();
  const [selectedType, setSelectedType] = useState<string | undefined>();

  // 🆕 State cho auto generate modal
  const [autoGenModalOpen, setAutoGenModalOpen] = useState(false);
  const [autoGenForm] = Form.useForm<any>();
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const [filterPublic, setFilterPublic] = useState<boolean | null>(null);  // ← THÊM
  const [filterType, setFilterType] = useState<string | null>(null);       // ← THÊM

  // State cho thư viện
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);         // ← THÊM
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);  // ← THÊM
  const [loadingLibrary, setLoadingLibrary] = useState(false);             // ← THÊM
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<number[]>([]); // ← THÊM
  const [libraryKeyword, setLibraryKeyword] = useState("");                // ← THÊM

  const { user } = useAuth();
  const teacherId = user?.teacher?.id;

  useEffect(() => {
    fetchAssignments();
    fetchSections();
    fetchQuestionSubjects();
  }, []);

  // 🆕 Fetch câu hỏi với filter
  useEffect(() => {
    fetchQuestions();
  }, [selectedSubjectId, selectedChapterId, selectedDifficulty, selectedType]);

  // 🆕 Load chapters khi chọn subject
  useEffect(() => {
    if (selectedSubjectId) {
      fetchChaptersBySubject(selectedSubjectId);
    } else {
      setChapters([]);
      setSelectedChapterId(undefined);
    }
  }, [selectedSubjectId]);

  async function fetchAssignments() {
    try {
      setLoading(true);
      const res = await axios.get<{ success: boolean; data: Assignment[] }>(
        `${API_BASE}/assignments?createdBy=${teacherId}`  // ← SỬA DÒNG NÀY
      );
      if (res.data.success) {
        setAssignments(res.data.data || []);
      }
    } catch {
      toast.error("Không tải được danh sách bài tập");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSections() {
    try {
      const res = await axios.get<{ success: boolean; data: any[] }>(
        `${API_BASE}/sections-instructors?teacher_id=${teacherId}`  // ← SỬA DÒNG NÀY
      );
      if (res.data.success) {
        setSections(res.data.data.map((item: any) => item.section) || []);  // ← SỬA DÒNG NÀY
      }
    } catch {
      toast.error("Không tải được danh sách lớp");
    }
  }
  async function fetchAllAssignments() {
    try {
      setLoadingLibrary(true);

      const [allRes, myRes] = await Promise.all([
        axios.get(`${API_BASE}/assignments?isPublic=true`),
        axios.get(`${API_BASE}/assignments?createdBy=${teacherId}`)
      ]);

      if (allRes.data.success && myRes.data.success) {
        const allAssigns = allRes.data.data;
        const myAssigns = myRes.data.data;

        const myOriginalAssignmentIds = new Set(
          myAssigns
            .filter((a: Assignment) => a.originalAssignmentId)
            .map((a: Assignment) => a.originalAssignmentId)
        );

        const otherAssignments = allAssigns.filter((a: Assignment) => {
          return !(a.createdBy === teacherId && !a.originalAssignmentId);
        });

        const assignmentsByRootId = new Map<string, Assignment>();
        otherAssignments.forEach((a: Assignment) => {
          const rootId = a.originalAssignmentId || a.id.toString();
          if (!assignmentsByRootId.has(rootId) || !a.originalAssignmentId) {
            assignmentsByRootId.set(rootId, a);
          }
        });

        const availableAssignments = Array.from(assignmentsByRootId.values())
          .filter(assignment => {
            const rootId = assignment.originalAssignmentId || assignment.id.toString();
            return !myOriginalAssignmentIds.has(rootId);
          });

        setAllAssignments(availableAssignments);
      }
    } catch (err) {
      console.error("Lỗi fetch assignments:", err);
      toast.error("Không tải được danh sách bài tập");
    } finally {
      setLoadingLibrary(false);
    }
  }

  const handleTogglePublic = async (assignmentId: number, isPublic: boolean) => {
    try {
      const res = await axios.put(`${API_BASE}/assignments/${assignmentId}`, {
        isPublic,
      });
      console.log(res); 
      if (res.data.success) {
        toast.success(`Đã ${isPublic ? "chia sẻ" : "hủy chia sẻ"} bài tập`);
        setAssignments((prev) =>
          prev.map((a) => (a.id === assignmentId ? { ...a, isPublic } : a))
        );
      }
    } catch (err: any) {
      console.error("Lỗi toggle public:", err);
      toast.error("Không thể cập nhật trạng thái chia sẻ");
    }
  };

  // 🆕 Fetch question subjects
  async function fetchQuestionSubjects() {
    try {
      const res = await axios.get<{
        success: boolean;
        data: QuestionSubject[];
        meta: any;
      }>(
        `${API_BASE}/subjects?limit=100`
      );
      if (res.data.success) {
        setQuestionSubjects(res.data.data || []);
      }
    } catch {
      toast.error("Không tải được danh sách môn học");
    }
  }

  // 🆕 Fetch chapters by subject
  async function fetchChaptersBySubject(subjectId: number) {
    try {
      const res = await axios.get<{ success: boolean; data: Chapter[] }>(
        `${API_BASE}/questions/${subjectId}/chapters`
      );
      if (res.data.success) {
        setChapters(res.data.data || []);
      }
    } catch {
      toast.error("Không tải được danh sách chương");
      setChapters([]);
    }
  }

  // 🆕 Fetch questions với filter
  async function fetchQuestions() {
    try {
      setLoadingQuestions(true);
      const params: any = { page: 1, limit: 1000 };

      if (selectedSubjectId) params.subjectId = selectedSubjectId;
      if (selectedChapterId) params.chapterId = selectedChapterId;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (selectedType) params.type = selectedType;

      const res = await axios.get<{
        success: boolean;
        data: Question[] | { items: Question[] };
      }>(`${API_BASE}/questions`, { params });

      if (res.data.success) {
        // Handle cả 2 format response
        const items = Array.isArray(res.data.data)
          ? res.data.data
          : (res.data.data as any).items || [];
        setQuestions(items);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Không tải được danh sách câu hỏi");
    } finally {
      setLoadingQuestions(false);
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/assignments/${id}`);
      toast.success("Đã xóa bài tập");
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Không thể xóa bài tập");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const uniqueCode = uuidv4();

      const payload = {
        ...(values.sectionId ? { sectionId: Number(values.sectionId) } : {}),
        title: values.title.trim(),
        description: values.description?.trim(),
        type: values.type,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        maxScore: Number(values.maxScore || 100),
        passingScore: values.passingScore ? Number(values.passingScore) : null,
        timeLimit: values.timeLimit ? Number(values.timeLimit) : null,
        maxAttempts: values.maxAttempts ? Number(values.maxAttempts) : 1,
        shuffleQuestions: values.shuffleQuestions || false,
        showAnswersAfterSubmit: values.showAnswersAfterSubmit || false,
        allowLateSubmission: values.allowLateSubmission || false,
        isPublic: values.isPublic || false,  // ← THÊM DÒNG NÀY
        createdBy: teacherId,
        originalAssignmentId: uniqueCode
      };

      let assignmentId: number;

      if (editing) {
        const res = await axios.put(
          `${API_BASE}/assignments/${editing.id}`,
          payload
        );
        assignmentId = editing.id;
        toast.success("Đã cập nhật bài tập");
      } else {
        const res = await axios.post(`${API_BASE}/assignments`, payload);
        assignmentId = res.data.data.id;
        toast.success("Đã tạo bài tập mới");
      }

      await saveQuestionAssignments(assignmentId);

      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      setTempSelectedQuestionIds([]);
      setAssignedQuestionIds([]);
      resetFilters();
      fetchAssignments();
    } catch (err: any) {
      if (err?.errorFields) return;
      toast.error(
        err?.response?.data?.message || "Không thể lưu thông tin bài tập"
      );
    }
  };

  const handleCopyAssignments = async () => {
    if (selectedAssignmentIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 bài tập");
      return;
    }

    try {
      const selectedAssignments = allAssignments.filter((a) =>
        selectedAssignmentIds.includes(a.id)
      );

      const createPromises = selectedAssignments.map(async (assignment) => {
        return axios.post(`${API_BASE}/assignments`, {
          title: assignment.title,
          description: assignment.description,
          type: assignment.type,
          maxScore: assignment.maxScore,
          passingScore: assignment.passingScore,
          timeLimit: assignment.timeLimit,
          maxAttempts: assignment.maxAttempts,
          shuffleQuestions: assignment.shuffleQuestions,
          showAnswersAfterSubmit: assignment.showAnswersAfterSubmit,
          allowLateSubmission: assignment.allowLateSubmission,
          createdBy: teacherId,
          originalAssignmentId: assignment.originalAssignmentId || assignment.id.toString(),
          isPublic: false,
        });
      });

      await Promise.all(createPromises);

      toast.success(`Đã sao chép ${selectedAssignmentIds.length} bài tập`);
      setLibraryModalOpen(false);
      setSelectedAssignmentIds([]);
      setLibraryKeyword("");
      fetchAssignments();
    } catch (err: any) {
      console.error("Lỗi copy:", err);
      toast.error(err.response?.data?.message || "Không thể sao chép bài tập");
    }
  };

  const getStatistics = () => {
    const totalAssignments = assignments.length;
    const publicAssignments = assignments.filter((a) => a.isPublic).length;
    const privateAssignments = totalAssignments - publicAssignments;
    const assignmentsByType = {
      exercise: assignments.filter((a) => a.type === "exercise").length,
      quiz: assignments.filter((a) => a.type === "quiz").length,
      project: assignments.filter((a) => a.type === "project").length,
      exam: assignments.filter((a) => a.type === "exam").length,
    };

    return {
      totalAssignments,
      publicAssignments,
      privateAssignments,
      assignmentsByType,
    };
  };

  const stats = getStatistics();

  const saveQuestionAssignments = async (assignmentId: number) => {
    try {
      const toAdd = tempSelectedQuestionIds.filter(
        (id) => !assignedQuestionIds.includes(id)
      );

      const toRemove = assignedQuestionIds.filter(
        (id) => !tempSelectedQuestionIds.includes(id)
      );

      const addPromises = toAdd.map((questionId) =>
        axios.post(
          `${API_BASE}/assignments-questions/assignments/${assignmentId}/questions/${questionId}`
        )
      );

      const removePromises = toRemove.map((questionId) =>
        axios.delete(
          `${API_BASE}/assignments-questions/assignments/${assignmentId}/questions/${questionId}`
        )
      );

      await Promise.all([...addPromises, ...removePromises]);

      if (toAdd.length > 0 || toRemove.length > 0) {
        toast.success(`Đã cập nhật câu hỏi (thêm: ${toAdd.length}, xóa: ${toRemove.length})`);
      }
    } catch (error) {
      console.error("Error saving question assignments:", error);
      toast.error("Không thể cập nhật câu hỏi");
      throw error;
    }
  };

  const openAssignModal = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    try {
      const res = await axios.get<{ success: boolean; data: any[] }>(
        `${API_BASE}/sections-assignments/assignments/${assignment.id}/sections`
      );
      if (res.data.success) {
        const sectionIds = res.data.data.map((s) => s.sectionId);
        setAssignedSectionIds(sectionIds);
        setTempSelectedSectionIds(sectionIds);
      }
    } catch {
      toast.error("Không tải được danh sách lớp đã gán");
      setAssignedSectionIds([]);
      setTempSelectedSectionIds([]);
    }
    setAssignModalOpen(true);
  };

  const openCreateEditModal = async (assignment?: Assignment) => {
    if (assignment) {
      setEditing(assignment);
      form.setFieldsValue({
        ...assignment,
        dueDate: assignment.dueDate ? dayjs(assignment.dueDate) : null,
      });

      setLoadingQuestions(true);
      try {
        const res = await axios.get<{
          success: boolean;
          data: Array<{
            assignmentId: number;
            questionId: number;
            question: Question;
          }>
        }>(
          `${API_BASE}/assignments-questions/assignments/${assignment.id}/questions`
        );

        if (res.data.success && res.data.data) {
          const questionIds = res.data.data.map((item) => item.questionId);
          setAssignedQuestionIds(questionIds);
          setTempSelectedQuestionIds(questionIds);
        } else {
          setAssignedQuestionIds([]);
          setTempSelectedQuestionIds([]);
        }
      } catch (error) {
        console.error("Error loading assigned questions:", error);
        toast.error("Không tải được danh sách câu hỏi đã gán");
        setAssignedQuestionIds([]);
        setTempSelectedQuestionIds([]);
      } finally {
        setLoadingQuestions(false);
      }
    } else {
      setEditing(null);
      form.resetFields();
      setAssignedQuestionIds([]);
      setTempSelectedQuestionIds([]);
    }
    resetFilters();
    setModalOpen(true);
  };

  // 🆕 Mở modal auto generate
  const openAutoGenModal = (assignment?: Assignment) => {
    if (assignment) {
      setEditing(assignment);
    } else {
      setEditing(null);
      form.resetFields();
    }
    autoGenForm.resetFields();
    setAutoGenModalOpen(true);
  };

  // 🆕 Handle auto generate
  const handleAutoGenerate = async () => {
    try {
      const values = await autoGenForm.validateFields();

      // Validate assignment exists
      if (!editing) {
        toast.error("Vui lòng tạo bài tập trước khi tự động tạo câu hỏi");
        return;
      }

      setGeneratingQuestions(true);

      // Gọi API auto generate
      const res = await axios.post(`${API_BASE}/assignment-generator/generate`, {
        assignmentId: editing.id,
        subjectId: values.subjectId,
        totalScore: 10,
        chapterRules: values.chapterRules || [],
      });

      if (res.data.success) {
        toast.success(`Đã tự động tạo ${res.data.data.totalQuestionsAdded} câu hỏi!`);
        setAutoGenModalOpen(false);
        autoGenForm.resetFields();
        // Refresh assignment
        fetchAssignments();
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      toast.error(err?.response?.data?.message || "Không thể tự động tạo câu hỏi");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const toggleTempSelection = (sectionId: number, checked: boolean) => {
    if (checked) {
      setTempSelectedSectionIds((prev) => [...prev, sectionId]);
    } else {
      setTempSelectedSectionIds((prev) => prev.filter((id) => id !== sectionId));
    }
  };

  const toggleTempQuestionSelection = (questionId: number, checked: boolean) => {
    if (checked) {
      setTempSelectedQuestionIds((prev) => [...prev, questionId]);
    } else {
      setTempSelectedQuestionIds((prev) => prev.filter((id) => id !== questionId));
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedAssignment) return;

    setSavingAssignment(true);
    try {
      const toAdd = tempSelectedSectionIds.filter(
        (id) => !assignedSectionIds.includes(id)
      );

      const toRemove = assignedSectionIds.filter(
        (id) => !tempSelectedSectionIds.includes(id)
      );

      const addPromises = toAdd.map((sectionId) =>
        axios.post(`${API_BASE}/sections-assignments/sections/${sectionId}/assignments`, {
          assignmentId: selectedAssignment.id,
        })
      );

      const removePromises = toRemove.map((sectionId) =>
        axios.delete(
          `${API_BASE}/sections-assignments/sections/${sectionId}/assignments/${selectedAssignment.id}`
        )
      );

      await Promise.all([...addPromises, ...removePromises]);
      console.log(addPromises, toRemove);
      toast.success("Đã cập nhật gán lớp thành công");
      setAssignedSectionIds(tempSelectedSectionIds);
      setAssignModalOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      toast.error("Không thể cập nhật gán lớp");
    } finally {
      setSavingAssignment(false);
    }
  };

  // 🆕 Reset filters
  const resetFilters = () => {
    setSelectedSubjectId(undefined);
    setSelectedChapterId(undefined);
    setSelectedDifficulty(undefined);
    setSelectedType(undefined);
    setQuestionKeyword("");
  };

  // 🎨 Render difficulty tag
  const renderDifficultyTag = (difficulty?: string) => {
    const config: Record<string, { color: string; text: string }> = {
      easy: { color: "green", text: "Dễ" },
      medium: { color: "orange", text: "Trung bình" },
      hard: { color: "red", text: "Khó" },
    };
    if (!difficulty) return null;
    const diff = config[difficulty] || { color: "default", text: difficulty };
    return <Tag color={diff.color}>{diff.text}</Tag>;
  };

  // 🎨 Render type tag
  const renderTypeTag = (type: string) => {
    const config: Record<string, { color: string; text: string }> = {
      multiple_choice: { color: "blue", text: "Trắc nghiệm" },
      essay: { color: "purple", text: "Tự luận" },
      coding: { color: "cyan", text: "Lập trình" },
      true_false: { color: "geekblue", text: "Đúng/Sai" },
    };
    const t = config[type] || { color: "default", text: type };
    return <Tag color={t.color}>{t.text}</Tag>;
  };

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Assignment) => (  // ← SỬA
        <div>
          <div style={{ fontWeight: 600, color: "#1890ff" }}>
            {text}
          </div>
          {record.description && (
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const colors: any = {
          exercise: "blue",
          quiz: "purple",
          project: "orange",
          exam: "red",
        };
        return <Tag color={colors[type]}>{type.toUpperCase()}</Tag>;
      },
    },
    {  // ← THÊM COLUMN MỚI (thêm sau column "Điểm tối đa")
      title: "Trạng thái",
      key: "status",
      width: 150,
      align: "center" as const,
      render: (_: any, record: Assignment) => (
        <Switch
          checkedChildren={<><GlobalOutlined /> Công khai</>}
          unCheckedChildren={<><LockOutlined /> Riêng tư</>}
          checked={record.isPublic}
          onChange={(checked) => {
            console.log(checked);
            handleTogglePublic(record.id, checked)
          }}
        />
      ),
    },
    {
      title: "Điểm tối đa",
      dataIndex: "maxScore",
      key: "maxScore",
      align: "center" as const,
    },
    {
      title: "Hạn nộp",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (v: string) =>
        v ? dayjs(v).format("DD/MM/YYYY HH:mm") : <Tag>Không</Tag>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: Assignment) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Tooltip title="Sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => openCreateEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Tự động tạo câu hỏi">
            <Button
              icon={<ThunderboltOutlined />}
              size="small"
              type="primary"
              ghost
              onClick={() => openAutoGenModal(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa bài tập"
              description="Bạn có chắc muốn xóa bài tập này?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Gán vào lớp">
            <Button
              icon={<ApartmentOutlined />}
              size="small"
              onClick={() => openAssignModal(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const filteredAssignments = assignments.filter((a) => {
    const matchKeyword =
      !keyword ||
      a.title.toLowerCase().includes(keyword.toLowerCase()) ||
      a.description?.toLowerCase().includes(keyword.toLowerCase());

    const matchPublic = filterPublic === null || a.isPublic === filterPublic;
    const matchType = !filterType || a.type === filterType;

    return matchKeyword && matchPublic && matchType;
  });

  const filteredQuestions = questions.filter((q) => {
    if (!questionKeyword) return true;
    const kw = questionKeyword.toLowerCase();
    return (
      q.content.toLowerCase().includes(kw) ||
      q.type?.toLowerCase().includes(kw) ||
      q.difficulty?.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="pl-3 pr-3">
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <Title level={3} className="mt-2">
          <div className="flex items-center gap-2">
            <FileQuestion /> Quản lý Bài tập
          </div>
        </Title>
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng bài tập"
                value={stats.totalAssignments}
                prefix={<FolderOpenOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Công khai"
                value={stats.publicAssignments}
                prefix={<GlobalOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Riêng tư"
                value={stats.privateAssignments}
                prefix={<LockOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Bài kiểm tra"
                value={stats.assignmentsByType.quiz + stats.assignmentsByType.exam}
                prefix={<BookOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
        </Row>
        <div style={{ display: "flex", gap: 8 }}>
          <Select
            allowClear
            placeholder="Lọc theo trạng thái"
            style={{ width: 150 }}
            value={filterPublic}
            onChange={setFilterPublic}
          >
            <Option value={true}>Công khai</Option>
            <Option value={false}>Riêng tư</Option>
          </Select>
          <Select
            allowClear
            placeholder="Lọc theo loại"
            style={{ width: 150 }}
            value={filterType}
            onChange={setFilterType}
          >
            <Option value="exercise">Exercise</Option>
            <Option value="quiz">Quiz</Option>
            <Option value="project">Project</Option>
            <Option value="exam">Exam</Option>
          </Select>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tiêu đề, mô tả, loại..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 400 }}
          />
          <Button
            icon={<CopyOutlined />}
            onClick={() => {
              setLibraryModalOpen(true);
              fetchAllAssignments();
            }}
          >
            Lấy từ thư viện
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchAssignments}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openCreateEditModal()}
          >
            Thêm bài tập
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" tip="Đang tải danh sách bài tập..." />
        </div>
      ) : (
        <Table<Assignment>
          dataSource={filteredAssignments}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: "Không có bài tập nào" }}
        />
      )}

      {/* Modal thêm/sửa - với filter câu hỏi */}
      <Modal
        title={editing ? "Sửa thông tin bài tập" : "Thêm bài tập mới"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          setTempSelectedQuestionIds([]);
          setAssignedQuestionIds([]);
          resetFilters();
        }}
        onOk={handleSubmit}
        okText={editing ? "Lưu" : "Tạo mới"}
        cancelText="Hủy"
        width={1400}
        centered
        bodyStyle={{
          maxHeight: "75vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Row gutter={24}>
          {/* Cột trái: Thông tin bài tập */}
          <Col span={10}>
            <Title level={5} style={{ marginBottom: 12 }}>Thông tin bài tập</Title>

            <Form
              form={form}
              layout="vertical"
              className="[&_.ant-form-item]:mb-3"
            >
              <Form.Item
                label="Tiêu đề"
                name="title"
                rules={[{ required: true }]}
                className="mb-3"
              >
                <Input placeholder="VD: Bài tập OOP" className="!py-1.5 !px-2" />
              </Form.Item>

              <Form.Item label="Mô tả" name="description" className="mb-3">
                <Input.TextArea rows={3} placeholder="Mô tả chi tiết bài tập" className="!p-2" />
              </Form.Item>

              <Form.Item
                label="Loại bài tập"
                name="type"
                className="mb-3"
              >
                <Select placeholder="Chọn loại bài tập">
                  <Option value="exercise">Exercise</Option>
                  <Option value="quiz">Quiz</Option>
                  <Option value="project">Project</Option>
                  <Option value="exam">Exam</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Hạn nộp" name="dueDate" className="mb-3">
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  className="w-full"
                />
              </Form.Item>

              <Divider className="!my-3">Cấu hình</Divider>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Điểm tối đa" name="maxScore" className="mb-3">
                  <Input type="number" className="!py-1.5 !px-2" />
                </Form.Item>
                <Form.Item label="Điểm đạt" name="passingScore" className="mb-3">
                  <Input type="number" className="!py-1.5 !px-2" />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Thời gian (phút)" name="timeLimit" className="mb-3">
                  <Input type="number" className="!py-1.5 !px-2" />
                </Form.Item>
                <Form.Item label="Số lần nộp" name="maxAttempts" className="mb-3">
                  <Input type="number" className="!py-1.5 !px-2" />
                </Form.Item>
              </div>

              <Form.Item name="shuffleQuestions" valuePropName="checked" className="mb-2">
                <Checkbox>Xáo trộn câu hỏi</Checkbox>
              </Form.Item>
              <Form.Item name="showAnswersAfterSubmit" valuePropName="checked" className="mb-2">
                <Checkbox>Hiện đáp án sau khi nộp</Checkbox>
              </Form.Item>
              <Form.Item name="allowLateSubmission" valuePropName="checked" className="mb-0">
                <Checkbox>Cho phép nộp muộn</Checkbox>
              </Form.Item>
              <Form.Item
                name="isPublic"
                label="Chia sẻ bài tập"
                valuePropName="checked"
                initialValue={false}
                tooltip="Khi bật, giảng viên khác có thể xem và sao chép bài tập này"
                className="mb-0"
              >
                <Switch
                  checkedChildren={<><ShareAltOutlined /> Công khai</>}
                  unCheckedChildren={<><LockOutlined /> Riêng tư</>}
                />
              </Form.Item>
            </Form>
          </Col>

          {/* Cột phải: Danh sách câu hỏi với filter */}
          <Col span={14}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Title level={5} style={{ margin: 0 }}>Câu hỏi</Title>
              <Space>
                <Button
                  icon={<ThunderboltOutlined />}
                  size="small"
                  type="primary"
                  onClick={() => openAutoGenModal(editing || undefined)}
                  disabled={!editing}
                >
                  Tự động tạo
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  size="small"
                  onClick={resetFilters}
                >
                  Xóa bộ lọc
                </Button>
              </Space>
            </div>

            {/* 🆕 Bộ lọc */}
            <Card size="small" style={{ marginBottom: 12, backgroundColor: "#fafafa" }}>
              <Space direction="vertical" style={{ width: "100%" }} size="small">
                <Row gutter={8}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Môn học:</Text>
                    <Select
                      allowClear
                      placeholder="Chọn môn học"
                      value={selectedSubjectId}
                      onChange={setSelectedSubjectId}
                      style={{ width: "100%" }}
                      size="small"
                    >
                      {questionSubjects.map((s) => (
                        <Option key={s.id} value={s.id}>
                          {s.subjectCode} - {s.subjectName}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Chương:</Text>
                    <Select
                      allowClear
                      placeholder="Chọn chương"
                      value={selectedChapterId}
                      onChange={setSelectedChapterId}
                      disabled={!selectedSubjectId}
                      style={{ width: "100%" }}
                      size="small"
                    >
                      {chapters.map((c) => (
                        <Option key={c.id} value={c.id}>
                          {c.chapterCode} - {c.chapterName}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                </Row>
                <Row gutter={8}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Độ khó:</Text>
                    <Select
                      allowClear
                      placeholder="Chọn độ khó"
                      value={selectedDifficulty}
                      onChange={setSelectedDifficulty}
                      style={{ width: "100%" }}
                      size="small"
                    >
                      <Option value="easy">Dễ</Option>
                      <Option value="medium">Trung bình</Option>
                      <Option value="hard">Khó</Option>
                    </Select>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Loại câu hỏi:</Text>
                    <Select
                      allowClear
                      placeholder="Chọn loại"
                      value={selectedType}
                      onChange={setSelectedType}
                      style={{ width: "100%" }}
                      size="small"
                    >
                      <Option value="multiple_choice">Trắc nghiệm</Option>
                      <Option value="essay">Tự luận</Option>
                      <Option value="coding">Lập trình</Option>
                      <Option value="true_false">Đúng/Sai</Option>
                    </Select>
                  </Col>
                </Row>
              </Space>
            </Card>

            {/* Search */}
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm theo nội dung câu hỏi..."
              value={questionKeyword}
              onChange={(e) => setQuestionKeyword(e.target.value)}
              style={{ marginBottom: 12 }}
              size="small"
            />

            {/* Thống kê */}
            <Card size="small" style={{ marginBottom: 12 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Tổng số câu"
                    value={questions.length}
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Đã chọn"
                    value={tempSelectedQuestionIds.length}
                    valueStyle={{ fontSize: 20, color: "#1890ff" }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Danh sách câu hỏi */}
            <div
              style={{
                maxHeight: 400,
                overflowY: "auto",
                border: "1px solid #d9d9d9",
                borderRadius: 4,
                padding: 12,
              }}
            >
              {loadingQuestions ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <Spin tip="Đang tải câu hỏi..." />
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: "#999" }}>
                  <FilterOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                  <p>Không tìm thấy câu hỏi phù hợp</p>
                  <Button size="small" onClick={resetFilters}>Xóa bộ lọc</Button>
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const checked = tempSelectedQuestionIds.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      style={{
                        display: "block",
                        padding: "10px 12px",
                        marginBottom: 8,
                        borderRadius: 4,
                        border: "1px solid #d9d9d9",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        backgroundColor: checked ? "#e6f7ff" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!checked) e.currentTarget.style.backgroundColor = "#f5f5f5";
                      }}
                      onMouseLeave={(e) => {
                        if (!checked) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleTempQuestionSelection(q.id, e.target.checked)}
                          style={{ marginTop: 4, cursor: "pointer" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{ fontWeight: 500, marginBottom: 4 }}
                            dangerouslySetInnerHTML={{
                              __html: q.content.substring(0, 100) + (q.content.length > 100 ? "..." : "")
                            }}
                          />
                          <div style={{ fontSize: 12 }}>
                            {renderTypeTag(q.type)}
                            {renderDifficultyTag(q.difficulty)}
                            {q.points && <Tag color="green">{q.points} điểm</Tag>}
                            {q.subject && (
                              <Tag color="blue" icon={<BookOutlined />}>
                                {q.subject.subjectCode}
                              </Tag>
                            )}
                            {q.chapter && (
                              <Tag color="purple">
                                {q.chapter.chapterCode}
                              </Tag>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </Col>
        </Row>
      </Modal>

      {/* 🆕 Modal tự động tạo câu hỏi */}
      <Modal
        title={
          <Space>
            <ThunderboltOutlined />
            Tự động tạo câu hỏi
          </Space>
        }
        open={autoGenModalOpen}
        onCancel={() => {
          setAutoGenModalOpen(false);
          autoGenForm.resetFields();
        }}
        onOk={handleAutoGenerate}
        okText="Tạo câu hỏi"
        cancelText="Hủy"
        confirmLoading={generatingQuestions}
        width={800}
        centered
      >
        <Form form={autoGenForm} layout="vertical">
          <Form.Item
            label="Môn học"
            name="subjectId"
            rules={[{ required: true, message: "Vui lòng chọn môn học" }]}
          >
            <Select placeholder="Chọn môn học" onChange={(value) => {
              fetchChaptersBySubject(value);
              autoGenForm.setFieldValue("chapterRules", []);
            }}>
              {questionSubjects.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.subjectCode} - {s.subjectName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>Cấu hình câu hỏi theo chương</Divider>

          <Form.List name="chapterRules">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: 12 }}>
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item
                          {...restField}
                          name={[name, "chapterId"]}
                          label="Chương"
                          rules={[{ required: true }]}
                        >
                          <Select placeholder="Chọn chương">
                            {chapters.map((c) => (
                              <Option key={c.id} value={c.id}>
                                {c.chapterCode} - {c.chapterName}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={8}>
                      <Col span={8}>
                        <Text strong>Dễ:</Text>
                        <Form.Item {...restField} name={[name, "easy", "count"]} label="Số câu">
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, "easy", "pointPerQuestion"]} label="Điểm/câu">
                          <InputNumber min={0} step={0.5} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>

                      <Col span={8}>
                        <Text strong>Trung bình:</Text>
                        <Form.Item {...restField} name={[name, "medium", "count"]} label="Số câu">
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, "medium", "pointPerQuestion"]} label="Điểm/câu">
                          <InputNumber min={0} step={0.5} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>

                      <Col span={8}>
                        <Text strong>Khó:</Text>
                        <Form.Item {...restField} name={[name, "hard", "count"]} label="Số câu">
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, "hard", "pointPerQuestion"]} label="Điểm/câu">
                          <InputNumber min={0} step={0.5} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Button danger size="small" onClick={() => remove(name)}>
                      Xóa chương
                    </Button>
                  </Card>
                ))}

                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Thêm chương
                </Button>
              </>
            )}
          </Form.List>

          <Card size="small" style={{ marginTop: 16, backgroundColor: "#fff7e6" }}>
            <Text type="warning">
              ⚠️ Tổng điểm phải bằng 10. Hệ thống sẽ tự động kiểm tra khi tạo.
            </Text>
          </Card>
        </Form>
      </Modal>

      {/* Modal gán lớp */}
      <Modal
        title={`Giao bài tập "${selectedAssignment?.title}" cho lớp`}
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false);
          setSelectedAssignment(null);
          setTempSelectedSectionIds([]);
        }}
        onOk={handleSaveAssignment}
        okText="Giao bài"
        cancelText="Hủy"
        confirmLoading={savingAssignment}
        width={600}
      >
        {selectedAssignment && (
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 6 }}>
            <div><Text strong>Bài tập:</Text> {selectedAssignment.title}</div>
            {selectedAssignment.description && (
              <div style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
                {selectedAssignment.description}
              </div>
            )}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sections.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999" }}>Bạn chưa có lớp nào</p>
          ) : (
            sections.map((s) => {
              const checked = tempSelectedSectionIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    padding: "12px",
                    borderRadius: 4,
                    border: "1px solid #d9d9d9",
                    transition: "all 0.3s",
                    backgroundColor: checked ? "#e6f7ff" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!checked) e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }}
                  onMouseLeave={(e) => {
                    if (!checked) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggleTempSelection(s.id, e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>
                      {s.sectionCode} - {s.sectionName}
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {s.subject.subjectCode} - {s.subject.subjectName} ({s.term.name})
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </Modal>
      {/* Modal thư viện */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CopyOutlined /> Lấy bài tập từ thư viện chung
          </div>
        }
        open={libraryModalOpen}
        onCancel={() => {
          setLibraryModalOpen(false);
          setSelectedAssignmentIds([]);
          setLibraryKeyword("");
        }}
        onOk={handleCopyAssignments}
        okText={`Sao chép (${selectedAssignmentIds.length})`}
        cancelText="Hủy"
        width={900}
        centered
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm bài tập..."
            value={libraryKeyword}
            onChange={(e) => setLibraryKeyword(e.target.value)}
          />
        </div>

        {loadingLibrary ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin tip="Đang tải..." />
          </div>
        ) : (
          <Table<Assignment>
            dataSource={allAssignments.filter(
              (a) =>
                !libraryKeyword ||
                a.title
                  .toLowerCase()
                  .includes(libraryKeyword.toLowerCase()) ||
                a.description
                  ?.toLowerCase()
                  .includes(libraryKeyword.toLowerCase())
            )}
            columns={[
              {
                title: "Tiêu đề",
                dataIndex: "title",
                key: "title",
                render: (text: string, record: Assignment) => (
                  <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    {record.description && (
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {record.description}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: "Loại",
                dataIndex: "type",
                key: "type",
                width: 100,
                render: (type: string) => {
                  const colors: any = {
                    exercise: "blue",
                    quiz: "purple",
                    project: "orange",
                    exam: "red",
                  };
                  return <Tag color={colors[type]}>{type.toUpperCase()}</Tag>;
                },
              },
              {
                title: "Điểm",
                dataIndex: "maxScore",
                key: "maxScore",
                width: 80,
                align: "center" as const,
                render: (score: number) => <Tag color="green">{score}</Tag>,
              },
              {
                title: "Ngày tạo",
                dataIndex: "createdAt",
                key: "createdAt",
                width: 120,
                render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
              },
            ]}
            rowKey="id"
            rowSelection={{
              selectedRowKeys: selectedAssignmentIds,
              onChange: (keys) =>
                setSelectedAssignmentIds(keys as number[]),
            }}
            pagination={{ pageSize: 5 }}
            size="small"
            locale={{ emptyText: "Không có bài tập nào" }}
          />
        )}
      </Modal>
    </div>
  );
}