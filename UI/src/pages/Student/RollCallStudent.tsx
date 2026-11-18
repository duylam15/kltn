import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import {
  ClipboardCheck,
  Clock,
  Users,
  Hash,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

type AttendanceStatus = "present" | "late" | "absent" | "warning";

type Student = {
  id: number;
  studentCode: string;
  user: {
    fullName: string;
    email: string;
  };
};

type Attendance = {
  id: number;
  sessionId: number;
  studentId: number;
  status: AttendanceStatus;
  checkedInAt: string;
  distance: number | null;
  isValid: boolean;
  ipAddress: string;
  deviceInfo: string;
  student: Student;
};

type AttendanceSession = {
  id: number;
  name: string | null;
  sessionCode: string;
  qrCodeUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  radius: number;
  createdAt: string;
  expiresAt: string | null;
  attendances: Attendance[];
};

const getDeviceFingerprint = () => {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const colorDepth = window.screen.colorDepth;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fingerprint = `${platform}_${screenWidth}x${screenHeight}_${colorDepth}bit_${timezone}`;

  return {
    userAgent: ua,
    platform,
    language,
    screen: `${screenWidth}x${screenHeight}`,
    colorDepth,
    timezone,
    fingerprint,
    deviceMemory: (navigator as any).deviceMemory || "unknown",
    hardwareConcurrency: navigator.hardwareConcurrency || "unknown",
    touchSupport: "ontouchstart" in window,
  };
};

export default function RollCallStudent() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const studentId = user?.student?.id;
  const studentCode = user?.studentCode;

  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);

  const fetchSessions = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/v1/attendance/sections/${sectionId}/sessions`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
      } else {
        setError("Không thể tải danh sách điểm danh");
      }
    } catch (err) {
      setError("Lỗi kết nối server");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (sectionId) {
      fetchSessions();
      const interval = setInterval(() => fetchSessions(true), 30000);
      return () => clearInterval(interval);
    }
  }, [sectionId]);

  const handleCheckIn = async (sessionId: number) => {
    if (!studentCode) {
      setError("Không tìm thấy mã sinh viên");
      return;
    }

    setCheckingIn(sessionId);
    setError("");

    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị GPS");
      setCheckingIn(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        if (accuracy > 50) {
          const confirm = window.confirm(
            `Độ chính xác GPS thấp (${accuracy.toFixed(0)}m).\nBạn có muốn tiếp tục?`
          );
          if (!confirm) {
            setCheckingIn(null);
            return;
          }
        }

        try {
          const deviceInfo = getDeviceFingerprint();

          const res = await fetch(
            "http://localhost:4000/api/v1/attendance/check-in",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Device-Fingerprint": deviceInfo.fingerprint,
              },
              credentials: "include",
              body: JSON.stringify({
                sessionId,
                studentCode,
                latitude,
                longitude,
              }),
            }
          );

          const data = await res.json();

          if (data.success) {
            alert(`${data.message}\n\nĐiểm: ${data.scoreInfo?.score || "N/A"}/10`);
            fetchSessions();
          } else {
            setError(data.message || "Điểm danh thất bại");
          }
        } catch (err) {
          setError("Lỗi kết nối khi điểm danh");
        } finally {
          setCheckingIn(null);
        }
      },
      (err) => {
        let errorMessage = "Không thể lấy vị trí GPS";
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = "Vui lòng cho phép truy cập vị trí trên trình duyệt";
        }
        setError(errorMessage);
        setCheckingIn(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const getMyAttendance = (session: AttendanceSession) => {
    return session.attendances.find((a) => a.studentId === studentId);
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    const config = {
      present: {
        label: "Có mặt",
        icon: CheckCircle2,
        style: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      },
      late: {
        label: "Đi muộn",
        icon: Clock,
        style: "bg-amber-50 text-amber-700 border-amber-200/80",
      },
      warning: {
        label: "Cảnh báo",
        icon: AlertTriangle,
        style: "bg-orange-50 text-orange-700 border-orange-200/80",
      },
      absent: {
        label: "Vắng mặt",
        icon: XCircle,
        style: "bg-rose-50 text-rose-700 border-rose-200/80",
      },
    };
    return config[status];
  };

  const formatDate = (dateString: string) => {
    const date = dayjs(dateString);
    const now = dayjs();
    const diffDays = now.diff(date, "day");

    if (diffDays === 0) return `Hôm nay, ${date.format("HH:mm")}`;
    if (diffDays === 1) return `Hôm qua, ${date.format("HH:mm")}`;
    return date.format("DD/MM/YYYY • HH:mm");
  };

  if (loading) {
    return (
      <div className="w-full px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-52 bg-slate-100/80 animate-pulse rounded-xl border border-slate-200/60"
            />
          ))}
        </div>
      </div>
    );
  }

  const attendedCount = sessions.filter((s) => getMyAttendance(s)).length;
  const openCount = sessions.filter((s) => {
    const expired = s.expiresAt && new Date(s.expiresAt) <= new Date();
    return !expired && !getMyAttendance(s);
  }).length;

  return (
    <div className="w-full px-6 py-6">
      {/* Header gọn gàng, trung tính */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Danh sách điểm danh
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Theo dõi lịch sử chuyên cần và thực hiện điểm danh theo buổi học
          </p>
        </div>

        {sessions.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600">
              Tổng số buổi:{" "}
              <span className="font-semibold text-slate-900">
                {sessions.length}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600">
              Đã điểm danh:{" "}
              <span className="font-semibold text-emerald-600">
                {attendedCount}/{sessions.length}
              </span>
            </div>
            {openCount > 0 && (
              <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium">
                Đang mở: {openCount}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Nội dung chính */}
      {sessions.length === 0 ? (
        <div className="w-full bg-white rounded-xl border border-dashed border-slate-300 py-14 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-800">
            Chưa có buổi điểm danh nào
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Khi giảng viên mở phiên điểm danh, thông tin sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sessions.map((session) => {
            const myAttendance = getMyAttendance(session);
            const isExpired =
              session.expiresAt && new Date(session.expiresAt) <= new Date();
            const canCheckIn = !isExpired && !myAttendance;
            const isCheckingThis = checkingIn === session.id;

            return (
              <div
                key={session.id}
                className={`flex flex-col justify-between bg-white rounded-xl border p-5 transition-all ${
                  canCheckIn
                    ? "border-blue-300 shadow-sm ring-1 ring-blue-500/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Top: Icon + Tên buổi */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                        canCheckIn
                          ? "bg-blue-50 border-blue-200 text-blue-600"
                          : "bg-slate-50 border-slate-200/80 text-slate-600"
                      }`}
                    >
                      <ClipboardCheck className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">
                          {session.name || "Buổi điểm danh"}
                        </h3>
                        {canCheckIn && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            Đang mở
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Thông tin chi tiết phiên */}
                  <div className="space-y-2 py-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5" /> Mã phiên
                      </span>
                      <span className="font-mono font-medium text-slate-700">
                        {session.sessionCode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Đã tham gia
                      </span>
                      <span className="font-medium text-slate-700">
                        {session.attendances.length} sinh viên
                      </span>
                    </div>

                    {session.expiresAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Hạn chót
                        </span>
                        <span
                          className={`font-medium ${
                            isExpired && !myAttendance
                              ? "text-slate-400"
                              : "text-slate-700"
                          }`}
                        >
                          {dayjs(session.expiresAt).format("HH:mm, DD/MM")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Trạng thái hoặc Nút hành động */}
                <div className="pt-3 mt-1 border-t border-slate-100">
                  {myAttendance ? (
                    (() => {
                      const badge = getStatusBadge(myAttendance.status);
                      const StatusIcon = badge.icon;
                      return (
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/60">
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${badge.style}`}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              {badge.label}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              {dayjs(myAttendance.checkedInAt).format(
                                "HH:mm:ss"
                              )}
                            </span>
                          </div>

                          {myAttendance.distance !== null && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2 pt-1.5 border-t border-slate-200/60">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>
                                Khoảng cách GPS:{" "}
                                <strong className="font-medium text-slate-700">
                                  {myAttendance.distance.toFixed(0)}m
                                </strong>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : canCheckIn ? (
                    <button
                      onClick={() => handleCheckIn(session.id)}
                      disabled={isCheckingThis}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isCheckingThis ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang định vị...</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          <span>Điểm danh ngay</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Đã hết hạn điểm danh</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}