# vue-frontend/ Vue 3 前端

**技术栈**: Vue 3.5 + TypeScript 5.9 + Vite 7 + Pinia 3 + Vue Router 4

## 结构

```
src/
├── views/               # 4页面: Bookshelf/Translate/Reader/Insight
├── components/          # 82+组件，按功能域分组
│   ├── translate/      # 上传、设置侧边栏、缩略图
│   ├── edit/           # 编辑画布、气泡编辑器
│   ├── insight/        # 30+分析组件(最复杂)
│   ├── bookshelf/      # 书籍卡片、搜索
│   ├── reader/         # 阅读器
│   └── common/         # Toast、Modal、Header
├── stores/              # Pinia状态管理
│   ├── imageStore.ts   # 核心图片状态
│   ├── settings/       # 模块化设置(7子模块)
│   ├── bookshelfStore.ts
│   └── insightStore.ts
├── composables/         # 52个组合式函数
│   └── translation/    # 翻译管线引擎
├── api/                 # 14个API模块
├── types/               # TypeScript类型
└── styles/global.css    # CSS变量体系
```

## 翻译管线引擎

**统一入口**: `useTranslationPipeline.ts`

两种执行模式:
- **顺序管线**: `SequentialPipeline` — 6步骤(detection→ocr→translate→inpaint→render→color)
- **并行管线**: `ParallelPipeline` — 5个独立TaskPool，每页独立执行

## 状态管理

- `imageStore`: 图片数组、当前索引、翻译状态
- `settingsStore`: 最复杂Store(~1000行)，7个模块化子模块
- `bubbleStore`: 编辑模式气泡状态
- `bookshelfStore`: 书籍/章节/标签

## API层

- `api/client.ts`: Axios单例，超时5分钟
- 按功能域拆分: translate/bookshelf/insight/config/...
- 统一格式: `ApiResponse<T>` {success, data, error}
- SSE流式: Manga Insight问答

## 样式约定

- `<style scoped>` 为默认
- CSS变量: `--color-xxx`, `--spacing-xxx`, `--z-xxx`
- z-index分层: base(1)→dropdown(100)→modal(1100)→toast(1300)
- 禁止 `!important` 和 ID选择器
- 新组件类名: `组件名-元素名`

## 开发代理

Vite代理 `/api` → `http://127.0.0.1:5000`
构建输出: `../src/app/static/vue/`
