import { ref } from 'vue'
import { naturalSort } from '@/utils/naturalSort'
import { useImageStore } from '@/stores/imageStore'
import { useBookshelfStore } from '@/stores/bookshelfStore'
import { useSessionStore } from '@/stores/sessionStore'

export interface ChapterGroup {
  folderName: string
  files: File[]
}

export interface BatchUploadProgress {
  currentChapter: number
  totalChapters: number
  currentChapterName: string
  currentImage: number
  totalImages: number
  overallPercent: number
}

export interface FailedChapter {
  folderName: string
  reason: string
}

export interface SuccessChapter {
  folderName: string
  chapterId: string
  imageCount: number
}

export interface BatchUploadOptions {
  bookId: string
  files: FileList
  onProgress?: (progress: BatchUploadProgress) => void
  onConfirmOverwrite?: () => Promise<boolean>
}

export interface BatchUploadResult {
  successCount: number
  failedCount: number
  successChapters: SuccessChapter[]
  failedChapters: FailedChapter[]
  totalImagesProcessed: number
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataURL = e.target?.result as string
      if (dataURL) {
        resolve(dataURL)
      } else {
        reject(new Error(`读取图片文件结果为空: ${file.name}`))
      }
    }
    reader.onerror = () => reject(new Error(`读取图片文件失败: ${file.name}`))
    reader.readAsDataURL(file)
  })
}

export function scanFolder(files: FileList): ChapterGroup[] {
  const allFiles = Array.from(files)
  const chapterMap = new Map<string, File[]>()

  for (const file of allFiles) {
    if (!file.type.startsWith('image/')) {
      continue
    }

    const relativePath = file.webkitRelativePath || file.name
    const pathParts = relativePath.split('/')

    if (pathParts.length < 2) {
      continue
    }

    const chapterName = pathParts[1]!

    if (!chapterMap.has(chapterName)) {
      chapterMap.set(chapterName, [])
    }
    chapterMap.get(chapterName)!.push(file)
  }

  const groups: ChapterGroup[] = []
  for (const [folderName, files] of chapterMap) {
    if (files.length === 0) continue
    groups.push({ folderName, files })
  }

  return naturalSort(groups, (g) => g.folderName)
}

export async function processBatchUpload(
  options: BatchUploadOptions
): Promise<BatchUploadResult> {
  const { bookId, files, onProgress, onConfirmOverwrite } = options

  const imageStore = useImageStore()
  const bookshelfStore = useBookshelfStore()
  const sessionStore = useSessionStore()

  const chapters = scanFolder(files)

  if (chapters.length === 0) {
    return {
      successCount: 0,
      failedCount: 0,
      successChapters: [],
      failedChapters: [],
      totalImagesProcessed: 0,
    }
  }

  if (imageStore.hasImages && onConfirmOverwrite) {
    const shouldContinue = await onConfirmOverwrite()
    if (!shouldContinue) {
      return {
        successCount: 0,
        failedCount: 0,
        successChapters: [],
        failedChapters: [],
        totalImagesProcessed: 0,
      }
    }
  }

  const totalImagesAll = chapters.reduce((sum, ch) => sum + ch.files.length, 0)
  let imagesProcessedSoFar = 0
  let totalImagesProcessed = 0

  const successChapters: SuccessChapter[] = []
  const failedChapters: FailedChapter[] = []

  for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
    const chapter = chapters[chapterIndex]!
    const currentChapterNum = chapterIndex + 1

    const chapterData = await bookshelfStore.createChapterApi(bookId, chapter.folderName)

    if (!chapterData) {
      failedChapters.push({
        folderName: chapter.folderName,
        reason: '创建章节失败',
      })
      imagesProcessedSoFar += chapter.files.length
      if (onProgress) {
        onProgress({
          currentChapter: currentChapterNum,
          totalChapters: chapters.length,
          currentChapterName: chapter.folderName,
          currentImage: 0,
          totalImages: chapter.files.length,
          overallPercent: Math.round((imagesProcessedSoFar / totalImagesAll) * 100),
        })
      }
      continue
    }

    const chapterId = chapterData.id

    imageStore.clearImages()

    const sortedFiles = naturalSort(chapter.files, (f) => f.name)
    let chapterImageCount = 0

    for (let imageIndex = 0; imageIndex < sortedFiles.length; imageIndex++) {
      const file = sortedFiles[imageIndex]!
      const currentImageNum = imageIndex + 1

      try {
        const dataURL = await readFileAsDataURL(file)
        imageStore.addImage(file.name, dataURL)
        chapterImageCount++
        totalImagesProcessed++
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err)
        console.error(`[批量上传] 图片读取失败: ${file.name}, 原因: ${reason}`)
      }

      imagesProcessedSoFar++

      if (onProgress) {
        onProgress({
          currentChapter: currentChapterNum,
          totalChapters: chapters.length,
          currentChapterName: chapter.folderName,
          currentImage: currentImageNum,
          totalImages: sortedFiles.length,
          overallPercent: Math.round((imagesProcessedSoFar / totalImagesAll) * 100),
        })
      }
    }

    try {
      await sessionStore.saveChapterSession(bookId, chapterId)
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      console.error(`[批量上传] 保存章节会话失败: ${chapter.folderName}, 原因: ${reason}`)
    }

    successChapters.push({
      folderName: chapter.folderName,
      chapterId,
      imageCount: chapterImageCount,
    })
  }

  return {
    successCount: successChapters.length,
    failedCount: failedChapters.length,
    successChapters,
    failedChapters,
    totalImagesProcessed,
  }
}

export function useBatchChapterUpload() {
  const isUploading = ref(false)
  const progress = ref<BatchUploadProgress | null>(null)
  const lastResult = ref<BatchUploadResult | null>(null)

  async function upload(options: BatchUploadOptions): Promise<BatchUploadResult> {
    isUploading.value = true
    progress.value = null

    try {
      const result = await processBatchUpload({
        ...options,
        onProgress: (p) => {
          progress.value = p
          options.onProgress?.(p)
        },
      })
      lastResult.value = result
      return result
    } finally {
      isUploading.value = false
    }
  }

  return {
    isUploading,
    progress,
    lastResult,
    upload,
    scanFolder,
  }
}
