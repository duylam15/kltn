import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Spin,
  Progress,
  List,
  Avatar,
  Tag,
  Timeline,
  Empty,
  Divider,
  Space,
  Button,
} from "antd";
import {
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
  RocketOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import instance from "../../utils/axiosInstance";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text } = Typography;
const API_BASE = "http://localhost:4000/api/v1";

export default function Overview() {
  const navigate = useNavigate();
  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGroups: 0,
    studentsWithGroup: 0,
    totalAssignments: 0,
    visibleAssignments: 0,
    totalMaterials: 0,
    visibleMaterials: 0,
    totalSessions: 0,
    activeSessions: 0,
    avgAttendanceRate: 0,
    totalGradeColumns: 0,
    publishedColumns: 0,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchOverviewData();
  }, [sectionId]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);

      const [
        studentsRes,
        groupsRes,
        assignmentsRes,
        materialsRes,
        sessionsRes,
        gradesRes,
      ] = await Promise.all([
        instance.get(`/sections-enrollments/section/${sectionId}/students`),

        instance.get(`/sections-groups/sections/${sectionId}/groups`),

        instance.get(`/sections-assignments/sections/${sectionId}/assignments`),

        instance.get(`/materials/class/${sectionId}`),

        instance.get(`/attendance/sections/${sectionId}/sessions`),

        instance.get(`/students-grades/gradebook/${sectionId}`, {
          params: { includeUnpublished: true }
        }),
      ]);

      console.log("Grades Res:", gradesRes);

      const students = studentsRes.data.data || [];
      const groups = groupsRes.data.data || [];
      const assignments = assignmentsRes.data.data || [];
      const materials = materialsRes.data.data || [];
      const sessions = sessionsRes.data.data || [];
      const gradeBook = gradesRes.data.data;

      const studentsWithGroup = students.filter((s: any) => s.groupId).length;
      const visibleAssignments = assignments.filter((a: any) => a.isOpen).length;
      const visibleMaterials = materials.filter((m: any) => m.isOpen).length;
      const activeSessions = sessions.filter((s: any) => {
        if (!s.expiresAt) return true;
        return dayjs(s.expiresAt).isAfter(dayjs());
      }).length;

      const totalAttendances = sessions.reduce(
        (sum: number, s: any) => sum + (s.attendances?.length || 0),
        0
      );
      const avgAttendanceRate =
        sessions.length > 0 && students.length > 0
          ? (totalAttendances / (sessions.length * students.length)) * 100
          : 0;

      setStats({
        totalStudents: students.length,
        totalGroups: groups.length,
        studentsWithGroup,
        totalAssignments: assignments.length,
        visibleAssignments,
        totalMaterials: materials.length,
        visibleMaterials,
        totalSessions: sessions.length,
        activeSessions,
        avgAttendanceRate,
        totalGradeColumns: gradeBook?.columns?.length || 0,
        publishedColumns: gradeBook?.columns?.filter((c: any) => c.isPublished).length || 0,
      });

      // Recent activities
      const recentActs = [
        ...sessions.slice(0, 5).map((s: any) => ({
          type: "attendance",
          title: `Điểm danh: ${s.name || `Phiên #${s.id}`}`,
          time: s.createdAt,
          icon: <CalendarOutlined />,
          color: "blue",
        })),
        ...assignments.slice(0, 5).map((a: any) => ({
          type: "assignment",
          title: `Bài tập: ${a.title}`,
          time: a.createdAt,
          icon: <FileTextOutlined />,
          color: "purple",
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 8);

      setRecentActivities(recentActs);

      // Upcoming deadlines
      const upcoming = assignments
        .filter((a: any) => a.dueDate && dayjs(a.dueDate).isAfter(dayjs()))
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

      setUpcomingDeadlines(upcoming);

      // Top students
      if (gradeBook?.students) {
        const studentsWithScores = gradeBook.students
          .map((s: any) => {
            const scores = Object.values(s.columns).filter(
              (col: any) => col.score !== null
            );
            const avgScore =
              scores.length > 0
                ? (scores.reduce((sum: number, col: any) => sum + (col.percentage || 0), 0) as number) /
                scores.length
                : 0;
            return { ...s, avgScore };
          })
          .sort((a: any, b: any) => b.avgScore - a.avgScore)
          .slice(0, 5);

        setTopStudents(studentsWithScores);
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu overview:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        background: '#fff'
      }}>
        <Spin size="large" tip="Đang tải dữ liệu tổng quan..." />
      </div>
    );
  }

  return (
    <div style={{
      paddingLeft: "24px", paddingRight: "24px",
      background: "#fff",
      minHeight: "100vh"
    }}>
      {/* Header */}
      <div style={{
        paddingBottom: 16,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Title level={3} style={{ margin: 0, color: '#262626' }}>
            Tổng quan lớp học
          </Title>
        </Space>
        <Text type="secondary" style={{ fontSize: 13, marginLeft: 12 }}>
          Cập nhật lúc: {dayjs().format("DD/MM/YYYY HH:mm")}
        </Text>
      </div>

      {/* Stats Cards - Simple Style */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: '#fafafa',
              borderRadius: 8,
              border: '1px solid #f0f0f0',
            }}
          >
            <Statistic
              title={<Text type="secondary">Sinh viên</Text>}
              value={stats.totalStudents}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#262626', fontSize: 28, fontWeight: 600 }}
            />
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                {stats.studentsWithGroup} đã có nhóm
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: '#fafafa',
              borderRadius: 8,
              border: '1px solid #f0f0f0',
            }}
          >
            <Statistic
              title={<Text type="secondary">Nhóm học tập</Text>}
              value={stats.totalGroups}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#262626', fontSize: 28, fontWeight: 600 }}
            />
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Tỷ lệ: {Math.round((stats.studentsWithGroup / stats.totalStudents) * 100)}%
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: '#fafafa',
              borderRadius: 8,
              border: '1px solid #f0f0f0',
            }}
          >
            <Statistic
              title={<Text type="secondary">Bài tập</Text>}
              value={stats.totalAssignments}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#262626', fontSize: 28, fontWeight: 600 }}
            />
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                {stats.visibleAssignments} đang hiển thị
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: '#fafafa',
              borderRadius: 8,
              border: '1px solid #f0f0f0',
            }}
          >
            <Statistic
              title={<Text type="secondary">Tài liệu</Text>}
              value={stats.totalMaterials}
              prefix={<FolderOpenOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#262626', fontSize: 28, fontWeight: 600 }}
            />
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                {stats.visibleMaterials} đang hiển thị
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Attendance & Grades */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            style={{
              borderRadius: 8,
              border: '1px solid #f0f0f0',
            }}
            title={
              <Space>
                <CalendarOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: 500, fontSize: 15 }}>Điểm danh</span>
              </Space>
            }
            extra={
              <Button
                type="text"
                size="small"
                onClick={() => navigate(`/teacher/courses/${sectionId}/roll-call`)}
                icon={<ArrowRightOutlined />}
              >
                Chi tiết
              </Button>
            }
          >
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 32,
                    fontWeight: 600,
                    color: '#262626',
                    marginBottom: 4
                  }}>
                    {stats.totalSessions}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>Tổng phiên</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 32,
                    fontWeight: 600,
                    color: '#52c41a',
                    marginBottom: 4
                  }}>
                    {stats.activeSessions}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>Đang hoạt động</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 32,
                    fontWeight: 600,
                    color: '#8c8c8c',
                    marginBottom: 4
                  }}>
                    {stats.totalSessions - stats.activeSessions}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>Đã kết thúc</Text>
                </div>
              </Col>
            </Row>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8
              }}>
                <Text style={{ fontSize: 13 }}>Tỷ lệ điểm danh trung bình</Text>
                <Text strong style={{
                  color: stats.avgAttendanceRate >= 75 ? '#52c41a' :
                    stats.avgAttendanceRate >= 50 ? '#faad14' : '#ff4d4f'
                }}>
                  {stats.avgAttendanceRate.toFixed(1)}%
                </Text>
              </div>
              <Progress
                percent={Number(stats.avgAttendanceRate.toFixed(1))}
                strokeColor={
                  stats.avgAttendanceRate >= 75 ? '#52c41a' :
                    stats.avgAttendanceRate >= 50 ? '#faad14' : '#ff4d4f'
                }
                strokeWidth={8}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            style={{
              borderRadius: 8,
              border: '1px solid #f0f0f0',
            }}
            title={
              <Space>
                <BarChartOutlined style={{ color: '#722ed1' }} />
                <span style={{ fontWeight: 500, fontSize: 15 }}>Điểm số</span>
              </Space>
            }
            extra={
              <Button
                type="text"
                size="small"
                onClick={() => navigate(`/teacher/courses/${sectionId}/grades`)}
                icon={<ArrowRightOutlined />}
              >
                Chi tiết
              </Button>
            }
          >
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 32,
                    fontWeight: 600,
                    color: '#262626',
                    marginBottom: 4
                  }}>
                    {stats.totalGradeColumns}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>Tổng cột điểm</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 32,
                    fontWeight: 600,
                    color: '#52c41a',
                    marginBottom: 4
                  }}>
                    {stats.publishedColumns}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>Đã công bố</Text>
                </div>
              </Col>
            </Row>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8
              }}>
                <Text style={{ fontSize: 13 }}>Tỷ lệ công bố điểm</Text>
                <Text strong style={{ color: '#52c41a' }}>
                  {stats.totalGradeColumns > 0
                    ? Math.round((stats.publishedColumns / stats.totalGradeColumns) * 100)
                    : 0}%
                </Text>
              </div>
              <Progress
                percent={stats.totalGradeColumns > 0
                  ? Math.round((stats.publishedColumns / stats.totalGradeColumns) * 100)
                  : 0}
                strokeColor="#52c41a"
                strokeWidth={8}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bottom Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              height: 450,
            }}
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: 500, fontSize: 15 }}>Hoạt động gần đây</span>
              </Space>
            }
            bodyStyle={{
              padding: '16px 24px',
              height: 'calc(100% - 57px)',
              overflowY: 'auto'
            }}
          >
            {recentActivities.length === 0 ? (
              <Empty
                description="Chưa có hoạt động nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Timeline
                items={recentActivities.map((act) => ({
                  color: act.color,
                  children: (
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 13, marginBottom: 4 }}>
                        {act.title}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(act.time).fromNow()}
                      </Text>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              height: 450,
            }}
            title={
              <Space>
                <CalendarOutlined style={{ color: '#fa8c16' }} />
                <span style={{ fontWeight: 500, fontSize: 15 }}>Deadline sắp tới</span>
              </Space>
            }
            bodyStyle={{
              padding: '12px 16px',
              height: 'calc(100% - 57px)',
              overflowY: 'auto'
            }}
          >
            {upcomingDeadlines.length === 0 ? (
              <Empty
                description="Không có deadline nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={upcomingDeadlines}
                renderItem={(item: any) => {
                  const daysLeft = dayjs(item.dueDate).diff(dayjs(), 'day');
                  const isUrgent = daysLeft <= 3;

                  return (
                    <List.Item style={{ padding: '12px 8px', border: 'none' }}>
                      <List.Item.Meta
                        avatar={
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: isUrgent ? '#fff1f0' : '#f0f5ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${isUrgent ? '#ffccc7' : '#d6e4ff'}`,
                          }}>
                            <ClockCircleOutlined
                              style={{
                                fontSize: 20,
                                color: isUrgent ? '#ff4d4f' : '#1890ff'
                              }}
                            />
                          </div>
                        }
                        title={
                          <div style={{ fontSize: 13, marginBottom: 4 }}>
                            {item.title}
                          </div>
                        }
                        description={
                          <Space direction="vertical" size={2}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(item.dueDate).format("DD/MM/YYYY HH:mm")}
                            </Text>
                            <Tag
                              color={isUrgent ? 'red' : 'orange'}
                              style={{ fontSize: 11, marginTop: 4 }}
                            >
                              {daysLeft === 0 ? 'Hôm nay' :
                                daysLeft === 1 ? 'Ngày mai' :
                                  `Còn ${daysLeft} ngày`}
                            </Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              height: 450,
            }}
            title={
              <Space>
                <TrophyOutlined style={{ color: '#faad14' }} />
                <span style={{ fontWeight: 500, fontSize: 15 }}>Sinh viên xuất sắc</span>
              </Space>
            }
            bodyStyle={{
              padding: '12px 16px',
              height: 'calc(100% - 57px)',
              overflowY: 'auto'
            }}
          >
            {topStudents.length === 0 ? (
              <Empty
                description="Chưa có dữ liệu điểm"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={topStudents}
                renderItem={(student: any, index: number) => {
                  return (
                    <List.Item style={{ padding: '12px 8px', border: 'none' }}>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size={40}
                            style={{
                              background: index === 0 ? '#faad14' :
                                index === 1 ? '#8c8c8c' :
                                  index === 2 ? '#d4380d' : '#f0f0f0',
                              color: index < 3 ? '#fff' : '#262626',
                              fontWeight: 600,
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        }
                        title={
                          <div style={{ fontSize: 13, marginBottom: 4 }}>
                            {student.fullName}
                          </div>
                        }
                        description={
                          <Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {student.studentCode}
                            </Text>
                            <Tag
                              color={student.avgScore >= 80 ? 'green' :
                                student.avgScore >= 70 ? 'blue' : 'orange'}
                            >
                              {student.avgScore.toFixed(1)}%
                            </Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}