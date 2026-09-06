# 火山引擎 TTS 申请与配置教程（学员版）

讲解视频模板的两条 TTS 通道之一。本地 Voicebox 免费但依赖本机服务，火山引擎是**云端按量计费**，最适合发给学员用——不挑机器、音色库大、支持「声音复刻」克隆本人声线。

## 一、开通语音合成

1. 打开 [火山引擎控制台 - 语音合成](https://console.volcengine.com/speech/app)
2. 没开通过先「开通服务」→ 选「大模型语音合成」（不是旧的「语音技术」）
3. 进入「应用管理」→「创建应用」，拿到三个关键值：
   - **APP ID**（形如 `1234567890`）
   - **Access Token**（一长串，点「查看/复制」拿到，注意有有效期，过期重新生成）
   - 记下应用名称，后面配置要用

## 二、挑音色 / 声音复刻

### 直接用现成音色（最快）
- 在「语音合成」控制台「音色试听」里挑一个中文音色
- 复制它的 **Voice Type ID**（通常是 `zh_female_xxx` / `zh_male_xxx` 这种）

### 克隆自己的声音（推荐，做个人 IP）
1. 控制台 → 「声音复刻」→「创建复刻」
2. 按要求上传 **≥ 1 分钟** 本人清晰朗读音频（安静环境、无背景乐）
3. 训练完成后生成的音色 ID 是 **`S_` 开头**（如 `S_bnaHmeF72`）
4. ⚠️ 克隆音色必须配合 `cluster = volcano_icl` 才能调通（通用大模型音色用 `volcano_tts`）

> 项目里 `tts.py` 已写死：`voice_type` 是 `S_` 开头就自动用 `volcano_icl`，普通音色用 `volcano_tts`。你只要把 ID 填对，脚本会自己选对 cluster。

## 三、把凭证写进配置

两种方式任选其一：

### 方式 A：脚本交互填（推荐学员）
```bash
python3 "$HOME/.workbuddy/skills/hgz-explainer-video/scripts/setup_config.py"
```
按提示填 appid / access_token / voice_type（S_ 开头的），自动写进
`~/.hgz-explainer-video/config.json`。

### 方式 B：环境变量（适合 CI / 多机）
```bash
export VOLC_APPID="你的appid"
export VOLC_ACCESS_TOKEN="你的token"
export VOLC_VOICE_TYPE="S_bnaHmeF72"
```
环境变量优先级最高，会盖过配置文件。

## 四、验证

```bash
python3 "$HOME/.workbuddy/skills/hgz-explainer-video/scripts/tts.py" --doctor
```
看到 `volcengine  ✓ 火山引擎已配置（音色 S_xxx）` 即成功。

单条试听：
```bash
python3 "$HOME/.workbuddy/skills/hgz-explainer-video/scripts/tts.py" \
  --text "这是一条测试旁白" --out /tmp/test.wav --engine volcengine
```

## 五、常见报错

| 现象 | 原因 / 解法 |
|------|------------|
| `code=3001` / `voice not found` | 音色未生效。新建音色后等 **5–10 分钟**再试；或 cluster 选错（S_ 音色必须用 `volcano_icl`） |
| `code=1003` / token 失效 | Access Token 过期，回控制台重新生成 |
| 返回空 data | 文本太长或含不支持字符，拆短重试 |
| 403 / 401 | appid 与 token 不匹配，确认是同一个应用下的 |

## 六、计费提示

火山引擎大模型语音合成按**字符数**计费，新用户有免费额度。给学员讲清楚：跑一条 7 分钟视频（约 1500 字）成本极低，但别在脚本里无限循环重试浪费额度。
