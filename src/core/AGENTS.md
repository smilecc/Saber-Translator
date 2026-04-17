# src/core/ 核心翻译引擎

**职责**: 漫画翻译核心流水线 + 书架管理 + 页面存储

## 结构

```
src/core/
├── types_enhanced.py          # 核心协议定义
├── config_models.py           # BubbleState等配置模型
├── detection.py               # 气泡检测入口
├── ocr.py                     # 多引擎OCR (337行函数)
├── translation.py             # 多服务商翻译 (1079行)
├── inpainting.py              # LAMA/纯色修复
├── rendering.py               # 文字渲染 (2078行，最大文件)
├── color_extractor.py         # 气泡颜色提取
├── bookshelf_manager.py       # 书架CRUD (1059行)
├── page_storage.py            # 页面级JSON存储
├── session_manager.py         # 旧版会话管理
├── detector/                  # 统一检测器框架
├── manga_insight/             # AI分析引擎(独立AGENTS.md)
└── web_import/                # 网页漫画导入
```

## 核心数据流

```
原图 → detection.py → ocr.py → color_extractor.py → translation.py → inpainting.py → rendering.py
```

## 检测器框架

- `BaseTextDetector` (ABC) → `CTDBackend` / `YoloBackend` / `YoloV5Backend` / `DefaultBackend`
- 注册表模式: `register_detector()` / `get_detector()` / `detect()`
- 数据结构: `TextLine` → `TextBlock` → `DetectionResult`

## 关键函数

| 函数 | 文件 | 行数 | 职责 |
|---|---|---|---|
| `draw_multiline_text_vertical` | rendering.py | 339 | 竖排文字渲染 |
| `recognize_text_in_bubbles` | ocr.py | 337 | 气泡OCR识别 |
| `translate_single_text` | translation.py | 288 | 单条翻译 |
| `inpaint_bubbles` | inpainting.py | 249 | 图像修复 |
| `render_bubbles_unified` | rendering.py | 138 | 统一渲染入口 |

## 约定

- 翻译支持批量/单条/Baidu/Youdao/LLM多种模式
- 颜色提取使用主色/文字色/背景色三层分析
- 渲染支持竖排/横排、旋转、描边、填充
