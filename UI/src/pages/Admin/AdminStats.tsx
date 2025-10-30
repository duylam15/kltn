import { useEffect, useMemo, useState } from "react";
import {
  Card, Tabs, Form, Select, DatePicker, Button, Space, Row, Col,
  Statistic, Table, Tag, Divider, message, Segmented, Empty, Spin
} from "antd";
import {
  BarChartOutlined, LineChartOutlined, ClockCircleOutlined,
  PieChartOutlined, ReloadOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import type { Dayjs } from "dayjs";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, LineChart, Line, AreaChart, Area
} from "recharts";
import { PrettyTooltip } from "../../components/PrettyTooltip";

/* === Types & API === */
type CatalogTerm = { id:number; code:string; name:string; startDate:string; endDate:string };
type CatalogSubject = { id:number; subjectCode:string; subjectName:string };
type CatalogTeacher = { id:number; code:string; fullName:string };
type CatalogSection = { id:number; sectionCode:string; sectionName:string; subjectId:number; termId:number; teacherIds:number[] };

type TotalRow = { sectionId:number; studentId:number; studentCode:string; studentName:string; total10:number; };
type BucketSeriesRes = { scheme:string; buckets: { label:string; from:number; to:number }[]; total: number; series: { label:string; count:number }[]; };
type AttendanceItem = { sectionId:number; present:number; late:number; excused:number; absent:number; total:number; rate:number; };

const API_BASE = "http://localhost:4000/api/v1";

/* === CSS Glassmorphism & Neumorphism === */
const glassStyle = {
  background: "rgba(255, 255, 255, 0.75)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.07), inset 0 0 0 0.5px rgba(255, 255, 255, 0.2)",
  borderRadius: "16px",
};

const darkGlassStyle = {
  background: "rgba(15, 15, 30, 0.7)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  borderRadius: "16px",
};

const kpiIconStyle = (color1: string, color2: string) => ({
  width: 48,
  height: 48,
  borderRadius: 16,
  background: `linear-gradient(135deg, ${color1}, ${color2})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  fontSize: 20,
});

/* === useCatalog === */
function useCatalog() {
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState<CatalogTerm[]>([]);
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [teachers, setTeachers] = useState<CatalogTeacher[]>([]);
  const [sections, setSections] = useState<CatalogSection[]>([]);

  const reload = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/catalog/catalog`, {
        params: { scopes: "terms,subjects,sections,teachers" },
      });
      setTerms(data.terms || []);
      setSubjects(data.subjects || []);
      setTeachers(data.teachers || []);
      setSections(data.sections || []);
    } catch (e:any) {
      message.error(e?.response?.data?.message || "Không tải được danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const teacherById = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
  const subjectById = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const termById = useMemo(() => new Map(terms.map(t => [t.id, t])), [terms]);

  return { loading, terms, subjects, teachers, sections, teacherById, subjectById, termById, reload };
}

function SectionOption({ s, subjectById, termById, teacherById }: {
  s: CatalogSection;
  subjectById: Map<number, CatalogSubject>;
  termById: Map<number, CatalogTerm>;
  teacherById: Map<number, CatalogTeacher>;
}) {
  const subject = subjectById.get(s.subjectId);
  const term = termById.get(s.termId);
  const tNames = s.teacherIds.map(id => teacherById.get(id)?.fullName).filter(Boolean).join(", ");

  return (
    <div className="flex flex-col">
      <div><b>{s.sectionName}</b> <Tag color="blue" style={{ marginLeft: 6, borderRadius: 8 }}>{s.sectionCode}</Tag></div>
      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
        {subject ? `${subject.subjectCode} – ${subject.subjectName}` : "(No subject)"} · {term?.code || ""}{tNames ? ` · GV: ${tNames}` : ""}
      </div>
    </div>
  );
}

/* === MAIN PAGE === */
export default function AdminStats() {
  const { loading: catLoading, sections, subjects, teacherById, subjectById, termById, reload } = useCatalog();
  const [activeKey, setActiveKey] = useState("grades");

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: "#ffffff" }}>
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        {/* Header */}
        <Card style={glassStyle} bodyStyle={{ padding: "20px 24px" }}>
          <div className="flex items-center gap-3">
            <div style={kpiIconStyle("#6c5ce7", "#8e79ff")}>📊</div>
            <div>
              <h2 className="m-0 text-xl font-bold text-gray-800">Thống kê học tập &amp; chuyên cần</h2>
              <p className="m-0 text-sm text-gray-600">Tổng hợp dữ liệu theo lớp, môn, học kỳ</p>
            </div>
          </div>
        </Card>

        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          tabBarStyle={{ marginBottom: 0 }}
          items={[
            { key: "grades", label: <Space><LineChartOutlined />Điểm trung bình</Space>, children: <GradesTab {...{ sections, subjects, subjectById, termById, teacherById, catalogLoading: catLoading }} /> },
            { key: "buckets", label: <Space><PieChartOutlined />Phân bố điểm</Space>, children: <BucketsTab {...{ sections, subjects, catalogLoading: catLoading }} /> },
            { key: "attendance", label: <Space><ClockCircleOutlined />Chuyên cần</Space>, children: <AttendanceTab {...{ sections, subjects, catalogLoading: catLoading }} /> },
            { key: "dept", label: <Space><BarChartOutlined />Tổng quan Khoa</Space>, children: <DepartmentTab {...{ sections, subjects, subjectById, termById, catalogLoading: catLoading }} /> },
          ]}
        />
      </Space>
    </div>
  );
}

/* === GradesTab === */
function GradesTab({ sections, subjects, subjectById, termById, teacherById, catalogLoading }: any) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TotalRow[]>([]);
  const [mode, setMode] = useState<"section" | "subject">("section");
  const [sectionIds, setSectionIds] = useState<number[]>([]);
  const [subjectIds, setSubjectIds] = useState<number[]>([]);

  useEffect(() => {
    form.setFieldsValue({ ids: mode === "section" ? sectionIds : subjectIds });
  }, [mode, sectionIds, subjectIds, form]);

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
    const ret: Record<number, { n:number; avg:number; min:number; max:number }> = {};
    groupedBySection.forEach((rows, secId) => {
      const vals = rows.map(r => r.total10);
      const n = vals.length || 1;
      const avg = +(vals.reduce((a,b)=>a+b,0) / n).toFixed(2);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      ret[secId] = { n, avg, min, max };
    });
    return ret;
  }, [groupedBySection]);

  const onFetch = async () => {
    const ids: number[] = form.getFieldValue("ids") || [];
    if (!ids.length) return message.warning("Chọn ít nhất 1 mục");

    try {
      setLoading(true);
      const params: any = {};
      if (mode === "section") params.sectionIds = ids.join(",");
      else params.subjectIds = ids.join(",");

      const { data } = await axios.get(`${API_BASE}/stats/grades`, { params });
      setItems(data.items || []);
    } catch (e:any) {
      message.error(e?.response?.data?.message || "Không tải được điểm");
    } finally {
      setLoading(false);
    }
  };

  const dataSource = useMemo(() => {
    const secLabel = (id: number) => {
      const s = sections.find((x: any) => x.id === id);
      if (!s) return String(id);
      const subj = subjectById.get(s.subjectId);
      const term = termById.get(s.termId);
      const tNames = s.teacherIds.map((tid: number) => teacherById.get(tid)?.fullName).filter(Boolean).join(", ");
      return `${s.sectionName} · ${subj?.subjectCode ?? ""} · ${term?.code ?? ""}${tNames ? " · " + tNames : ""}`;
    };

    return items.map(r => ({
      ...r,
      key: `${r.sectionId}-${r.studentId}`,
      sectionLabel: mode === "section" ? secLabel(r.sectionId) : `${subjectById.get(sections.find((x: any) => x.id === r.sectionId)?.subjectId || 0)?.subjectCode} – ${subjectById.get(sections.find((x: any) => x.id === r.sectionId)?.subjectId || 0)?.subjectName}`,
    }));
  }, [items, sections, subjectById, termById, teacherById, mode]);

  const chartData = useMemo(() => {
    return Array.from(groupedBySection.entries()).map(([secId, list]) => {
      const st = statsBySection[secId];
      const s = sections.find((x: any) => x.id === secId);
      const label = mode === "section" ? (s?.sectionName || String(secId)) : (subjectById.get(s?.subjectId || 0)?.subjectCode || "Unknown");
      return { name: label, avg: st?.avg || 0 };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [groupedBySection, statsBySection, sections, subjectById, mode]);

  const values = items.map(i => i.total10 ?? 0);
  const avg = values.length ? +(values.reduce((a,b)=>a+b,0)/values.length).toFixed(2) : 0;
  const pass = values.filter(v=>v>=5).length;
  const excellent = values.filter(v=>v>=8).length;

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      {/* Filter */}
      <Card style={glassStyle} className="sticky top-0 z-10" bodyStyle={{ padding: "16px" }}>
        <Form form={form} layout="inline" onFinish={onFetch}>
          <Space wrap>
            <Form.Item label="Chế độ">
              <Segmented value={mode} onChange={v => setMode(v as any)} options={[{ label: "Theo lớp", value: "section" }, { label: "Theo môn", value: "subject" }]} />
            </Form.Item>
            <Form.Item name="ids" style={{ minWidth: 300 }}>
              <Select
                mode="multiple"
                placeholder={mode === "section" ? "Chọn lớp..." : "Chọn môn..."}
                loading={catalogLoading}
                options={(mode === "section" ? sections : subjects).map((s: any) => ({
                  value: s.id,
                  label: mode === "section" ? `${s.sectionName} (${s.sectionCode})` : `${s.subjectCode} – ${s.subjectName}`,
                }))}
                onChange={(vals: number[]) => mode === "section" ? setSectionIds(vals) : setSubjectIds(vals)}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<LineChartOutlined />} loading={loading}>Xem</Button>
          </Space>
        </Form>
      </Card>

      {/* KPI */}
      <Row gutter={[16, 16]}>
        {[
          { label: "Số bản ghi", value: items.length, icon: "📄", color: ["#10b981", "#34d399"] },
          { label: "Điểm TB", value: avg, icon: <AreaChart data={values.map((v,i)=>({i,v}))} style={{ height: 36 }} />, color: ["#6c5ce7", "#8e79ff"] },
          { label: "≥ 5 điểm", value: pass, icon: "✅", color: ["#f59e0b", "#fbbf24"] },
          { label: "≥ 8 điểm", value: excellent, icon: "Trophy", color: ["#ec4899", "#f43f5e"] },
        ].map((kpi, i) => (
          <Col xs={12} md={6} key={i}>
            <Card style={glassStyle} className="hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-70">{kpi.label}</div>
                  <div className="text-2xl font-bold">{typeof kpi.value === "number" ? kpi.value : kpi.value}</div>
                </div>
                <div style={kpiIconStyle(kpi.color[0], kpi.color[1])}>{kpi.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Chart + Table */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card style={glassStyle} title="Điểm TB theo lớp/môn" bodyStyle={{ height: 380, padding: 0 }}>
            {loading ? <Spin /> : chartData.length ? (
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <defs><linearGradient id="barG1"><stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.9}/><stop offset="100%" stopColor="#6c5ce7" stopOpacity={0.3}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" height={70} />
                  <YAxis domain={[0, 10]} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Bar dataKey="avg" fill="url(#barG1)" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card style={glassStyle} title="Danh sách sinh viên">
            <Table size="small" dataSource={dataSource} columns={[
              { title: "Mã SV", dataIndex: "studentCode", width: 100 },
              { title: "Họ tên", dataIndex: "studentName" },
              { title: mode === "section" ? "Lớp" : "Môn", dataIndex: "sectionLabel" },
              { title: "Điểm", dataIndex: "total10", align: "right", render: v => <Tag color={v>=8?"green":v>=6.5?"geekblue":v>=5?"gold":"red"} style={{ borderRadius: 8 }}>{v.toFixed(2)}</Tag> },
            ]} pagination={{ pageSize: 8 }} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}


/* ========================================
   BUCKETS TAB – PHÂN BỐ ĐIỂM
======================================== */
function BucketsTab({
  sections,
  subjects,
  catalogLoading
}: {
  sections: CatalogSection[];
  subjects: CatalogSubject[];
  catalogLoading: boolean;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BucketSeriesRes | null>(null);
  const [sectionIds, setSectionIds] = useState<number[]>([]);
  const [subjectIds, setSubjectIds] = useState<number[]>([]);
  const mode = Form.useWatch("mode", form) || "section";

  const handleIdsChange = (vals: number[]) => {
    if (mode === "section") setSectionIds(vals);
    else setSubjectIds(vals);
    form.setFieldsValue({ ids: vals });
  };

  useEffect(() => {
    form.setFieldsValue({ ids: mode === "section" ? sectionIds : subjectIds });
  }, [mode, form, sectionIds, subjectIds]);

  const onFetch = async () => {
    const ids: number[] = form.getFieldValue("ids") || [];
    if (!ids.length) return message.warning("Chọn ít nhất 1 mục");

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/stats/grade-buckets`, {
        params: { mode, ids: ids.join(","), scheme: "vn10" },
      });
      setData(res.data);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Không tải được phân bố điểm");
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => data?.series?.map((s, i) => ({ idx: i + 1, label: s.label, count: s.count })) || [], [data]);

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      {/* Filter */}
      <Card style={glassStyle} className="sticky top-0 z-10" bodyStyle={{ padding: "16px" }}>
        <Form form={form} layout="inline" onFinish={onFetch} initialValues={{ mode: "section" }}>
          <Space wrap>
            <Form.Item name="mode" label="Chế độ">
              <Segmented options={[{ label: "Theo lớp", value: "section" }, { label: "Theo môn", value: "subject" }]} />
            </Form.Item>
            <Form.Item name="ids" style={{ minWidth: 300 }}>
              <Select
                mode="multiple"
                placeholder={mode === "section" ? "Chọn lớp..." : "Chọn môn..."}
                loading={catalogLoading}
                options={(mode === "section" ? sections : subjects).map((x: any) => ({
                  value: x.id,
                  label: mode === "section" ? `${x.sectionName} (${x.sectionCode})` : `${x.subjectCode} – ${x.subjectName}`,
                }))}
                onChange={handleIdsChange}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<PieChartOutlined />} loading={loading}>Xem phân bố</Button>
          </Space>
        </Form>
      </Card>

      {/* KPI + Chart */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card style={glassStyle} className="hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-70">Tổng bài ghi nhận</div>
                <div className="text-2xl font-bold">{data?.total || 0}</div>
              </div>
              <div style={kpiIconStyle("#8b5cf6", "#a78bfa")}>📊</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={glassStyle} className="hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-70">Số nhóm điểm</div>
                <div className="text-2xl font-bold">{data?.series?.length || 0}</div>
              </div>
              <div style={kpiIconStyle("#ec4899", "#f43f5e")}>🎯</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card style={glassStyle} title="Phân bố điểm theo nhóm" bodyStyle={{ height: 380, padding: 0 }}>
            {loading ? <Spin /> : chartData.length ? (
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="barG2"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Bar dataKey="count" name="Số SV" fill="url(#barG2)" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty description="Chưa có dữ liệu" />}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

/* ========================================
   ATTENDANCE TAB – CHUYÊN CẦN
======================================== */
function AttendanceTab({
  sections,
  subjects,
  catalogLoading
}: {
  sections: CatalogSection[];
  subjects: CatalogSubject[];
  catalogLoading: boolean;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AttendanceItem[]>([]);
  const [sectionIds, setSectionIds] = useState<number[]>([]);
  const [subjectIds, setSubjectIds] = useState<number[]>([]);
  const mode = Form.useWatch("mode", form) || "section";

  const handleIdsChange = (vals: number[]) => {
    if (mode === "section") setSectionIds(vals);
    else setSubjectIds(vals);
    form.setFieldsValue({ ids: vals });
  };

  useEffect(() => {
    form.setFieldsValue({ ids: mode === "section" ? sectionIds : subjectIds });
  }, [mode, form, sectionIds, subjectIds]);

  const onFetch = async () => {
    const ids: number[] = form.getFieldValue("ids") || [];
    const range: [Dayjs, Dayjs] | undefined = form.getFieldValue("range");
    if (!ids.length) return message.warning("Chọn ít nhất 1 mục");

    try {
      setLoading(true);
      const params: any = { mode, ids: ids.join(",") };
      if (range) {
        params.from = range[0].startOf("day").toISOString();
        params.to = range[1].endOf("day").toISOString();
      }
      const { data } = await axios.get(`${API_BASE}/stats/attendance`, { params });
      setItems(data.items || []);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Không tải được chuyên cần");
    } finally {
      setLoading(false);
    }
  };

  const dataSource = useMemo(() => {
    return items.map(it => ({
      ...it,
      key: it.sectionId,
      sectionLabel: sections.find(s => s.id === it.sectionId)?.sectionName || String(it.sectionId),
    }));
  }, [items, sections]);

  const chartData = useMemo(() => dataSource.map(it => ({ section: it.sectionLabel, rate: it.rate })), [dataSource]);

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      {/* Filter */}
      <Card style={glassStyle} className="sticky top-0 z-10" bodyStyle={{ padding: "16px" }}>
        <Form form={form} layout="inline" onFinish={onFetch} initialValues={{ mode: "section" }}>
          <Space wrap>
            <Form.Item name="mode" label="Chế độ">
              <Segmented options={[{ label: "Theo lớp", value: "section" }, { label: "Theo môn", value: "subject" }]} />
            </Form.Item>
            <Form.Item name="ids" style={{ minWidth: 280 }}>
              <Select
                mode="multiple"
                placeholder={mode === "section" ? "Chọn lớp..." : "Chọn môn..."}
                loading={catalogLoading}
                options={(mode === "section" ? sections : subjects).map((x: any) => ({
                  value: x.id,
                  label: mode === "section" ? `${x.sectionName} (${x.sectionCode})` : `${x.subjectCode} – ${x.subjectName}`,
                }))}
                onChange={handleIdsChange}
              />
            </Form.Item>
            <Form.Item name="range">
              <DatePicker.RangePicker allowEmpty={[true, true]} />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<ClockCircleOutlined />} loading={loading}>Xem</Button>
          </Space>
        </Form>
      </Card>

      {/* Chart + Table */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card style={glassStyle} title="Tỷ lệ chuyên cần" bodyStyle={{ height: 380, padding: 0 }}>
            {loading ? <Spin /> : chartData.length ? (
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="lineG"><stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/><stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="section" angle={-15} textAnchor="end" height={70} />
                  <YAxis domain={[0, 100]} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card style={glassStyle} title="Chi tiết chuyên cần">
            <Table
              size="small"
              dataSource={dataSource}
              columns={[
                { title: mode === "section" ? "Lớp" : "Môn", dataIndex: "sectionLabel" },
                { title: "Có mặt", dataIndex: "present", align: "right", width: 90 },
                { title: "Trễ", dataIndex: "late", align: "right", width: 70 },
                { title: "Có phép", dataIndex: "excused", align: "right", width: 90 },
                { title: "Vắng", dataIndex: "absent", align: "right", width: 70 },
                { title: "Tổng", dataIndex: "total", align: "right", width: 80 },
                { title: "Tỷ lệ", dataIndex: "rate", align: "right", render: v => <Tag color={v>=90?"green":v>=80?"geekblue":v>=65?"gold":"red"} style={{ borderRadius: 8 }}>{v.toFixed(1)}%</Tag> },
              ]}
              pagination={{ pageSize: 8 }}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

/* ========================================
   DEPARTMENT TAB – TỔNG QUAN KHOA
======================================== */
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

  const filteredSections = useMemo(() => {
    const termId: number | undefined = form.getFieldValue("termId");
    const subjectIds: number[] = form.getFieldValue("subjectIds") || [];
    let list = sections;
    if (termId) list = list.filter(s => s.termId === termId);
    if (subjectIds.length) list = list.filter(s => subjectIds.includes(s.subjectId));
    return list;
  }, [sections, form]);

  const onFetch = async () => {
    const sectionIds = filteredSections.map(s => s.id);
    if (!sectionIds.length) return message.warning("Không có lớp nào khớp");

    try {
      setLoading(true);
      const [gRes, aRes] = await Promise.all([
        axios.get(`${API_BASE}/stats/grades`, { params: { sectionIds: sectionIds.join(",") } }),
        axios.get(`${API_BASE}/stats/attendance`, { params: { mode: "section", ids: sectionIds.join(",") } }),
      ]);
      setGrades(gRes.data.items || []);
      setAttendance(aRes.data.items || []);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Không tải được dữ liệu khoa");
    } finally {
      setLoading(false);
    }
  };

  const subjectSummary = useMemo(() => {
    const map = new Map<number, TotalRow[]>();
    filteredSections.forEach(s => {
      const arr = map.get(s.subjectId) ?? [];
      grades.filter(g => g.sectionId === s.id).forEach(g => arr.push(g));
      map.set(s.subjectId, arr);
    });

    return Array.from(map.entries()).map(([subId, list]) => {
      const subj = subjectById.get(subId);
      const vals = list.map(x => x.total10);
      const n = vals.length || 1;
      const avg = +(vals.reduce((a,b)=>a+b,0)/n).toFixed(2);
      const pass = list.filter(x=>x.total10 >= 5).length;
      const excellent = list.filter(x=>x.total10 >= 8).length;
      return { key: subId, subjectId: subId, subject: `${subj?.subjectCode} – ${subj?.subjectName}`, n: vals.length, avg, pass, excellent };
    }).sort((a,b) => String(a.subject).localeCompare(String(b.subject)));
  }, [grades, filteredSections, subjectById]);

  const top5 = [...subjectSummary].sort((a,b)=>b.avg-a.avg).slice(0,5);
  const bottom5 = [...subjectSummary].sort((a,b)=>a.avg-b.avg).slice(0,5);

  const attendanceChart = useMemo(() => {
    const agg = new Map<number, { present:number; late:number; total:number }>();
    attendance.forEach(it => {
      const sec = filteredSections.find(s => s.id === it.sectionId);
      if (!sec) return;
      const cur = agg.get(sec.subjectId) || { present:0, late:0, total:0 };
      cur.present += it.present; cur.late += it.late; cur.total += it.total;
      agg.set(sec.subjectId, cur);
    });
    return Array.from(agg.entries()).map(([subId, v]) => {
      const subj = subjectById.get(subId);
      const rate = v.total ? +(((v.present + v.late) / v.total) * 100).toFixed(1) : 0;
      return { subject: subj?.subjectCode || subId, rate };
    }).sort((a,b) => a.subject.localeCompare(b.subject));
  }, [attendance, filteredSections, subjectById]);

  const exportCSV = () => {
    const lines = [
      "Môn học,Số SV,Điểm TB,>=5,>=8",
      ...subjectSummary.map(r => `${r.subject.replace(/,/g," ")},${r.n},${r.avg},${r.pass},${r.excellent}`)
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "khoa-summary.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      {/* Filter */}
      <Card style={glassStyle} className="sticky top-0 z-10" bodyStyle={{ padding: "16px" }}>
        <Form form={form} layout="inline" onFinish={onFetch}>
          <Space wrap>
            <Form.Item name="termId" label="Học kỳ">
              <Select allowClear loading={catalogLoading} options={[...termById.values()].map(t => ({ value: t.id, label: `${t.code} – ${t.name}` }))} style={{ width: 200 }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<BarChartOutlined />} loading={loading}>Tổng hợp</Button>
            <Button onClick={exportCSV} icon={<ReloadOutlined />}>Xuất CSV</Button>
          </Space>
        </Form>
      </Card>

      {/* KPIs */}
      <Row gutter={[16,16]}>
        <Col xs={24} md={8}>
          <Card style={glassStyle} className="hover:scale-105 transition-transform">
            <Statistic title="Số môn" value={subjectSummary.length} prefix={<div style={kpiIconStyle("#6366f1", "#4f46e5")}>📚</div>} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={glassStyle} className="hover:scale-105 transition-transform">
            <Statistic title="Số lớp" value={filteredSections.length} prefix={<div style={kpiIconStyle("#ec4899", "#f43f5e")}>🏫</div>} />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Row gutter={[16,16]}>
        <Col xs={24}>
          <Card style={glassStyle} title="Điểm trung bình theo môn" bodyStyle={{ height: 380, padding: 0 }}>
            {loading ? <Spin /> : subjectSummary.length ? (
              <ResponsiveContainer>
                <BarChart data={subjectSummary}>
                  <defs><linearGradient id="barG3"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.9}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0.3}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" angle={-15} textAnchor="end" height={80} />
                  <YAxis domain={[0,10]} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Bar dataKey="avg" fill="url(#barG3)" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </Card>
        </Col>
      </Row>

      {/* Top/Bottom + Attendance */}
      <Row gutter={[16,16]}>
        <Col xs={24} lg={12}>
          <Card style={glassStyle} title="Top 5 môn điểm cao">
            <Table size="small" dataSource={top5} columns={[
              { title: "Môn", dataIndex: "subject" },
              { title: "Điểm TB", dataIndex: "avg", render: v => <Tag color="green" style={{ borderRadius: 8 }}>{v}</Tag> },
            ]} pagination={false} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={glassStyle} title="Bottom 5 môn điểm thấp">
            <Table size="small" dataSource={bottom5} columns={[
              { title: "Môn", dataIndex: "subject" },
              { title: "Điểm TB", dataIndex: "avg", render: v => <Tag color="red" style={{ borderRadius: 8 }}>{v}</Tag> },
            ]} pagination={false} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16,16]}>
        <Col xs={24}>
          <Card style={glassStyle} title="Chuyên cần theo môn" bodyStyle={{ height: 380, padding: 0 }}>
            {loading ? <Spin /> : attendanceChart.length ? (
              <ResponsiveContainer>
                <LineChart data={attendanceChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" angle={-15} textAnchor="end" height={80} />
                  <YAxis domain={[0,100]} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
