export function PrettyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(255,255,255,.96)",
        borderRadius: 12,
        padding: "8px 10px",
        boxShadow: "0 8px 24px rgba(108,92,231,.15)",
        border: "1px solid #f0f0f0",
        minWidth: 160,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any, idx: number) => (
        <div
          key={idx}
          style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
        >
          <span style={{ opacity: 0.75 }}>{p.name}</span>
          <span style={{ fontWeight: 600 }}>
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
