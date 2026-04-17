# src/core/manga_insight/ Manga Insight AI分析引擎

**职责**: 基于AI的漫画内容深度理解，含RAG问答、向量检索、时间线、角色卡、续写

## 结构

```
src/core/manga_insight/
├── analyzer.py              # MangaAnalyzer 总协调器
├── batch_analyzer.py        # 批量页面分析(VLM)
├── summary_generator.py     # 段落/章节总结
├── overview_generator.py    # 全书概述
├── task_manager.py          # 任务调度(单例，暂停/恢复/取消)
├── task_executor.py         # 任务执行器
├── qa.py                    # RAG智能问答
├── vector_store.py          # ChromaDB向量存储
├── embedding_builder.py     # 向量索引构建
├── storage.py               # JSON文件系统存储
├── vlm_client.py            # 多模态VLM客户端
├── embedding_client.py      # Embedding + Chat客户端
├── reranker_client.py       # 重排序客户端
├── clients/                 # API客户端基类 + 服务商注册表
├── features/                # 时间线、层级摘要
├── continuation/            # AI续写/同人图生成
├── character_cards/         # 角色卡工坊
└── ...
```

## 四层级分析架构

```
批量分析(每5页) → 段落总结 → 章节总结 → 全书概述
```

架构预设: 简洁/标准/章节/完整模式

## RAG实现

- **混合检索**: 向量(70%) + 关键词(30%)
- **Reranker**: Jina/Cohere/SiliconFlow/BGE
- **推理检索**: LLM分解复杂问题为子问题
- **父子块**: 返回批次完整上下文
- **两种模式**: 精确(向量检索) / 全局(全书摘要)

## 任务管理

- 单例 `AnalysisTaskManager`
- 状态: PENDING → RUNNING → COMPLETED / PAUSED / CANCELLED / FAILED
- 并发控制: 同一书籍仅一个运行中任务
- 暂停: `threading.Event.clear()`，恢复: `Event.set()`

## 数据存储

```
data/bookshelf/{book_id}/insight/
├── metadata.json, analysis_status.json, overview.json
├── pages/, batches/, segments/, chapters/
├── embeddings/          # ChromaDB向量数据库
├── timeline.json, notes.json
└── continuation/, character_cards/
```

## LLM交互

- 统一OpenAI兼容格式，通过 `BaseAPIClient` 封装
- VLM: 发送Base64图片 + 提示词
- Chat: 文本摘要/问答/概述
- 能力: RPM限制、指数退避重试、SSE流式
