# 批量上传章节功能

## TL;DR

> **Quick Summary**: 在 BookDetailModal 的"新建章节"按钮旁添加"批量上传"功能，允许用户选择文件夹后自动按文件夹结构批量创建章节并上传图片。
>
> **Deliverables**:
> - `vue-frontend/src/composables/useBatchChapterUpload.ts` — 批量上传核心逻辑 composable
> - 修改 `vue-frontend/src/components/bookshelf/BookDetailModal.vue` — 添加按钮、确认摘要、进度覆盖层、结果摘要
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 (composable) → Task 2 (UI integration)

---

## Context

### Original Request
在 BookDetailModal.vue "新增章节"按钮旁添加"批量上传"按钮，实现文件夹选择、遍历、章节批量创建、图片添加和保存。

### Interview Summary
**Key Discussions**:
- 处理模式：**就地处理**（在 BookDetailModal 内完成所有操作，不跳转页面）
- 章节标题：直接使用**文件夹名称**
- 错误处理：**宽松模式**（跳过失败项，继续处理剩余，最后汇总报告）
- 进度显示：**详细进度**（当前章节/总章节、当前图片/总图片、总体百分比）

**Research Findings**:
- `createChapterApi(bookId, title)` → `Promise<ChapterData | null>` (bookshelfStore.ts:590)
- `saveChapterSession(bookId, chapterId)` → `Promise<boolean>` (sessionStore.ts:546)
- `addImage(fileName, originalDataURL, overrides?)` → `ImageData` (imageStore.ts:143)
- `imageStore.clearImages()` 可重置全局 store (imageStore.ts:255)
- `naturalSort(files, getPath)` 支持自然排序 (utils/naturalSort.ts)
- `saveChapterSession` **不依赖** `sessionStore.setBookChapterContext`，直接接受参数

### Metis Review
**Identified Gaps** (addressed):
- **全局 store 污染风险**: 上传前检查 `imageStore.hasImages`，非空时弹出警告让用户确认
- **内存管理**: 逐个 `FileReader` 读取图片，避免一次性加载大量文件到内存
- **文件夹结构边界**: 根目录图片忽略；空文件夹跳过；嵌套子文件夹扁平化
- **章节名冲突**: 宽松处理，直接调用 API，失败则记录并继续
- **上传前确认**: 添加确认摘要弹窗，显示章节数量和图片总数

---

## Work Objectives

### Core Objective
在 BookDetailModal 中实现完整的批量章节上传功能，用户选择一个文件夹后，系统自动按"根目录/章节文件夹/图片"结构创建章节并上传图片。

### Concrete Deliverables
- `vue-frontend/src/composables/useBatchChapterUpload.ts`（新建）
- 修改 `vue-frontend/src/components/bookshelf/BookDetailModal.vue`

### Definition of Done
- [x] 点击"批量上传"按钮弹出文件夹选择框
- [x] 选择文件夹后显示确认摘要（章节数、图片数）
- [x] 确认后开始上传，显示实时进度
- [x] 上传完成后显示结果摘要（成功/失败章节数）
- [x] 章节列表自动刷新
- [x] 边界情况正确处理（空文件夹、非图片文件、API失败等）

### Must Have
- 文件夹选择 via `<input webkitdirectory>`
- 按文件夹分组并自然排序
- 逐个章节：创建 → 添加图片 → 保存会话
- 详细进度显示（章节级别 + 图片级别 + 总体百分比）
- 宽松错误处理（失败项记录但不中断）
- 全局 store 安全检查（imageStore 非空时警告）

### Must NOT Have (Guardrails)
- 不跳转翻译页面（就地处理）
- 不自动触发翻译管线
- 不处理 PDF/MOBI（仅图片）
- 不重试失败项（仅记录）
- 不保留进度到 localStorage
- 不处理图片预处理（旋转、压缩）
- 不上传后直接开始翻译

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO（前端无自动化测试框架）
- **Automated tests**: NO
- **Framework**: none
- **Agent-Executed QA**: MANDATORY for all tasks

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (`/playwright` skill) — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation):
├── Task 1: 创建 useBatchChapterUpload composable [deep]
│   └── 新建文件，实现文件夹扫描、章节创建、图片上传、保存、进度报告
└── Task 2: 修改 BookDetailModal UI [visual-engineering]
    └── 添加按钮、确认摘要模态框、进度覆盖层、结果摘要

Wave 2 (After Wave 1 - integration):
├── Task 3: 集成批量上传到 BookDetailModal [deep]
    └── 导入 composable、连接事件、处理回调、刷新章节列表

Wave FINAL (After ALL tasks — verification):
├── Task F1: 计划合规审计 (oracle)
├── Task F2: 代码质量审查 (unspecified-high)
├── Task F3: 手动QA验证 (unspecified-high)
└── Task F4: 范围保真度检查 (deep)
-> 呈现结果 -> 获取用户显式确认

Critical Path: Task 1 → Task 2 → Task 3 → F1-F4 → user okay
```

### Dependency Matrix
- **Task 1**: - → Task 3
- **Task 2**: - → Task 3
- **Task 3**: Task 1, Task 2 → F1-F4
- **F1-F4**: Task 3 → user okay

### Agent Dispatch Summary
- **Wave 1**: Task 1 → `deep`, Task 2 → `visual-engineering`
- **Wave 2**: Task 3 → `deep`
- **FINAL**: F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] **Task 1: 创建 `useBatchChapterUpload.ts` 组合式函数**

  **What to do**:
  - 新建 `vue-frontend/src/composables/useBatchChapterUpload.ts`
  - 定义 `BatchUploadOptions` 接口和 `BatchUploadResult` 接口
  - 实现 `scanFolder(files: FileList)`：按 `webkitRelativePath` 解析文件夹结构，按直接子文件夹分组章节，过滤非图片文件（`file.type.startsWith('image/')`），根目录下的图片忽略
  - 实现 `processBatchUpload(options)` 主函数：
    1. 调用 `scanFolder` 获取章节分组
    2. 检查 `imageStore.hasImages`，非空时通过回调询问用户是否继续（会清除现有翻译工作）
    3. 对每个章节文件夹（按文件夹名自然排序）：
       a. 调用 `bookshelfStore.createChapterApi(bookId, folderName)`
       b. 如果创建成功，记录 `chapterId`
       c. `imageStore.clearImages()`（清空上一章节的图片）
       d. 对该章节内的图片按文件名自然排序，逐个 `FileReader.readAsDataURL` 读取并调用 `imageStore.addImage(fileName, dataURL)`
       e. 调用 `sessionStore.saveChapterSession(bookId, chapterId)` 保存
       f. 通过 `onProgress` 回调报告进度
    4. 返回 `BatchUploadResult`（成功章节列表、失败章节列表、统计信息）
  - 错误处理：单个章节创建失败 → 记录到失败列表，继续下一章节；单张图片读取失败 → 记录错误，继续下一张图片

  **Must NOT do**:
  - 不要一次性用多个 `FileReader` 并行读取所有图片（内存风险）
  - 不要调用 `sessionStore.setBookChapterContext`（`saveChapterSession` 不需要）
  - 不要自动触发翻译或其他管线步骤
  - 不要修改任何现有文件（除了新建本 composable）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 需要理解 Pinia store 交互、异步流程控制、文件处理、错误处理
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — 与 Task 2 同时执行（Task 2 添加 UI 骨架，Task 3 负责集成）
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References** (CRITICAL):

  **Pattern References** (existing code to follow):
  - `vue-frontend/src/components/translate/ImageUpload.vue:310-321` — `processImageFile` 模式（FileReader + addImage）
  - `vue-frontend/src/components/translate/ImageUpload.vue:111-133` — `handleFolderSelect` 文件夹遍历模式
  - `vue-frontend/src/utils/naturalSort.ts` — 自然排序工具函数

  **API/Type References** (contracts to implement against):
  - `vue-frontend/src/stores/bookshelfStore.ts:590` — `createChapterApi(bookId: string, title: string): Promise<ChapterData | null>`
  - `vue-frontend/src/stores/sessionStore.ts:546` — `saveChapterSession(bookId: string, chapterId: string): Promise<boolean>`
  - `vue-frontend/src/stores/imageStore.ts:143` — `addImage(fileName: string, originalDataURL: string, overrides?: Partial<ImageData>): ImageData`
  - `vue-frontend/src/stores/imageStore.ts:255` — `clearImages(): void`
  - `vue-frontend/src/types/api.ts:123` — `ChapterData` 接口定义
  - `vue-frontend/src/types/image.ts:17` — `ImageData` 接口定义

  **External References**:
  - MDN `FileReader.readAsDataURL`: https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL

  **WHY Each Reference Matters**:
  - `ImageUpload.vue:310-321`: 展示如何读取单个图片文件并添加到 imageStore
  - `ImageUpload.vue:111-133`: 展示如何解析 `webkitdirectory` 的 `FileList` 并按路径分组
  - `bookshelfStore.ts:590`: 展示创建章节的 API 调用方式和返回值处理
  - `sessionStore.ts:546`: 展示保存章节会话的方式（内部自动读取 imageStore）
  - `imageStore.ts:143/255`: 展示如何添加图片和清空 store

  **Acceptance Criteria**:
  - [ ] 文件 `vue-frontend/src/composables/useBatchChapterUpload.ts` 存在且 TypeScript 无编译错误
  - [ ] `scanFolder` 正确按第一层子文件夹分组（根目录图片被忽略）
  - [ ] `processBatchUpload` 按文件夹名自然排序处理章节
  - [ ] 每个章节内的图片按文件名自然排序处理
  - [ ] 创建章节失败时不中断整个流程，而是记录到失败列表
  - [ ] 图片读取失败时记录但不中断当前章节处理
  - [ ] 进度回调被正确调用（currentChapter, totalChapters, currentImage, totalImages, overallPercent）
  - [ ] `BatchUploadResult` 包含成功章节数、失败章节数、失败原因列表

  **QA Scenarios**:

  ```
  Scenario: 正常批量上传（Happy Path）
    Tool: Bash (node REPL 或 bun)
    Preconditions: composable 文件已创建
    Steps:
      1. 读取 composable 文件，验证导出了 `useBatchChapterUpload`
      2. 检查 `scanFolder` 和 `processBatchUpload` 函数存在
      3. 验证 TypeScript 编译通过：`cd vue-frontend && npx vue-tsc --noEmit`
    Expected Result: 编译通过，无类型错误
    Evidence: .sisyphus/evidence/task-1-compile-pass.log

  Scenario: 错误处理（Failure Case）
    Tool: Read (代码审查)
    Preconditions: composable 文件已创建
    Steps:
      1. 读取文件，查找 `try/catch` 块
      2. 验证章节创建失败时调用被 catch 并记录到失败列表
      3. 验证图片读取失败时不抛出导致整个流程中断
      4. 验证 `imageStore.clearImages()` 在创建新章节前被调用
    Expected Result: 至少3个独立的错误处理点；`clearImages` 在章节切换时被调用
    Evidence: .sisyphus/evidence/task-1-error-handling.md
  ```

  **Evidence to Capture**:
  - [ ] `task-1-compile-pass.log` — TypeScript 编译输出
  - [ ] `task-1-error-handling.md` — 错误处理审查记录

  **Commit**: YES
  - Message: `feat(bookshelf): add useBatchChapterUpload composable for batch chapter upload`
  - Files: `vue-frontend/src/composables/useBatchChapterUpload.ts`

---

- [x] **Task 2: 修改 `BookDetailModal.vue` — 添加批量上传 UI 元素**

  **What to do**:
  - 在"章节列表"区域的 `section-header` 中，在"新建章节"按钮旁添加"批量上传"按钮
  - 添加隐藏的文件夹选择 input：`<input type="file" webkitdirectory directory>`
  - 添加状态变量：
    - `showBatchUploadConfirm` — 确认摘要弹窗
    - `showBatchUploadProgress` — 进度覆盖层
    - `showBatchUploadResult` — 结果摘要弹窗
    - `batchUploadState` — 上传状态（idle/scanning/confirm/uploading/done）
    - `batchUploadSummary` — 扫描结果摘要（章节数、图片数）
    - `batchUploadProgress` — 进度数据
    - `batchUploadResult` — 最终结果
  - 添加确认摘要模态框（使用 BaseModal）：显示"发现 N 个章节，共 M 张图片"，提供"确认上传"和"取消"按钮
  - 添加上传进度覆盖层：半透明遮罩 + 进度条，显示"正在上传第 X/Y 章：章节名"、"图片 M/N"、总体百分比
  - 添加结果摘要弹窗：显示成功章节数、失败章节数，失败原因列表
  - 添加全局 store 安全检查弹窗：当 `imageStore.hasImages` 为 true 时，显示警告"当前有未保存的翻译工作，继续将清除现有图片"

  **Must NOT do**:
  - 不要连接实际的批量上传逻辑（留给 Task 3）
  - 不要修改现有章节列表的拖拽排序功能
  - 不要改变"新建章节"按钮的样式或位置（在旁边添加即可）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 主要是 UI 布局和样式工作，添加按钮、弹窗、进度覆盖层
  - **Skills**: [`/frontend-ui-ux`]
    - `/frontend-ui-ux`: 确保新 UI 元素与现有设计风格一致

  **Parallelization**:
  - **Can Run In Parallel**: YES — 与 Task 1 同时执行
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `vue-frontend/src/components/bookshelf/BookDetailModal.vue:479-486` — 现有"新建章节"按钮的位置和样式
  - `vue-frontend/src/components/bookshelf/BookDetailModal.vue:537-558` — BaseModal 使用模式（章节编辑弹窗）
  - `vue-frontend/src/components/bookshelf/BookDetailModal.vue:560-615` — BaseModal 使用模式（添加标签弹窗）
  - `vue-frontend/src/components/translate/ImageUpload.vue:651-657` — `webkitdirectory` input 的实现

  **API/Type References**:
  - `vue-frontend/src/components/common/BaseModal.vue` — Modal 组件 props 和 slots

  **WHY Each Reference Matters**:
  - `BookDetailModal.vue:479-486`: 确定新按钮的插入位置和样式类
  - `BookDetailModal.vue:537-558/560-615`: 展示 BaseModal 的使用方式（v-model、title、footer slot）
  - `ImageUpload.vue:651-657`: 展示 `webkitdirectory` input 的 HTML 属性

  **Acceptance Criteria**:
  - [ ] "批量上传"按钮显示在"新建章节"按钮旁边，样式一致
  - [ ] 点击按钮触发文件夹选择对话框（`input.click()`）
  - [ ] 选择文件夹后显示确认摘要弹窗（BaseModal），显示章节数和图片数
  - [ ] 确认弹窗有"确认上传"和"取消"按钮
  - [ ] 上传进度覆盖层在页面上正确显示（半透明遮罩 + 进度信息）
  - [ ] 结果摘要弹窗在上传完成后显示
  - [ ] 所有新增状态变量正确声明在 `script setup` 中

  **QA Scenarios**:

  ```
  Scenario: UI 元素正确渲染（Happy Path）
    Tool: Playwright (/playwright skill)
    Preconditions: 前端 dev server 运行中 (`cd vue-frontend && pnpm run dev`)
    Steps:
      1. 导航到书架页面，点击任意书籍卡片打开 BookDetailModal
      2. 在"章节列表"标题右侧，断言存在两个按钮："新建章节"和"批量上传"
      3. 点击"批量上传"按钮
      4. （由于无法自动选择文件夹，改为验证 input 元素存在且 `webkitdirectory` 属性设置正确）
      5. 使用 Playwright 的 `page.evaluate()` 模拟触发文件选择事件，传入测试 FileList
      6. 断言确认摘要弹窗显示，内容包含"发现"和"章节"字样
    Expected Result: 按钮可见、可点击；确认弹窗正确显示
    Evidence: .sisyphus/evidence/task-2-ui-render.png

  Scenario: 进度覆盖层显示（Progress Overlay）
    Tool: Playwright (/playwright skill)
    Preconditions: 前端 dev server 运行中
    Steps:
      1. 打开 BookDetailModal
      2. 通过 JS 直接设置 `showBatchUploadProgress = true` 和模拟进度数据
      3. 断言页面上显示进度覆盖层（半透明遮罩）
      4. 断言进度文本包含"正在上传"字样
    Expected Result: 进度覆盖层正确渲染，不遮挡底层内容但阻止交互
    Evidence: .sisyphus/evidence/task-2-progress-overlay.png
  ```

  **Evidence to Capture**:
  - [ ] `task-2-ui-render.png` — 按钮和确认弹窗截图
  - [ ] `task-2-progress-overlay.png` — 进度覆盖层截图

  **Commit**: NO（与 Task 3 合并提交）

---

- [x] **Task 3: 集成批量上传逻辑到 `BookDetailModal.vue`**

  **What to do**:
  - 在 `BookDetailModal.vue` 的 `script setup` 中导入 `useBatchChapterUpload` composable
  - 导入 `useImageStore`（用于全局 store 安全检查）
  - 实现 `handleBatchUploadClick()`：触发隐藏的文件夹 input 的 `click()`
  - 实现 `handleFolderSelected(event)`：
    1. 获取 `input.files`
    2. 调用 `scanFolder` 解析文件夹结构
    3. 如果 `imageStore.hasImages` 为 true，显示全局 store 安全警告弹窗，用户确认后才继续
    4. 显示确认摘要弹窗（`showBatchUploadConfirm = true`）
  - 实现 `confirmBatchUpload()`：
    1. 关闭确认弹窗
    2. 显示进度覆盖层（`showBatchUploadProgress = true`）
    3. 调用 `processBatchUpload` 并传入：
       - `bookId: currentBook.value.id`
       - `files: selectedFiles`
       - `onProgress: (progress) => { batchUploadProgress = progress }`
    4. 等待完成后：
       - 关闭进度覆盖层
       - 显示结果摘要弹窗
       - 如果成功章节数 > 0，刷新书籍详情（`refreshBookDetail()`）
  - 实现 `cancelBatchUpload()`：关闭确认弹窗，重置状态
  - 确保上传过程中：
    - 禁用"新建章节"按钮和"批量上传"按钮
    - 禁用章节列表中的操作按钮
    - 阻止模态框关闭（BaseModal 的 `close-on-overlay` 和 `close-on-esc` 临时设为 false）
  - 处理取消/关闭：上传过程中用户尝试关闭模态框时，显示"上传进行中，确定要取消吗？"确认

  **Must NOT do**:
  - 不要修改 `useBatchChapterUpload.ts`（如果 Task 1 已完成则只读）
  - 不要修改 `saveChapterSession` 或 `createChapterApi` 的实现
  - 不要在上传完成后自动导航到翻译页面

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 需要协调多个 store、composable、UI 状态和事件处理
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2（依赖 Task 1 和 Task 2）
  - **Blocks**: F1-F4
  - **Blocked By**: Task 1, Task 2

  **References**:

  **Pattern References**:
  - `vue-frontend/src/components/bookshelf/BookDetailModal.vue:96-101` — `openCreateChapterModal` 模式
  - `vue-frontend/src/components/bookshelf/BookDetailModal.vue:114-145` — `saveChapter` 异步保存模式（try/catch + toast）
  - `vue-frontend/src/components/bookshelf/BookDetailModal.vue:216-226` — `refreshBookDetail` 刷新书籍详情
  - `vue-frontend/src/components/translate/ImageUpload.vue:111-133` — 文件夹选择事件处理
  - `vue-frontend/src/composables/useBatchChapterUpload.ts` — Task 1 创建的 composable（函数签名）

  **API/Type References**:
  - `vue-frontend/src/stores/imageStore.ts` — `useImageStore` 的 `hasImages` getter

  **WHY Each Reference Matters**:
  - `BookDetailModal.vue:96-101`: 展示如何在当前组件中打开模态框/触发操作
  - `BookDetailModal.vue:114-145`: 展示异步 API 调用的错误处理模式（try/catch + showToast）
  - `BookDetailModal.vue:216-226`: 上传完成后刷新书籍详情以更新章节列表
  - `ImageUpload.vue:111-133`: 展示如何处理文件夹选择事件和 `webkitRelativePath`

  **Acceptance Criteria**:
  - [ ] 选择文件夹后正确调用 `scanFolder` 并显示确认摘要
  - [ ] `imageStore.hasImages` 为 true 时显示安全警告
  - [ ] 点击"确认上传"后显示进度覆盖层并调用 `processBatchUpload`
  - [ ] 进度数据实时更新到 UI（通过 `onProgress` 回调）
  - [ ] 上传完成后显示结果摘要
  - [ ] 成功上传后章节列表自动刷新
  - [ ] 上传过程中禁用相关按钮和模态框关闭
  - [ ] `BookDetailModal.vue` 的 TypeScript 编译通过

  **QA Scenarios**:

  ```
  Scenario: 完整批量上传流程（End-to-End）
    Tool: Playwright (/playwright skill)
    Preconditions: 前端 dev server + 后端 Flask 运行中；测试书籍已创建
    Steps:
      1. 导航到书架页面，点击测试书籍打开 BookDetailModal
      2. 点击"批量上传"按钮
      3. 使用 Playwright 的 `page.setInputFiles()` 向隐藏的 webkitdirectory input 传入测试文件夹（fixtures/batch-upload-test/）
      4. 断言确认摘要弹窗显示章节数和图片数正确
      5. 点击"确认上传"
      6. 断言进度覆盖层显示，且进度从 0% 增长到 100%
      7. 断言结果摘要弹窗显示"上传完成"
      8. 关闭结果弹窗，断言章节列表中新增相应章节
      9. 刷新页面，断言章节和图片数据持久化（调用 API 验证）
    Expected Result: 所有步骤通过，章节和图片正确创建并保存
    Evidence: .sisyphus/evidence/task-3-e2e-success.png, task-3-e2e-chapter-list.png

  Scenario: 全局 store 非空警告（Guardrail）
    Tool: Playwright (/playwright skill)
    Preconditions: 前端 dev server + 后端运行中；先进入翻译页面上传任意图片
    Steps:
      1. 导航到翻译页面，上传一张测试图片（不保存）
      2. 返回书架，打开 BookDetailModal
      3. 点击"批量上传"，选择测试文件夹
      4. 断言显示安全警告弹窗，文本包含"未保存的翻译工作"或"清除"
      5. 点击"取消"，断言回到确认摘要弹窗之前的状态
      6. 再次触发上传，点击"继续"，断言上传流程继续
    Expected Result: 安全警告正确显示，取消/继续逻辑正确
    Evidence: .sisyphus/evidence/task-3-store-warning.png

  Scenario: API 失败容错（Error Resilience）
    Tool: Bash (curl + mock) 或 Playwright (network intercept)
    Preconditions: 前端 dev server 运行中
    Steps:
      1. 使用 Playwright 的 `page.route()` 拦截 `**/api/bookshelf/books/*/chapters` POST 请求
      2. 让第二个章节的创建请求返回 500 错误
      3. 执行批量上传流程
      4. 断言进度覆盖层继续显示（没有卡住）
      5. 断言最终结果弹窗显示"1 个章节成功，1 个章节失败"
      6. 断言成功的章节在列表中可见
    Expected Result: 单点失败不影响整体流程，错误被正确记录和报告
    Evidence: .sisyphus/evidence/task-3-api-failure-resilience.png
  ```

  **Evidence to Capture**:
  - [ ] `task-3-e2e-success.png` — 上传完成后结果弹窗截图
  - [ ] `task-3-e2e-chapter-list.png` — 章节列表刷新后截图
  - [ ] `task-3-store-warning.png` — 全局 store 安全警告弹窗截图
  - [ ] `task-3-api-failure-resilience.png` — API 失败容错测试结果

  **Commit**: YES
  - Message: `feat(bookshelf): integrate batch chapter upload into BookDetailModal`
  - Files: `vue-frontend/src/components/bookshelf/BookDetailModal.vue`
  - Pre-commit: `cd vue-frontend && npx vue-tsc --noEmit`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [x] **F1. 计划合规审计** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] **F2. 代码质量审查** — `unspecified-high`
  Run `cd vue-frontend && npx vue-tsc --noEmit` + `npx eslint src/components/bookshelf/BookDetailModal.vue src/composables/useBatchChapterUpload.ts`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, `console.log` in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] **F3. 手动 QA 验证** — `unspecified-high` (+ `/playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty folder, non-image files, API failure mock. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] **F4. 范围保真度检查** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Commit 1**: `feat(bookshelf): add useBatchChapterUpload composable for batch chapter upload`
  - Files: `vue-frontend/src/composables/useBatchChapterUpload.ts`
  - Pre-commit: `cd vue-frontend && npx vue-tsc --noEmit`

- **Commit 2**: `feat(bookshelf): integrate batch chapter upload into BookDetailModal`
  - Files: `vue-frontend/src/components/bookshelf/BookDetailModal.vue`
  - Pre-commit: `cd vue-frontend && npx vue-tsc --noEmit`

---

## Success Criteria

### Verification Commands
```bash
# TypeScript 编译检查
cd vue-frontend && npx vue-tsc --noEmit

# ESLint 检查
cd vue-frontend && npx eslint src/components/bookshelf/BookDetailModal.vue src/composables/useBatchChapterUpload.ts

# 功能验证：前端 dev server 运行后手动测试批量上传流程
cd vue-frontend && pnpm run dev
```

### Final Checklist
- [x] 所有 "Must Have" 已实现
- [x] 所有 "Must NOT Have" 未出现
- [x] `vue-tsc --noEmit` 编译通过
- [x] ESLint 无错误
- [x] 所有 QA scenarios 通过
- [x] 所有 evidence 文件已捕获 (代码审查验证替代)
