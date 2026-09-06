import React from "react";
import { Img, staticFile } from "remotion";
import { COLORS } from "../data/defaults";

type Layout = "pyramid" | "flow" | "grid4" | "ring" | "image";

interface CardContentProps {
  layout: Layout;
  /** layout==="image" 时必填：public/ 下的图片文件名 */
  imageSrc?: string;
}

/**
 * 信息图版式（内置 4 种 + 自定义图片）
 *  - pyramid：5 层金字塔（体系/层级）
 *  - flow：总花费 → 可报 / 自费 流向图（算账对比）
 *  - grid4：4 宫格场景（并列清单）
 *  - ring：闭环图（不是二选一，是 A + B）
 *  - image：用现成 PNG/JPG（放 public/ 下）
 */
export const CardContent: React.FC<CardContentProps> = ({ layout, imageSrc }) => {
  // 自定义图片优先
  if (layout === "image" || imageSrc) {
    if (!imageSrc) return <Pyramid />;
    return (
      <Img
        src={staticFile(imageSrc)}
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
      />
    );
  }

  switch (layout) {
    case "pyramid":
      return <Pyramid />;
    case "flow":
      return <Flow />;
    case "grid4":
      return <Grid4 />;
    case "ring":
      return <Ring />;
    default:
      return <Pyramid />;
  }
};

/* ====================== Pyramid: 医保金字塔 ====================== */
const Pyramid: React.FC = () => (
  <svg width="880" height="520" viewBox="0 0 880 520">
    <defs>
      <linearGradient id="pyramidTop" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A" />
        <stop offset="100%" stopColor="#D4A857" />
      </linearGradient>
      <linearGradient id="pyramidMid1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3a5680" />
        <stop offset="100%" stopColor="#2a4060" />
      </linearGradient>
      <linearGradient id="pyramidMid2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1f3358" />
        <stop offset="100%" stopColor="#15243f" />
      </linearGradient>
    </defs>

    {/* 顶层：商业医疗险（金字塔尖） */}
    <polygon
      points="440,30 510,90 370,90"
      fill="url(#pyramidTop)"
      stroke="#F0CE82"
      strokeWidth="1.5"
    />
    <text x="440" y="76" textAnchor="middle" fill="#1A1A1A" fontSize="18" fontWeight="700">
      商业医疗险
    </text>

    {/* 第二层：公务员医疗补助 */}
    <polygon
      points="370,95 510,95 580,170 300,170"
      fill="url(#pyramidMid1)"
      stroke="#4a6890"
      strokeWidth="1.5"
    />
    <text x="440" y="142" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="600">
      公务员医疗补助
    </text>

    {/* 第三层：职工医保 */}
    <polygon
      points="300,175 580,175 650,250 230,250"
      fill="url(#pyramidMid2)"
      stroke="#3a5680"
      strokeWidth="1.5"
    />
    <text x="440" y="222" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="600">
      职工医保
    </text>

    {/* 底座：3 个限制卡片（装饰，不放标签文字，标签由外层 tagBar 渲染） */}
    <rect x="40" y="300" width="800" height="200" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="6 6" />
    <text x="440" y="380" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="20" fontWeight="500" letterSpacing="2">
      三 大 局 限
    </text>
    <text x="440" y="425" textAnchor="middle" fill="rgba(255,255,255,0.20)" fontSize="16" fontWeight="400">
      封顶线 · 目录外 · 异地报销打折
    </text>
  </svg>
);

/* ====================== Flow: 报销缺口流向图 ====================== */
const Flow: React.FC = () => (
  <svg width="880" height="520" viewBox="0 0 880 520">
    <defs>
      <linearGradient id="flowBig" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3a5680" />
        <stop offset="100%" stopColor="#1f3358" />
      </linearGradient>
      <linearGradient id="flowSmall" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A" />
        <stop offset="100%" stopColor="#D4A857" />
      </linearGradient>
    </defs>

    {/* 标题 */}
    <text x="440" y="40" textAnchor="middle" fill="#FFFFFF" fontSize="26" fontWeight="700">
      总花费 30 万 → 医保只报 10 万
    </text>

    {/* 总花费（大块） */}
    <rect x="60" y="90" width="760" height="120" rx="8" fill="url(#flowBig)" stroke="#4a6890" strokeWidth="1.5" />
    <text x="440" y="135" textAnchor="middle" fill="#FFFFFF" fontSize="28" fontWeight="700">
      总医疗花费
    </text>
    <text x="440" y="180" textAnchor="middle" fill={COLORS.gold} fontSize="44" fontWeight="800">
      30 万
    </text>

    {/* 拆分线 */}
    <line x1="440" y1="220" x2="440" y2="280" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="6 6" />

    {/* 两个分支 */}
    {/* 左：医保可报 */}
    <rect x="60" y="290" width="380" height="80" rx="6" fill="rgba(212, 168, 87, 0.15)" stroke={COLORS.gold} strokeWidth="1.5" />
    <text x="250" y="320" textAnchor="middle" fill={COLORS.gold} fontSize="22" fontWeight="600">
      目录内可报销
    </text>
    <text x="250" y="355" textAnchor="middle" fill={COLORS.white} fontSize="32" fontWeight="800">
      10 万
    </text>

    {/* 右：自费缺口 */}
    <rect x="460" y="290" width="360" height="80" rx="6" fill="rgba(247, 147, 30, 0.18)" stroke={COLORS.primary} strokeWidth="1.5" />
    <text x="640" y="320" textAnchor="middle" fill={COLORS.primary} fontSize="22" fontWeight="600">
      目录外自费缺口
    </text>
    <text x="640" y="355" textAnchor="middle" fill={COLORS.white} fontSize="32" fontWeight="800">
      20 万
    </text>

    {/* 底部注解 */}
    <rect x="60" y="410" width="760" height="70" rx="6" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.15)" />
    <text x="440" y="455" textAnchor="middle" fill={COLORS.whiteDim} fontSize="22" fontWeight="500">
      进口靶向药 · 高端耗材 · 异地医疗 → 全部走自费通道
    </text>
  </svg>
);

/* ====================== Grid4: 4 宫格场景 ====================== */
const Grid4: React.FC = () => {
  const cells = [
    { title: "常规住院", desc: "起付线 + 目录内", color: "#3a5680" },
    { title: "癌症靶向药", desc: "目录外 1 盒上万", color: "#2a4060" },
    { title: "门诊慢病", desc: "封顶 + 进口药自费", color: "#3a5680" },
    { title: "意外受伤", desc: "进口耗材全自费", color: "#2a4060" },
  ];
  return (
    <svg width="880" height="520" viewBox="0 0 880 520">
      <text x="440" y="40" textAnchor="middle" fill="#FFFFFF" fontSize="26" fontWeight="700">
        4 类医保也不够用的场景
      </text>
      {cells.map((c, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 80 + col * 380;
        const y = 90 + row * 200;
        return (
          <g key={i}>
            <rect x={x} y={y} width="340" height="160" rx="8" fill={c.color} stroke="#4a6890" strokeWidth="1.5" />
            {/* 圆形图标 */}
            <circle cx={x + 60} cy={y + 80} r="30" fill={COLORS.gold} />
            <text x={x + 60} y={y + 90} textAnchor="middle" fill="#1A1A1A" fontSize="22" fontWeight="800">
              {i + 1}
            </text>
            <text x={x + 110} y={y + 70} fill="#FFFFFF" fontSize="26" fontWeight="700">
              {c.title}
            </text>
            <text x={x + 110} y={y + 105} fill={COLORS.whiteDim} fontSize="20" fontWeight="500">
              {c.desc}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ====================== Ring: 闭环（基础+升级） ====================== */
const Ring: React.FC = () => (
  <svg width="880" height="520" viewBox="0 0 880 520">
    {/* 中心圆形 */}
    <circle cx="440" cy="260" r="120" fill="none" stroke={COLORS.gold} strokeWidth="3" strokeDasharray="6 6" />
    <circle cx="440" cy="260" r="80" fill={COLORS.bgDark} stroke={COLORS.primary} strokeWidth="3" />
    <text x="440" y="252" textAnchor="middle" fill={COLORS.white} fontSize="24" fontWeight="700">
      不是
    </text>
    <text x="440" y="285" textAnchor="middle" fill={COLORS.white} fontSize="24" fontWeight="700">
      二选一
    </text>

    {/* 左侧：医保+补助（基础盘） */}
    <g>
      <rect x="40" y="200" width="200" height="120" rx="10" fill="url(#leftPanel)" stroke="#4a6890" strokeWidth="1.5" />
      <defs>
        <linearGradient id="leftPanel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a4060" />
          <stop offset="100%" stopColor="#15243f" />
        </linearGradient>
      </defs>
      <text x="140" y="245" textAnchor="middle" fill={COLORS.goldLight} fontSize="22" fontWeight="700">
        医保 + 补助
      </text>
      <text x="140" y="280" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="600">
        = 基础盘
      </text>
      <text x="140" y="305" textAnchor="middle" fill={COLORS.whiteDim} fontSize="14" fontWeight="400">
        目录内 · 日常少花钱
      </text>
    </g>

    {/* 右侧：商业保险（升级包） */}
    <g>
      <rect x="640" y="200" width="200" height="120" rx="10" fill="rgba(247, 147, 30, 0.18)" stroke={COLORS.primary} strokeWidth="1.5" />
      <text x="740" y="245" textAnchor="middle" fill={COLORS.primary} fontSize="22" fontWeight="700">
        商业保险
      </text>
      <text x="740" y="280" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="600">
        = 升级包
      </text>
      <text x="740" y="305" textAnchor="middle" fill={COLORS.whiteDim} fontSize="14" fontWeight="400">
        目录外 · 大病不掏空
      </text>
    </g>

    {/* 连接箭头（双向虚线） */}
    <path
      d="M 240 260 Q 340 260 360 260"
      stroke={COLORS.whiteDim}
      strokeWidth="2"
      strokeDasharray="4 4"
      fill="none"
    />
    <path
      d="M 520 260 Q 540 260 640 260"
      stroke={COLORS.whiteDim}
      strokeWidth="2"
      strokeDasharray="4 4"
      fill="none"
    />

    {/* 底部金句 */}
    <rect x="120" y="420" width="640" height="60" rx="30" fill={COLORS.primary} />
    <text x="440" y="460" textAnchor="middle" fill="#FFFFFF" fontSize="26" fontWeight="800">
      基础 + 升级 = 多层次保障
    </text>
  </svg>
);
