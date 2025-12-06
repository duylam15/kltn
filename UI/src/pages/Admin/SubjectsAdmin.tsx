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
  Space,
  Card,
  Empty,
  Collapse,
  Badge,
  Descriptions,
  InputNumber,
  Flex,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Book } from "lucide-react";
import instance from "../../utils/axiosInstance";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

// ==================== TYPES ====================
type Subject = {
  id: number;
  subjectCode: string;
  subjectName: string;
  description?: string;
  credits?: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    chapters: number;
    questions: number;
    courseSections?: number;
  };
  chapters?: Chapter[];
};

type Chapter = {
  id: number;
  subjectId: number;
  chapterCode: string;
  chapterName: string;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    questions: number;
  };
};

type Question = {
  id: number;
  type: string;
  content: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  createdAt: string;
};

type ChapterDetail = Chapter & {
  questions?: Question[];
  subject?: {
    id: number;
    subjectCode: string;
    subjectName: string;
  };
};

type ApiResponse = {
  success: boolean;
  data: Subject[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

// ==================== COMPONENT ====================
export default function SubjectsAdmin() {
  // State
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal thêm/sửa
  const [form] = Form.useForm<any>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);

  // Modal xem chi tiết
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<ChapterDetail[]>([]);
  const [chapterQuestions, setChapterQuestions] = useState<Record<number, Question[]>>({});
  const [loadingChapters, setLoadingChapters] = useState<number[]>([]);

  // Modal Chapter
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterForm] = Form.useForm();

  // ==================== EFFECTS ====================
  useEffect(() => {
    fetchSubjects(1, 10);
  }, []);

  // ==================== API CALLS ====================
  async function fetchSubjects(page = 1, limit = 10, search?: string) {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (search) params.q = search;

      const res = await instance.get<ApiResponse>("/subjects", { params });

      if (res.data.success) {
        setSubjects(res.data.data || []);
        setPagination({
          current: res.data.meta.page,
          pageSize: res.data.meta.limit,
          total: res.data.meta.total,
        });
      }
    } catch (err) {
      toast.error("Không tải được danh sách môn học");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const fetchSubjectDetail = async (subjectId: number) => {
    try {
      setDetailLoading(true);
      setDetailModalOpen(true);

      const subjectRes = await instance.get(`/subjects/${subjectId}`);

      if (subjectRes.data.success) {
        setSelectedSubject(subjectRes.data.data);
        setChapters(subjectRes.data.data.chapters || []);
      }
    } catch (err) {
      toast.error("Không thể tải chi tiết môn học");
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchChapterQuestions = async (chapterId: number) => {
    if (chapterQuestions[chapterId]) return;

    try {
      setLoadingChapters((prev) => [...prev, chapterId]);

      const res = await instance.get(`/chapters/${chapterId}/questions`);

      if (res.data.success) {
        setChapterQuestions((prev) => ({
          ...prev,
          [chapterId]: res.data.data || [],
        }));
      }
    } catch (err) {
      toast.error("Không thể tải câu hỏi");
      console.error(err);
    } finally {
      setLoadingChapters((prev) => prev.filter((id) => id !== chapterId));
    }
  };

  // ==================== HANDLERS ====================
  const handleDelete = async (id: number) => {
    try {
      await instance.delete(`/subjects/${id}`);
      toast.success("Đã xóa môn học");
      fetchSubjects(pagination.current, pagination.pageSize, keyword);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Không thể xóa môn học";
      toast.error(errorMsg);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        subjectCode: values.subjectCode.trim().toUpperCase(),
        subjectName: values.subjectName.trim(),
        description: values.description?.trim() || undefined,
      };

      if (editing) {
        await instance.patch(`/subjects/${editing.id}`, payload);
        toast.success("Đã cập nhật môn học");
      } else {
        await instance.post("/subjects", payload);
        toast.success("Đã thêm môn học mới");
      }

      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchSubjects(1, pagination.pageSize);
    } catch (err: any) {
      if (err?.errorFields) return;
      const errorMsg = err?.response?.data?.message || "Không thể lưu môn học";
      toast.error(errorMsg);
    }
  };

  const handleSearch = () => {
    fetchSubjects(1, pagination.pageSize, keyword);
  };

  const handleTableChange = (newPagination: any) => {
    fetchSubjects(newPagination.current, newPagination.pageSize, keyword);
  };

  const handleCreateChapter = () => {
    if (!selectedSubject) return;

    setEditingChapter(null);
    chapterForm.setFieldsValue({
      subjectId: selectedSubject.id,
      chapterCode: "",
      chapterName: "",
      description: "",
      order: chapters.length,
    });
    setChapterModalOpen(true);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    chapterForm.setFieldsValue({
      subjectId: chapter.subjectId,
      chapterCode: chapter.chapterCode,
      chapterName: chapter.chapterName,
      description: chapter.description,
      order: chapter.order,
    });
    setChapterModalOpen(true);
  };

  const handleSubmitChapter = async () => {
    try {
      const values = await chapterForm.validateFields();

      if (editingChapter) {
        await instance.patch(`/chapters/${editingChapter.id}`, values);
        toast.success("Đã cập nhật chương");
      } else {
        await instance.post("/chapters", values);
        toast.success("Đã thêm chương mới");
      }

      setChapterModalOpen(false);
      chapterForm.resetFields();

      if (selectedSubject) {
        fetchSubjectDetail(selectedSubject.id);
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      const errorMsg = err?.response?.data?.message || "Không thể lưu chương";
      toast.error(errorMsg);
    }
  };

  const handleDeleteChapter = async (chapterId: number) => {
    try {
      await instance.delete(`/chapters/${chapterId}`);
      toast.success("Đã xóa chương");

      if (selectedSubject) {
        fetchSubjectDetail(selectedSubject.id);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Không thể xóa chương";
      toast.error(errorMsg);
    }
  };

  // ==================== RENDER HELPERS ====================
  const renderDifficultyTag = (difficulty: string) => {
    const config = {
      easy: { color: "green", text: "Dễ" },
      medium: { color: "orange", text: "Trung bình" },
      hard: { color: "red", text: "Khó" },
    };
    const diff = config[difficulty as keyof typeof config] || {
      color: "default",
      text: difficulty,
    };
    return <Tag color={diff.color}>{diff.text}</Tag>;
  };

  const renderQuestionTypeTag = (type: string) => {
    const config = {
      multiple_choice: { color: "blue", text: "Trắc nghiệm" },
      essay: { color: "purple", text: "Tự luận" },
      coding: { color: "cyan", text: "Lập trình" },
      true_false: { color: "geekblue", text: "Đúng/Sai" },
    };
    const t = config[type as keyof typeof config] || {
      color: "default",
      text: type,
    };
    return <Tag color={t.color}>{t.text}</Tag>;
  };

  // ==================== TABLE COLUMNS ====================
  const columns = [
    {
      title: "Mã môn học",
      dataIndex: "subjectCode",
      key: "subjectCode",
      width: 120,
      render: (text: string) => (
        <Tag color="blue" style={{ fontSize: 14, fontWeight: 600 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Tên môn học",
      dataIndex: "subjectName",
      key: "subjectName",
      width: 200,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 250,
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip title={text}>
          {text || <span style={{ color: "#999" }}>Chưa có mô tả</span>}
        </Tooltip>
      ),
    },
    {
      title: "Số chương",
      key: "chapters",
      align: "center" as const,
      width: 120,
      render: (_: any, record: Subject) => (
        <Tag icon={<FileTextOutlined />} color="cyan">
          {record._count?.chapters || 0}
        </Tag>
      ),
    },
    {
      title: "Số câu hỏi",
      key: "questions",
      align: "center" as const,
      width: 110,
      render: (_: any, record: Subject) => (
        <Tag icon={<QuestionCircleOutlined />} color="green">
          {record._count?.questions || 0}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center" as const,
      width: 150,
      fixed: "right" as const,
      render: (_: any, record: Subject) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<EyeOutlined />}
              size="small"
              type="primary"
              ghost
              onClick={() => fetchSubjectDetail(record.id)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditing(record);
                form.setFieldsValue({
                  subjectCode: record.subjectCode,
                  subjectName: record.subjectName,
                  description: record.description,
                });
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa môn học"
              description={
                <div>
                  <p>Bạn có chắc muốn xóa môn học này? </p>
                  {record._count && record._count.chapters > 0 && (
                    <p style={{ color: "red", marginTop: 8 }}>
                      ⚠️ Môn học này có {record._count.chapters} chương và{" "}
                      {record._count.questions} câu hỏi!
                    </p>
                  )}
                </div>
              }
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ==================== RENDER ====================
  return (
    <div className="sm:px-3 h-auto sm:h-auto">
      {/* 🎯 RESPONSIVE HEADER */}
      <Flex
        wrap="wrap"
        gap={12}
        className="flex-col sm:flex-row items-start sm:items-center w-full pt-3 pb-5"
      >

        {/* Title Left */}
        <Title level={3} style={{ margin: 0 }}>
          <Flex align="center" gap={8}>
            <Book />
            <span>Quản lý Môn học</span>
          </Flex>
        </Title>

        {/* Action Right */}
        <Flex
          gap={8}
          wrap="wrap"
          className="w-full sm:w-auto sm:ml-auto"
        >
          {/* Search */}
          <Input.Search
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo mã, tên..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            className="w-full sm:w-72"
          />

          {/* Buttons */}
          <Flex gap={8} wrap="wrap">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchSubjects(1, pagination.pageSize)}
            >
              <span className="hidden sm:inline">Làm mới</span>
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                form.resetFields();
                setModalOpen(true);
              }}
            >
              <span className="hidden sm:inline">Thêm môn học</span>
              <span className="inline sm:hidden">Thêm</span>
            </Button>
          </Flex>

        </Flex>
      </Flex>


      {/* 🎯 TABLE WITH PROPER PAGINATION */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" tip="Đang tải danh sách môn học..." />
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <Table<Subject>
            dataSource={subjects}
            columns={columns}
            rowKey="id"
            bordered
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} môn học`,
              pageSizeOptions: ["10", "20", "50", "100"],
              position: ["bottomRight"],
              style: { marginTop: 16 },
            }}
            onChange={handleTableChange}
            locale={{ emptyText: "Không có môn học nào" }}
            scroll={{ x: 1200 }}
            expandable={{
              expandedRowRender: (record) => {
                if (!record.chapters || record.chapters.length === 0) {
                  return <Empty description="Chưa có chương nào" style={{ padding: 20 }} />;
                }

                return (
                  <Table
                    dataSource={record.chapters}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: "Mã chương",
                        dataIndex: "chapterCode",
                        key: "chapterCode",
                        width: 120,
                        render: (text: string) => <Tag color="purple">{text}</Tag>,
                      },
                      {
                        title: "Tên chương",
                        dataIndex: "chapterName",
                        key: "chapterName",
                        width: 250,
                      },
                      {
                        title: "Mô tả",
                        dataIndex: "description",
                        key: "description",
                        width: 250,
                        ellipsis: true,
                      },
                      {
                        title: "Thứ tự",
                        dataIndex: "order",
                        key: "order",
                        width: 80,
                        align: "center" as const,
                      },
                      {
                        title: "Số câu hỏi",
                        key: "questions",
                        width: 100,
                        align: "center" as const,
                        render: (_: any, chapter: Chapter) => (
                          <Tag color="green">{chapter._count?.questions || 0}</Tag>
                        ),
                      },
                    ]}
                  />
                );
              },
              rowExpandable: (record) =>
                (record.chapters && record.chapters.length > 0) || true,
            }}
          />
        </div>
      )}

      {/* Modal thêm/sửa */}
      <Modal
        title={
          <Space>
            <BookOutlined />
            {editing ? "Sửa thông tin môn học" : "Thêm môn học mới"}
          </Space>
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onOk={handleSubmit}
        okText={editing ? "Lưu thay đổi" : "Tạo mới"}
        cancelText="Hủy"
        width={600}
        centered
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Mã môn học"
            name="subjectCode"
            rules={[
              { required: true, message: "Vui lòng nhập mã môn học" },
              {
                pattern: /^[A-Z0-9]+$/i,
                message: "Mã môn học chỉ chứa chữ cái và số",
              },
              { max: 30, message: "Mã môn học tối đa 30 ký tự" },
            ]}
          >
            <Input
              placeholder="VD: CS101"
              maxLength={30}
              style={{ textTransform: "uppercase" }}
              disabled={!!editing}
            />
          </Form.Item>

          <Form.Item
            label="Tên môn học"
            name="subjectName"
            rules={[
              { required: true, message: "Vui lòng nhập tên môn học" },
              { max: 200, message: "Tên môn học tối đa 200 ký tự" },
            ]}
          >
            <Input placeholder="VD: Lập trình căn bản" maxLength={200} />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ max: 500, message: "Mô tả tối đa 500 ký tự" }]}
          >
            <TextArea
              placeholder="Nhập mô tả chi tiết về môn học (không bắt buộc)"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>

          {editing && editing._count && (
            <Card size="small" style={{ backgroundColor: "#f0f5ff" }}>
              <Space direction="vertical" size="small">
                <div>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  Số chương: <strong>{editing._count.chapters}</strong>
                </div>
                <div>
                  <QuestionCircleOutlined style={{ marginRight: 8 }} />
                  Số câu hỏi: <strong>{editing._count.questions}</strong>
                </div>
              </Space>
            </Card>
          )}
        </Form>
      </Modal>

      {/* Modal xem chi tiết */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>Chi tiết môn học</span>
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedSubject(null);
          setChapters([]);
          setChapterQuestions({});
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalOpen(false);
              setSelectedSubject(null);
              setChapters([]);
              setChapterQuestions({});
            }}
          >
            Đóng
          </Button>,
        ]}
        width={1000}
        centered
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin tip="Đang tải chi tiết môn học..." />
          </div>
        ) : selectedSubject ? (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Mã môn học" span={1}>
                  <Tag color="blue" style={{ fontSize: 14, fontWeight: 600 }}>
                    {selectedSubject.subjectCode}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tên môn học" span={1}>
                  <strong>{selectedSubject.subjectName}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả" span={2}>
                  {selectedSubject.description || (
                    <Text type="secondary">Chưa có mô tả</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Số chương">
                  <Badge
                    count={selectedSubject?.chapters?.length || 0}
                    showZero
                    color="cyan"
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Số câu hỏi">
                  <Badge
                    count={selectedSubject._count?.questions || 0}
                    showZero
                    color="green"
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {selectedSubject.createdAt
                    ? dayjs(selectedSubject.createdAt).format("DD/MM/YYYY HH:mm")
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật">
                  {selectedSubject.updatedAt
                    ? dayjs(selectedSubject.updatedAt).format("DD/MM/YYYY HH:mm")
                    : "—"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Title level={5}>
                <FolderOpenOutlined /> Danh sách chương ({chapters.length})
              </Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={handleCreateChapter}
              >
                Thêm chương
              </Button>
            </div>

            {chapters.length === 0 ? (
              <Empty description="Chưa có chương nào" />
            ) : (
              <Collapse
                accordion
                onChange={(key) => {
                  if (key) {
                    const chapterId = Number(key);
                    fetchChapterQuestions(chapterId);
                  }
                }}
              >
                {chapters.map((chapter) => (
                  <Panel
                    key={chapter.id}
                    header={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <Space>
                          <Tag color="purple">{chapter.chapterCode}</Tag>
                          <strong>{chapter.chapterName}</strong>
                          <Badge
                            count={chapter._count?.questions || 0}
                            showZero
                            style={{ backgroundColor: "#52c41a" }}
                          />
                        </Space>
                      </div>
                    }
                    extra={
                      <Space size="small" onClick={(e) => e.stopPropagation()}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Thứ tự: {chapter.order}
                        </Text>
                        <Button
                          type="link"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditChapter(chapter);
                          }}
                        >
                          Sửa
                        </Button>
                        <Popconfirm
                          title="Xóa chương"
                          description={`Bạn có chắc muốn xóa chương "${chapter.chapterName}"?`}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDeleteChapter(chapter.id);
                          }}
                          onCancel={(e) => e?.stopPropagation()}
                        >
                          <Button
                            type="link"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Xóa
                          </Button>
                        </Popconfirm>
                      </Space>
                    }
                  >
                    {chapter.description && (
                      <div style={{ marginBottom: 12 }}>
                        <Text type="secondary">{chapter.description}</Text>
                      </div>
                    )}

                    {loadingChapters.includes(chapter.id) ? (
                      <div style={{ textAlign: "center", padding: 20 }}>
                        <Spin tip="Đang tải câu hỏi..." />
                      </div>
                    ) : chapterQuestions[chapter.id] ? (
                      <>
                        <Title level={5} style={{ marginTop: 16 }}>
                          Danh sách câu hỏi ({chapterQuestions[chapter.id].length})
                        </Title>
                        {chapterQuestions[chapter.id].length === 0 ? (
                          <Empty
                            description="Chưa có câu hỏi nào"
                            style={{ padding: 20 }}
                          />
                        ) : (
                          <Table
                            dataSource={chapterQuestions[chapter.id]}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            columns={[
                              {
                                title: "ID",
                                dataIndex: "id",
                                key: "id",
                                width: 60,
                              },
                              {
                                title: "Nội dung",
                                dataIndex: "content",
                                key: "content",
                                ellipsis: true,
                                render: (text: string) => (
                                  <Tooltip title={text}>
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html:
                                          text.substring(0, 100) +
                                          (text.length > 100 ? "..." : ""),
                                      }}
                                    />
                                  </Tooltip>
                                ),
                              },
                              {
                                title: "Loại",
                                dataIndex: "type",
                                key: "type",
                                width: 120,
                                render: renderQuestionTypeTag,
                              },
                              {
                                title: "Độ khó",
                                dataIndex: "difficulty",
                                key: "difficulty",
                                width: 110,
                                render: renderDifficultyTag,
                              },
                              {
                                title: "Điểm",
                                dataIndex: "points",
                                key: "points",
                                width: 80,
                                align: "center" as const,
                                render: (points: number) => (
                                  <Tag color="orange">{points}</Tag>
                                ),
                              },
                              {
                                title: "Ngày tạo",
                                dataIndex: "createdAt",
                                key: "createdAt",
                                width: 100,
                                render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
                              },
                            ]}
                          />
                        )}
                      </>
                    ) : null}
                  </Panel>
                ))}
              </Collapse>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Modal thêm/sửa Chapter */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            {editingChapter ? "Sửa chương" : "Thêm chương mới"}
          </Space>
        }
        open={chapterModalOpen}
        onCancel={() => {
          setChapterModalOpen(false);
          setEditingChapter(null);
          chapterForm.resetFields();
        }}
        onOk={handleSubmitChapter}
        okText={editingChapter ? "Lưu thay đổi" : "Tạo mới"}
        cancelText="Hủy"
        width={600}
        centered
      >
        <Form form={chapterForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="subjectId" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Mã chương"
            name="chapterCode"
            rules={[
              { required: true, message: "Vui lòng nhập mã chương" },
              {
                pattern: /^[A-Z0-9._-]+$/i,
                message: "Mã chương chỉ chứa chữ cái, số, dấu chấm, gạch ngang",
              },
              { max: 30, message: "Mã chương tối đa 30 ký tự" },
            ]}
          >
            <Input
              placeholder="VD: CHUONG-01"
              maxLength={30}
              disabled={!!editingChapter}
            />
          </Form.Item>

          <Form.Item
            label="Tên chương"
            name="chapterName"
            rules={[
              { required: true, message: "Vui lòng nhập tên chương" },
              { max: 200, message: "Tên chương tối đa 200 ký tự" },
            ]}
          >
            <Input placeholder="VD: Giới thiệu về lập trình" maxLength={200} />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ max: 500, message: "Mô tả tối đa 500 ký tự" }]}
          >
            <TextArea
              placeholder="Nhập mô tả chi tiết về chương (không bắt buộc)"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Thứ tự"
            name="order"
            rules={[
              { required: true, message: "Vui lòng nhập thứ tự" },
              { type: "number", min: 0, message: "Thứ tự phải >= 0" },
            ]}
          >
            <InputNumber min={0} placeholder="0" style={{ width: "100%" }} />
          </Form.Item>

          {editingChapter && editingChapter._count && (
            <Card size="small" style={{ backgroundColor: "#fff7e6" }}>
              <Space direction="vertical" size="small">
                <div>
                  <QuestionCircleOutlined style={{ marginRight: 8 }} />
                  Số câu hỏi: <strong>{editingChapter._count.questions}</strong>
                </div>
              </Space>
            </Card>
          )}
        </Form>
      </Modal>
    </div>
  );
}