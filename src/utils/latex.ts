/**
 * LaTeX 和 Markdown 渲染工具函数
 * 使用 KaTeX 将 LaTeX 公式转换为 HTML
 * 使用 marked 将 Markdown 转换为 HTML
 */
import katex from 'katex'
import { marked } from 'marked'

// 配置 marked
marked.setOptions({
  breaks: true,  // 支持 GFM 换行
  gfm: true      // 启用 GitHub 风格的 Markdown
})

/**
 * 渲染包含 LaTeX 公式的文本
 * 支持行内公式 $...$ 和块级公式 $$...$$
 * @param text 包含 LaTeX 公式的文本
 * @returns 渲染后的 HTML 字符串
 */
export const renderLatex = (text: string): string => {
  if (!text) return ''

  // 首先处理块级公式 $$...$$
  let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false
      })
    } catch {
      return `<span class="latex-error">${escapeHtml(formula)}</span>`
    }
  })

  // 然后处理行内公式 $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (_match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false
      })
    } catch {
      return `<span class="latex-error">${escapeHtml(formula)}</span>`
    }
  })

  // 将换行符转换为 <br>
  result = result.replace(/\n/g, '<br>')

  return result
}

/**
 * 渲染 Markdown 和 LaTeX 混合内容
 * 先提取并保护 LaTeX 公式，然后渲染 Markdown，最后还原 LaTeX
 * @param text 包含 Markdown 和 LaTeX 的文本
 * @returns 渲染后的 HTML 字符串
 */
export const renderMarkdown = (text: string): string => {
  if (!text) return ''

  // 用占位符保护 LaTeX 公式，防止被 Markdown 解析器破坏
  const latexPlaceholders: string[] = []
  let placeholderIndex = 0

  // 保护块级公式 $$...$$ - 添加换行使其成为独立段落
  let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    const placeholder = `%%LATEX_BLOCK_${placeholderIndex}%%`
    try {
      latexPlaceholders[placeholderIndex] = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false
      })
    } catch {
      latexPlaceholders[placeholderIndex] = `<span class="latex-error">${escapeHtml(formula)}</span>`
    }
    placeholderIndex++
    // 添加换行使 markdown 解析器将其作为独立段落处理
    return `\n\n${placeholder}\n\n`
  })

  // 保护行内公式 $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (_match, formula) => {
    const placeholder = `%%LATEX_INLINE_${placeholderIndex}%%`
    try {
      latexPlaceholders[placeholderIndex] = katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false
      })
    } catch {
      latexPlaceholders[placeholderIndex] = `<span class="latex-error">${escapeHtml(formula)}</span>`
    }
    placeholderIndex++
    return placeholder
  })

  // 渲染 Markdown
  result = marked.parse(result) as string

  // 还原块级 LaTeX 公式 - 移除 marked 添加的 <p> 包装，避免块级元素嵌套在 <p> 中
  result = result.replace(/<p>\s*%%LATEX_BLOCK_(\d+)%%\s*<\/p>/g, (_match, index) => {
    return `<div class="katex-block-wrapper">${latexPlaceholders[parseInt(index)] || ''}</div>`
  })

  // 还原行内 LaTeX 公式
  result = result.replace(/%%LATEX_INLINE_(\d+)%%/g, (_match, index) => {
    return latexPlaceholders[parseInt(index)] || ''
  })

  // 处理可能遗留的占位符（边缘情况，如块级公式在其他元素内）
  result = result.replace(/%%LATEX_BLOCK_(\d+)%%/g, (_match, index) => {
    return latexPlaceholders[parseInt(index)] || ''
  })

  return result
}

/**
 * 转义 HTML 特殊字符，防止 XSS
 */
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * 仅渲染单个 LaTeX 公式（不处理文本中的公式标记）
 * @param formula LaTeX 公式（不含 $ 符号）
 * @param displayMode 是否为块级模式
 * @returns 渲染后的 HTML 字符串
 */
export const renderFormula = (formula: string, displayMode = false): string => {
  try {
    return katex.renderToString(formula.trim(), {
      displayMode,
      throwOnError: false
    })
  } catch {
    return `<span class="latex-error">${escapeHtml(formula)}</span>`
  }
}
