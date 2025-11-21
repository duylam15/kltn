import React, { useState, useEffect } from "react";
import { totp } from "otplib";
import { QRCodeSVG } from "qrcode.react";

interface DynamicQrProps {
  secretBase32: string;
  period?: number;
  digits?: number;
  size?: number;
}

export const DynamicQr: React.FC<DynamicQrProps> = ({
  secretBase32,
  period = 10,
  digits = 6,
  size = 256,
}) => {
  const [token, setToken] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(period);

  useEffect(() => {
    if (!secretBase32 || secretBase32.length < 16) {
      setToken("ERROR: No secret");
      return;
    }

    try {
      totp.options = { digits, step: period };
      const updateToken = () => {
        const newToken = totp.generate(secretBase32);
        setToken(newToken);
      };
      updateToken();
      const interval = setInterval(updateToken, period * 1000);
      return () => clearInterval(interval);
    } catch (err) {
      console.error("TOTP error:", err);
      setToken("TOTP Error");
    }
  }, [secretBase32, period, digits]);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setSecondsLeft(period - (elapsed % period));
    }, 100);
    return () => clearInterval(timer);
  }, [period]);

  if (!secretBase32) {
    return (
      <div style={{ textAlign: "center", color: "red" }}>
        <p>Không có TOTP secret</p>
        <p>Vui lòng tạo lại phiên điểm danh</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <QRCodeSVG value={token} size={size} level="M" />
      <div style={{ marginTop: 12, fontSize: 14, color: "#666" }}>
        Mã hiện tại: <strong>{token}</strong>
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: "#999" }}>
        Cập nhật sau: <strong>{secondsLeft}s</strong>
      </div>
    </div>
  );
};