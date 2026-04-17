# src/interfaces/ 外部接口适配层

**职责**: 封装第三方AI服务(OCR、检测、翻译、修复)

## 结构

```
src/interfaces/
├── yolov5/              # YOLOv5检测模型完整仓库嵌入
│   ├── repo/           # 官方仓库代码(第三方)
│   └── __init__.py     # YOLOv5检测器接口
├── ctd/                 # Comic Text Detector
├── default/             # DBNet ResNet34检测器
├── ocr_48px/            # 48px OCR模型
├── manga_ocr_interface.py
├── paddle_ocr_interface.py
├── rapid_ocr_interface.py
├── baidu_ocr.py
├── ai_vision_ocr.py
├── lama_interface.py    # LAMA图像修复
├── translation_interfaces/  # 翻译服务商接口
└── ...
```

## 关键约定

- **第三方代码**: `yolov5/repo/` 为嵌入的官方仓库，禁止修改
- 检测器统一通过 `src/core/detector/` 注册表调用
- OCR接口统一返回文本列表格式
- 翻译接口统一使用OpenAI兼容格式

## 服务商支持

**OCR**: MangaOCR, PaddleOCR, RapidOCR, 百度OCR, AI视觉OCR, 48px OCR, PaddleOCR-VL
**检测**: CTD, YOLOv5, YSGYolo, DBNet
**翻译**: SiliconFlow, DeepSeek, Gemini, 火山, Ollama, Sakura, 百度, 有道
**修复**: LAMA (litelama)
