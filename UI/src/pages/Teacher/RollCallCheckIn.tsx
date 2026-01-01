// src/pages/Student/RollCallCheckIn.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { User, CheckCircle, KeyRound, Lock } from "lucide-react";
import instance from "../../utils/axiosInstance";


export default function RollCallCheckIn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const codeFromQr = searchParams.get("code") || "";
  const navigate = useNavigate();

  const [studentCode, setStudentCode] = useState("");
  const [password, setPassword] = useState("");              // ✅ thêm
  const [scannedToken, setScannedToken] = useState(codeFromQr);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setScannedToken(codeFromQr);
  }, [codeFromQr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!sessionId) return setError("Không tìm thấy sessionId trong link");
    if (!studentCode.trim()) return setError("Vui lòng nhập mã số sinh viên");
    if (!password.trim()) return setError("Vui lòng nhập mật khẩu");          // ✅ validate
    if (!scannedToken.trim()) return setError("Thiếu mã QR. Vui lòng quét lại QR mới nhất.");

    if (!navigator.geolocation) {
      return setError("Trình duyệt không hỗ trợ định vị. Vui lòng dùng Chrome/Edge và bật GPS.");
    }

    setLoading(true);
    try {
      // 1) GPS
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
         
        });
      });

      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      const accuracy = pos.coords.accuracy ?? 9999;


      // 3) nonce
      const nonceRes = await instance.get(`/attendance/session/${sessionId}/nonce`);
      if (!nonceRes.data?.success) throw new Error(nonceRes.data?.message || "Không lấy được nonce");
      const nonce = nonceRes.data.nonce || nonceRes.data.value;

      // 4) sign payload
      const base = [sessionId, latitude, longitude, accuracy, nonce].join("|");
      const sigRes = await instance.post(`/attendance/sign`, { base });
      if (!sigRes.data?.success) throw new Error(sigRes.data?.message || "Không ký được payload");
      const payloadSig = sigRes.data.signature;

      // 5) check-in
      const body = {
        sessionId: Number(sessionId),
        studentCode: studentCode.trim(),
        password: password.trim(),              
        latitude,
        longitude,
        accuracy,
       
        nonce,
        payloadSig,
        scannedToken: scannedToken.trim(),
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
      if (err?.code === 1 || err?.message === "User denied Geolocation") {
        setError("Bạn đã từ chối quyền vị trí. Hãy bật GPS và cho phép truy cập vị trí rồi thử lại.");
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/40 p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-indigo-700">Điểm danh</h1>
            
            {sessionId && (
              <p className="text-[11px] text-gray-400 mt-1">
                Mã buổi: <span className="font-mono">{sessionId}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="text-green-600 text-sm text-center bg-green-50 py-2 px-3 rounded-lg flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4" /> {successMsg}
              </div>
            )}

            {/* MSSV */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Mã số sinh viên</label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  required
                  className="w-full rounded-xl border pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="VD: 3122410208"
                />
              </div>
            </div>

            {/* Password ✅ */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="Nhập mật khẩu tài khoản"
                />
              </div>
            </div>

            {/* QR token */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Mã QR</label>
              <div className="relative">
                <KeyRound className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={scannedToken}
                  onChange={(e) => setScannedToken(e.target.value)}
                  className="w-full rounded-xl border pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="Quét QR để có mã"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Mã đổi theo chu kỳ. Nếu báo hết hạn, hãy quét lại QR mới.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50"
            >
              {loading ? <span>Đang điểm danh...</span> : "Xác nhận điểm danh"}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-1">
              Hệ thống dùng GPS + QR động + mật khẩu để giảm gian lận.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
