"use client";

export default function RuntimeBadge({
  label,
}: {
  label: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 8,
        right: 18,
        zIndex: 9999,
        opacity: 0.7,
        padding: "3px 6px",
        borderRadius: 4,
        background: "rgba(0,0,0,0.55)",
        color: "white",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      Runtime · {label}
    </div>
  );
}
