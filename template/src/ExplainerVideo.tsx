import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  Audio,
  staticFile,
  interpolate,
} from "remotion";
import { COLORS, LAYOUT, type ExplainerVideoProps, type Scene } from "./data/defaults";
import { CardContent } from "./components/CardContent";
import { AvatarWindow } from "./components/AvatarWindow";
import { Waveform } from "./components/Waveform";

/**
 * ExplainerVideo —— 讲解型竖屏视频（多场景版）
 *
 * 版面：
 *  - 顶部：主标（橙）+ 副标（白）+ 右上圆形头像窗（全片固定）
 *  - 中部：信息图卡（每个场景可换版式 pyramid/flow/grid4/ring/image）
 *  - 底部：橙色实时波形 + 字幕（每个场景切一条）
 *
 * 场景切换：按 scenes[].durationFrames 累计定位当前场景，
 *           每个场景内部用 localFrame 做入场动画。
 */
export const ExplainerVideo: React.FC<ExplainerVideoProps> = (props) => {
  const frame = useCurrentFrame();
  const { scenes } = props;

  // 定位当前场景
  let acc = 0;
  let sceneIndex = scenes.length - 1;
  let sceneStart = 0;
  for (let i = 0; i < scenes.length; i++) {
    const next = acc + scenes[i].durationFrames;
    if (frame < next) {
      sceneIndex = i;
      sceneStart = acc;
      break;
    }
    acc = next;
  }
  const localFrame = frame - sceneStart;
  const scene: Scene = scenes[sceneIndex] ?? scenes[scenes.length - 1];

  // 场景内入场动画（每个场景都重放一次）
  const cardOpacity = interpolate(localFrame, [0, 12], [0.35, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardY = interpolate(localFrame, [0, 12], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleOpacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(localFrame, [0, 8], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily:
          '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif',
      }}
    >
      {/* 旁白音轨 */}
      {props.audioSrc ? (
        <Audio src={staticFile(props.audioSrc)} volume={props.audioVolume ?? 1} />
      ) : null}

      {/* ===================== 顶部标题区（全片固定） ===================== */}
      <div
        style={{
          position: "absolute",
          left: LAYOUT.titleBlock.x,
          top: LAYOUT.titleBlock.y,
          width: LAYOUT.titleBlock.w,
          height: LAYOUT.titleBlock.h,
          backgroundColor: COLORS.bg,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: LAYOUT.titleMain.x,
            top: LAYOUT.titleMain.y,
            width: LAYOUT.titleMain.w,
            height: LAYOUT.titleMain.h,
            color: COLORS.primary,
            fontSize: LAYOUT.titleMain.fontSize,
            fontWeight: 800,
            letterSpacing: 1,
            lineHeight: 1.1,
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "visible",
            textShadow: "0 4px 24px rgba(247, 147, 30, 0.35)",
          }}
        >
          {props.titleMain}
        </div>

        <div
          style={{
            position: "absolute",
            left: LAYOUT.titleSub.x,
            top: LAYOUT.titleSub.y,
            width: LAYOUT.titleSub.w,
            height: LAYOUT.titleSub.h,
            color: COLORS.white,
            fontSize: LAYOUT.titleSub.fontSize,
            fontWeight: 600,
            letterSpacing: 3,
            lineHeight: 1.05,
            textAlign: "center",
            whiteSpace: "nowrap",
            opacity: 0.96,
          }}
        >
          {props.titleSub}
        </div>

        <AvatarWindow src={props.avatarSrc} fallbackLabel={props.avatarLabel ?? "讲者"} />
      </div>

      {/* ===================== 中部信息图卡（每场景切换） ===================== */}
      <div
        style={{
          position: "absolute",
          left: LAYOUT.cardBlock.x,
          top: LAYOUT.cardBlock.y,
          width: LAYOUT.cardBlock.w,
          height: LAYOUT.cardBlock.h,
          background: `linear-gradient(180deg, ${COLORS.cardFrom} 0%, ${COLORS.cardTo} 100%)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            opacity: cardOpacity,
            transform: `translateY(${cardY}px)`,
          }}
        >
          {/* 主标语 */}
          <div
            style={{
              position: "absolute",
              left: LAYOUT.cardHeadline.x,
              top: LAYOUT.cardHeadline.y - LAYOUT.cardBlock.y,
              width: LAYOUT.cardHeadline.w,
              color: COLORS.white,
              fontSize: LAYOUT.cardHeadline.fontSize,
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: 1,
              lineHeight: 1.2,
            }}
          >
            {scene.cardHeadline}
          </div>

          {/* 副标语 */}
          {scene.cardSubline ? (
            <div
              style={{
                position: "absolute",
                left: LAYOUT.cardSubline.x,
                top: LAYOUT.cardSubline.y - LAYOUT.cardBlock.y,
                width: LAYOUT.cardSubline.w,
                color: COLORS.whiteDim,
                fontSize: LAYOUT.cardSubline.fontSize,
                fontWeight: 400,
                textAlign: "center",
                letterSpacing: 1,
              }}
            >
              {scene.cardSubline}
            </div>
          ) : null}

          {/* 信息图主体 */}
          <div
            style={{
              position: "absolute",
              left: LAYOUT.cardVisual.x,
              top: LAYOUT.cardVisual.y - LAYOUT.cardBlock.y,
              width: LAYOUT.cardVisual.w,
              height: LAYOUT.cardVisual.h,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CardContent layout={scene.cardLayout} imageSrc={scene.cardImageSrc} />
          </div>

          {/* 标签条 */}
          {scene.tags && scene.tags.length > 0 ? (
            <div
              style={{
                position: "absolute",
                left: LAYOUT.tagBar.x,
                top: LAYOUT.tagBar.y - LAYOUT.cardBlock.y,
                width: LAYOUT.tagBar.w,
                display: "flex",
                justifyContent: "center",
                gap: LAYOUT.tagBar.gap,
              }}
            >
              {scene.tags.slice(0, LAYOUT.tagBar.maxTags).map((t, i) => (
                <div
                  key={`${sceneIndex}-${i}`}
                  style={{
                    backgroundColor: COLORS.tagBg,
                    color: COLORS.tagText,
                    fontSize: LAYOUT.tagBar.fontSize,
                    fontWeight: 700,
                    padding: "8px 22px",
                    borderRadius: 6,
                    letterSpacing: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* ===================== 底部字幕区（每场景切换） ===================== */}
      <div
        style={{
          position: "absolute",
          left: LAYOUT.subtitleBlock.x,
          top: LAYOUT.subtitleBlock.y,
          width: LAYOUT.subtitleBlock.w,
          height: LAYOUT.subtitleBlock.h,
          backgroundColor: COLORS.bg,
        }}
      >
        <Waveform
          x={LAYOUT.waveform.x}
          y={LAYOUT.waveform.y - LAYOUT.subtitleBlock.y}
          width={LAYOUT.waveform.w}
          height={LAYOUT.waveform.h}
          barWidth={LAYOUT.waveform.barWidth}
          gap={LAYOUT.waveform.gap}
          color={LAYOUT.waveform.color}
          frame={frame}
          seed={sceneIndex * 17 + 42}
        />

        <div
          style={{
            position: "absolute",
            left: LAYOUT.subtitle.x,
            top: LAYOUT.subtitle.y - LAYOUT.subtitleBlock.y,
            width: LAYOUT.subtitle.w,
            color: COLORS.white,
            fontSize: LAYOUT.subtitle.fontSize,
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.25,
            letterSpacing: 1,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          {scene.subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
