import { Composition, type CalculateMetadataFunction } from "remotion";
import { ExplainerVideo } from "./ExplainerVideo";
import { DEFAULT_PROPS, FPS, WIDTH, HEIGHT, type ExplainerVideoProps } from "./data/defaults";

// Remotion 4 的 Composition 期望 component 是 FC<Record<string, unknown>>
// 我们内部用强类型，导出时 wrap 一层做安全 cast
const ExplainerVideoWrapped: React.FC<Record<string, unknown>> = (props) => (
  <ExplainerVideo {...(props as unknown as ExplainerVideoProps)} />
);

/** 按 scenes 总帧数自动算时长（配合 calculateMetadata 支持 --props 传入外部数据） */
const calculateMetadata: CalculateMetadataFunction<Record<string, unknown>> = ({ props }) => {
  const input = props as unknown as ExplainerVideoProps;
  const total = (input.scenes ?? []).reduce((s, x) => s + (x.durationFrames || 0), 0);
  return {
    durationInFrames: total > 0 ? total : 150,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
    props,
  };
};

export const RemotionRoot: React.FC = () => {
  const defaultFrames = DEFAULT_PROPS.scenes.reduce((s, x) => s + x.durationFrames, 0);
  return (
    <>
      <Composition
        id="ExplainerVideo"
        component={ExplainerVideoWrapped}
        durationInFrames={defaultFrames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={DEFAULT_PROPS as unknown as Record<string, unknown>}
      />
      {/* 用 --props 传入外部 content.json 时走这个 composition（时长自动算） */}
      <Composition
        id="ExplainerVideoInput"
        component={ExplainerVideoWrapped}
        durationInFrames={defaultFrames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={DEFAULT_PROPS as unknown as Record<string, unknown>}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
