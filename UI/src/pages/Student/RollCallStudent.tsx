import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
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

  const fetchSessions = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sectionId) {
      fetchSessions();
      const interval = setInterval(fetchSessions, 30000);
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
            alert(`✅ ${data.message}\n\nĐiểm: ${data.scoreInfo?.score || "N/A"}/10`);
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
      (error) => {
        let errorMessage = "Không thể lấy vị trí GPS";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Vui lòng cho phép truy cập vị trí";
        }
        alert(errorMessage);
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

  const getStatusText = (status: AttendanceStatus) => {
    const statusMap = {
      present: "Có mặt",
      late: "Muộn",
      warning: "Cảnh báo",
      absent: "Vắng",
    };
    return statusMap[status];
  };

  const getStatusColor = (status: AttendanceStatus) => {
    const colorMap = {
      present: "text-green-700",
      late: "text-yellow-700",
      warning: "text-orange-700",
      absent: "text-red-700",
    };
    return colorMap[status];
  };

  const formatDate = (dateString: string) => {
    const date = dayjs(dateString);
    const now = dayjs();
    const diffDays = now.diff(date, "day");

    if (diffDays === 0) return `Hôm nay ${date.format("HH:mm")}`;
    if (diffDays === 1) return `Hôm qua ${date.format("HH:mm")}`;
    return date.format("DD/MM/YYYY HH:mm");
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Content */}
      <div className="px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <p className="text-gray-600">Không có buổi điểm danh nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sessions.map((session) => {
              const myAttendance = getMyAttendance(session);
              const isExpired = session.expiresAt && new Date(session.expiresAt) <= new Date();
              const canCheckIn = !isExpired && !myAttendance;

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    {/* Header with Icon and Title */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl">
                        📝
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {session.name || "Điểm danh"}
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {formatDate(session.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5 mb-3 text-xs text-gray-600">
                      <p className="truncate">Mã: {session.sessionCode}</p>
                      <p>{session.attendances.length} sinh viên</p>
                      {session.expiresAt && (
                        <p className="truncate">
                          Hết: {formatDate(session.expiresAt)}
                        </p>
                      )}
                    </div>

                    {/* Status or Action */}
                    {myAttendance ? (
                      <div className="space-y-2">
                        <div className={`text-xs font-medium ${getStatusColor(myAttendance.status)} text-center py-2 bg-gray-50 rounded`}>
                          ✓ {getStatusText(myAttendance.status)}
                        </div>
                        <p className="text-xs text-gray-600 text-center">
                          {dayjs(myAttendance.checkedInAt).format("HH:mm:ss")}
                        </p>
                        {myAttendance.distance !== null && (
                          <p className="text-xs text-gray-500 text-center">
                            {myAttendance.distance.toFixed(0)}m
                          </p>
                        )}
                      </div>
                    ) : canCheckIn ? (
                      <button
                        onClick={() => handleCheckIn(session.id)}
                        disabled={checkingIn === session.id}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {checkingIn === session.id ? "Đang xử lý..." : "Điểm danh"}
                      </button>
                    ) : (
                      <div className="text-center text-xs text-red-600 py-2 bg-red-50 rounded">
                        Đã hết hạn
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}