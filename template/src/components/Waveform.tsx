import React from "react";

interface WaveformProps {
  x: number;
  y: number;
  width: number;
  height: number;
  barWidth: number;
  gap: number;
  color: string;
  frame: number;
  seed: number;
}

/**
 * 实时波形条（纯 SVG/CSS，无音频）
 * - 桶数 = floor(width / (barWidth + gap))
 * - 每桶高度 = f(frame, i, seed) → 0..height 区间
 * - 视觉：中间高、两端低，模拟说话时的能量分布
 */
export const Waveform: React.FC<WaveformProps> = ({
  x, y, width, height, barWidth, gap, color, frame, seed,
}) => {
  const step = barWidth + gap;
  const count = Math.floor(width / step);
  const bars: React.ReactElement[] = [];

  for (let i = 0; i < count; i++) {
    // 用 sin 组合 + 噪声制造"看起来像人声"的波形
    const t = (frame + i * 0.3 + seed) * 0.18;
    const env = Math.sin((i / count) * Math.PI); // 0..1..0，两端低中间高
    const noise = 0.4 + 0.6 * Math.abs(Math.sin(t) * 0.5 + Math.cos(t * 1.7) * 0.5);
    const h = Math.max(2, env * noise * height);
    const bx = x + i * step;
    const by = y + (height - h) / 2;
    bars.push(
      <rect
        key={i}
        x={bx}
        y={by}
        width={barWidth}
        height={h}
        fill={color}
        rx={barWidth / 2}
      />,
    );
  }

  return (
    <svg
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      width={width}
      height={height + y * 0}
    >
      <g transform={`translate(0, 0)`}>{bars}</g>
    </svg>
  );
};
