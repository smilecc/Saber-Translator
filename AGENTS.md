# Saber-Translator 项目知识库

**生成时间**: 2026-04-18
**Commit**: 3a3cb1c
**分支**: main

**项目**: AI漫画翻译与管理桌面Web应用
**技术栈**: Python 3.12+ (Flask) + Vue 3 (TypeScript) + PyInstaller

## 结构

```
.
├── app.py                  # Flask入口，启动本地服务(0.0.0.0:5000)
├── pyproject.toml          # Python依赖(uv管理)
├── src/
│   ├── app/               # Flask应用层(API、路由、静态文件)
│   ├── core/              # 核心业务(翻译流水线、书架、Manga Insight)
│   ├── interfaces/        # 外部接口适配(OCR、检测、翻译、修复)
│   ├── plugins/           # 插件系统
│   ├── shared/            # 共享工具(异常、常量、路径助手)
│   └── utils/             # 通用工具
├── vue-frontend/          # Vue 3 + TypeScript + Vite 前端
├── models/                # AI模型文件(CTD、YOLO、LAMA、MangaOCR等)
├── config/                # 运行时配置
├── data/                  # 运行时数据(书架、会话、调试)
├── tests_backend/         # 后端回归测试
└── plugins/               # 外部插件目录(运行时加载)
```

## 核心翻译流水线

```
检测(detection) → OCR(ocr) → 翻译(translation) → 修复(inpainting) → 渲染(rendering)
```

## 技术栈

**后端**: Flask, PyTorch, Transformers 4.55, Ultralytics, OpenCV, Pillow, ChromaDB
**前端**: Vue 3.5, Vite, Pinia, Vue Router, Axios, TypeScript 5.9
**OCR**: MangaOCR, PaddleOCR, RapidOCR, 百度OCR, AI视觉OCR
**检测**: CTD, YOLOv5, DBNet
**翻译**: SiliconFlow, DeepSeek, Gemini, 火山, Ollama, Sakura 等
**修复**: LAMA (litelama)
**分析**: 多模态VLM + Embedding + Reranker + ChromaDB

## 关键约定

- **路径**: 必须使用 `resource_path()` 兼容PyInstaller打包
- **API前缀**: 所有新API使用 `/api/`
- **异常**: 继承 `ComicTranslatorException`，在 `error_handlers.py` 注册处理器
- **常量同步**: 前后端共享常量需同步更新 (`src/shared/constants.py` ↔ `vue-frontend/src/constants/index.ts`)
- **日志**: 统一使用 `logging`，禁止 `print()`（启动ASCII艺术除外）
- **Python**: 4空格缩进, 120字符行宽
- **前端**: 2空格缩进, scoped样式, CSS变量优先

## 反模式

- 禁止直接使用相对文件路径
- 禁止修改 `src/interfaces/yolov5/repo/`（第三方代码）
- 禁止在核心代码中使用 `print()` 调试
- 禁止允许werkzeug日志输出到控制台
- 禁止前后端常量不一致

## 命令

```bash
# 开发
cd vue-frontend && pnpm run dev      # 前端(代理到Flask :5000)
uv run app.py                       # 启动Flask

# 构建
cd vue-frontend && pnpm run build    # 构建到 src/app/static/vue/
pyinstaller app.spec --noconfirm    # 打包

# 检查
cd vue-frontend && npx vue-tsc --noEmit
cd vue-frontend && npx eslint src/
cd vue-frontend && npx stylelint 'src/**/*.{vue,css}'
```
