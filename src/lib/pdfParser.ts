import * as pdfjsLib from 'pdfjs-dist'
// 直接导入 worker 的入口
import 'pdfjs-dist/build/pdf.worker.min.mjs'

/**
 * 从 PDF 文件中提取文本内容
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
    })
    
    const pdf = await loadingTask.promise
    
    let fullText = ''
    
    // 遍历所有页面
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // 提取文本项
      const textItems = textContent.items as Array<{
        str: string
        hasEOL?: boolean
      }>
      
      // 简单拼接文本
      let pageText = ''
      for (const item of textItems) {
        pageText += item.str
        if (item.hasEOL) {
          pageText += '\n'
        }
      }
      
      fullText += pageText
      
      // 页面之间添加分隔
      if (pageNum < pdf.numPages) {
        fullText += '\n\n---\n\n'
      }
    }
    
    // 清理多余的空行
    const cleanedText = fullText
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    
    return cleanedText
  } catch (error) {
    console.error('PDF 解析错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`PDF 解析失败: ${errorMessage}`)
  }
}

/**
 * 验证文件是否为 PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
