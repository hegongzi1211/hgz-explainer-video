#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
讲解视频模板 —— 端到端构建：口播稿 → TTS → 时轴对齐 → content.build.json

流程：
  1. 读 content.json（学员写口播稿 + 每张卡片的文案）
  2. 逐段 TTS（Voicebox / 火山引擎自动选）
  3. ffprobe 测每段真实时长 → 反推 durationFrames（+ 段尾留白）
  4. 拼接整条音轨到 public/narration.wav
  5. 回写 content.build.json（含 durationFrames + audioSrc）
  6. 打印渲染命令

用法：
  python3 scripts/build_video.py \
      --project ~/my-video \
      --content content.json \
      --engine auto \
      --tail-pad 0.35

参数：
  --tail-pad  每段音频后追加的静音秒数（默认 0.35，避免句子挤在一起）
  --min-frames 每段最少帧数（默认 45 = 1.5s，防止过短导致卡片一闪而过）
"""

import argparse
import json
import math
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tts import synthesize, load_config, probe_duration  # noqa: E402

FPS = 30


def run(cmd: list, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def make_silence(path: str, seconds: float, rate: int = 24000) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i",
         f"anullsrc=r={rate}:cl=mono", "-t", f"{seconds}", path],
        capture_output=True, text=True, timeout=60,
    )


def concat_audio(parts: list, out_path: str) -> None:
    """拼接（重编码，避免 WAV 直接 concat 失败）"""
    list_path = out_path + ".list.txt"
    with open(list_path, "w", encoding="utf-8") as f:
        for p in parts:
            f.write(f"file '{p}'\n")
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    r = subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path,
         "-c:a", "pcm_s16le", "-ar", "24000", "-ac", "1", out_path],
        capture_output=True, text=True, timeout=300,
    )
    if r.returncode != 0:
        raise RuntimeError(f"音频拼接失败：{r.stderr[-500:]}")
    os.remove(list_path)


def main() -> int:
    ap = argparse.ArgumentParser(description="讲解视频端到端构建")
    ap.add_argument("--project", required=True, help="Remotion 项目目录（含 public/ 和 src/）")
    ap.add_argument("--content", default="content.json", help="口播稿 + 卡片文案 JSON")
    ap.add_argument("--engine", default="auto", choices=["auto", "voicebox", "volcengine"])
    ap.add_argument("--tail-pad", type=float, default=0.35, help="每段后静音秒数")
    ap.add_argument("--min-frames", type=int, default=45, help="每段最少帧数")
    ap.add_argument("--skip-tts", action="store_true", help="跳过 TTS，复用已有分段音频")
    args = ap.parse_args()

    project = os.path.abspath(os.path.expanduser(args.project))
    content_path = args.content if os.path.isabs(args.content) else os.path.join(os.getcwd(), args.content)
    if not os.path.exists(content_path):
        print(f"[err] 找不到 {content_path}")
        return 1

    with open(content_path, "r", encoding="utf-8") as f:
        content = json.load(f)

    scenes = content.get("scenes") or []
    if not scenes:
        print("[err] content.json 里没有 scenes")
        return 1

    build_dir = os.path.join(project, "build")
    seg_dir = os.path.join(build_dir, "segs")
    os.makedirs(seg_dir, exist_ok=True)
    public_dir = os.path.join(project, "public")
    os.makedirs(public_dir, exist_ok=True)

    cfg = load_config()

    # ---------- 1) 逐段 TTS ----------
    seg_files = []
    durations = []
    print(f"[1/4] TTS 合成 {len(scenes)} 段（engine={args.engine}）")
    used_engine = None
    for i, sc in enumerate(scenes):
        text = (sc.get("narration") or "").strip()
        seg_path = os.path.join(seg_dir, f"seg_{i:02d}.wav")

        if not text:
            # 无口播：用静音占位
            dur = sc.get("durationFrames", args.min_frames) / FPS
            make_silence(seg_path, dur)
            durations.append(dur)
            seg_files.append(seg_path)
            print(f"  [{i:02d}] （无口播）静音 {dur:.2f}s")
            continue

        if args.skip_tts and os.path.exists(seg_path):
            dur = probe_duration(seg_path)
        else:
            engine, dur = synthesize(text, seg_path, cfg, args.engine)
            used_engine = used_engine or engine
            # Voicebox 返回的 duration 有时为 0，兜底用 ffprobe 实测
            if not dur or dur <= 0:
                dur = probe_duration(seg_path)

        durations.append(dur)
        seg_files.append(seg_path)
        print(f"  [{i:02d}] {dur:5.2f}s  {text[:32]}{'…' if len(text) > 32 else ''}")

    # ---------- 2) 反推帧数 ----------
    print("[2/4] 计算每段 durationFrames")
    total_frames = 0
    for i, sc in enumerate(scenes):
        raw = (durations[i] + args.tail_pad) * FPS
        frames = max(args.min_frames, int(math.ceil(raw)))
        sc["durationFrames"] = frames
        total_frames += frames
        print(f"  [{i:02d}] {durations[i]:5.2f}s + {args.tail_pad}s → {frames} 帧")

    total_sec = total_frames / FPS
    print(f"  总时长：{total_frames} 帧 / {total_sec:.1f}s")

    # ---------- 3) 拼接音轨 ----------
    print("[3/4] 拼接整条音轨")
    parts = []
    silence_path = os.path.join(build_dir, "_pad.wav")
    if args.tail_pad > 0:
        make_silence(silence_path, args.tail_pad)
    for i, p in enumerate(seg_files):
        parts.append(p)
        if args.tail_pad > 0 and i < len(seg_files) - 1:
            parts.append(silence_path)

    audio_rel = "narration.wav"
    audio_abs = os.path.join(public_dir, audio_rel)
    concat_audio(parts, audio_abs)
    audio_dur = probe_duration(audio_abs)
    print(f"  音轨：{audio_abs}  {audio_dur:.2f}s")

    # 音画时长校验
    drift = abs(audio_dur - total_sec)
    if drift > 1.5:
        print(f"  ⚠ 音画偏差 {drift:.2f}s，建议检查 tail-pad 或分段时长")
    else:
        print(f"  ✓ 音画对齐（偏差 {drift:.2f}s）")

    # ---------- 4) 回写 ----------
    content["audioSrc"] = audio_rel
    content["audioVolume"] = content.get("audioVolume", 1)
    out_path = os.path.join(project, "content.build.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
    print(f"[4/4] 已生成 {out_path}")

    print()
    print("=" * 56)
    print("下一步：渲染")
    print("=" * 56)
    print(f'cd "{project}"')
    print(f'NODE_OPTIONS="" npx remotion render src/index.ts ExplainerVideoInput \\')
    print(f'  out/final.mp4 --props="$(cat content.build.json)"')
    print()
    print(f"  预览前 15 秒：同上加 --frames=0-449")
    print(f"  引擎：{used_engine or '(复用已有音频)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
