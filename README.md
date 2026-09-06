# 讲解视频模板 · 真人小窗 + 信息图（hgz-explainer-video）

一个 WorkBuddy Skill：把「顶部主标 + 右上真人头像小窗 + 中部信息图卡 + 底部橙色波形字幕」的竖屏知识科普视频做成**数据驱动模板**。

写口播稿 → 自动生成旁白（Voicebox 本地克隆 / 火山引擎云端，二选一）→ 自动算时长 → 渲染成片。复刻自一条 7 分钟保险科普视频的版式。

## 给学员：三步装好

```bash
# 1) 克隆到 WorkBuddy 的 skill 目录（目录名必须保持 hgz-explainer-video）
git clone https://github.com/hegongzi1211/hgz-explainer-video.git \
  ~/.workbuddy/skills/hgz-explainer-video

# 2) 进模板目录装依赖（约 3-5 分钟）
cd ~/.workbuddy/skills/hgz-explainer-video/template
npm install
npx remotion browser ensure      # 软链/下载渲染浏览器

# 3) 配旁白引擎（二选一，详见 SKILL.md）
python3 ~/.workbuddy/skills/hgz-explainer-video/scripts/setup_config.py
```

装完在 WorkBuddy 里直接说「用讲解视频模板做一条 XX 科普视频」即可。

## 目录结构

```
hgz-explainer-video/
├── SKILL.md              操作手册（双 TTS 配置 + 渲染 + 验收 + 排障）
├── template/             Remotion 4 多场景模板（拷贝即用）
├── scripts/              tts.py（双通道）/ build_video.py（端到端）/ setup_config.py（配置）
└── references/           volcengine-setup.md（火山引擎申请）/ content-guide.md（写稿公式）
```

## 出片流程（一句话）

```
写 content.json → python3 scripts/build_video.py --project <模板目录> --content content.json --engine auto
→ NODE_OPTIONS="" npx remotion render src/index.ts ExplainerVideoInput out/final.mp4 --props="$(cat content.build.json)"
```

完整写法、4 种信息图版式、写稿公式、火山引擎申请教程、排障表，都在 `SKILL.md` 和 `references/` 里。

## 规格

1080×1920 / 30fps / 竖屏。顶部标题全片固定，中部信息图每屏可换版式（pyramid / flow / grid4 / ring / image），底部橙色波形 + 白字字幕跟着口播走。
