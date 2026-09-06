#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
讲解视频模板 —— TTS 统一入口（双通道）

引擎：
  1. voicebox   本地 Voicebox（免费、可克隆本人声音）
                地址 http://127.0.0.1:17493
                需要本地跑着 Voicebox 服务 + 已有音色档案 profile_id
  2. volcengine 火山引擎「大模型语音合成 / 声音复刻」（云端、按量计费）
                地址 https://openspeech.bytedance.com/api/v1/tts
                需要 APPID + Access Token + 音色 ID（S_ 前缀）

用法：
  # 单条合成
  python3 tts.py --text "你好，这是一段旁白" --out /tmp/a.wav

  # 指定引擎
  python3 tts.py --text "..." --out /tmp/a.wav --engine volcengine

  # 批量：从 scenes JSON 合成（见 build_video.py，通常不直接调）
  python3 tts.py --scenes-json content.json --out-dir /tmp/segs

  # 查看当前配置和引擎可用性
  python3 tts.py --doctor
"""

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid

# ---------------------------------------------------------------- 配置

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USER_CONFIG = os.path.expanduser("~/.hgz-explainer-video/config.json")
LOCAL_CONFIG = os.path.join(SKILL_DIR, "config.json")

VOICEBOX_URL = os.environ.get("VOICEBOX_URL", "http://127.0.0.1:17493")
VOLC_TTS_URL = "https://openspeech.bytedance.com/api/v1/tts"

DEFAULTS = {
    # Voicebox（本地）：profile_id 换成你自己的音色档案 ID
    "voicebox": {
        "url": VOICEBOX_URL,
        "profile_id": os.environ.get("VOICEBOX_PROFILE_ID", ""),
        "model_size": "1.7B",
        "language": "zh",
        "personality": False,   # 纯克隆：True 会叠加情绪层改掉原声
        "instruct": "",
    },
    # 火山引擎（云端）：三件套从控制台获取
    "volcengine": {
        "appid": os.environ.get("VOLC_APPID", ""),
        "access_token": os.environ.get("VOLC_ACCESS_TOKEN", ""),
        "voice_type": os.environ.get("VOLC_VOICE_TYPE", ""),  # 声音复刻：S_ 前缀
        "cluster": "volcano_icl",   # 声音复刻固定值；通用大模型音色用 volcano_tts
        "encoding": "wav",
        "rate": 24000,
        "speed_ratio": 1.0,
    },
    "engine_order": ["voicebox", "volcengine"],  # auto 模式的尝试顺序
}


def load_config() -> dict:
    """配置优先级：环境变量 > ~/.hgz-explainer-video/config.json > skill/config.json"""
    cfg = json.loads(json.dumps(DEFAULTS))  # deep copy
    for path in (LOCAL_CONFIG, USER_CONFIG):
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for k, v in data.items():
                    if isinstance(v, dict) and isinstance(cfg.get(k), dict):
                        cfg[k].update(v)
                    else:
                        cfg[k] = v
            except Exception as e:
                print(f"[warn] 读取配置 {path} 失败：{e}", file=sys.stderr)
    return cfg


def save_config(cfg: dict, path: str = USER_CONFIG) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
    print(f"[ok] 配置已写入 {path}")


# ---------------------------------------------------------------- 引擎探测

def voicebox_available(cfg: dict) -> tuple:
    """返回 (可用?, 说明)"""
    url = cfg["voicebox"]["url"]
    try:
        req = urllib.request.Request(f"{url}/health", headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            info = json.loads(resp.read())
        if not info.get("model_loaded"):
            return False, "Voicebox 在线但模型未加载"
        return True, f"Voicebox 在线（{info.get('model_size', '?')}）"
    except Exception:
        return False, f"Voicebox 不可达（{url}）"


def volcengine_available(cfg: dict) -> tuple:
    v = cfg["volcengine"]
    if not (v.get("appid") and v.get("access_token") and v.get("voice_type")):
        return False, "火山引擎凭证未配置（appid / access_token / voice_type）"
    return True, f"火山引擎已配置（音色 {v['voice_type']}）"


def doctor(cfg: dict) -> int:
    print("=" * 56)
    print("TTS 引擎体检")
    print("=" * 56)
    ok_any = False
    for name, fn in (("voicebox", voicebox_available), ("volcengine", volcengine_available)):
        ok, msg = fn(cfg)
        print(f"  [{'✓' if ok else '✗'}] {name:12s} {msg}")
        ok_any = ok_any or ok
    print("-" * 56)
    print(f"  配置：{USER_CONFIG}" + ("（已存在）" if os.path.exists(USER_CONFIG) else "（未创建）"))
    if not ok_any:
        print("\n  ⚠ 没有任何可用引擎。二选一：")
        print("    · 本地跑 Voicebox：先启动服务，再填 profile_id")
        print("    · 用火山引擎：python3 scripts/setup_config.py 填三件套")
        return 1
    return 0


# ---------------------------------------------------------------- Voicebox

def tts_voicebox(text: str, out_path: str, cfg: dict) -> float:
    """本地 Voicebox 合成，返回音频时长（秒）"""
    v = cfg["voicebox"]
    url = v["url"]
    body = {
        "profile_id": v["profile_id"],
        "text": text,
        "language": v.get("language", "zh"),
        "model_size": v.get("model_size", "1.7B"),
    }
    if v.get("personality"):
        body["personality"] = True
    if v.get("instruct"):
        body["instruct"] = v["instruct"]

    payload = json.dumps(body).encode()
    req = urllib.request.Request(url + "/generate", data=payload,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        gen_id = json.loads(resp.read())["id"]

    for _ in range(60):
        time.sleep(2)
        with urllib.request.urlopen(f"{url}/history?limit=1", timeout=10) as r:
            item = json.loads(r.read())["items"][0]
        if item["id"] == gen_id and item["status"] == "completed":
            vid = item["active_version_id"]
            with urllib.request.urlopen(f"{url}/audio/version/{vid}", timeout=60) as ar:
                data = ar.read()
            with open(out_path, "wb") as f:
                f.write(data)
            return float(item.get("duration") or 0)
        if item["id"] == gen_id and item["status"] in ("failed", "error"):
            raise RuntimeError(f"Voicebox 合成失败：{item}")
    raise TimeoutError("Voicebox 合成超时（120s）")


# ---------------------------------------------------------------- 火山引擎

def tts_volcengine(text: str, out_path: str, cfg: dict) -> float:
    """火山引擎大模型语音合成，返回音频时长（秒）"""
    v = cfg["volcengine"]
    reqid = str(uuid.uuid4())
    body = {
        "app": {
            "appid": v["appid"],
            "token": "access_token",
            "cluster": v.get("cluster", "volcano_icl"),
        },
        "user": {"uid": "hgz-explainer-video"},
        "audio": {
            "voice_type": v["voice_type"],
            "encoding": v.get("encoding", "wav"),
            "rate": int(v.get("rate", 24000)),
            "speed_ratio": float(v.get("speed_ratio", 1.0)),
        },
        "request": {
            "reqid": reqid,
            "text": text,
            "operation": "query",
        },
    }
    payload = json.dumps(body).encode()
    req = urllib.request.Request(
        VOLC_TTS_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer;{v['access_token']}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            res = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "ignore")[:400]
        raise RuntimeError(f"火山引擎 HTTP {e.code}：{detail}") from e

    code = res.get("code")
    if code not in (0, 3000):
        raise RuntimeError(f"火山引擎返回错误 code={code} message={res.get('message')}")

    audio_b64 = res.get("data")
    if not audio_b64:
        raise RuntimeError("火山引擎返回数据为空（data 字段缺失）")

    raw = base64.b64decode(audio_b64)
    with open(out_path, "wb") as f:
        f.write(raw)

    # 时长：优先用接口返回的 duration，没有就用 ffprobe 测
    dur = res.get("addition", {}).get("duration")
    if dur:
        return float(dur)
    return probe_duration(out_path)


def probe_duration(path: str) -> float:
    import shutil
    import subprocess
    if not shutil.which("ffprobe"):
        return 0.0
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path],
            capture_output=True, text=True, timeout=20,
        )
        return float(out.stdout.strip())
    except Exception:
        return 0.0


# ---------------------------------------------------------------- 统一入口

def synthesize(text: str, out_path: str, cfg: dict, engine: str = "auto") -> tuple:
    """
    合成一条语音。
    engine: auto | voicebox | volcengine
    返回 (实际使用的引擎, 时长秒)
    """
    order = cfg.get("engine_order", ["voicebox", "volcengine"])
    candidates = order if engine == "auto" else [engine]

    errors = []
    for name in candidates:
        try:
            if name == "voicebox":
                ok, msg = voicebox_available(cfg)
                if not ok:
                    errors.append(f"voicebox: {msg}")
                    continue
                dur = tts_voicebox(text, out_path, cfg)
                return "voicebox", dur
            if name == "volcengine":
                ok, msg = volcengine_available(cfg)
                if not ok:
                    errors.append(f"volcengine: {msg}")
                    continue
                dur = tts_volcengine(text, out_path, cfg)
                return "volcengine", dur
            errors.append(f"未知引擎 {name}")
        except Exception as e:
            errors.append(f"{name}: {e}")
            continue

    raise RuntimeError("全部引擎失败 → " + " | ".join(errors))


# ---------------------------------------------------------------- CLI

def main() -> int:
    ap = argparse.ArgumentParser(description="讲解视频模板 TTS（Voicebox / 火山引擎 双通道）")
    ap.add_argument("--text", help="要合成的文本")
    ap.add_argument("--out", help="输出音频路径（wav/mp3）")
    ap.add_argument("--engine", default="auto", choices=["auto", "voicebox", "volcengine"])
    ap.add_argument("--doctor", action="store_true", help="体检：检查引擎可用性和配置")
    args = ap.parse_args()

    cfg = load_config()

    if args.doctor:
        return doctor(cfg)

    if not (args.text and args.out):
        ap.error("需要 --text 和 --out（或只用 --doctor）")

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    engine, dur = synthesize(args.text, args.out, cfg, args.engine)
    print(f"[ok] 引擎={engine} 时长={dur:.2f}s → {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
