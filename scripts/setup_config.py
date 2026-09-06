#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
讲解视频模板 —— 交互式配置火山引擎凭证

火山引擎三件套获取路径（控制台）：
  1. 开通「语音技术」→ 创建应用
     https://console.volcengine.com/speech/app
  2. 应用详情 → 开通「音频生成大模型 - 语音合成大模型」
  3. 拿三件套：
     · appid        = 应用 ID
     · access_token = Access Token
     · voice_type   = 音色 ID
                      声音复刻（克隆自己的声音）→ S_ 开头，如 S_bnaHmeF72
                      通用大模型音色        → zh_female_xxx / zh_male_xxx

用法：
  python3 scripts/setup_config.py              # 交互式
  python3 scripts/setup_config.py --show       # 只看当前配置
  python3 scripts/setup_config.py --voicebox-profile <id>   # 顺手配 Voicebox 音色
"""

import argparse
import getpass
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tts import load_config, save_config, USER_CONFIG  # noqa: E402


def mask(s: str) -> str:
    if not s:
        return "(空)"
    if len(s) <= 8:
        return "*" * len(s)
    return f"{s[:4]}{'*' * (len(s) - 8)}{s[-4:]}"


def main() -> int:
    ap = argparse.ArgumentParser(description="配置 TTS 引擎")
    ap.add_argument("--show", action="store_true", help="只显示当前配置")
    ap.add_argument("--voicebox-profile", help="设置 Voicebox 音色档案 ID")
    ap.add_argument("--cluster", default=None,
                    help="cluster：volcano_icl（声音复刻，默认）/ volcano_tts（通用音色）")
    args = ap.parse_args()

    cfg = load_config()

    if args.show:
        v = cfg["volcengine"]
        print(json.dumps({
            "voicebox": {
                "url": cfg["voicebox"]["url"],
                "profile_id": cfg["voicebox"]["profile_id"] or "(未设置)",
            },
            "volcengine": {
                "appid": v["appid"] or "(未设置)",
                "access_token": mask(v["access_token"]),
                "voice_type": v["voice_type"] or "(未设置)",
                "cluster": v["cluster"],
            },
            "engine_order": cfg.get("engine_order"),
        }, ensure_ascii=False, indent=2))
        print(f"\n配置文件：{USER_CONFIG}")
        return 0

    if args.voicebox_profile:
        cfg["voicebox"]["profile_id"] = args.voicebox_profile
        save_config(cfg)
        return 0

    print("=" * 56)
    print("火山引擎 TTS 配置")
    print("=" * 56)
    print("三件套在哪拿：console.volcengine.com/speech/app")
    print("  · appid        = 应用详情里的「APP ID」")
    print("  · access_token = 应用详情里的「Access Token」")
    print("  · voice_type   = 音色 ID（克隆声音是 S_ 开头）")
    print()
    print("直接回车 = 保持原值不变。")
    print()

    v = cfg["volcengine"]
    cur_appid = v.get("appid", "")
    cur_token = v.get("access_token", "")
    cur_voice = v.get("voice_type", "")

    new_appid = input(f"appid        [{cur_appid or '未设置'}]: ").strip()
    new_token = getpass.getpass(f"access_token [{'已设置 ' + mask(cur_token) if cur_token else '未设置'}]: ").strip()
    new_voice = input(f"voice_type   [{cur_voice or '未设置'}]: ").strip()

    if new_appid:
        v["appid"] = new_appid
    if new_token:
        v["access_token"] = new_token
    if new_voice:
        v["voice_type"] = new_voice
        # 自动判断 cluster：S_ 前缀 = 声音复刻
        if new_voice.startswith("S_"):
            v["cluster"] = "volcano_icl"
            print("  → 识别为声音复刻音色，cluster 自动设为 volcano_icl")
        elif not new_voice.startswith("S_"):
            v["cluster"] = "volcano_tts"
            print("  → 识别为通用大模型音色，cluster 自动设为 volcano_tts")

    if args.cluster:
        v["cluster"] = args.cluster

    save_config(cfg)
    print()
    print("验证：python3 scripts/tts.py --doctor")
    return 0


if __name__ == "__main__":
    sys.exit(main())
