import { ConfigProvider, theme as antdTheme } from "antd";
import AdminStats from "./Admin/AdminStats";
import "../styles/stats.css"; // ⚠️ chỉnh path nếu cần

export default function StatsPage() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#6c5ce7",
          colorInfo: "#6c5ce7",
          borderRadius: 12,
          fontSize: 14,
        },
        algorithm: antdTheme.defaultAlgorithm,
        components: {
          Card: { headerHeight: 54 },
          Statistic: { titleFontSize: 12, contentFontSize: 24 },
        },
      }}
    >
      <div className="stats-gradient-bg">
        <AdminStats />
      </div>
    </ConfigProvider>
  );
}
