import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { User, CheckCircle } from "lucide-react";
import instance from "../../utils/axiosInstance";


function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const KEY = "lms_device_id";
    let id = localStorage.getItem(KEY);
    if (!id) {
      if ("randomUUID" in crypto) {
        id = crypto.randomUUID();
      } else {
        id =
          Math.random().toString(36).substring(2) +
          Date.now().toString(36);
      }
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "unknown-device";
  }
}

export default function RollCallCheckIn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const navigate = useNavigate();

  const [studentCode, setStudentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!sessionId) {
      setError("Không tìm thấy sessionId trong link");
      return;
    }

    if (!studentCode.trim()) {
      setError("Vui lòng nhập mã số sinh viên");
      return;
    }

    if (!navigator.geolocation) {
      setError(
        "Trình duyệt của bạn không hỗ trợ định vị. Vui lòng dùng Chrome / Edge và bật GPS."
      );
      return;
    }

    setLoading(true);
    try {
      // 1) Lấy vị trí
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      const accuracy = pos.coords.accuracy ?? 9999;

      // 2) Lấy / tạo deviceId
      const deviceId = getOrCreateDeviceId();

      // 3) Xin nonce cho session
      const nonceRes = await instance.get(
        `/attendance/session/${sessionId}/nonce`
      );
      if (!nonceRes.data?.success) {
        throw new Error(nonceRes.data?.message || "Không lấy được nonce");
      }
      const nonce = nonceRes.data.nonce || nonceRes.data.value;

      // 4) Tạo base string và xin HMAC
      const base = [sessionId, latitude, longitude, accuracy, nonce].join("|");
      const sigRes = await instance.post(`/attendance/sign`, {
        base,
      });
      if (!sigRes.data?.success) {
        throw new Error(sigRes.data?.message || "Không ký được payload");
      }
      const payloadSig = sigRes.data.signature;

      // 5) Gửi check-in
      const body = {
        sessionId: Number(sessionId),
        studentCode: studentCode.trim(),
        latitude,
        longitude,
        accuracy,
        deviceId,
        nonce,
        payloadSig,
        // scannedToken: "" // nếu sau này bạn muốn bắt SV nhập mã TOTP thì thêm ở đây
      };

      const res = await instance.post(`/attendance/check-in`, body);

      if (res.data.success) {
        setSuccessMsg(res.data.message || "Điểm danh thành công");
        setTimeout(() => navigate("/"), 2000);
      } else {
        setError(res.data.message || "Điểm danh thất bại");
      }
    } catch (err: any) {
      console.error(err);
      // lỗi geolocation riêng để message dễ hiểu
      if (err?.code === 1 || err?.message === "User denied Geolocation") {
        setError(
          "Bạn đã từ chối quyền truy cập vị trí. Vui lòng bật GPS và cho phép trình duyệt truy cập vị trí rồi thử lại."
        );
      } else {
        setError(err.response?.data?.message || err.message || "Có lỗi xảy ra");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative flex items-center justify-center"
      style={{ backgroundImage: "url('/bgsgu3.jpg')" }}
    >
      {/* Overlay mờ */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      {/* Content */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/40 p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-indigo-700">Điểm danh</h1>
            <p className="text-gray-600 text-sm mt-1">
              Nhập mã sinh viên và cho phép truy cập vị trí để điểm danh
            </p>

            {sessionId && (
              <p className="text-[11px] text-gray-400 mt-1">
                Mã buổi: <span className="font-mono">{sessionId}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-lg flex items-center justify-center gap-1">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="text-green-600 text-sm text-center bg-green-50 py-2 px-3 rounded-lg flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4" /> {successMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Mã số sinh viên
              </label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  required
                  className="w-full rounded-xl border pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="VD: SV100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50"
            >
              {loading ? (
                <span>Đang điểm danh...</span>
              ) : (
                "Xác nhận điểm danh"
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-1">
              Hệ thống sử dụng GPS và thiết bị để chống gian lận.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
