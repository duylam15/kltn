import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card,
  Tabs,
  Form,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  message,
  Segmented,
  Empty,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import type { Dayjs } from "dayjs";
import {
  BarChart3,
  TrendingUp,
  Clock,
  PieChart,
  RefreshCw,
  FileText,
  CheckCircle2,
  Award,
  Download,
  Filter,
  Building2,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { PrettyTooltip } from "../../components/PrettyTooltip";

/** --------------------------------------
 *  Types from backend
 *  -------------------------------------- */
type CatalogTerm = { id: number; code: string; name: string; startDate: string; endDate: string };
type CatalogSubject = { id: number; subjectCode: string; subjectName: string };
type CatalogTeacher = { id: number; code: string; fullName: string };
type CatalogSection = {
  id: number;
  sectionCode: string;
  sectionName: string;
  subjectId: number;
  termId: number;
  teacherIds: number[];
};

type TotalRow = {
  sectionId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  total10: number;
};

type Bucket = { label: string; from: number; to: number };
type BucketSeriesRes = {
  scheme: string;
  buckets: Bucket[];
  total: number;
  series: { label: string; count: number }[];
};

type AttendanceItem = {
  sectionId: number;
  present: number;
  late: number;
  excused: number;
  absent: number;
  total: number;
  rate: number;
};

/** --------------------------------------
 *  API instance
 *  -------------------------------------- */
const API_BASE = "http://localhost:4000/api/v1";

const apiClient = axios.create({ baseURL: API_BASE });
apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** --------------------------------------
 *  Catalog hooks
 *  -------------------------------------- */
function useCatalog() {
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState<CatalogTerm[]>([]);
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [teachers, setTeachers] = useState<CatalogTeacher[]>([]);
  const [sections, setSections] = useState<CatalogSection[]>([]);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/catalog/catalog", {
        params: { scopes: "terms,subjects,sections,teachers" },
      });
      setTerms(data.terms || []);
      setSubjects(data.subjects || []);
      setTeachers(data.teachers || []);
      setSections(data.sections || []);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Không tải được danh mục");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const teacherById = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const termById = useMemo(() => new Map(terms.map((t) => [t.id, t])), [terms]);

  return { loading, terms, subjects, teachers, sections, teacherById, subjectById, termById, reload };
}

function SectionOption({
  s,
  subjectById,
  termById,
  teacherById,
}: {
  s: CatalogSection;
  subjectById: Map<number, CatalogSubject>;
  termById: Map<number, CatalogTerm>;
  teacherById: Map<number, CatalogTeacher>;
}) {
  const subject = subjectById.get(s.subjectId);
  const term = termById.get(s.termId);
  const tNames = (s.teacherIds || [])
    .map((id) => teacherById.get(id)?.fullName)
    .filter(Boolean)
    .join(", ");

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "2px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontWeight: 600 }}>{s.sectionName}</span>
        <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
          {s.sectionCode}
        </Tag>
      </div>
      <div style={{ fontSize: 12, color: "#64748b" }}>
        {subject ? `${subject.subjectCode} – ${subject.subjectName}` : "Chưa gán môn"}
        {term ? ` · ${term.code}` : ""}
        {tNames ? ` · GV: ${tNames}` : ""}
      </div>
    </div>
  );
}

/** --------------------------------------
 *  Main Component
 *  -------------------------------------- */
export default function AdminStats() {
  const { loading: catLoading, sections, subjects, teacherById, subjectById, termById, reload } =
    useCatalog();

  const [activeKey, setActiveKey] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "grades";
  });

  const handleTabChange = (key: string) => {
    setActiveKey(key);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", key);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Compact Header - Không còn khoảng trống thừa */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 20px",
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
              Thống kê học tập & chuyên cần
            </h2>
            <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
              Tổng hợp dữ liệu toàn hệ thống ({sections.length} lớp học phần · {subjects.length} môn học)
            </p>
          </div>
        </div>

        <Button
          type="primary"
          icon={<RefreshCw size={15} />}
          onClick={reload}
          loading={catLoading}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8 }}
        >
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        activeKey={activeKey}
        onChange={handleTabChange}
        tabBarStyle={{ marginBottom: 12 }}
        items={[
          {
            key: "grades",
            label: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={16} />
                Điểm trung bình
              </span>
            ),
            children: (
              <GradesTab
                sections={sections}
                subjectById={subjectById}
                termById={termById}
                teacherById={teacherById}
                catalogLoading={catLoading}
              />
            ),
          },
          {
            key: "buckets",
            label: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <PieChart size={16} />
                Phân bố điểm
              </span>
            ),
            children: (
              <BucketsTab sections={sections} subjects={subjects} catalogLoading={catLoading} />
            ),
          },
          {
            key: "attendance",
            label: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Clock size={16} />
                Chuyên cần
              </span>
            ),
            children: (
              <AttendanceTab sections={sections} subjects={subjects} catalogLoading={catLoading} />
            ),
          },
          {
            key: "dept",
            label: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Building2 size={16} />
                Tổng quan Khoa
              </span>
            ),
            children: (
              <DepartmentTab
                sections={sections}
                subjects={subjects}
                subjectById={subjectById}
                termById={termById}
                catalogLoading={catLoading}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

/** --------------------------------------
 *  KPI Card Helper Component
 *  -------------------------------------- */
function KpiCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
  extraChart,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  extraChart?: React.ReactNode;
}) {
  return (
    <Card
      styles={{ body: { padding: "16px 20px" } }}
      style={{ borderRadius: 12, border: "1px solid #e2e8f0", height: "100%" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>
            {title}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
        {extraChart ? (
          extraChart
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: iconBg,
              color: iconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

/** --------------------------------------
 *  Tab 1: Grades
 *  -------------------------------------- */
function GradesTab({
  sections,
  subjectById,
  termById,
  teacherById,
  catalogLoading,
}: {
  sections: CatalogSection[];
  subjectById: Map<number, CatalogSubject>;
  termById: Map<number, CatalogTerm>;
  teacherById: Map<number, CatalogTeacher>;
  catalogLoading: boolean;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TotalRow[]>([]);
  const [initialized, setInitialized] = useState(false);

  const fetchGrades = useCallback(async (targetIds: number[]) => {
    if (!targetIds.length) return;
    try {
      setLoading(true);
      const { data } = await apiClient.get("/stats/grades", {
        params: { sectionIds: targetIds.join(",") },
      });
      setItems(data.items || []);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Không tải được điểm");
    } finally {
      setLoading(false);
    }
  }, []);

  // Mới vào load ngay toàn bộ tất cả các lớp
  useEffect(() => {
    if (!initialized && sections.length > 0) {
      fetchGrades(sections.map((s) => s.id));
      setInitialized(true);
    }
  }, [sections, initialized, fetchGrades]);

  const onFetch = (values: { sectionIds?: number[] }) => {
    const selected = values.sectionIds?.length ? values.sectionIds : sections.map((s) => s.id);
    if (!selected.length) return message.warning("Chưa có lớp học phần nào");
    fetchGrades(selected);
  };

  const groupedBySection = useMemo(() => {
    const map = new Map<number, TotalRow[]>();
    for (const r of items) {
      const arr = map.get(r.sectionId) ?? [];
      arr.push(r);
      map.set(r.sectionId, arr);
    }
    return map;
  }, [items]);

  const statsBySection = useMemo(() => {
    const ret: Record<number, { n: number; avg: number; min: number; max: number }> = {};
    groupedBySection.forEach((rows, secId) => {
      const vals = rows.map((r) => Number(r.total10 || 0));
      const n = vals.length || 1;
      const avg = +(vals.reduce((a, b) => a + b, 0) / n).toFixed(2);
      ret[secId] = {
        n,
        avg,
        min: vals.length ? Math.min(...vals) : 0,
        max: vals.length ? Math.max(...vals) : 0,
      };
    });
    return ret;
  }, [groupedBySection]);

  const columns: ColumnsType<TotalRow & { sectionLabel: string }> = [
    { title: "Mã SV", dataIndex: "studentCode", width: 125 },
    { title: "Họ tên", dataIndex: "studentName" },
    { title: "Lớp học phần", dataIndex: "sectionLabel", width: 250 },
    {
      title: "Điểm TB (10)",
      dataIndex: "total10",
      width: 120,
      align: "right",
      sorter: (a, b) => Number(a.total10) - Number(b.total10),
      render: (v: number) => {
        const val = Number(v ?? 0);
        return (
          <Tag
            color={val >= 8 ? "green" : val >= 6.5 ? "geekblue" : val >= 5 ? "gold" : "red"}
            style={{ borderRadius: 6, padding: "2px 10px", fontWeight: 600, margin: 0 }}
          >
            {val.toFixed(2)}
          </Tag>
        );
      },
    },
  ];

  const dataSource = useMemo(() => {
    const secLabel = (id: number) => {
      const s = sections.find((x) => x.id === id);
      if (!s) return String(id);
      const subj = subjectById.get(s.subjectId);
      const term = termById.get(s.termId);
      return `${s.sectionName} · ${subj?.subjectCode ?? ""} · ${term?.code ?? ""}`;
    };
    return items.map((r) => ({
      ...r,
      key: `${r.sectionId}-${r.studentId}`,
      sectionLabel: secLabel(r.sectionId),
    }));
  }, [items, sections, subjectById, termById]);

  const chartData = useMemo(() => {
    const rows: { section: string; avg: number }[] = [];
    groupedBySection.forEach((_list, secId) => {
      const st = statsBySection[secId];
      const s = sections.find((x) => x.id === secId);
      rows.push({ section: s?.sectionName || String(secId), avg: st?.avg || 0 });
    });
    return rows.sort((a, b) => a.section.localeCompare(b.section));
  }, [groupedBySection, statsBySection, sections]);

  const values = items.map((i) => Number(i.total10 ?? 0));
  const avg = values.length ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
  const pass = values.filter((v) => v >= 5).length;
  const excellent = values.filter((v) => v >= 8).length;
  const passRate = values.length ? ((pass / values.length) * 100).toFixed(1) : "0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filter Bar gọn 1 hàng */}
      <Card styles={{ body: { padding: "14px 20px" } }} style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <Form form={form} onFinish={onFetch} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <Form.Item name="sectionIds" style={{ flex: 1, minWidth: 280, marginBottom: 0 }}>
            <Select
              mode="multiple"
              maxTagCount={3}
              loading={catalogLoading}
              allowClear
              placeholder={`Mặc định hiển thị tất cả (${sections.length} lớp) — Hoặc chọn lớp để lọc...`}
              optionFilterProp="label"
              options={sections.map((s) => ({
                value: s.id,
                label: `${s.sectionName} (${s.sectionCode})`,
                section: s,
              }))}
              optionRender={(opt) => {
                // @ts-ignore
                const sec: CatalogSection = opt.data.section;
                return (
                  <SectionOption
                    s={sec}
                    subjectById={subjectById}
                    termById={termById}
                    teacherById={teacherById}
                  />
                );
              }}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<Filter size={15} />}
            loading={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8 }}
          >
            Lọc dữ liệu
          </Button>
          <Button
            onClick={() => {
              form.resetFields();
              fetchGrades(sections.map((s) => s.id));
            }}
            style={{ borderRadius: 8 }}
          >
            Tất cả lớp
          </Button>
        </Form>
      </Card>

      {/* KPI Tiles */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Tổng bản ghi điểm"
            value={items.length}
            subtitle={`Trên ${groupedBySection.size} lớp có dữ liệu`}
            icon={<FileText size={20} />}
            iconBg="#eef2ff"
            iconColor="#4f46e5"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Điểm trung bình"
            value={avg}
            subtitle={`Thấp nhất ${(values.length ? Math.min(...values) : 0).toFixed(2)} · Cao nhất ${(values.length ? Math.max(...values) : 0).toFixed(2)}`}
            icon={<TrendingUp size={20} />}
            iconBg="#f5f3ff"
            iconColor="#7c3aed"
            extraChart={
              <div style={{ width: 84, height: 42 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={values.slice(0, 40).map((v, i) => ({ i, v }))}>
                    <defs>
                      <linearGradient id="gAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} fill="url(#gAvg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            }
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Đạt (≥ 5.0 điểm)"
            value={pass}
            subtitle={`Chiếm ${passRate}% tổng số`}
            icon={<CheckCircle2 size={20} />}
            iconBg="#ecfdf5"
            iconColor="#10b981"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Giỏi (≥ 8.0 điểm)"
            value={excellent}
            subtitle={`Chiếm ${values.length ? ((excellent / values.length) * 100).toFixed(1) : "0"}% tổng số`}
            icon={<Award size={20} />}
            iconBg="#fffbeb"
            iconColor="#f59e0b"
          />
        </Col>
      </Row>

      {/* Chart + Table */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={11}>
          <Card
            title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                <BarChart3 size={17} color="#4f46e5" />
                Điểm trung bình theo lớp
              </span>
            }
            styles={{ body: { height: 420, padding: "16px" } }}
            style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          >
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Spin />
              </div>
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 16, left: -12, bottom: 20 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="section" angle={-20} textAnchor="end" height={65} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Legend />
                  <Bar dataKey="avg" name="Điểm TB (10)" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có dữ liệu điểm" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={13}>
          <Card
            title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                <Users size={17} color="#4f46e5" />
                Chi tiết điểm sinh viên
              </span>
            }
            styles={{ body: { padding: "12px 16px" } }}
            style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          >
            <Table
              size="small"
              rowKey={(r) => `${r.sectionId}-${r.studentId}`}
              loading={loading}
              dataSource={dataSource}
              columns={columns}
              pagination={{ pageSize: 8, showSizeChanger: true }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

/** --------------------------------------
 *  Tab 2: Buckets
 *  -------------------------------------- */
function BucketsTab({
  sections,
  subjects,
  catalogLoading,
}: {
  sections: CatalogSection[];
  subjects: CatalogSubject[];
  catalogLoading: boolean;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BucketSeriesRes | null>(null);
  const [initialized, setInitialized] = useState(false);

  const mode = Form.useWatch("mode", form) || "section";

  const fetchBuckets = useCallback(
    async (curMode: string, selectedIds?: number[], scheme = "vn10") => {
      const targetIds =
        selectedIds && selectedIds.length > 0
          ? selectedIds
          : (curMode === "section" ? sections : subjects).map((x) => x.id);
      if (!targetIds.length) return;
      try {
        setLoading(true);
        const { data } = await apiClient.get("/stats/grade-buckets", {
          params: { mode: curMode, ids: targetIds.join(","), scheme },
        });
        setData(data);
      } catch (e: any) {
        message.error(e?.response?.data?.message || "Không tải được phân bố điểm");
      } finally {
        setLoading(false);
      }
    },
    [sections, subjects]
  );

  useEffect(() => {
    if (!initialized && sections.length > 0) {
      fetchBuckets("section", [], "vn10");
      setInitialized(true);
    }
  }, [sections, initialized, fetchBuckets]);

  const onFetch = (values: { mode?: string; ids?: number[]; scheme?: string }) => {
    fetchBuckets(values.mode || "section", values.ids || [], values.scheme || "vn10");
  };

  const chartData = useMemo(
    () => data?.series?.map((s, i) => ({ idx: i + 1, label: s.label, count: s.count })) || [],
    [data]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card styles={{ body: { padding: "14px 20px" } }} style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <Form
          form={form}
          onFinish={onFetch}
          initialValues={{ mode: "section", scheme: "vn10" }}
          style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}
        >
          <Form.Item name="mode" style={{ marginBottom: 0 }}>
            <Segmented
              onChange={(val) => {
                form.setFieldValue("ids", []);
                fetchBuckets(String(val), [], form.getFieldValue("scheme") || "vn10");
              }}
              options={[
                { label: "Theo lớp", value: "section" },
                { label: "Theo môn", value: "subject" },
              ]}
            />
          </Form.Item>
          <Form.Item name="ids" style={{ flex: 1, minWidth: 260, marginBottom: 0 }}>
            <Select
              mode="multiple"
              maxTagCount={3}
              allowClear
              loading={catalogLoading}
              options={(mode === "section" ? sections : subjects).map((x: any) => ({
                value: x.id,
                label:
                  mode === "section"
                    ? `${x.sectionName} (${x.sectionCode})`
                    : `${x.subjectCode} – ${x.subjectName}`,
              }))}
              showSearch
              optionFilterProp="label"
              placeholder={`Mặc định hiển thị tất cả (${mode === "section" ? sections.length + " lớp" : subjects.length + " môn"})`}
            />
          </Form.Item>
          <Form.Item name="scheme" style={{ width: 130, marginBottom: 0 }}>
            <Select options={[{ value: "vn10", label: "Thang 0–10" }]} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PieChart size={15} />}
            loading={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8 }}
          >
            Xem phân bố
          </Button>
        </Form>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title="Tổng quan phổ điểm"
            style={{ borderRadius: 12, border: "1px solid #e2e8f0", height: "100%" }}
          >
            <Row gutter={[16, 20]}>
              <Col span={12}>
                <Statistic title="Tổng bài ghi nhận" value={data?.total || 0} />
              </Col>
              <Col span={12}>
                <Statistic title="Số khoảng điểm" value={data?.series?.length || 0} />
              </Col>
            </Row>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {(data?.series || []).map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "#f8fafc",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <span style={{ fontWeight: 500, color: "#334155" }}>Mức {s.label}</span>
                  <span style={{ fontWeight: 700, color: "#4f46e5" }}>{s.count} SV</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                <PieChart size={17} color="#7c3aed" />
                Biểu đồ phân bố theo khoảng điểm
              </span>
            }
            styles={{ body: { height: 380 } }}
            style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          >
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Spin />
              </div>
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Legend />
                  <Bar dataKey="count" name="Số sinh viên" fill="url(#barGrad2)" radius={[8, 8, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có dữ liệu" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

/** --------------------------------------
 *  Tab 3: Attendance
 *  -------------------------------------- */
function AttendanceTab({
  sections,
  subjects,
  catalogLoading,
}: {
  sections: CatalogSection[];
  subjects: CatalogSubject[];
  catalogLoading: boolean;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AttendanceItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  const mode = Form.useWatch("mode", form) || "section";

  const fetchAttendance = useCallback(
    async (curMode: string, selectedIds?: number[], range?: [Dayjs, Dayjs]) => {
      const targetIds =
        selectedIds && selectedIds.length > 0
          ? selectedIds
          : (curMode === "section" ? sections : subjects).map((x) => x.id);
      if (!targetIds.length) return;
      try {
        setLoading(true);
        const params: any = { mode: curMode, ids: targetIds.join(",") };
        if (range?.[0] && range?.[1]) {
          params.from = range[0].startOf("day").toISOString();
          params.to = range[1].endOf("day").toISOString();
        }
        const { data } = await apiClient.get("/stats/attendance", { params });
        setItems(data.items || []);
      } catch (e: any) {
        message.error(e?.response?.data?.message || "Không tải được chuyên cần");
      } finally {
        setLoading(false);
      }
    },
    [sections, subjects]
  );

  useEffect(() => {
    if (!initialized && sections.length > 0) {
      fetchAttendance("section", []);
      setInitialized(true);
    }
  }, [sections, initialized, fetchAttendance]);

  const onFetch = (values: { mode?: string; ids?: number[]; range?: [Dayjs, Dayjs] }) => {
    fetchAttendance(values.mode || "section", values.ids || [], values.range);
  };

  const columns: ColumnsType<AttendanceItem & { sectionLabel: string }> = [
    { title: mode === "section" ? "Lớp học phần" : "Môn học", dataIndex: "sectionLabel" },
    { title: "Có mặt", dataIndex: "present", align: "right", width: 85 },
    { title: "Trễ", dataIndex: "late", align: "right", width: 70 },
    { title: "Có phép", dataIndex: "excused", align: "right", width: 85 },
    { title: "Vắng", dataIndex: "absent", align: "right", width: 70 },
    { title: "Tổng", dataIndex: "total", align: "right", width: 75 },
    {
      title: "Tỷ lệ (%)",
      dataIndex: "rate",
      align: "right",
      width: 105,
      sorter: (a, b) => Number(a.rate) - Number(b.rate),
      render: (v: number) => {
        const val = Number(v ?? 0);
        return (
          <Tag
            color={val >= 90 ? "green" : val >= 80 ? "geekblue" : val >= 65 ? "gold" : "red"}
            style={{ borderRadius: 6, padding: "2px 8px", fontWeight: 600, margin: 0 }}
          >
            {val.toFixed(1)}%
          </Tag>
        );
      },
    },
  ];

  const dataSource = useMemo(() => {
    const labelMap = (id: number) => {
      if (mode === "section") {
        return sections.find((s) => s.id === id)?.sectionName || String(id);
      }
      const sub = subjects.find((s) => s.id === id);
      return sub ? `${sub.subjectCode} – ${sub.subjectName}` : String(id);
    };
    return items.map((it) => ({
      ...it,
      key: it.sectionId,
      sectionLabel: labelMap(it.sectionId),
    }));
  }, [items, sections, subjects, mode]);

  const chartData = useMemo(
    () => dataSource.map((it) => ({ section: it.sectionLabel, rate: it.rate })),
    [dataSource]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card styles={{ body: { padding: "14px 20px" } }} style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <Form
          form={form}
          onFinish={onFetch}
          initialValues={{ mode: "section" }}
          style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}
        >
          <Form.Item name="mode" style={{ marginBottom: 0 }}>
            <Segmented
              onChange={(val) => {
                form.setFieldValue("ids", []);
                fetchAttendance(String(val), [], form.getFieldValue("range"));
              }}
              options={[
                { label: "Theo lớp", value: "section" },
                { label: "Theo môn", value: "subject" },
              ]}
            />
          </Form.Item>
          <Form.Item name="ids" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
            <Select
              mode="multiple"
              maxTagCount={3}
              allowClear
              loading={catalogLoading}
              options={(mode === "section" ? sections : subjects).map((x: any) => ({
                value: x.id,
                label:
                  mode === "section"
                    ? `${x.sectionName} (${x.sectionCode})`
                    : `${x.subjectCode} – ${x.subjectName}`,
              }))}
              showSearch
              optionFilterProp="label"
              placeholder={`Mặc định hiển thị tất cả (${mode === "section" ? sections.length + " lớp" : subjects.length + " môn"})`}
            />
          </Form.Item>
          <Form.Item name="range" style={{ width: 250, marginBottom: 0 }}>
            <DatePicker.RangePicker allowEmpty={[true, true]} style={{ width: "100%" }} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<Clock size={15} />}
            loading={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8 }}
          >
            Xem chuyên cần
          </Button>
        </Form>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={11}>
          <Card
            title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                <TrendingUp size={17} color="#7c3aed" />
                Tỷ lệ chuyên cần (%)
              </span>
            }
            styles={{ body: { height: 380 } }}
            style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          >
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Spin />
              </div>
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -12, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="section" angle={-20} textAnchor="end" height={65} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    name="Tỷ lệ chuyên cần (%)"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#7c3aed" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có dữ liệu chuyên cần" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={13}>
          <Card
            title="Bảng thống kê điểm danh"
            styles={{ body: { padding: "12px 16px" } }}
            style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          >
            <Table
              size="small"
              rowKey={(r) => String(r.sectionId)}
              loading={loading}
              dataSource={dataSource}
              columns={columns}
              pagination={{ pageSize: 8, showSizeChanger: true }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

/** --------------------------------------
 *  Tab 4: Department Overview
 *  -------------------------------------- */
function DepartmentTab({
  sections,
  subjects,
  subjectById,
  termById,
  catalogLoading,
}: {
  sections: CatalogSection[];
  subjects: CatalogSubject[];
  subjectById: Map<number, CatalogSubject>;
  termById: Map<number, CatalogTerm>;
  catalogLoading: boolean;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<TotalRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  const watchedTermId = Form.useWatch("termId", form);
  const watchedSubjectIds = Form.useWatch("subjectIds", form);

  const filteredSections = useMemo(() => {
    let list = sections;
    if (watchedTermId) list = list.filter((s) => s.termId === watchedTermId);
    if (watchedSubjectIds?.length) {
      list = list.filter((s) => watchedSubjectIds.includes(s.subjectId));
    }
    return list;
  }, [sections, watchedTermId, watchedSubjectIds]);

  const fetchDeptData = useCallback(async (chosenSections: CatalogSection[]) => {
    if (!chosenSections.length) return;
    const sectionIds = chosenSections.map((s) => s.id);
    try {
      setLoading(true);
      const [gRes, aRes] = await Promise.all([
        apiClient.get("/stats/grades", { params: { sectionIds: sectionIds.join(",") } }),
        apiClient.get("/stats/attendance", {
          params: { mode: "section", ids: sectionIds.join(",") },
        }),
      ]);
      setGrades(gRes.data.items || []);
      setAttendance(aRes.data.items || []);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Không tải được dữ liệu khoa");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized && sections.length > 0) {
      fetchDeptData(sections);
      setInitialized(true);
    }
  }, [sections, initialized, fetchDeptData]);

  const onFetch = () => {
    if (!filteredSections.length) return message.warning("Không có lớp nào khớp bộ lọc");
    fetchDeptData(filteredSections);
  };

  const bySubject = useMemo(() => {
    const secById = new Map(filteredSections.map((s) => [s.id, s]));
    const map = new Map<number, TotalRow[]>();
    for (const r of grades) {
      const sec = secById.get(r.sectionId);
      if (!sec) continue;
      const arr = map.get(sec.subjectId) ?? [];
      arr.push(r);
      map.set(sec.subjectId, arr);
    }
    return map;
  }, [grades, filteredSections]);

  const subjectSummary = useMemo(() => {
    const rows: {
      key: string;
      subjectId: number;
      subject: string;
      n: number;
      avg: number;
      pass: number;
      excellent: number;
    }[] = [];
    bySubject.forEach((list, subId) => {
      const subj = subjectById.get(subId);
      const vals = list.map((x) => Number(x.total10 || 0));
      const n = vals.length || 1;
      const avg = +(vals.reduce((a, b) => a + b, 0) / n).toFixed(2);
      const pass = vals.filter((v) => v >= 5).length;
      const excellent = vals.filter((v) => v >= 8).length;
      rows.push({
        key: String(subId),
        subjectId: subId,
        subject: `${subj?.subjectCode ?? subId} – ${subj?.subjectName ?? ""}`,
        n: vals.length,
        avg,
        pass,
        excellent,
      });
    });
    return rows.sort((a, b) => a.subject.localeCompare(b.subject));
  }, [bySubject, subjectById]);

  const top5 = useMemo(() => [...subjectSummary].sort((a, b) => b.avg - a.avg).slice(0, 5), [subjectSummary]);
  const bottom5 = useMemo(() => [...subjectSummary].sort((a, b) => a.avg - b.avg).slice(0, 5), [subjectSummary]);

  const attendanceBySubject = useMemo(() => {
    const secById = new Map(filteredSections.map((s) => [s.id, s]));
    const agg = new Map<
      number,
      { present: number; late: number; excused: number; absent: number; total: number }
    >();
    for (const it of attendance) {
      const sec = secById.get(it.sectionId);
      if (!sec) continue;
      const cur = agg.get(sec.subjectId) || { present: 0, late: 0, excused: 0, absent: 0, total: 0 };
      cur.present += it.present;
      cur.late += it.late;
      cur.excused += it.excused;
      cur.absent += it.absent;
      cur.total += it.total;
      agg.set(sec.subjectId, cur);
    }
    return agg;
  }, [attendance, filteredSections]);

  const attendanceChart = useMemo(() => {
    const rows: { subject: string; rate: number }[] = [];
    attendanceBySubject.forEach((v, subId) => {
      const subj = subjectById.get(subId);
      const denom = v.total || 1;
      const rate = +(((v.present + v.late) / denom) * 100).toFixed(2);
      rows.push({ subject: `${subj?.subjectCode ?? subId}`, rate });
    });
    return rows.sort((a, b) => a.subject.localeCompare(b.subject));
  }, [attendanceBySubject, subjectById]);

  const exportCSV = () => {
    const header = ["SubjectCode-Name", "N", "Avg10", "Pass(>=5)", "Excellent(>=8)"];
    const lines = [
      header.join(","),
      ...subjectSummary.map((r) =>
        [r.subject.replaceAll(",", " "), r.n, r.avg, r.pass, r.excellent].join(",")
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `department-summary.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<any> = [
    { title: "Môn học", dataIndex: "subject", ellipsis: true },
    { title: "Số SV", dataIndex: "n", align: "right", width: 85 },
    {
      title: "Điểm TB",
      dataIndex: "avg",
      align: "right",
      width: 105,
      render: (v: number) => (
        <Tag
          color={v >= 8 ? "green" : v >= 6.5 ? "geekblue" : v >= 5 ? "gold" : "red"}
          style={{ borderRadius: 6, padding: "2px 8px", fontWeight: 600, margin: 0 }}
        >
          {v.toFixed(2)}
        </Tag>
      ),
    },
    { title: "≥ 5", dataIndex: "pass", align: "right", width: 75 },
    { title: "≥ 8", dataIndex: "excellent", align: "right", width: 75 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card styles={{ body: { padding: "14px 20px" } }} style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <Form
          form={form}
          onFinish={onFetch}
          style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}
        >
          <Form.Item name="termId" style={{ width: 220, marginBottom: 0 }}>
            <Select
              allowClear
              loading={catalogLoading}
              options={[...termById.values()].map((t) => ({
                value: t.id,
                label: `${t.code} – ${t.name}`,
              }))}
              showSearch
              optionFilterProp="label"
              placeholder="Tất cả học kỳ"
            />
          </Form.Item>
          <Form.Item name="subjectIds" style={{ flex: 1, minWidth: 260, marginBottom: 0 }}>
            <Select
              mode="multiple"
              maxTagCount={3}
              allowClear
              loading={catalogLoading}
              options={subjects.map((s) => ({
                value: s.id,
                label: `${s.subjectCode} – ${s.subjectName}`,
              }))}
              showSearch
              optionFilterProp="label"
              placeholder="Tất cả môn học (hoặc chọn môn để lọc)"
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<BarChart3 size={15} />}
            loading={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8 }}
          >
            Tổng hợp
          </Button>
          <Button
            icon={<Download size={15} />}
            onClick={exportCSV}
            disabled={!subjectSummary.length}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8 }}
          >
            Xuất CSV
          </Button>
        </Form>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Chỉ số tổng hợp Khoa" style={{ borderRadius: 12, border: "1px solid #e2e8f0", height: "100%" }}>
            <Row gutter={[16, 20]}>
              <Col span={12}>
                <Statistic title="Số môn có dữ liệu" value={subjectSummary.length} />
              </Col>
              <Col span={12}>
                <Statistic title="Số lớp học phần" value={filteredSections.length} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Điểm TB toàn khoa"
                  value={(
                    subjectSummary.reduce((a, b) => a + b.avg * (b.n || 0), 0) /
                    (subjectSummary.reduce((a, b) => a + (b.n || 0), 0) || 1)
                  ).toFixed(2)}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Tỷ lệ đạt (≥ 5)"
                  value={
                    (
                      (subjectSummary.reduce((a, b) => a + b.pass, 0) /
                        (subjectSummary.reduce((a, b) => a + b.n, 0) || 1)) *
                      100
                    ).toFixed(1) + "%"
                  }
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                <BarChart3 size={17} color="#4f46e5" />
                Điểm trung bình theo môn học
              </span>
            }
            styles={{ body: { height: 340 } }}
            style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          >
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Spin />
              </div>
            ) : subjectSummary.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectSummary} margin={{ top: 10, right: 20, left: -12, bottom: 20 }}>
                  <defs>
                    <linearGradient id="barGrad3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={75} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Legend />
                  <Bar dataKey="avg" name="Điểm TB (10)" fill="url(#barGrad3)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có dữ liệu" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Top 5 môn điểm trung bình cao nhất" style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <Table size="small" dataSource={top5} columns={columns} pagination={false} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top 5 môn điểm trung bình thấp nhất" style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <Table size="small" dataSource={bottom5} columns={columns} pagination={false} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                <Clock size={17} color="#7c3aed" />
                Tỷ lệ chuyên cần theo môn học
              </span>
            }
            styles={{ body: { height: 340 } }}
            style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          >
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Spin />
              </div>
            ) : attendanceChart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceChart} margin={{ top: 10, right: 20, left: -12, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="subject" interval={0} angle={-15} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    name="Tỷ lệ chuyên cần (%)"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#7c3aed" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có dữ liệu" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}