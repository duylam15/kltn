// src/pages/Teacher/DynamicQr.tsx
import React, { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const DEFAULT_PERIOD = 60;

type Props = {
  sessionId: number;
  size?: number;
};

export const DynamicQr: React.FC<Props> = ({ sessionId, size = 320 }) => {
  const [code, setCode] = useState<string>("...");
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_PERIOD);
  const [period, setPeriod] = useState<number>(DEFAULT_PERIOD);

  const FE_URL =
    import.meta.env.VITE_FE_URL?.replace(/\/$/, "") || window.location.origin;

  const link = useMemo(() => {
    // QR chứa link + code (code đổi theo thời gian, link base thì cố định)
    const q = new URLSearchParams({
      sessionId: String(sessionId),
      code: code || "",
    });
    return `${FE_URL}/diemdanh?${q.toString()}`;
  }, [FE_URL, sessionId, code]);

useEffect(() => {
  let countdownTimer: number | undefined;
  let fetchTimer: number | undefined;

  async function fetchCode() {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/attendance/sessions/${sessionId}/totp-current`
    );
    const data = await res.json();

    if (data?.success) {
      const p = Number(data.period || DEFAULT_PERIOD); // p = 60 nếu backend đúng
      setPeriod(p);
      setCode(String(data.token));

      
      setSecondsLeft(p);
    } else {
      setCode("ERROR");
    }
  }

  fetchCode();

  countdownTimer = window.setInterval(() => {
    setSecondsLeft((prev) => (prev <= 1 ? 1 : prev - 1));
  }, 1000);

  // ✅ luôn fetch lại sau p giây
  fetchTimer = window.setInterval(() => {
    fetchCode();
  }, (period || DEFAULT_PERIOD) * 1000);

  return () => {
    if (countdownTimer) clearInterval(countdownTimer);
    if (fetchTimer) clearInterval(fetchTimer);
  };
  // ✅ chỉ phụ thuộc sessionId (để tránh reset interval vì period thay đổi)
}, [sessionId]);


  return (
    <div style={{ textAlign: "center" }}>
      <QRCodeSVG value={link} size={size} level="M" />
      <p style={{ marginTop: 10 }}>
        Mã hiện tại: <b style={{ fontSize: 18 }}>{code}</b>
      </p>
      <p style={{ color: "#666" }}>Đổi mã sau: {secondsLeft}s</p>

      <p style={{ marginTop: 10, fontSize: 12 }}>
        Link:{" "}
        <a href={link} target="_blank" rel="noreferrer">
          {link}
        </a>
      </p>
    </div>
  );
};
