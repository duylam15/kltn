import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import toast from "react-hot-toast";
import {
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Fingerprint,
  CalendarClock,
  Timer,
  KeyRound,
} from "lucide-react";
import instance from "../../utils/axiosInstance";

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
 *  Nonce & HMAC helpers
 * ======================== */
async function getNonce(sessionId: number) {
  const res = await instance.get(`/attendance/session/${sessionId}/nonce`, {
    withCredentials: true,
  });
  const data = res.data;
  if (!data.success) throw new Error(data.message || "Không xin được nonce");
  return data.nonce as string;
}

async function getSignature(base: string) {
  const res = await instance.post(
    "/attendance/sign",
    {
      base,
    },
    {
      withCredentials: true,
    }
  );

  const data = res.data;
  if (!data.success) throw new Error(data.message || "Không ký được payload");
  return data.signature as string;
}

/* ========================
 *  UI helpers
 * ======================== */
const statusConfig = {
  present: {
    text: "Có mặt",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-green-600",
  },
  late: {
    text: "Muộn",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
    gradient: "from-amber-500 to-orange-600",
  },
  warning: {
    text: "Cảnh báo",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: AlertCircle,
    gradient: "from-orange-500 to-red-600",
  },
  absent: {
    text: "Vắng",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: XCircle,
    gradient: "from-red-500 to-rose-600",
  },
};

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
  const [tokenBySession, setTokenBySession] = useState<Record<number, string>>(
    {}
  );


  async function fetchSessions() {
    setLoading(true);
    setError("");
    try {
      const res = await instance.get(
        `/attendance/sections/${sectionId}/sessions`,
        { withCredentials: true }
      );
      const data = res.data;
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

  const handleCheckIn = async (sessionId: number) => {
  if (!studentCode) {
    setError("Không tìm thấy mã sinh viên");
    return;
  }
  if (!navigator.geolocation) {
    setError("Trình duyệt không hỗ trợ định vị GPS");
    return;
  }

  const scannedToken = (tokenBySession[sessionId] || "").trim();
  if (!scannedToken) {
    const msg = "Vui lòng nhập mã QR (6 số) từ QR động";
    setError(msg);
    toast.error(msg);
    return;
  }

  setCheckingIn(sessionId);
  setError("");
  // nếu có success banner:
  // setSuccessMsg("");

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude, accuracy } = pos.coords;

        const MAX_ALLOWED_ACCURACY_FOR_STUDENT = 100;
        if (accuracy == null || accuracy > MAX_ALLOWED_ACCURACY_FOR_STUDENT) {
          const msg = "Không thể lấy vị trí chính xác. Vui lòng bật GPS/Wi-Fi rồi thử lại.";
          setError(msg);
          toast.error(msg);
          return;
        }

        const nonce = await getNonce(sessionId);
        const base = [sessionId, latitude, longitude, Math.round(accuracy), nonce].join("|");
        const payloadSig = await getSignature(base);

        const res = await instance.post(
          "/attendance/check-in",
          {
            sessionId: +sessionId,
            studentCode,
            scannedToken,
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            nonce,
            payloadSig,
          },
          { withCredentials: true }
        );

        const data = res.data;

        // ✅ message từ controller
        const msg = data?.message || "Điểm danh thành công";
        toast.success(msg);
        // nếu có success banner:
        // setSuccessMsg(msg);

        if (data?.warning) toast(data.warning);

        setError("");
        setTokenBySession((prev) => ({ ...prev, [sessionId]: "" }));
        fetchSessions();
      } catch (e: any) {
        // ✅ message từ controller (Express)
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Lỗi khi điểm danh";

        setError(msg);
        toast.error(msg);
      } finally {
        setCheckingIn(null);
      }
    },
    (err) => {
      let msg = "Không thể lấy vị trí GPS";
      if (err.code === err.PERMISSION_DENIED) msg = "Vui lòng cho phép truy cập vị trí";
      else if (err.code === err.POSITION_UNAVAILABLE) msg = "Không xác định được vị trí";
      else if (err.code === err.TIMEOUT) msg = "Mã quá thời gian";

      setError(msg);
      toast.error(msg);
      setCheckingIn(null);
    },
    { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 }
  );
};



  const myAttendanceIn = (s: AttendanceSession) =>
    s.attendances.find((a) => a.studentId === studentId);

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500">Đang tải danh sách điểm danh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 ">
        {/* Sessions Grid */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarClock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Chưa có buổi điểm danh
            </h3>
            <p className="text-gray-500 text-sm">
              Giảng viên chưa tạo buổi điểm danh nào cho lớp này
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sessions.map((session) => {
              const att = myAttendanceIn(session);
              const isExpired =
                !!session.expiresAt &&
                new Date(session.expiresAt) <= new Date();
              const canCheckIn = !isExpired && !att;

              const config = att ? statusConfig[att.status] : null;
              const StatusIcon = config?.icon;

              return (
                <div
                  key={session.id}
                  className={`
    bg-white rounded-2xl shadow-md hover:shadow-xl 
    transition-all duration-300 overflow-hidden border-2 
    w-full
    ${att
                      ? config?.border
                      : canCheckIn
                        ? "border-blue-200 hover:border-blue-400"
                        : "border-gray-200"
                    }
    ${canCheckIn ? "hover:-translate-y-1" : ""}
  `}
                >

                  {/* Header Gradient */}

                  <div className="p-5 ">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${att
                          ? config?.bg
                          : canCheckIn
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                            : "bg-gray-100"
                          }`}
                      >
                        {att && StatusIcon ? (
                          <StatusIcon className={`w-6 h-6 ${config?.color}`} />
                        ) : canCheckIn ? (
                          <Fingerprint className="w-6 h-6 text-white" />
                        ) : (
                          <Timer className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 items-center justify-center">
                        <h3 className="font-bold text-gray-900 text-base truncate mb-1">
                          {session.name || "Điểm danh"}
                        </h3>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-2.5 mb-4">
                      {session.expiresAt && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="truncate">
                            Hết hạn: {fmtWhen(session.expiresAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status / Action */}
                    {att ? (
                      <div className="space-y-3">
                        <div
                          className={`flex items-center justify-center gap-2 ${config?.bg} ${config?.border} border-2 rounded-xl py-3`}
                        >
                          {StatusIcon && (
                            <StatusIcon className={`w-5 h-5 ${config?.color}`} />
                          )}
                          <span className={`text-sm font-bold ${config?.color}`}>
                            {config?.text}
                          </span>
                        </div>
                      </div>
                    ) : canCheckIn ? (
                      <div className="space-y-3">
                        {/* ✅ Mã QR */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                            <KeyRound className="w-4 h-4 text-gray-400" />
                            Mã QR (6 số)
                          </label>
                          <input
                            value={tokenBySession[session.id] || ""}
                            onChange={(e) =>
                              setTokenBySession((prev) => ({ ...prev, [session.id]: e.target.value }))
                            }
                            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Nhập mã từ QR động"
                            inputMode="numeric"
                          />
                          <p className="text-[11px] text-gray-400">
                            Mã đổi theo chu kỳ. Nếu báo hết hạn, hãy nhập lại mã mới.
                          </p>
                        </div>

                        <button
                        onClick={() => handleCheckIn(session.id)}
                        disabled={checkingIn === session.id}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-sm font-semibold disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                      >
                        {checkingIn === session.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            <span>Đang xử lý...</span>
                          </>
                        ) : (
                          <>
                            <Fingerprint className="w-4 h-4" />
                            <span>Điểm danh ngay</span>
                          </>
                        )}
                      </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-sm text-red-600 py-3 bg-red-50 border-2 border-red-200 rounded-xl font-medium">
                        <XCircle className="w-4 h-4" />
                        <span>Đã hết hạn</span>
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