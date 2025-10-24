import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { User, CheckCircle } from "lucide-react";
import axios from "axios";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

const API_BASE = "http://localhost:4000/api/v1";

export default function RollCallCheckIn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const navigate = useNavigate();

  const [studentCode, setStudentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const getDeviceId = async () => {
    const fp = await FingerprintJS.load();
    const r = await fp.get();
    return r.visitorId;
  };

  const getGeo = () =>
    new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
      })
    );

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

    setLoading(true);
    try {
      // 1) Nonce TTL ngắn
      const nonceRes = await axios.get(
        `${API_BASE}/attendance/session/${Number(sessionId)}/nonce`
      );
      const nonce: string = nonceRes.data?.nonce;
      if (!nonce) throw new Error("Không xin được nonce");

      // 2) GPS
      let latitude: number | null = null;
      let longitude: number | null = null;
      let accuracy: number | null = null;
      try {
        const pos = await getGeo();
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
        accuracy = pos.coords.accuracy;
      } catch {
        setError("Không lấy được vị trí. Vui lòng bật GPS và thử lại.");
        setLoading(false);
        return;
      }

      // 3) deviceId
      const deviceId = await getDeviceId();

      // 4) Xin chữ ký HMAC từ server (POST + body)
      const base = `${Number(sessionId)}|${latitude}|${longitude}|${accuracy}|${nonce}`;
      const sigRes = await axios.post(`${API_BASE}/attendance/sign`, { base });
      const payloadSig: string = sigRes.data?.signature;
      if (!payloadSig) throw new Error("Không ký được payload");

      // 5) Gửi check-in (POST + body JSON)
      const res = await axios.post(`${API_BASE}/attendance/check-in`, {
        sessionId: Number(sessionId),
        studentCode,
        latitude,
        longitude,
        accuracy,
        deviceId,
        nonce,
        payloadSig,
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || "Điểm danh thành công");
        setTimeout(() => navigate("/"), 1500);
      } else {
        setError(res.data?.message || "Điểm danh thất bại");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi điểm danh";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 to-white p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-700">Điểm danh</h1>
          <p className="text-gray-500 text-sm mt-1">
            Nhập mã sinh viên để điểm danh
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="text-green-600 text-sm text-center bg-green-50 py-2 rounded-lg flex items-center justify-center gap-1">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Mã số sinh viên</label>
            <div className="relative">
              <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                required
                className="w-full rounded-xl border pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="VD: SV100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 mt-3 text-white py-2.5 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <span>Đang điểm danh...</span> : "Xác nhận điểm danh"}
          </button>
        </form>
      </div>
    </div>
  );
}
