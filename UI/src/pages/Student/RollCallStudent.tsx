// src/pages/Student/RollCallStudent.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import toast from "react-hot-toast";

dayjs.extend(relativeTime);
dayjs.locale("vi");

/* ========================
 *  Types
 * ======================== */
type AttendanceStatus = "present" | "late" | "absent" | "warning";

type Student = {
  id: number;
  studentCode: string;
  user: { fullName: string; email: string };
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

/* ========================
 *  CONFIG
 * ======================== */
const API_BASE = "http://localhost:4000/api/v1";

// Khuyến nghị & ngưỡng chặn accuracy (đồng bộ với backend)
const RECOMMENDED_ACCURACY = 80;   // cảnh báo
const MAX_ALLOWED_ACCURACY = 100;  // chặn

/* ========================
 *  Fingerprint & DeviceId
 * ======================== */
const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

async function sha256Hex(input: string) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

/** Thu thập các trường fingerprint “ổn định”, không lộ UA vào deviceId */
function getDeviceFingerprintFields() {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const sw = window.screen.width;
  const sh = window.screen.height;
  const colorDepth = window.screen.colorDepth;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const deviceMemory = (navigator as any).deviceMemory ?? "unknown";
  const hardwareConcurrency = navigator.hardwareConcurrency ?? "unknown";
  const touchSupport = "ontouchstart" in window;

  return {
    userAgent: ua,
    platform,
    language,
    screen: `${sw}x${sh}`,
    colorDepth,
    timezone,
    deviceMemory,
    hardwareConcurrency,
    touchSupport,
  };
}

/** Tạo deviceId = SHA256(platform|screen|colorDepth|timezone|language|deviceMemory|HW|touch) */
async function buildDeviceId() {
  const f = getDeviceFingerprintFields();
  const raw = [
    f.platform,
    f.screen,
    f.colorDepth,
    f.timezone,
    f.language,
    String(f.deviceMemory),
    String(f.hardwareConcurrency),
    String(f.touchSupport),
  ].join("|");
  const deviceId = await sha256Hex(raw);
  return { deviceId, userAgent: f.userAgent, fields: f };
}

/* ========================
 *  Nonce & HMAC helpers
 * ======================== */
async function getNonce(sessionId: number) {
  const res = await fetch(`${API_BASE}/attendance/session/${sessionId}/nonce`, {
    credentials: "include",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Không xin được nonce");
  return data.nonce as string;
}

async function getSignature(base: string) {
  const res = await fetch(`${API_BASE}/attendance/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ base }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Không ký được payload");
  return data.signature as string;
}

/* ========================
 *  UI helpers
 * ======================== */
const statusText = (s: AttendanceStatus) =>
  ({ present: "Có mặt", late: "Muộn", warning: "Cảnh báo", absent: "Vắng" }[s]);
const statusColor = (s: AttendanceStatus) =>
  ({ present: "text-green-700", late: "text-yellow-700", warning: "text-orange-700", absent: "text-red-700" }[s]);

const fmtWhen = (s: string) => {
  const d = dayjs(s);
  const now = dayjs();
  const diffDays = now.diff(d, "day");
  if (diffDays === 0) return `Hôm nay ${d.format("HH:mm")}`;
  if (diffDays === 1) return `Hôm qua ${d.format("HH:mm")}`;
  return d.format("DD/MM/YYYY HH:mm");
};

/* ========================
 *  Component
 * ======================== */
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

  async function fetchSessions() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/attendance/sections/${sectionId}/sessions`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) setSessions(data.data);
      else setError(data.message || "Không thể tải danh sách điểm danh");
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!sectionId) return;
    fetchSessions();
    const t = setInterval(fetchSessions, 30_000);
    return () => clearInterval(t);
  }, [sectionId]);

  /* =========================================================
   * CHECK-IN: GPS → Nonce → HMAC → POST check-in
   * ========================================================= */
  const handleCheckIn = async (sessionId: number) => {
    if (!studentCode) {
      setError("Không tìm thấy mã sinh viên");
      return;
    }
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị GPS");
      return;
    }

    setCheckingIn(sessionId);
    setError("");

    // B1: Lấy GPS (ưu tiên độ chính xác)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;

          // chặn nếu độ chính xác của GV quá kém
      const MAX_ALLOWED_ACCURACY_FOR_TEACHER = 100; // mét
      if (accuracy == null || accuracy > MAX_ALLOWED_ACCURACY_FOR_TEACHER) {
        toast.error(
          `Không thể lấy vị trí chính xác. Bật Wi-Fi/High Accuracy và thử lại.`
        );
        return;
      }

          // B2: Device fingerprint → deviceId + UA
          const { deviceId, userAgent, fields } = await buildDeviceId();

          // B3: Xin nonce theo session
          const nonce = await getNonce(sessionId);

          // B4: Base string & xin chữ ký HMAC từ server
          // ⚠️ PHẢI KHỚP verify() backend:
          // `${sessionId}|${lat}|${lng}|${accuracy}|${nonce}`
          const base = [
            sessionId,
            latitude,
            longitude,
            Math.round(accuracy), // rút gọn vẫn an toàn
            nonce,
          ].join("|");
          const payloadSig = await getSignature(base);

          // B5: Gửi check-in (body đầy đủ)
          const res = await fetch(`${API_BASE}/attendance/check-in`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // truyền thêm thông tin mô tả device (optional, chỉ để log)
              "X-Device-Screen": fields.screen,
              "X-Device-TZ": fields.timezone,
            },
            credentials: "include",
            body: JSON.stringify({
              sessionId: Number(sessionId),
              studentCode,
              latitude,
              longitude,
              accuracy: Math.round(accuracy),
              deviceId,
              nonce,
              payloadSig,
            }),
          });

          const data = await res.json();
          if (data.success) {
            toast.success(
              `${data.message}` +
                (data.warning ? `\n⚠️ ${data.warning}` : "") +
                (data.scoreInfo?.score != null
                  ? `\nĐiểm: ${data.scoreInfo.score}/10`
                  : "")
            );
            fetchSessions();
          } else {
            setError(data.message || "Điểm danh thất bại");
          }
        } catch (e: any) {
          setError(e?.message || "Lỗi khi điểm danh");
        } finally {
          setCheckingIn(null);
        }
      },
      (err) => {
        let msg = "Không thể lấy vị trí GPS";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Vui lòng cho phép truy cập vị trí";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Không xác định được vị trí (POSITION_UNAVAILABLE)";
        } else if (err.code === err.TIMEOUT) {
          msg = "Lấy vị trí quá thời gian (TIMEOUT)";
        }
        setError(msg);
        setCheckingIn(null);
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 }
    );
  };

  const myAttendanceIn = (s: AttendanceSession) =>
    s.attendances.find((a) => a.studentId === studentId);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
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
              const att = myAttendanceIn(session);
              const isExpired =
                !!session.expiresAt &&
                new Date(session.expiresAt) <= new Date();
              const canCheckIn = !isExpired && !att;

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl">
                        📝
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {session.name || "Điểm danh"}
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {fmtWhen(session.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5 mb-3 text-xs text-gray-600">
                      <p className="truncate">Mã: {session.sessionCode}</p>
                      <p>{session.attendances.length} sinh viên</p>
                      {session.expiresAt && (
                        <p className="truncate">Hết: {fmtWhen(session.expiresAt)}</p>
                      )}
                    </div>

                    {/* Status / Action */}
                    {att ? (
                      <div className="space-y-2">
                        <div
                          className={`text-xs font-medium ${statusColor(
                            att.status
                          )} text-center py-2 bg-gray-50 rounded`}
                        >
                          ✓ {statusText(att.status)}
                        </div>
                        <p className="text-xs text-gray-600 text-center">
                          {dayjs(att.checkedInAt).format("HH:mm:ss")}
                        </p>
                        {att.distance !== null && (
                          <p className="text-xs text-gray-500 text-center">
                            {att.distance.toFixed(0)}m
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