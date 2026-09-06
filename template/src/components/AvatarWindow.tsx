import React from "react";
import { Img, staticFile } from "remotion";

interface AvatarWindowProps {
  src?: string;
  fallbackLabel?: string;
}

/**
 * 右上角圆形头像窗（全程挂着）
 * - 有 src：显示真实头像，圆形裁剪
 * - 无 src：显示深灰占位 + 文字标签（"讲者头像"）
 * - 黑色边框 + 内阴影 + 外发光
 */
export const AvatarWindow: React.FC<AvatarWindowProps> = ({ src, fallbackLabel = "讲者" }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 905 - 140,
        top: 175 - 140,
        width: 280,
        height: 280,
        borderRadius: "50%",
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
        border: "3px solid #000",
        boxShadow:
          "0 0 0 2px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        <Img
          src={staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background:
              "radial-gradient(circle at 50% 35%, #3a4658 0%, #1a2230 60%, #0a0f18 100%)",
            color: "#7a8696",
            fontSize: 22,
            fontWeight: 500,
            textAlign: "center",
            padding: "0 16px",
          }}
        >
          {/* 占位头像图形（圆形 + 肩部） */}
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="46" r="22" fill="#5a6878" />
            <path d="M 18 116 Q 18 80 60 80 Q 102 80 102 116 Z" fill="#5a6878" />
          </svg>
          <div style={{ marginTop: 6, color: "#9aa6b8", fontSize: 18 }}>{fallbackLabel}</div>
        </div>
      )}
    </div>
  );
};
