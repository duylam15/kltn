// src/pages/AdminStats.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Card, Tabs, Form, Select, DatePicker, Button, Space, Row, Col,
  Statistic, Table, Tag, Tooltip, Divider, Badge, Typography, message
} from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import dayjs, { Dayjs } from "dayjs";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, LineChart, Line, ScatterChart, Scatter
} from "recharts";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

/** =========
 *  API endpoints:
 *  - GET http://localhost:4000/api/v1/catalog/catalog?scopes=terms,subjects,sections,teachers
 *  - GET http://localhost:4000/api/v1/stats/grades?sectionIds=1,2
 *  - GET http://localhost:4000/api/v1/stats/grade-buckets?mode=section&ids=1,2&scheme=vn10
 *  - GET http://localhost:4000/api/v1/stats/attendance?mode=section&ids=1,2&from&to
 ========= **/

/* ---------- Types ---------- */
type Term = { id:number; code:string; name:string; startDate?:string; endDate?:string };
type Subject = { id:number; subjectCode:string; subjectName:string };
type Section = {
  id:number; sectionCode:string; sectionName?:string; subjectId:number; termId:number;
  teacherIds:number[]; // cần backend trả về
};
type Teacher = { id:number; code?:string; fullName:string };

type GradeRow = {
  sectionId:number; studentId:number; studentCode:string; studentName:string; total10:number;
};

type BucketBar = { label:string; count:number };

type AttendanceRow = {
  sectionId:number; present:number; late:number; excused:number; absent:number; rate:number; // 0..100
};

/* ---------- Config ---------- */
const API_BASE = "http://localhost:4000/api/v1";
const PASS_5 = 5.0;
const EXCELLENT_8 = 8.0;

/* ---------- Helpers ---------- */
function isBeforeTwoThirds(term?: Term, now = dayjs()): boolean {
  if (!term?.startDate || !term?.endDate) return true;
  const start = dayjs(term.startDate);
  const end = dayjs(term.endDate);
  if (!start.isValid() || !end.isValid() || !end.isAfter(start)) return true;
  const twoThirds = start.add((end.diff(start, "day") * 2) / 3, "day");
  return now.isBefore(twoThirds);
}

function computePassExcellent(grades: GradeRow[]) {
  const bySection: Record<number, { total:number; pass:number; excellent:number; avg:number; sum:number }> = {};
  grades.forEach(g => {
    const s = (bySection[g.sectionId] ??= { total:0, pass:0, excellent:0, avg:0, sum:0 });
    s.total += 1;
    s.sum += g.total10 ?? 0;
    if ((g.total10 ?? 0) >= PASS_5) s.pass += 1;
    if ((g.total10 ?? 0) >= EXCELLENT_8) s.excellent += 1;
  });
  for (const k of Object.keys(bySection)) {
    const s = bySection[+k];
    s.avg = s.total ? +(s.sum / s.total).toFixed(2) : 0;
  }
  return bySection;
}

function computeCompareBySubject(grades: GradeRow[], sections: Section[], subjectId?: number) {
  const secs = subjectId ? sections.filter(s => s.subjectId === subjectId) : sections;
  const secSet = new Set(secs.map(s => s.id));
  const agg: Record<number, { sectionId:number; avg:number; total:number; subjectId:number }> = {};
  grades.forEach(g => {
    if (!secSet.has(g.sectionId)) return;
    const sec = secs.find(x=>x.id===g.sectionId)!;
    const a = (agg[g.sectionId] ??= { sectionId:g.sectionId, avg:0, total:0, subjectId: sec.subjectId });
    a.avg = +( ((a.avg * a.total) + (g.total10 ?? 0)) / (a.total + 1) ).toFixed(2);
    a.total += 1;
  });
  return Object.values(agg);
}

function buildCorrelationData(grades: GradeRow[], attendance: AttendanceRow[]) {
  const bySectionAttend = new Map(attendance.map(a => [a.sectionId, a.rate]));
  const bySectionGrade: Record<number, { avg:number; n:number }> = {};
  grades.forEach(g => {
    const b = (bySectionGrade[g.sectionId] ??= { avg:0, n:0 });
    b.avg = ((b.avg * b.n) + (g.total10 ?? 0)) / (b.n + 1);
    b.n += 1;
  });
  return Object.entries(bySectionGrade).map(([sid, v]) => ({
    sectionId: +sid,
    avgGrade: +v.avg.toFixed(2),
    attendRate: +(bySectionAttend.get(+sid) ?? 0).toFixed(2),
  }));
}

function makeEarlyAlerts(grades: GradeRow[], attendance: AttendanceRow[], sections: Section[], terms: Term[]) {
  const attendBySec = new Map<number, AttendanceRow>(attendance.map(a => [a.sectionId, a]));
  const termById = new Map<number, Term>(terms.map(t => [t.id, t]));
  const alerts: Array<{ sectionId:number; studentId:number; studentCode:string; studentName:string; total10:number; attendRate:number; status:"Nguy cơ"; reason:string }> = [];
  grades.forEach(g => {
    const sec = sections.find(s => s.id === g.sectionId);
    const term = termById.get(sec?.termId ?? -1);
    const shouldShow = isBeforeTwoThirds(term, dayjs());
    const att = attendBySec.get(g.sectionId)?.rate ?? 0;
    const risk = (att < 70) || ((g.total10 ?? 0) < 5.5);
    if (risk && shouldShow) {
      const reasons = [];
      if (att < 70) reasons.push(`attendance ${att.toFixed(1)}% < 70%`);
      if ((g.total10 ?? 0) < 5.5) reasons.push(`total10 ${g.total10?.toFixed(2)} < 5.5`);
      alerts.push({
        sectionId: g.sectionId,
        studentId: g.studentId,
        studentCode: g.studentCode,
        studentName: g.studentName,
        total10: +(g.total10 ?? 0).toFixed(2),
        attendRate: +att.toFixed(2),
        status: "Nguy cơ",
        reason: reasons.join(" & "),
      });
    }
  });
  return alerts;
}

/** Term series: mặc định theo các sections đang chọn; tuỳ chọn theo môn/GV */
function buildTermSeries(
  grades: GradeRow[], sections: Section[], terms: Term[],
  scope: { sectionIds?: number[]; subjectId?: number; teacherId?: number } = {}
) {
  let secPool = sections;
  if (scope.sectionIds?.length) secPool = secPool.filter(s => scope.sectionIds!.includes(s.id));
  if (scope.subjectId) secPool = secPool.filter(s => s.subjectId === scope.subjectId);
  if (scope.teacherId) secPool = secPool.filter(s => (s.teacherIds || []).includes(scope.teacherId||0));

  const secById = new Map(secPool.map(s => [s.id, s]));
  const termAgg: Record<number, { sum:number; n:number }> = {};
  for (const g of grades) {
    const sec = secById.get(g.sectionId);
    if (!sec) continue;
    const a = (termAgg[sec.termId] ??= { sum:0, n:0 });
    a.sum += g.total10 ?? 0;
    a.n += 1;
  }
  const termMap = new Map(terms.map(t => [t.id, t]));
  return Object.entries(termAgg)
    .map(([termId, v]) => ({
      termId: +termId,
      term: termMap.get(+termId)?.name ?? String(termId),
      avg: +(v.sum / Math.max(1, v.n)).toFixed(2),
      count: v.n
    }))
    .sort((a,b)=>a.termId-b.termId);
}
function buildYoYSeries(termSeries: {termId:number; term:string; avg:number; count:number}[]) {
  return termSeries.map(t => ({ term: t.term, avg: t.avg, count: t.count }));
}

/** Outliers (theo section) */
function avgBySection(grades: GradeRow[]) {
  const m: Record<number,{sum:number;n:number}> = {};
  grades.forEach(g => {
    const a = (m[g.sectionId] ??= {sum:0,n:0});
    a.sum += g.total10 ?? 0; a.n += 1;
  });
  return Object.entries(m).map(([sid,v])=>({
    sectionId:+sid,
    avg: +(v.sum / Math.max(1,v.n)).toFixed(2),
    count: v.n
  }));
}
function detectOutliersZ(data: {sectionId:number; avg:number; count:number}[], z=2) {
  const avgs = data.map(d=>d.avg);
  const mu = avgs.reduce((s,v)=>s+v,0)/Math.max(1,avgs.length);
  const sd = Math.sqrt(avgs.reduce((s,v)=>s+(v-mu)*(v-mu),0)/Math.max(1,avgs.length));
  return data.map(d=>{
    const zscore = sd ? (d.avg - mu)/sd : 0;
    const tag = Math.abs(zscore) >= z ? (zscore>0 ? "Cao bất thường" : "Thấp bất thường") : "Bình thường";
    return { ...d, z: +zscore.toFixed(2), status: tag, mean:+mu.toFixed(2), sd:+sd.toFixed(2) };
  }).sort((a,b)=>Math.abs(b.z)-Math.abs(a.z));
}

/** Pass theo Giảng viên */
function computePassByTeacher(grades: GradeRow[], sections: Section[], teacherIdFilter?: number) {
  const mapSecTeachers = new Map<number, number[]>(
    sections.map(s => [s.id, s.teacherIds || []])
  );
  const agg: Record<number, { teacherId:number; total:number; pass:number; excellent:number; sum:number; avg:number }> = {};
  for (const g of grades) {
    const tIds = mapSecTeachers.get(g.sectionId) || [];
    for (const tid of tIds) {
      if (teacherIdFilter && tid !== teacherIdFilter) continue;
      const a = (agg[tid] ??= { teacherId: tid, total: 0, pass: 0, excellent: 0, sum: 0, avg: 0 });
      a.total += 1;
      const sc = g.total10 ?? 0;
      a.sum += sc;
      if (sc >= 5) a.pass += 1;
      if (sc >= 8) a.excellent += 1;
    }
  }
  Object.values(agg).forEach(a => { a.avg = a.total ? +(a.sum / a.total).toFixed(2) : 0; });
  return Object.values(agg);
}

/* ---------- Component ---------- */
export default function AdminStats() {
  const [form] = Form.useForm();

  // Catalog
  const [terms, setTerms] = useState<Term[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Data
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [buckets, setBuckets] = useState<BucketBar[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);

  // Load catalog
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/catalog/catalog`, {
          params: { scopes: "terms,subjects,sections,teachers" }
        });
        setTerms(data.terms ?? []);
        setSubjects(data.subjects ?? []);
        setSections(data.sections ?? []);
        setTeachers(data.teachers ?? []);
      } catch (e:any) {
        message.error(e?.message || "Không tải được danh mục");
      }
    })();
  }, []);

  /* ---- Fetchers ---- */
  const fetchAll = async () => {
    const pickedSections: number[] = form.getFieldValue("sectionIds") || [];
    const subjectId: number | undefined = form.getFieldValue("subjectId");
    const teacherId: number | undefined = form.getFieldValue("teacherId");
    const range: [Dayjs, Dayjs] | undefined = form.getFieldValue("range");

    // Lọc section theo Subject/GV
    let secPool = sections;
    if (subjectId) secPool = secPool.filter(s => s.subjectId === subjectId);
    if (teacherId) secPool = secPool.filter(s => (s.teacherIds || []).includes(teacherId));

    const sectionIds = pickedSections.length
      ? pickedSections.filter(id => secPool.some(s => s.id === id))
      : secPool.map(s => s.id);

    if (!sectionIds.length) {
      message.info("Không có học phần phù hợp bộ lọc.");
      return;
    }

    setLoading(true);
    try {
      const [gRes, bRes, aRes] = await Promise.all([
        axios.get(`${API_BASE}/stats/grades`, { params: { sectionIds: sectionIds.join(",") } }),
        axios.get(`${API_BASE}/stats/grade-buckets`, { params: { mode: "section", ids: sectionIds.join(","), scheme: "vn10" } }),
        axios.get(`${API_BASE}/stats/attendance`, {
          params: {
            mode: "section",
            ids: sectionIds.join(","),
            from: range?.[0] ? range[0].toISOString() : undefined,
            to: range?.[1] ? range[1].toISOString() : undefined
          }
        })
      ]);

      setGrades(gRes.data?.items ?? []);
      setBuckets(bRes.data?.series ?? []);
      setAttendance(aRes.data?.items ?? []);
    } catch (e:any) {
      message.error(e?.message || "Không tải được số liệu");
    } finally {
      setLoading(false);
    }
  };

  /* ---- Derived ---- */
  const passExcellentBySection = useMemo(() => computePassExcellent(grades), [grades]);

  const passExcellentTiles = useMemo(() => {
    const vals = Object.values(passExcellentBySection);
    const total = vals.reduce((s, v) => s + v.total, 0);
    const pass = vals.reduce((s, v) => s + v.pass, 0);
    const excellent = vals.reduce((s, v) => s + v.excellent, 0);
    const avg = total ? +(vals.reduce((s, v) => s + v.sum, 0) / total).toFixed(2) : 0;
    return {
      totalStudents: total,
      passRate: total ? +((pass / total) * 100).toFixed(2) : 0,
      excellentRate: total ? +((excellent / total) * 100).toFixed(2) : 0,
      avgScore: avg
    };
  }, [passExcellentBySection]);

  const compareSameSubject = useMemo(() => {
    const subjectId: number | undefined = form.getFieldValue("subjectId");
    return computeCompareBySubject(grades, sections, subjectId);
  }, [grades, sections, form]);

  const correlationData = useMemo(() => buildCorrelationData(grades, attendance), [grades, attendance]);
  const earlyAlerts = useMemo(() => makeEarlyAlerts(grades, attendance, sections, terms), [grades, attendance, sections, terms]);

  // Outliers
  const sectionAvg = useMemo(() => avgBySection(grades), [grades]);
  const outliers = useMemo(() => detectOutliersZ(sectionAvg, 2), [sectionAvg]);

  // Pass theo GV
  const teacherIdPick: number | undefined = Form.useWatch("teacherId", form);
  const passByTeacher = useMemo(
    () => computePassByTeacher(grades, sections, teacherIdPick || undefined),
    [grades, sections, teacherIdPick]
  );

  // SectionIds đang chọn (phục vụ YoY theo selection)
  const selectedSectionIds = Form.useWatch("sectionIds", form) as number[] | undefined;

  // YoY theo selection (MẶC ĐỊNH)
  const yoyBySelection = useMemo(() => {
    const list = buildTermSeries(grades, sections, terms, {
      sectionIds: selectedSectionIds && selectedSectionIds.length ? selectedSectionIds : undefined
    });
    return buildYoYSeries(list);
  }, [grades, sections, terms, selectedSectionIds]);

  // YoY theo Môn/GV
  const yoyBySubjectTeacher = useMemo(() => {
    const subjectId: number | undefined = form.getFieldValue("subjectId");
    const teacherId: number | undefined = form.getFieldValue("teacherId");
    const list = buildTermSeries(grades, sections, terms, { subjectId, teacherId });
    return buildYoYSeries(list);
  }, [grades, sections, terms, form]);

  /* ---- Columns ---- */
  const passBySectionCols: ColumnsType<any> = [
    { title: "Section", dataIndex: "sectionId", width: 100 },
    { title: "Sĩ số", dataIndex: "total", width: 90 },
    {
      title: "Tỉ lệ đạt (≥5)",
      dataIndex: "pass",
      render: (_:any, r:any) => <Tag color="blue">{((r.pass / Math.max(1, r.total)) * 100).toFixed(1)}%</Tag>
    },
    {
      title: "Tỉ lệ giỏi (≥8)",
      dataIndex: "excellent",
      render: (_:any, r:any) => <Tag color="green">{((r.excellent / Math.max(1, r.total)) * 100).toFixed(1)}%</Tag>
    },
    { title: "Điểm TB", dataIndex: "avg", render: (v:number) => <Tag color={v>=8?'green':v>=6.5?'geekblue':v>=5?'gold':'red'}>{v}</Tag> },
  ];

  const compareCols: ColumnsType<any> = [
    { title: "Section", dataIndex: "sectionId", width: 100 },
    { title: "Điểm TB", dataIndex: "avg", width: 120, render: (v:number)=> <Tag color={v>=8?'green':v>=6.5?'geekblue':v>=5?'gold':'red'}>{v}</Tag> },
    { title: "Số SV", dataIndex: "total", width: 100 },
  ];

  const earlyAlertCols: ColumnsType<any> = [
    { title: "Section", dataIndex: "sectionId", width: 90 },
    { title: "Mã SV", dataIndex: "studentCode", width: 110 },
    { title: "Họ tên", dataIndex: "studentName", ellipsis: true },
    { title: "Điểm (10)", dataIndex: "total10", width: 100, render: (v:number)=> <Tag color={v<5.5?'red':'gold'}>{v}</Tag> },
    { title: "Điểm danh (%)", dataIndex: "attendRate", width: 130, render: (v:number)=> <Tag color={v<70?'red':'gold'}>{v}</Tag> },
    { title: "Trạng thái", dataIndex: "status", width: 110, render: ()=> <Badge status="error" text="Nguy cơ" /> },
    { title: "Lý do", dataIndex: "reason", ellipsis: true }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width:"100%" }}>
      <Card>
        <Form form={form} layout="inline" onFinish={fetchAll}>
          <Form.Item name="termId" label="Học kỳ" style={{ minWidth: 240, marginBottom: 8 }}>
            <Select allowClear options={terms.map(t => ({ value: t.id, label: t.name }))} placeholder="Chọn học kỳ" />
          </Form.Item>
          <Form.Item name="subjectId" label="Môn học" style={{ minWidth: 280, marginBottom: 8 }}>
            <Select
              allowClear showSearch optionFilterProp="label"
              options={subjects.map(s => ({ value: s.id, label: `${s.subjectCode} — ${s.subjectName}` }))}
              placeholder="Chọn môn để so sánh lớp"
            />
          </Form.Item>
          <Form.Item name="teacherId" label="Giảng viên" style={{ minWidth: 260, marginBottom: 8 }}>
            <Select
              allowClear showSearch optionFilterProp="label"
              options={teachers.map(t => ({ value: t.id, label: t.fullName }))}
              placeholder="Lọc theo GV (tùy chọn)"
            />
          </Form.Item>
          <Form.Item name="sectionIds" label="Học phần" style={{ minWidth: 360, marginBottom: 8 }}>
            <Select
              mode="multiple" showSearch optionFilterProp="label" placeholder="Chọn >=1 học phần"
              options={sections.map(s => ({
                value: s.id,
                label: `${s.sectionName || s.sectionCode} • ${subjects.find(sb=>sb.id===s.subjectId)?.subjectCode ?? 'SUBJ'}`
              }))}
            />
          </Form.Item>
          <Form.Item name="range" label="Khoảng TG (điểm danh)">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Chạy thống kê</Button>
          </Form.Item>
        </Form>
      </Card>

      {/* KPI Tiles */}
      <Row gutter={16}>
        <Col xs={24} md={6}><Card><Statistic title="Tổng số SV (đang chọn)" value={passExcellentTiles.totalStudents} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Tỉ lệ đạt (≥5)" value={passExcellentTiles.passRate} precision={2} suffix="%" /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Tỉ lệ giỏi (≥8)" value={passExcellentTiles.excellentRate} precision={2} suffix="%" /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Điểm trung bình" value={passExcellentTiles.avgScore} precision={2} /></Card></Col>
      </Row>

      <Tabs
        defaultActiveKey="pass"
        items={[
          /* 1) Tỉ lệ đạt theo học phần / GV — TAB TRONG TAB */
          {
            key: "pass",
            label: "Tỉ lệ đạt theo học phần / GV",
            children: (
              <Card>
                <Tabs
                  defaultActiveKey="bySection" // MẶC ĐỊNH: Học phần
                  items={[
                    {
                      key: "bySection",
                      label: "Học phần",
                      children: (
                        <Row gutter={[16,16]}>
                          <Col xs={24} md={14}>
                            <div style={{ height: 360 }}>
                              <ResponsiveContainer>
                                <BarChart data={Object.entries(passExcellentBySection).map(([sectionId, v])=>({
                                  sectionId:+sectionId, pass:v.pass, excellent:v.excellent, total:v.total
                                }))}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="sectionId" />
                                  <YAxis />
                                  <RTooltip />
                                  <Legend />
                                  <Bar dataKey="pass" name="Số SV đạt (≥5)" fill="#1677ff" />
                                  <Bar dataKey="excellent" name="Số SV giỏi (≥8)" fill="#52c41a" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Col>
                          <Col xs={24} md={10}>
                            <Table
                              size="small" rowKey="sectionId" pagination={{ pageSize: 8 }}
                              columns={passBySectionCols}
                              dataSource={Object.entries(passExcellentBySection).map(([sectionId, v]) => ({
                                sectionId: +sectionId, total: v.total, pass: v.pass, excellent: v.excellent, avg: v.avg,
                              }))}
                            />
                          </Col>
                        </Row>
                      )
                    },
                    {
                      key: "byTeacher",
                      label: "Giảng viên",
                      children: (
                        <>
                          <Text type="secondary">
                            {teacherIdPick ? `Đang lọc theo GV: ${teachers.find(t=>t.id===teacherIdPick)?.fullName ?? teacherIdPick}` : "Hiển thị tất cả GV từ các học phần đang chọn"}
                          </Text>
                          <Divider />
                          <Row gutter={[16,16]}>
                            <Col xs={24} md={14}>
                              <div style={{ height: 320 }}>
                                <ResponsiveContainer>
                                  <BarChart data={passByTeacher.map(x => ({
                                    teacherId: x.teacherId,
                                    passRate: +(x.total ? (x.pass/x.total)*100 : 0).toFixed(1),
                                    excellentRate: +(x.total ? (x.excellent/x.total)*100 : 0).toFixed(1),
                                    avg: x.avg
                                  }))}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="teacherId" />
                                    <YAxis domain={[0,100]} />
                                    <RTooltip />
                                    <Legend />
                                    <Bar dataKey="passRate" name="Đạt (≥5) %" fill="#1677ff" />
                                    <Bar dataKey="excellentRate" name="Giỏi (≥8) %" fill="#52c41a" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </Col>
                            <Col xs={24} md={10}>
                              <Table
                                size="small" rowKey="teacherId" pagination={{ pageSize: 8 }}
                                columns={[
                                  { title:"GV", dataIndex:"teacherId", render:(id:number)=> teachers.find(t=>t.id===id)?.fullName ?? id },
                                  { title:"Sĩ số", dataIndex:"total", width:90 },
                                  { title:"Đạt (≥5)", render:(_:any,r:any)=><Tag color="blue">{((r.pass/Math.max(1,r.total))*100).toFixed(1)}%</Tag> },
                                  { title:"Giỏi (≥8)", render:(_:any,r:any)=><Tag color="green">{((r.excellent/Math.max(1,r.total))*100).toFixed(1)}%</Tag> },
                                  { title:"Điểm TB", dataIndex:"avg", render:(v:number)=><Tag color={v>=8?'green':v>=6.5?'geekblue':v>=5?'gold':'red'}>{v}</Tag> },
                                ]}
                                dataSource={computePassByTeacher(grades, sections, teacherIdPick || undefined)}
                              />
                            </Col>
                          </Row>
                        </>
                      )
                    }
                  ]}
                />
              </Card>
            )
          },

          /* 2) Phân bố điểm (Histogram) */
          {
            key: "hist",
            label: "Phân bố điểm (Histogram)",
            children: (
              <Card>
                <Row gutter={[16,16]}>
                  <Col xs={24} md={16}>
                    <div style={{ height: 360 }}>
                      <ResponsiveContainer>
                        <BarChart data={buckets}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis allowDecimals={false} />
                          <RTooltip />
                          <Legend />
                          <Bar dataKey="count" name="Số SV" fill="#722ed1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <Title level={5}>Gợi ý đọc</Title>
                    <ul style={{ marginTop: 8 }}>
                      <li>Lệch trái (nhiều &lt;5) → đề khó/thiếu hỗ trợ.</li>
                      <li>Lệch phải (nhiều 8–10) → đề dễ/chấm rộng, cân nhắc chuẩn hóa.</li>
                    </ul>
                  </Col>
                </Row>
              </Card>
            )
          },

          /* 3) Tỉ lệ điểm danh trung bình */
          {
            key: "att",
            label: "Tỉ lệ điểm danh trung bình",
            children: (
              <Card>
                <Row gutter={[16,16]}>
                  <Col xs={24} md={16}>
                    <div style={{ height: 360 }}>
                      <ResponsiveContainer>
                        <BarChart data={attendance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="sectionId" />
                          <YAxis domain={[0,100]} />
                          <RTooltip />
                          <Legend />
                          <Bar dataKey="rate" name="Đi học (%)" fill="#faad14" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <Table
                      size="small" rowKey="sectionId" pagination={{ pageSize: 8 }}
                      columns={[
                        { title:"Section", dataIndex:"sectionId", width:90 },
                        { title:"Present", dataIndex:"present", width:90 },
                        { title:"Late", dataIndex:"late", width:90 },
                        { title:"Excused", dataIndex:"excused", width:90 },
                        { title:"Absent", dataIndex:"absent", width:90 },
                        { title:"Đi học (%)", dataIndex:"rate", width:110, render:(v:number)=><Tag color={v>=85?"green":v>=70?"gold":"red"}>{v}</Tag> },
                      ]}
                      dataSource={attendance}
                    />
                  </Col>
                </Row>
              </Card>
            )
          },

          /* 4) So sánh lớp cùng môn / năm */
          {
            key: "compare",
            label: "So sánh lớp cùng môn / năm",
            children: (
              <Card>
                <Space direction="vertical" style={{ width:"100%" }} size="middle">
                  <Tooltip title="Chọn 'Môn học' ở bộ lọc để so sánh các section thuộc cùng môn">
                    <Text type="secondary">Chọn môn ở bộ lọc để chuẩn hóa so sánh.</Text>
                  </Tooltip>
                  <Row gutter={[16,16]}>
                    <Col xs={24} md={16}>
                      <div style={{ height: 360 }}>
                        <ResponsiveContainer>
                          <LineChart data={compareSameSubject}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="sectionId" />
                            <YAxis domain={[0,10]} />
                            <RTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="avg" name="Điểm TB" stroke="#13c2c2" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <Table
                        size="small" rowKey="sectionId" pagination={{ pageSize: 8 }}
                        columns={compareCols} dataSource={compareSameSubject}
                      />
                    </Col>
                  </Row>
                </Space>
              </Card>
            )
          },

          /* 5) So sánh năm/kỳ — TAB TRONG TAB (mặc định theo selection) */
          {
            key: "yoy",
            label: "So sánh năm/kỳ (term)",
            children: (
              <Card>
                <Tabs
                  defaultActiveKey="bySelection" // MẶC ĐỊNH: theo các section đang chọn
                  items={[
                    {
                      key: "bySelection",
                      label: "Theo học phần đang chọn",
                      children: (
                        <Row gutter={[16,16]}>
                          <Col xs={24} md={16}>
                            <div style={{height:360}}>
                              <ResponsiveContainer>
                                <LineChart data={yoyBySelection}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="term" />
                                  <YAxis domain={[0,10]} />
                                  <RTooltip />
                                  <Legend />
                                  <Line type="monotone" dataKey="avg" name="Điểm TB (term)" stroke="#eb2f96" />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </Col>
                          <Col xs={24} md={8}>
                            <Table
                              size="small" rowKey="term" pagination={{pageSize:8}}
                              columns={[
                                { title:"Kỳ", dataIndex:"term" },
                                { title:"Điểm TB", dataIndex:"avg", render:(v:number)=><Tag color={v>=8?"green":v>=6.5?"geekblue":v>=5?"gold":"red"}>{v}</Tag> },
                                { title:"Số bản ghi", dataIndex:"count" },
                              ]}
                              dataSource={yoyBySelection}
                            />
                          </Col>
                        </Row>
                      )
                    },
                    {
                      key: "bySubjectTeacher",
                      label: "Theo Môn / GV",
                      children: (
                        <>
                          <Text type="secondary">
                            Dùng bộ lọc phía trên để chọn <b>Môn</b> hoặc <b>Giảng viên</b>, sau đó bấm <b>Chạy thống kê</b>.
                          </Text>
                          <Divider />
                          <Row gutter={[16,16]}>
                            <Col xs={24} md={16}>
                              <div style={{height:360}}>
                                <ResponsiveContainer>
                                  <LineChart data={yoyBySubjectTeacher}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="term" />
                                    <YAxis domain={[0,10]} />
                                    <RTooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="avg" name="Điểm TB (term)" stroke="#722ed1" />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </Col>
                            <Col xs={24} md={8}>
                              <Table
                                size="small" rowKey="term" pagination={{pageSize:8}}
                                columns={[
                                  { title:"Kỳ", dataIndex:"term" },
                                  { title:"Điểm TB", dataIndex:"avg", render:(v:number)=><Tag color={v>=8?"green":v>=6.5?"geekblue":v>=5?"gold":"red"}>{v}</Tag> },
                                  { title:"Số bản ghi", dataIndex:"count" },
                                ]}
                                dataSource={yoyBySubjectTeacher}
                              />
                            </Col>
                          </Row>
                        </>
                      )
                    }
                  ]}
                />
              </Card>
            )
          },

          /* 6) Phát hiện ngoại lệ */
          {
            key: "outlier",
            label: "Phát hiện ngoại lệ",
            children: (
              <Card>
                <Space direction="vertical" size="middle" style={{width:"100%"}}>
                  <Text type="secondary">Dò outlier theo Z-score (|z| ≥ 2) dựa trên điểm TB theo section.</Text>
                  <Row gutter={[16,16]}>
                    <Col xs={24} md={16}>
                      <div style={{height:360}}>
                        <ResponsiveContainer>
                          <ScatterChart>
                            <CartesianGrid />
                            <XAxis dataKey="sectionId" name="Section" />
                            <YAxis dataKey="avg" name="Điểm TB" domain={[0,10]} />
                            <RTooltip />
                            <Legend />
                            <Scatter name="Điểm TB (section)" data={sectionAvg} fill="#1890ff" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <Table
                        size="small" rowKey="sectionId" pagination={{pageSize:8}}
                        columns={[
                          { title:"Section", dataIndex:"sectionId", width:90 },
                          { title:"Điểm TB", dataIndex:"avg", render:(v:number)=><Tag color={v>=8?'green':v>=6.5?'geekblue':v>=5?'gold':'red'}>{v}</Tag> },
                          { title:"Z", dataIndex:"z" },
                          { title:"Trạng thái", dataIndex:"status", render:(t:string)=>
                            t==="Bình thường" ? <Tag>{t}</Tag> :
                            t==="Cao bất thường" ? <Tag color="green">{t}</Tag> :
                            <Tag color="red">{t}</Tag>
                          },
                          { title:"Số SV", dataIndex:"count" }
                        ]}
                        dataSource={outliers}
                      />
                    </Col>
                  </Row>
                </Space>
              </Card>
            )
          }
        ]}
      />
    </Space>
  );
}
