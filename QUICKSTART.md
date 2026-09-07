# 讲解视频模板 · AI 一步到位执行版

> **用法**：把这份文档直接丢给 WorkBuddy 或 Codex，它会按下面 7 步帮你做出一条「真人小窗 + 信息图」的竖屏讲解视频。你只需要在 **Step 4** 填好自己的口播稿。

---

## 学员先准备两样东西

1. **环境**：已装 Node.js 18+、npm、Python 3.10+、ffmpeg（`ffmpeg -version` 能跑即可）
2. **一个旁白音色（二选一）**：
   - 本地 **Voicebox** 服务在跑（地址 `http://127.0.0.1:17493`），且你有音色档案 ID（`profile_id`）
   - 或 **火山引擎**三件套：`appid` / `access_token` / `voice_type`（声音复刻是 `S_` 开头）

> 啥都没配也能跑：脚本会用静音占位，先把画面模板跑通；你之后配好音色重新合成即可，不用改稿。

---

## 让 AI 按下面 7 步执行

### Step 1 — 安装 skill
```bash
git clone https://github.com/hegongzi1211/hgz-explainer-video.git ~/.workbuddy/skills/hgz-explainer-video
cd ~/.workbuddy/skills/hgz-explainer-video/template
npm install
```

### Step 2 — 体检（确认工具和引擎）
```bash
python3 scripts/tts.py --doctor
```
- 有任一引擎显示 ✓ 即可；都 ✗ 就先走 Step 3 配一个（不配也能继续，见开头说明）。

### Step 3 — 配置旁白引擎（写配置文件，别用交互式）
AI 直接写 `~/.hgz-explainer-video/config.json`：
```json
{
  "voicebox": { "profile_id": "你的音色ID" },
  "volcengine": {
    "appid": "你的APPID",
    "access_token": "你的TOKEN",
    "voice_type": "S_xxxx 或 zh_female_xxx",
    "cluster": "volcano_icl"
  }
}
```
> 只留你要用的那个引擎的字段即可；`auto` 模式会按 voicebox → volcengine 顺序自动选。
> 也可用环境变量：`VOICEBOX_PROFILE_ID` / `VOLC_APPID` / `VOLC_ACCESS_TOKEN` / `VOLC_VOICE_TYPE`。

### Step 4 — 写口播稿（最重要）
在 `template/content.json` 里写你的内容（照结构填，`scenes` 数组每一段 = 一页信息图 + 一句口播）：
```json
{
  "titleMain": "全片主标题（顶部固定）",
  "titleSub": "全片副标题（顶部固定）",
  "avatarLabel": "你的头像占位文字",
  "audioVolume": 1,
  "scenes": [
    {
      "narration": "这段口播要说的话，会拿去合成语音",
      "cardHeadline": "信息图主标语",
      "cardSubline": "信息图副标语",
      "cardLayout": "pyramid",
      "tags": ["标签1", "标签2", "标签3"],
      "subtitle": "底部字幕（当前这句）"
    }
  ]
}
```
- `cardLayout` 可选：`pyramid`(金字塔) / `flow`(流程) / `grid4`(四宫格) / `ring`(闭环) / `image`(用现成图，配 `cardImageSrc`)
- 想换真人头像：把图片放 `template/public/avatar.jpg`，并在顶层加 `"avatarSrc": "avatar.jpg"`
- 想用现成信息图：把 PNG 放 `template/public/card.png`，该段 `"cardLayout": "image"` + `"cardImageSrc": "card.png"`

### Step 5 — 合成旁白 + 算时长
```bash
python3 scripts/build_video.py --project . --content content.json --engine auto
```
生成 `content.build.json`（含每段时间 + 音轨路径）和 `public/narration.wav`（整条旁白）。

### Step 6 — 渲染成片
```bash
NODE_OPTIONS="" npx remotion render src/index.ts ExplainerVideoInput out/final.mp4 --props="$(cat content.build.json)"
```
> 若报 `EEXIST` 或渲染中途崩，一定保留 `NODE_OPTIONS=""` 前缀再跑（沙箱/权限问题）。

### Step 7 — 验收
- 成品：`template/out/final.mp4`（1080×1920 / 30fps）
- 先看前 15 秒：`... --frames=0-449`
- 确认：画面多段信息图切换正常 + 有声音 + 字幕对齐口播

---

## 排障

| 现象 | 解决 |
|---|---|
| `npm install` 慢 | 换国内源 `npm config set registry https://registry.npmmirror.com` 再装 |
| `--doctor` 全 ✗ | 走 Step 3 配引擎；或先不配，脚本用静音占位跑通画面 |
| 渲染 `EEXIST` | 命令前加 `NODE_OPTIONS=""` |
| Voicebox 报「模型未加载」 | 先启动 Voicebox 服务，让它加载完模型 |
| 字幕一闪而过 | build 已加 `--min-frames 45`；如仍短，调大该值或加 `narration` 字数 |
| 想改音色 | 改 `~/.hgz-explainer-video/config.json` 后重跑 Step 5、6 |
