/**
 * 讲解视频模板 —— 数据驱动 schema + 版面常量
 *
 * 版面（1080×1920 竖屏，实测对齐原视频）：
 *  - y=0-560     顶部标题区（黑底）：主标橙 + 副标白 + 右上圆形头像窗
 *  - y=560-1388  中部信息图卡（深蓝渐变）：主标语 + 副标语 + 信息图 + 标签条
 *  - y=1388-1920 底部字幕区（黑底）：橙色实时波形 + 白色字幕
 */

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** 配色（政务/财经调性：黑底 + 橙 + 金蓝） */
export const COLORS = {
  bg: "#000000",
  bgDark: "#0A0F1C",
  cardFrom: "#1B2C4E",
  cardTo: "#0F1B33",
  primary: "#F7931E",
  white: "#FFFFFF",
  whiteDim: "#B8C2D1",
  gold: "#D4A857",
  goldLight: "#E8C97A",
  tagBg: "#FFD54F",
  tagText: "#1A1A1A",
};

/** 区域绝对坐标 */
export const LAYOUT = {
  titleBlock: { x: 0, y: 0, w: 1080, h: 560 },
  cardBlock: { x: 0, y: 560, w: 1080, h: 828 },
  subtitleBlock: { x: 0, y: 1388, w: 1080, h: 532 },

  avatar: { cx: 905, cy: 175, r: 140 },

  titleMain: { x: 40, y: 230, w: 800, h: 80, fontSize: 56 },
  titleSub: { x: 40, y: 340, w: 800, h: 80, fontSize: 50 },

  cardHeadline: { x: 80, y: 600, w: 920, h: 70, fontSize: 56 },
  cardSubline: { x: 80, y: 685, w: 920, h: 50, fontSize: 30 },
  cardVisual: { x: 60, y: 760, w: 960, h: 560 },

  tagBar: { x: 80, y: 1340, w: 920, gap: 24, fontSize: 28, maxTags: 3 },

  waveform: { x: 120, y: 1408, w: 840, h: 28, barWidth: 6, gap: 4, color: COLORS.primary },
  subtitle: { x: 60, y: 1490, w: 960, fontSize: 56 },
};

export type CardLayout = "pyramid" | "flow" | "grid4" | "ring" | "image";

/** 单个场景（一段口播 + 一张信息图 + 一条字幕） */
export interface Scene {
  /** 时长（帧） */
  durationFrames: number;
  /** 信息图主标语 */
  cardHeadline: string;
  /** 信息图副标语 */
  cardSubline?: string;
  /** 信息图版式 */
  cardLayout: CardLayout;
  /** 用现成图片代替内置版式（放 public/ 下） */
  cardImageSrc?: string;
  /** 标签条（最多 3 个） */
  tags?: string[];
  /** 本段字幕（口播当前句） */
  subtitle: string;
}

export interface ExplainerVideoProps {
  /** 全片主标（顶部固定） */
  titleMain: string;
  /** 全片副标（顶部固定） */
  titleSub: string;
  /** 头像（放 public/ 下的文件名），不填用占位 */
  avatarSrc?: string;
  /** 头像占位文字 */
  avatarLabel?: string;
  /** 整条旁白音轨（放 public/ 下），不填则无声 */
  audioSrc?: string;
  /** 原声音量（0-1），默认 1 */
  audioVolume?: number;
  /** 场景序列 */
  scenes: Scene[];
}

/** 示例数据（单场景，用于快速预览） */
export const DEFAULT_PROPS: ExplainerVideoProps = {
  titleMain: "公务员为什么要买商业保险？",
  titleSub: "他到底需要吗？",
  avatarSrc: undefined,
  avatarLabel: "讲者头像",
  audioSrc: undefined,
  audioVolume: 1,
  scenes: [
    {
      durationFrames: 150,
      cardHeadline: "你以为的全报销，其实只报目录内",
      cardSubline: "医保比例再高，也不等于所有费用都管",
      cardLayout: "pyramid",
      tags: ["封顶线", "目录外", "异地打折"],
      subtitle: "那遇上癌症这种大病呢",
    },
  ],
};
