---
name: hgz-explainer-video
description: 用「讲解视频模板」做 1080x1920 竖屏知识科普视频——顶部主标+右上头像小窗+中部信息图卡+底部波形字幕。内置 Voicebox 本地克隆与火山引擎云端 TTS 双通道，口播稿进去成片出来。用户提到讲解视频、科普视频、算账视频、真人小窗模板、保险/财经科普视频、拆解视频怎么做成模板时使用。
metadata:
  display_name: 讲解视频模板（真人小窗+信息图）
  user-invocable: true
  agent_created: true
---

# 讲解视频模板（真人小窗 + 中部信息图 + 波形字幕）

复刻自那条 7 分钟保险科普视频的版式，做成**数据驱动模板**：写口播稿 → 自动生成旁白 → 自动算时长 → 渲染成片。

## 版式长什么样

```
┌──────────────────────────────────────┐  y=0-560    顶部标题区（黑底）
│  公务员为什么要买商业保险？    ┌───┐  │     主标 56px 橙（全片固定）
│        他到底需要吗？          │头像│ │     副标 50px 白
│                              └───┘ │     头像圆窗 r=140
├──────────────────────────────────────┤  y=560-1388  中部信息图卡（深蓝渐变）
│      你以为的全报销其实只报目录内      │     主标语 56px 白
│      医保比例再高也不等于全部都管      │     副标语 30px 灰
│         ┌──────────────────┐         │     信息图（4 种版式轮换）
│         │   信息图主体       │         │
│         └──────────────────┘         │
│    [封顶线]  [目录外]  [异地打折]      │     标签条 28px 黄底黑字
├──────────────────────────────────────┤  y=1388-1920 底部字幕区（黑底）
│ ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  橙色实时波形        │
│        那遇上癌症这种大病呢            │     字幕 56px 白字
└──────────────────────────────────────┘
```

规格：**1080×1920 / 30fps / 竖屏**

## 首次使用：环境准备

```bash
SKILL="$HOME/.workbuddy/skills/hgz-explainer-video"

# 1) 建项目（把模板源码拷到你的工作目录）
cp -R "$SKILL/template" ~/my-video && cd ~/my-video

# 2) 装依赖（约 3-5 分钟）
npm install

# 3) 软链 Remotion 浏览器（避免首次渲染现下载，很慢）
npx remotion browser ensure

# 4) 体检：看哪个 TTS 引擎能用
python3 "$SKILL/scripts/tts.py" --doctor
```

## 配置 TTS（二选一）

### A. 本地 Voicebox（免费，可克隆本人声音）

需要先跑着 Voicebox 服务（默认 `http://127.0.0.1:17493`），且有音色档案：

```bash
python3 "$SKILL/scripts/setup_config.py" --voicebox-profile "<你的音色档案ID>"
```

> 何公子本机音色：`8bd592c1-a2d8-48cf-98a0-9984bd0e8b41`（已在配置里）

### B. 火山引擎（云端，按量计费，学员推荐）

三件套在 `console.volcengine.com/speech/app` 拿：
- `appid` = 应用 ID
- `access_token` = Access Token
- `voice_type` = 音色 ID —— **声音复刻是 `S_` 开头**（如 `S_bnaHmeF72`）

```bash
python3 "$SKILL/scripts/setup_config.py"    # 交互式填写，自动识别 S_ 前缀设 cluster
python3 "$SKILL/scripts/tts.py" --doctor    # 验证
```

> `auto` 模式优先用本地 Voicebox，不可用时自动 fallback 火山引擎。

## 生产流程

### 1. 写口播稿 `content.json`

```json
{
  "titleMain": "公务员为什么要买商业保险？",
  "titleSub": "他到底需要吗？",
  "avatarSrc": "avatar.jpg",
  "scenes": [
    {
      "narration": "这段口播说什么（TTS 读这个）",
      "cardHeadline": "信息图主标语",
      "cardSubline": "信息图副标语",
      "cardLayout": "pyramid",
      "tags": ["标签1", "标签2", "标签3"],
      "subtitle": "屏幕字幕（narration 的精简版）"
    }
  ]
}
```

**4 种信息图版式**（`cardLayout`）：
| 版式 | 适合什么内容 |
|------|-------------|
| `pyramid` | 层级 / 体系（如医保三层叠加） |
| `flow` | 算账 / 流向（总花费 → 可报 vs 自费） |
| `grid4` | 并列清单（4 个场景并列） |
| `ring` | 闭环收口（不是二选一，是 A + B） |
| `image` | 用现成图（配 `cardImageSrc`，放 `public/`） |

素材放 `public/`：
- `avatar.jpg` —— 真人半身像（正面、浅景深、商务感）
- `card.png` —— 自定义信息图（可选）

### 2. 生成旁白 + 时轴对齐

```bash
python3 "$SKILL/scripts/build_video.py" \
    --project ~/my-video \
    --content content.json \
    --engine auto
```

它会：逐段 TTS → ffprobe 测真实时长 → 反推每段 `durationFrames` → 拼接整条音轨到 `public/narration.wav` → 输出 `content.build.json`。

常用参数：
- `--tail-pad 0.35` —— 每段后留白秒数（默认 0.35）
- `--min-frames 45` —— 每段最少帧数（防卡片一闪而过）
- `--skip-tts` —— 复用已有音频，只重算时长（调文案时用）

### 3. 渲染

```bash
cd ~/my-video

# 前 15 秒快速看版式
NODE_OPTIONS="" npx remotion render src/index.ts ExplainerVideoInput \
  out/preview-15s.mp4 --frames=0-449 --props="$(cat content.build.json)"

# 完整成片
NODE_OPTIONS="" npx remotion render src/index.ts ExplainerVideoInput \
  out/final.mp4 --props="$(cat content.build.json)"
```

> **必须 `NODE_OPTIONS=""` 前缀**：WorkBuddy 沙箱注入的 `NODE_OPTIONS` 会触发 Remotion 缓存目录 `EEXIST` 崩溃（仅在本机 WorkBuddy 里跑才需要，自己开终端不用）。

## 验收清单

- [ ] 成片 1080×1920 / 30fps
- [ ] 顶部主标（橙）+ 副标（白）全程可见，不换行不截断
- [ ] 右上头像圆窗显示正常（没放头像时显示占位）
- [ ] 每个场景的信息图版式正确切换
- [ ] 标签条最多 3 个，黄底黑字
- [ ] 底部橙色波形 + 白字字幕跟着口播走
- [ ] 旁白音轨存在且与画面对齐（build 脚本会打印偏差）
- [ ] 音画偏差 < 1.5s

## 内容怎么写（这类视频的核心公式）

这个版式最适合**算账型科普**。写稿按这个来：

```
钩子（30s）  复述用户原问题 + 群体共鸣
           「你这个问题特别典型，XX 的朋友十有八九都这么想」
原理（30s）  一句话击穿认知盲点
           「问题就出在 XX 这四个字里」
算账（每段）  场景 → 总花费 → 已覆盖 → 缺口 → 补救方案
           每段至少 3 个具体数字（精确到元）
转折         观众自问自答（「我的天原来如此」「这点真没想到」）
金句（30s）  双比喻（「XX 是基础盘，YY 是升级包」）
CTA（30s）   「如果你也是 XX，关注我」
```

详细写法见 `references/content-guide.md`，火山引擎申请教程见 `references/volcengine-setup.md`。

## 硬性边界

- 不改动 `template/src/data/defaults.ts` 里的 `LAYOUT` 坐标（版式基准，改了就对不上原版）
- 输出只放项目 `out/` 下
- 渲染统一走 `npx remotion render`，日志不要接 `| tail`（会掩盖退出码）：
  ```bash
  npx remotion render ... > /tmp/render.log 2>&1; echo EXIT=$?
  ```

## 排障

| 现象 | 原因 / 解法 |
|------|------------|
| `tts.py --doctor` 两个引擎都 ✗ | 本地没跑 Voicebox 且火山凭证没配，跑 `setup_config.py` |
| 火山引擎返回 `code=3001` 等 | 音色未生效（开通后需等 5-10 分钟）或 cluster 选错（`S_` 音色要用 `volcano_icl`） |
| 渲染报 `EEXIST: file already exists` | 沙箱 NODE_OPTIONS 问题，加 `NODE_OPTIONS=""` 前缀 |
| 字幕和口播对不上 | `--tail-pad` 太大/太小；或 `subtitle` 写太长，精简成一句 |
| 主标被截断 | 主标控制在 14 字内，副标 8 字内 |
| 卡片一闪而过 | 提高 `--min-frames`（默认 45 = 1.5s） |

## 交付时应说明

- 最终 MP4 路径（真实路径 + `~/Movies/渲染软链/` 系统盘预览软链）
- 使用的 TTS 引擎（Voicebox / 火山引擎）
- 成片分辨率、帧率、时长、音画偏差
- 是否有未解决风险
