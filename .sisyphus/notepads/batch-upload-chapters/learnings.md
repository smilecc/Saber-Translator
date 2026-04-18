
## Task 3 完成记录（2026-04-18）

### 集成批量上传逻辑到 BookDetailModal.vue
- 导入 `useBatchChapterUpload`, `scanFolder`, `processBatchUpload`
- 新增 `selectedFiles` ref 保存 FileList 供上传使用
- `handleBatchFolderSelect` 使用 `scanFolder` 解析文件夹结构，处理 `imageStore.hasImages` 警告
- `confirmBatchUpload` 调用 `processBatchUpload`，通过 `onProgress` 实时更新进度，完成后刷新章节列表
- 新增 `cancelBatchUpload` 函数，关闭确认弹窗并重置状态
- 上传过程中禁用"新建章节"、"批量上传"按钮和章节列表操作按钮
- 主模态框在上传过程中阻止关闭（`close-on-overlay/esc` 设为 false）
- 移除 `simulateBatchUpload` 模拟函数和所有 TODO 注释

### 修复 handleModalClose 缺失函数（2026-04-18）
- 新增 `showCancelUploadConfirm` 状态变量
- 新增 `handleModalClose` 函数：上传中显示确认弹窗，否则正常关闭
- 新增 `confirmCancelUpload` 和 `dismissCancelUpload` 函数
- 新增取消上传确认弹窗 BaseModal（"继续上传"/"取消上传"按钮）
- 新增对应 CSS 样式
- vue-tsc 类型检查通过，无错误

### 技术细节
- `onConfirmOverwrite` 使用 Promise + watch 模式等待用户在弹窗中做出选择
- `proceedAfterStoreWarning` 改为可变函数引用，以便在 overwrite 确认时临时替换行为
- 取消上传后已上传的章节保留（仅关闭模态框，不删除数据）
