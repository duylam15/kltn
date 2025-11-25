// src/pages/Teacher/DynamicQr.tsx
import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const API_BASE = "http://localhost:4000/api/v1";

interface DynamicQrProps {
  sessionId: number;
  size?: number;
}

const DEFAULT_PERIOD = 10; // 10 giây

export const DynamicQr: React.FC<DynamicQrProps> = ({
  sessionId,
  size = 260,
}) => {
  const [token, setToken] = useState<string>("Đang tải...");
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_PERIOD);
  const [period, setPeriod] = useState<number>(DEFAULT_PERIOD);

  useEffect(() => {
    let countdownTimer: number;
    let fetchTimer: number;

    async function fetchToken() {
      try {
        const res = await fetch(
          `${API_BASE}/attendance/sessions/${sessionId}/totp-current`
        );
        const data = await res.json();

        if (data.success) {
          setToken(data.token);
          const p = data.period || DEFAULT_PERIOD;
          setPeriod(p);
          setSecondsLeft(data.remaining ?? p);
        } else {
          setToken("TOTP Error");
        }
      } catch (err) {
        console.error("fetch TOTP error:", err);
        setToken("TOTP Error");
      }
    }

    // gọi ngay lần đầu
    fetchToken();

    // đếm ngược mỗi 1s
    countdownTimer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? period : prev - 1));
    }, 1000);

    // gọi lại backend mỗi `period` giây
    fetchTimer = window.setInterval(fetchToken, period * 1000);

    return () => {
      clearInterval(countdownTimer);
      clearInterval(fetchTimer);
    };
  }, [sessionId, period]);

  return (
    <div style={{ textAlign: "center" }}>
      <QRCodeSVG value={token} size={size} level="M" />
      <p>
        Mã hiện tại: <b>{token}</b>
      </p>
      <p>Cập nhật sau: {secondsLeft}s</p>
    </div>
  );
};
