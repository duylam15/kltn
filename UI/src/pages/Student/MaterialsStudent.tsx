import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Typography, List, Card, Space, Empty, Spin, Tag, Select } from "antd";
import { FilePdfOutlined, FileTextOutlined, FileImageOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const API_BASE = "http://localhost:4000/api/v1";
const FILE_HOST = "http://localhost:4000";
const PREVIEW_HOST = `${FILE_HOST}/uploads`;

type Material = {
  id: number;
  title: string;
  description?: string | null;
  fileName?: string | null;
  filePath?: string | null;
  fileType?: string | null;
  uploadedAt: string;
};

export default function MaterialsStudent({ sectionId: propId }: { sectionId?: number }) {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const sectionId = useMemo(() => propId ?? Number(path.split("/")[3]), [propId, path]);

  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>("Tất cả");

  useEffect(() => {
    if (!sectionId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get<{ success: boolean; data: Material[] }>(
          `${API_BASE}/materials/class/${sectionId}/open`,
          { withCredentials: true }
        );
        if (res.data?.success) {
          const list = (res.data.data ?? []).sort(
            (a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)
          );
          setMaterials(list);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [sectionId]);

  // ==== Topics từ title (frontend) ====
  const topics = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => set.add(m.title?.trim() || "Khác"));
    return ["Tất cả", ...Array.from(set)];
  }, [materials]);

  // Lọc theo topic đang chọn
  const filteredMaterials = useMemo(() => {
    if (selectedTopic === "Tất cả") return materials;
    return materials.filter((m) => (m.title?.trim() || "Khác") === selectedTopic);
  }, [materials, selectedTopic]);

  // === helpers ===
  const buildFileUrl = (m: Material) => {
    if (m.filePath) {
      if (/^https?:\/\//i.test(m.filePath)) return m.filePath;
      return `${FILE_HOST}/${m.filePath.replace(/^\/+/, "")}`;
    }
    if (m.fileName) return `${FILE_HOST}/uploads/${m.fileName}`;
    return "";
  };

  const iconFor = (m: Material) => {
    const mt = (m.fileType || "").toLowerCase();
    const fn = (m.fileName || "").toLowerCase();
    if (mt.startsWith("image/")) return <FileImageOutlined style={{ marginRight: 10, fontSize: 22, color: "#1677ff" }} />;
    if (mt.includes("pdf") || fn.endsWith(".pdf")) return <FilePdfOutlined style={{ marginRight: 10, fontSize: 22, color: "#1677ff" }} />;
    return <FileTextOutlined style={{ marginRight: 10, fontSize: 22, color: "#1677ff" }} />;
  };

  const fileTypeLabel = (m: Material) => {
    const mt = (m.fileType || "").toUpperCase();
    if (mt.includes("PDF") || (m.fileName || "").toLowerCase().endsWith(".pdf")) return "PDF";
    if (mt.startsWith("IMAGE/")) return "IMAGE";
    if (mt.includes("POWERPOINT") || /\.(ppt|pptx)$/i.test(m.fileName || "")) return "PPT";
    if (mt.includes("WORD") || /\.(doc|docx)$/i.test(m.fileName || "")) return "DOC";
    if (mt.includes("EXCEL") || /\.(xls|xlsx)$/i.test(m.fileName || "")) return "EXCEL";
    if (mt.startsWith("AUDIO") || /\.(mp3|wav|m4a|ogg)$/i.test(m.fileName || "")) return "AUDIO";
    if (mt.startsWith("VIDEO") || /\.(mp4|mkv|avi|mov|webm)$/i.test(m.fileName || "")) return "VIDEO";
    return mt || "FILE";
  };

  const previewImageFor = (m: Material) => {
    const fn = (m.fileName || "").toLowerCase();
    const mt = (m.fileType || "").toLowerCase();

    if (mt.includes("pdf") || fn.endsWith(".pdf")) return `${PREVIEW_HOST}/imagesPDF.png`;
    if (mt.includes("powerpoint") || /\.(ppt|pptx)$/i.test(fn)) return `${PREVIEW_HOST}/imagePP.png`;
    if (mt.includes("word") || /\.(doc|docx)$/i.test(fn)) return `${PREVIEW_HOST}/imageDOC.png`;
    if (mt.includes("excel") || /\.(xls|xlsx)$/i.test(fn)) return `${PREVIEW_HOST}/imageExcel.png`;
    if (mt.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/i.test(fn)) return `${PREVIEW_HOST}/imageAudio.png`;
    if (mt.startsWith("video/") || /\.(mp4|mkv|avi|mov|webm)$/i.test(fn)) return `${PREVIEW_HOST}/imageVideo.png`;
    if (mt.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(fn)) {
      const url = buildFileUrl(m);
      return url || `${PREVIEW_HOST}/imageTemp.jpg`;
    }
    return `${PREVIEW_HOST}/imageTemp.jpg`;
  };

  // ==== Group theo title nhưng dùng filteredMaterials (đã lọc) ====
  const groups = useMemo(() => {
    return filteredMaterials.reduce<Record<string, Material[]>>((acc, m) => {
      const key = (m.title || "Khác").trim().toLowerCase();
      (acc[key] ||= []).push(m);
      return acc;
    }, {});
  }, [filteredMaterials]);

  const titleLabel = useMemo(() => {
    const map: Record<string, string> = {};
    filteredMaterials.forEach((m) => {
      const key = (m.title || "Khác").trim().toLowerCase();
      if (!map[key]) map[key] = m.title || "Khác";
    });
    return map;
  }, [filteredMaterials]);

  const GroupBlock = ({ gkey, items }: { gkey: string; items: Material[] }) => (
    <div style={{ marginBottom: 28 }}>
      <Title level={2} style={{ margin: "8px 0 16px" }}>
        {titleLabel[gkey] || "Khác"}
      </Title>

      <List
        dataSource={items}
        renderItem={(m) => {
          const isOpen = openId === m.id;
          const url = buildFileUrl(m);
          const toggle = () => setOpenId(isOpen ? null : m.id);
          const openNewTab = () => url && window.open(url, "_blank", "noopener");

          return (
            <List.Item key={m.id} style={{ display: "block" }}>
              <Card
                hoverable
                onClick={toggle}
                style={{ width: "100%", borderRadius: 12 }}
                bodyStyle={{ padding: 14 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Space direction="vertical" size={4} style={{ flex: 1 }}>
                    <Text strong style={{ whiteSpace: "pre-wrap", fontSize: 16 }}>
                      {iconFor(m)}
                      {m.description || m.fileName || "(Không có mô tả)"}
                    </Text>
                  </Space>

                  <Text type="secondary">
                    Đã đăng {dayjs(m.uploadedAt).format("DD/MM/YYYY")}
                  </Text>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 12 }}>
                    <Card
                      hoverable
                      onClick={(e) => {
                        e.stopPropagation();
                        openNewTab();
                      }}
                      style={{ borderRadius: 10, background: "#fafafa" }}
                      bodyStyle={{ padding: 12 }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <img
                          src={previewImageFor(m)}
                          alt="preview"
                          style={{
                            width: 136,
                            height: 86,
                            objectFit: "cover",
                            borderRadius: 8,
                            background: "#f0f0f0",
                          }}
                        />
                        <Space direction="vertical" size={2}>
                          <a
                            href={url || "#"}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontWeight: 600 }}
                          >
                            {m.fileName || "(Không có tệp)"}
                          </a>
                          <Tag bordered={false}>{fileTypeLabel(m)}</Tag>
                        </Space>
                      </div>
                    </Card>

                    {url && (
                      <div style={{ marginTop: 8 }}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Xem tài liệu
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </List.Item>
          );
        }}
      />
    </div>
  );

  const orderedGroups = useMemo(
    () =>
      Object.entries(groups).sort(
        (a, b) =>
          +new Date(b[1][0]?.uploadedAt || 0) - +new Date(a[1][0]?.uploadedAt || 0)
      ),
    [groups]
  );

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 16 }}>
        {/* Bộ lọc chủ đề */}
        <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <Text strong>Chủ đề:</Text>
          <Select
            style={{ minWidth: 240 }}
            value={selectedTopic}
            onChange={setSelectedTopic}
            options={topics.map((t) => ({ value: t, label: t }))}
          />
        </div>

        {filteredMaterials.length === 0 ? (
          <Empty description="Chưa có tài liệu" />
        ) : (
          orderedGroups.map(([gkey, items]) => (
            <GroupBlock key={gkey} gkey={gkey} items={items} />
          ))
        )}
      </div>
    </Spin>
  );
}
