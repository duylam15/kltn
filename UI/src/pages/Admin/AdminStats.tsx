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

/* --------------------------------------
 *  Types from backend
 * -------------------------------------- */
type CatalogTerm = { id:number; code:string; name:string; startDate:string; endDate:string };
type CatalogSubject = { id:number; subjectCode:string; subjectName:string };
type CatalogTeacher = { id:number; code:string; fullName:string };
type CatalogSection = { id:number; sectionCode:string; sectionName:string; subjectId:number; termId:number; teacherIds:number[] };

type TotalRow = {
  sectionId:number;
  studentId:number;
  studentCode:string;
  studentName:string;
  total10:number;
};

type BucketSeriesRes = {
  scheme:string;
  buckets: { label:string; from:number; to:number }[];
  total: number;
  series: { label:string; count:number }[];
};

type AttendanceItem = {
  sectionId:number;
  present:number;
  late:number;
  excused:number;
  absent:number;
  total:number;
  rate:number;
};

/* --------------------------------------
 *  API base
 * -------------------------------------- */
const API_BASE = "http://localhost:4000/api/v1";

/* --------------------------------------
 *  Catalog hook
 * -------------------------------------- */
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

  const teacherById = useMemo(
    () => new Map(teachers.map(t => [t.id, t])),
    [teachers]
  );
  const subjectById = useMemo(
    () => new Map(subjects.map(s => [s.id, s])),
    [subjects]
  );
  const termById = useMemo(
    () => new Map(terms.map(t => [t.id, t])),
    [terms]
  );

  return {
    loading,
    terms,
    subjects,
    teachers,
    sections,
    teacherById,
    subjectById,
    termById,
    reload,
  };
}

function SectionOption({
  s, subjectById, termById, teacherById
}:{
  s:CatalogSection;
  subjectById:Map<number,CatalogSubject>;
  termById:Map<number,CatalogTerm>;
  teacherById:Map<number,CatalogTeacher>;
}) {
  const subject = subjectById.get(s.subjectId);
  const term = termById.get(s.termId);
  const tNames = s.teacherIds
    .map(id => teacherById.get(id)?.fullName)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col">
      <div>
        <b>{s.sectionName}</b>{" "}
        <Tag color="blue" style={{ marginLeft: 6 }}>
          {s.sectionCode}
        </Tag>
      </div>
      <div style={{ fontSize:12, opacity:.85 }}>
        {subject
          ? `${subject.subjectCode} – ${subject.subjectName}`
          : "(No subject)"}
        {" · "}
        {term ? term.code : ""}
        {tNames ? ` · GV: ${tNames}` : ""}
      </div>
    </div>
  );
}

/* --------------------------------------
 *  Page
 * -------------------------------------- */
export default function AdminStats() {
  const {
    loading: catLoading,
    sections,
    subjects,
    teacherById,
    subjectById,
    termById,
    reload
  } = useCatalog();

  const [activeKey, setActiveKey] = useState("grades");

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* Header */}
      <Row gutter={[16,16]} className="card-glass">
        <Col xs={24}>
          <Card
            bordered
            title={
              <Space align="center">
                <span
                  style={{
                    display:"inline-flex",
                    width:36,
                    height:36,
                    alignItems:"center",
                    justifyContent:"center",
                    borderRadius:12,
                    background:"linear-gradient(135deg,#6c5ce7,#8e79ff)",
                    color:"#fff",
                  }}
                >
                  📊
                </span>
                <span>Thống kê học tập &amp; chuyên cần</span>
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={reload}
              >
                Làm mới danh mục
              </Button>
            }
          >
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        items={[
          {
            key: "grades",
            label: (
              <Space>
                <LineChartOutlined />
                Điểm trung bình
              </Space>
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
              <Space>
                <PieChartOutlined />
                Phân bố điểm
              </Space>
            ),
            children: (
              <BucketsTab
                sections={sections}
                subjects={subjects}
                catalogLoading={catLoading}
              />
            ),
          },
          {
            key: "attendance",
            label: (
              <Space>
                <ClockCircleOutlined />
                Chuyên cần
              </Space>
            ),
            children: (
              <AttendanceTab
                sections={sections}
                subjects={subjects}
                catalogLoading={catLoading}
              />
            ),
          },
          {
            key: "dept",
            label: (
              <Space>
                <BarChartOutlined />
                Tổng quan Khoa
              </Space>
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
    </Space>
  );
}

/* --------------------------------------
 *  Tab: Grades
 * -------------------------------------- */
function GradesTab({
  sections,
  subjectById,
  termById,
  teacherById,
  catalogLoading,
}:{
  sections: CatalogSection[];
  subjectById: Map<number,CatalogSubject>;
  termById: Map<number,CatalogTerm>;
  teacherById: Map<number,CatalogTeacher>;
  catalogLoading:boolean;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TotalRow[]>([]);

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
    const ret: Record<
      number,
      { n:number; avg:number; min:number; max:number }
    > = {};
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
    const sectionIds:number[] = form.getFieldValue("sectionIds") || [];
    if (!sectionIds.length) {
      message.warning("Chọn ít nhất 1 lớp (section)");
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/stats/grades`, {
        params: { sectionIds: sectionIds.join(",") },
      });
      setItems(data.items || []);
    } catch (e:any) {
      message.error(
        e?.response?.data?.message || "Không tải được điểm"
      );
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<TotalRow & { sectionLabel:string }> = [
    { title: "Mã SV", dataIndex: "studentCode", width: 120 },
    { title: "Họ tên", dataIndex: "studentName" },
    { title: "Lớp", dataIndex: "sectionLabel", width: 240 },
    {
      title: "Điểm TB (10)",
      dataIndex: "total10",
      width: 140,
      align:"right",
      render: (v:number)=> (
        <Tag
          color={
            v>=8
              ? "green"
              : v>=6.5
              ? "geekblue"
              : v>=5
              ? "gold"
              : "red"
          }
          style={{
            borderRadius:8,
            padding:"2px 8px",
            minWidth:64,
            textAlign:"center",
          }}
        >
          {v.toFixed(2)}
        </Tag>
      ),
    },
  ];

  const dataSource = useMemo(() => {
    const secLabel = (id:number) => {
      const s = sections.find(x=>x.id===id);
      if (!s) return String(id);
      const subj = subjectById.get(s.subjectId);
      const term = termById.get(s.termId);
      const tNames = s.teacherIds
        .map(tid => teacherById.get(tid)?.fullName)
        .filter(Boolean)
        .join(", ");
      return `${s.sectionName} · ${subj?.subjectCode ?? ""} · ${
        term?.code ?? ""
      }${tNames ? " · " + tNames : ""}`;
    };
    return items.map(r => ({
      ...r,
      key: `${r.sectionId}-${r.studentId}`,
      sectionLabel: secLabel(r.sectionId),
    }));
  }, [items, sections, subjectById, termById, teacherById]);

  const chartData = useMemo(() => {
    const rows: { section:string; avg:number }[] = [];
    groupedBySection.forEach((list, secId) => {
      const st = statsBySection[secId];
      const s = sections.find(x=>x.id===secId);
      rows.push({
        section: s?.sectionName || String(secId),
        avg: st?.avg || 0,
      });
    });
    return rows.sort((a,b)=>a.section.localeCompare(b.section));
  }, [groupedBySection, statsBySection, sections]);

  // KPIs
  const values = items.map(i => i.total10 ?? 0);
  const avg = values.length
    ? +(values.reduce((a,b)=>a+b,0)/values.length).toFixed(2)
    : 0;
  const pass = values.filter(v=>v>=5).length;
  const excellent = values.filter(v=>v>=8).length;

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* Filters */}
      <Card className="card-glass sticky-filters">
        <Form form={form} layout="vertical" onFinish={onFetch}>
          <Form.Item
            name="sectionIds"
            label="Chọn lớp (Section)"
            tooltip="Có thể chọn nhiều lớp để so sánh"
          >
            <Select
              mode="multiple"
              maxTagCount="responsive"
              loading={catalogLoading}
              allowClear
              placeholder="Tìm theo tên lớp, mã lớp, môn học..."
              optionFilterProp="label"
              options={sections.map(s => ({
                value: s.id,
                label: `${s.sectionName} (${s.sectionCode})`,
                section: s,
              }))}
              optionRender={(opt) => {
                // @ts-ignore
                const sec:CatalogSection = opt.data.section;
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

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<LineChartOutlined />}
                loading={loading}
              >
                Xem thống kê
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* KPI Tiles */}
      <Row gutter={[16,16]}>
        <Col xs={24} md={6}>
          <Card className="card-glass">
            <div className="kpi-tile">
              <div>
                <div style={{opacity:.7,fontSize:12}}>Số bản ghi</div>
                <div style={{fontWeight:700,fontSize:24}}>
                  {items.length}
                </div>
              </div>
              <div className="kpi-icon">📄</div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="card-glass">
            <div className="kpi-tile">
              <div>
                <div style={{opacity:.7,fontSize:12}}>Điểm TB</div>
                <div style={{fontWeight:700,fontSize:24}}>{avg}</div>
              </div>
              <div style={{height:38}}>
                <ResponsiveContainer width={80} height={38}>
                  <AreaChart data={values.map((v,i)=>({i,v}))}>
                    <defs>
                      <linearGradient
                        id="gAvg"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#6c5ce7"
                          stopOpacity={0.7}
                        />
                        <stop
                          offset="100%"
                          stopColor="#6c5ce7"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      dataKey="v"
                      stroke="#6c5ce7"
                      fill="url(#gAvg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="card-glass">
            <div className="kpi-tile">
              <div>
                <div style={{opacity:.7,fontSize:12}}>≥ 5 điểm</div>
                <div style={{fontWeight:700,fontSize:24}}>
                  {pass}
                </div>
              </div>
              <div className="kpi-icon">✅</div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className="card-glass">
            <div className="kpi-tile">
              <div>
                <div style={{opacity:.7,fontSize:12}}>≥ 8 điểm</div>
                <div style={{fontWeight:700,fontSize:24}}>
                  {excellent}
                </div>
              </div>
              <div className="kpi-icon">🏆</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Chart + Table */}
      <Row gutter={[16,16]}>
        <Col xs={24} lg={10}>
          <Card
            className="card-glass"
            title="Điểm trung bình theo lớp"
            bodyStyle={{ height: 360 }}
          >
            {loading ? (
              <Spin />
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="barGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#6c5ce7"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor="#6c5ce7"
                        stopOpacity={0.3}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="section"
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0, 10]} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="avg"
                    name="Điểm TB (10)"
                    fill="url(#barGrad)"
                    radius={[8,8,0,0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có dữ liệu" />
            )}
          </Card>

          <div
            style={{
              marginTop: 12,
              display:"grid",
              gridTemplateColumns:"1fr 1fr",
              gap:12,
            }}
          >
            <Card size="small" className="card-glass">
              <Statistic
                title="Điểm thấp nhất"
                value={(
                  values.length ? Math.min(...values) : 0
                ).toFixed(2)}
              />
            </Card>
            <Card size="small" className="card-glass">
              <Statistic
                title="Điểm cao nhất"
                value={(
                  values.length ? Math.max(...values) : 0
                ).toFixed(2)}
              />
            </Card>
          </div>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            className="card-glass"
            title={
              <Space>
                <BarChartOutlined />
                Danh sách điểm theo sinh viên
              </Space>
            }
          >
            <Table
              size="middle"
              rowKey={(r)=>`${r.sectionId}-${r.studentId}`}
              loading={loading}
              dataSource={dataSource}
              columns={columns}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
              }}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

/* --------------------------------------
 *  Tab: Buckets
 *  (Phân bố điểm, có 2 chế độ: theo lớp / theo môn)
 * -------------------------------------- */
function BucketsTab({
  sections,
  subjects,
  catalogLoading
}:{
  sections:CatalogSection[];
  subjects:CatalogSubject[];
  catalogLoading:boolean;
}) {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BucketSeriesRes | null>(null);

  // Bộ nhớ riêng cho mỗi chế độ
  const [sectionIds, setSectionIds] = useState<number[]>([]);
  const [subjectIds, setSubjectIds] = useState<number[]>([]);

  // mode hiện tại ("section" | "subject")
  const mode = Form.useWatch("mode", form) || "section";

  // Khi user thay đổi Select (ids)
  const handleIdsChange = (vals:number[]) => {
    if (mode === "section") {
      setSectionIds(vals);
    } else {
      setSubjectIds(vals);
    }
    form.setFieldsValue({ ids: vals });
  };

  // Khi đổi mode -> đồng bộ giá trị ids trong form
  useEffect(() => {
    if (mode === "section") {
      form.setFieldsValue({ ids: sectionIds });
    } else {
      form.setFieldsValue({ ids: subjectIds });
    }
  }, [mode, form, sectionIds, subjectIds]);

  const onFetch = async () => {
    const currentMode = form.getFieldValue("mode") || "section";
    const ids:number[] = form.getFieldValue("ids") || [];
    const scheme = "vn10"; // thang nhóm điểm server hiểu (ví dụ <5,5-6.5,...)

    if (!ids.length) {
      message.warning("Chọn ít nhất 1 mục");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/stats/grade-buckets`, {
        params: {
          mode: currentMode,        // "section" | "subject"
          ids: ids.join(","),       // ví dụ "12,13,15"
          scheme,                   // kiểu bucket
        },
      });
      setData(res.data);
    } catch (e:any) {
      message.error(
        e?.response?.data?.message || "Không tải được phân bố điểm"
      );
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(
    () =>
      data?.series?.map((s, i) => ({
        idx: i+1,
        label: s.label,
        count: s.count,
      })) || [],
    [data]
  );

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* Filters */}
      <Card className="card-glass sticky-filters">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFetch}
          initialValues={{
            mode: "section",
          }}
        >
          <Row gutter={12}>
            <Col xs={24} md={6}>
              <Form.Item name="mode" label="Chế độ">
                <Segmented
                  options={[
                    { label: "Theo lớp (Section)", value: "section" },
                    { label: "Theo môn (Subject)", value: "subject" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="ids"
                label={mode === "section" ? "Chọn lớp" : "Chọn môn"}
              >
                <Select
                  mode="multiple"
                  maxTagCount="responsive"
                  loading={catalogLoading}
                  // danh sách hiển thị phụ thuộc mode
                  options={(mode === "section" ? sections : subjects).map(
                    (x:any) => ({
                      value: x.id,
                      label:
                        mode === "section"
                          ? `${x.sectionName} (${x.sectionCode})`
                          : `${x.subjectCode} – ${x.subjectName}`,
                    })
                  )}
                  showSearch
                  optionFilterProp="label"
                  placeholder={
                    mode === "section"
                      ? "Chọn một hoặc nhiều lớp"
                      : "Chọn một hoặc nhiều môn"
                  }
                  onChange={handleIdsChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<PieChartOutlined />}
              loading={loading}
            >
              Xem phân bố
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Results */}
      <Row gutter={[16,16]}>
        <Col xs={24} lg={10}>
          <Card className="card-glass" title="Tổng quan">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Tổng bài ghi nhận"
                  value={data?.total || 0}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Số nhóm"
                  value={data?.series?.length || 0}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            className="card-glass"
            title="Phân bố theo nhóm điểm"
            bodyStyle={{ height: 360 }}
          >
            {loading ? (
              <Spin />
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <defs>
                    <linearGradient
                      id="barGrad2"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#8e79ff"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor="#8e79ff"
                        stopOpacity={0.3}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="Số SV"
                    fill="url(#barGrad2)"
                    radius={[8,8,0,0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có dữ liệu" />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

/* --------------------------------------
 *  Tab: Attendance
 *  (Chuyên cần, cũng 2 chế độ giống BucketsTab)
 * -------------------------------------- */
function AttendanceTab({
  sections,
  subjects,
  catalogLoading
}:{
  sections:CatalogSection[];
  subjects:CatalogSubject[];
  catalogLoading:boolean;
}) {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AttendanceItem[]>([]);

  // Bộ nhớ riêng cho mỗi chế độ
  const [sectionIds, setSectionIds] = useState<number[]>([]);
  const [subjectIds, setSubjectIds] = useState<number[]>([]);

  // theo dõi chế độ hiện tại
  const mode = Form.useWatch("mode", form) || "section";

  // đồng bộ ids khi chọn trong Select
  const handleIdsChange = (vals:number[]) => {
    if (mode === "section") {
      setSectionIds(vals);
    } else {
      setSubjectIds(vals);
    }
    form.setFieldsValue({ ids: vals });
  };

  // khi đổi mode thì set lại ids tương ứng
  useEffect(() => {
    if (mode === "section") {
      form.setFieldsValue({ ids: sectionIds });
    } else {
      form.setFieldsValue({ ids: subjectIds });
    }
  }, [mode, form, sectionIds, subjectIds]);

  const onFetch = async () => {
    const currentMode = form.getFieldValue("mode") || "section";
    const ids:number[] = form.getFieldValue("ids") || [];
    const range: [Dayjs, Dayjs] | undefined = form.getFieldValue("range");

    if (!ids.length) {
      message.warning("Chọn ít nhất 1 mục");
      return;
    }

    try {
      setLoading(true);
      const params:any = {
        mode: currentMode,
        ids: ids.join(","),
      };
      if (range) {
        params.from = range[0].startOf("day").toISOString();
        params.to = range[1].endOf("day").toISOString();
      }
      const { data } = await axios.get(`${API_BASE}/stats/attendance`, {
        params,
      });
      setItems(data.items || []);
    } catch (e:any) {
      message.error(
        e?.response?.data?.message || "Không tải được chuyên cần"
      );
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<AttendanceItem & { sectionLabel:string }> = [
    {
      title: mode === "section" ? "Lớp" : "Môn",
      dataIndex: "sectionLabel",
    },
    { title: "Có mặt", dataIndex: "present", align: "right", width: 100 },
    { title: "Trễ", dataIndex: "late", align: "right", width: 80 },
    { title: "Có phép", dataIndex: "excused", align: "right", width: 100 },
    { title: "Vắng", dataIndex: "absent", align: "right", width: 80 },
    { title: "Tổng", dataIndex: "total", align: "right", width: 90 },
    {
      title: "Tỷ lệ (%)",
      dataIndex: "rate",
      align: "right",
      width: 110,
      render: (v:number)=>(
        <Tag
          color={
            v>=90
              ? "green"
              : v>=80
              ? "geekblue"
              : v>=65
              ? "gold"
              : "red"
          }
          style={{
            borderRadius:8,
            padding:"2px 8px",
          }}
        >
          {v.toFixed(2)}
        </Tag>
      ),
    },
  ];

  const dataSource = useMemo(() => {
    // hiển thị tên lớp nếu mode=section
    const secName = (id:number) =>
      sections.find(s=>s.id===id)?.sectionName || String(id);

    return items.map(it => ({
      ...it,
      key: it.sectionId,
      sectionLabel: secName(it.sectionId),
    }));
  }, [items, sections]);

  const chartData = useMemo(
    () =>
      dataSource.map(it => ({
        section: it.sectionLabel,
        rate: it.rate,
      })),
    [dataSource]
  );

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* Filters */}
      <Card className="card-glass sticky-filters">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFetch}
          initialValues={{ mode: "section" }}
        >
          <Row gutter={12}>
            <Col xs={24} md={6}>
              <Form.Item name="mode" label="Chế độ">
                <Segmented
                  options={[
                    { label: "Theo lớp", value: "section" },
                    { label: "Theo môn", value: "subject" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={10}>
              <Form.Item
                name="ids"
                label={mode === "section" ? "Chọn lớp" : "Chọn môn"}
              >
                <Select
                  mode="multiple"
                  maxTagCount="responsive"
                  loading={catalogLoading}
                  options={(mode === "section" ? sections : subjects).map(
                    (x:any) => ({
                      value: x.id,
                      label:
                        mode === "section"
                          ? `${x.sectionName} (${x.sectionCode})`
                          : `${x.subjectCode} – ${x.subjectName}`,
                    })
                  )}
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn mục để tổng hợp"
                  onChange={handleIdsChange}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item name="range" label="Khoảng thời gian">
                <DatePicker.RangePicker
                  allowEmpty={[true,true]}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<ClockCircleOutlined />}
              loading={loading}
            >
              Xem chuyên cần
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Result */}
      <Row gutter={[16,16]}>
        <Col xs={24} lg={10}>
          <Card
            className="card-glass"
            title="Tỷ lệ chuyên cần theo lớp"
            bodyStyle={{ height: 360 }}
          >
            {loading ? (
              <Spin />
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <defs>
                    <linearGradient
                      id="lineGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#8e79ff"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor="#8e79ff"
                        stopOpacity={0.25}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="section"
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0,100]} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="rate"
                    name="Tỷ lệ (%)"
                    stroke="#8e79ff"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có dữ liệu" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card className="card-glass" title="Bảng chi tiết">
            <Table
              size="middle"
              rowKey={(r)=>String(r.sectionId)}
              loading={loading}
              dataSource={dataSource}
              columns={columns}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
              }}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

/* --------------------------------------
 *  Tab: Department Overview
 * -------------------------------------- */
function DepartmentTab({
  sections,
  subjects,
  subjectById,
  termById,
  catalogLoading,
}:{
  sections:CatalogSection[];
  subjects:CatalogSubject[];
  subjectById: Map<number,CatalogSubject>;
  termById: Map<number,CatalogTerm>;
  catalogLoading:boolean;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<TotalRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);

  // lọc các section theo bộ lọc trên form
  const filteredSections = useMemo(() => {
    const termId:number|undefined = form.getFieldValue("termId");
    const subjectIds:number[] = form.getFieldValue("subjectIds") || [];

    let list = sections;
    if (termId) {
      list = list.filter(s => s.termId === termId);
    }
    if (subjectIds?.length) {
      list = list.filter(s => subjectIds.includes(s.subjectId));
    }
    return list;
  }, [sections, form]);

  const onFetch = async () => {
    const chosenSections = filteredSections;
    if (!chosenSections.length) {
      message.warning("Không có lớp nào khớp bộ lọc");
      return;
    }
    const sectionIds = chosenSections.map(s => s.id);

    try {
      setLoading(true);
      const [gRes, aRes] = await Promise.all([
        axios.get(`${API_BASE}/stats/grades`, {
          params: { sectionIds: sectionIds.join(",") },
        }),
        axios.get(`${API_BASE}/stats/attendance`, {
          params: {
            mode: "section",
            ids: sectionIds.join(","),
          },
        }),
      ]);
      setGrades(gRes.data.items || []);
      setAttendance(aRes.data.items || []);
    } catch (e:any) {
      message.error(
        e?.response?.data?.message || "Không tải được dữ liệu khoa"
      );
    } finally {
      setLoading(false);
    }
  };

  // Gom điểm theo môn (subject)
  const bySubject = useMemo(() => {
    const secById = new Map(filteredSections.map(s => [s.id, s]));
    const map = new Map<number, TotalRow[]>();

    for (const r of grades) {
      const sec = secById.get(r.sectionId);
      if (!sec) continue;
      const arr = map.get(sec.subjectId) ?? [];
      arr.push(r);
      map.set(sec.subjectId, arr);
    }
    return map; // subjectId -> list TotalRow
  }, [grades, filteredSections]);

  const subjectSummary = useMemo(() => {
    const rows: {
      key:string;
      subjectId:number;
      subject:string;
      n:number;
      avg:number;
      pass:number;
      excellent:number;
    }[] = [];

    bySubject.forEach((list, subId) => {
      const subj = subjectById.get(subId);
      const vals = list.map(x=>x.total10);
      const n = vals.length || 1;
      const avg = +(
        vals.reduce((a,b)=>a+b,0) / n
      ).toFixed(2);
      const pass = list.filter(x=>x.total10 >= 5).length;
      const excellent = list.filter(x=>x.total10 >= 8).length;

      rows.push({
        key: String(subId),
        subjectId: subId,
        subject: `${subj?.subjectCode ?? subId} – ${
          subj?.subjectName ?? ""
        }`,
        n: vals.length,
        avg,
        pass,
        excellent,
      });
    });

    return rows.sort((a,b)=>a.subject.localeCompare(b.subject));
  }, [bySubject, subjectById]);

  const top5 = useMemo(
    () => [...subjectSummary]
      .sort((a,b)=>b.avg - a.avg)
      .slice(0,5),
    [subjectSummary]
  );

  const bottom5 = useMemo(
    () => [...subjectSummary]
      .sort((a,b)=>a.avg - b.avg)
      .slice(0,5),
    [subjectSummary]
  );

  // Ghép chuyên cần theo subject
  const attendanceBySubject = useMemo(() => {
    const secById = new Map(filteredSections.map(s => [s.id, s]));
    const agg = new Map<
      number,
      { present:number; late:number; excused:number; absent:number; total:number }
    >();

    for (const it of attendance) {
      const sec = secById.get(it.sectionId);
      if (!sec) continue;

      const cur =
        agg.get(sec.subjectId) || {
          present:0,
          late:0,
          excused:0,
          absent:0,
          total:0,
        };

      cur.present += it.present;
      cur.late += it.late;
      cur.excused += it.excused;
      cur.absent += it.absent;
      cur.total += it.total;

      agg.set(sec.subjectId, cur);
    }
    return agg; // subjectId -> tổng hợp attendance
  }, [attendance, filteredSections]);

  const attendanceChart = useMemo(() => {
    const rows: { subject:string; rate:number }[] = [];
    attendanceBySubject.forEach((v, subId) => {
      const subj = subjectById.get(subId);
      const denom = v.total || 1;
      const rate = +(((v.present + v.late) / denom) * 100).toFixed(2);

      rows.push({
        subject: `${subj?.subjectCode ?? subId}`,
        rate,
      });
    });
    return rows.sort((a,b)=>a.subject.localeCompare(b.subject));
  }, [attendanceBySubject, subjectById]);

  // Xuất CSV
  const exportCSV = () => {
    const header = [
      "SubjectCode-Name",
      "N",
      "Avg10",
      "Pass(>=5)",
      "Excellent(>=8)",
    ];
    const lines = [
      header.join(","),
      ...subjectSummary.map(r => [
        r.subject.replaceAll(",", " "),
        r.n,
        r.avg,
        r.pass,
        r.excellent,
      ].join(",")),
    ];

    const blob = new Blob(
      ["\uFEFF" + lines.join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `department-summary.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<any> = [
    { title: "Môn học", dataIndex: "subject", ellipsis: true },
    {
      title: "Số SV",
      dataIndex: "n",
      align:"right",
      width: 100,
    },
    {
      title: "Điểm TB (10)",
      dataIndex: "avg",
      align:"right",
      width: 140,
      render:(v:number)=>(
        <Tag
          color={
            v>=8
              ? "green"
              : v>=6.5
              ? "geekblue"
              : v>=5
              ? "gold"
              : "red"
          }
          style={{
            borderRadius:8,
            padding:"2px 8px",
          }}
        >
          {v.toFixed(2)}
        </Tag>
      ),
    },
    {
      title: ">=5",
      dataIndex: "pass",
      align:"right",
      width: 100,
    },
    {
      title: ">=8",
      dataIndex: "excellent",
      align:"right",
      width: 100,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* Filters */}
      <Card className="card-glass sticky-filters">
        <Form form={form} layout="vertical" onFinish={onFetch}>
          <Row gutter={12}>
            <Col xs={24} md={6}>
              <Form.Item name="termId" label="Học kỳ">
                <Select
                  allowClear
                  loading={catalogLoading}
                  options={[...termById.values()].map((t:any)=>({
                    value: t.id,
                    label: `${t.code} – ${t.name}`,
                  }))}
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn học kỳ"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="subjectIds" label="Môn học (tùy chọn)">
                <Select
                  mode="multiple"
                  maxTagCount="responsive"
                  loading={catalogLoading}
                  options={subjects.map(s=>({
                    value: s.id,
                    label: `${s.subjectCode} – ${s.subjectName}`,
                  }))}
                  showSearch
                  optionFilterProp="label"
                  placeholder="Không chọn = tất cả môn trong học kỳ"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item label=" ">
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<BarChartOutlined />}
                    loading={loading}
                  >
                    Tổng hợp
                  </Button>
                  <Button onClick={exportCSV}>
                    Xuất CSV
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* KPIs */}
      <Row gutter={[16,16]}>
        <Col xs={24} lg={8}>
          <Card className="card-glass" title="Chỉ số chính">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Số môn"
                  value={subjectSummary.length}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Số lớp (section)"
                  value={filteredSections.length}
                />
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Điểm TB toàn khoa"
                  value={(
                    subjectSummary.reduce(
                      (a,b)=>a + b.avg*(b.n||0),
                      0
                    ) /
                    (subjectSummary.reduce(
                      (a,b)=>a+(b.n||0),
                      0
                    ) || 1)
                  ).toFixed(2)}
                />
              </Col>

              <Col span={12}>
                <Statistic
                  title="Tỷ lệ >=5 (ước tính)"
                  value={(
                    (
                      subjectSummary.reduce(
                        (a,b)=>a+b.pass,
                        0
                      ) /
                      (
                        subjectSummary.reduce(
                          (a,b)=>a+b.n,
                          0
                        ) || 1
                      )
                    ) * 100
                  ).toFixed(1) + "%"}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            className="card-glass"
            title="Điểm trung bình theo môn"
            bodyStyle={{ height: 360 }}
          >
            {loading ? (
              <Spin />
            ) : subjectSummary.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectSummary}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="barGrad3"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#6c5ce7"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor="#6c5ce7"
                        stopOpacity={0.3}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="subject"
                    tick={{ fontSize:12 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0,10]} />
                  <RTooltip content={<PrettyTooltip />} />
                  <Legend />

                  <Bar
                    dataKey="avg"
                    name="Điểm TB (10)"
                    fill="url(#barGrad3)"
                    radius={[8,8,0,0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có dữ liệu" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Top/Bottom môn */}
      <Row gutter={[16,16]}>
        <Col xs={24} lg={12}>
          <Card
            className="card-glass"
            title="Top 5 môn theo điểm TB"
          >
            <Table
              size="small"
              dataSource={top5}
              columns={columns}
              pagination={false}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            className="card-glass"
            title="Bottom 5 môn theo điểm TB"
          >
            <Table
              size="small"
              dataSource={bottom5}
              columns={columns}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Tỷ lệ chuyên cần theo môn */}
      <Row gutter={[16,16]}>
        <Col xs={24}>
          <Card
            className="card-glass"
            title="Chuyên cần theo môn"
            bodyStyle={{ height: 360 }}
          >
            {loading ? (
              <Spin />
            ) : (
              attendanceChart.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={attendanceChart}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="subject"
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[0,100]} />
                    <RTooltip content={<PrettyTooltip />} />
                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Tỷ lệ (%)"
                      stroke="#8e79ff"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Chưa có dữ liệu" />
              )
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
