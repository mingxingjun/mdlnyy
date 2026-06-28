/**
 * 文件文本提取器（输出结构化 Markdown，便于 LLM 解析）
 *
 * 支持格式：
 * - 纯文本：.txt / .md / .markdown / .csv / .log
 * - PDF：.pdf（pdfjs-dist 前端解析）
 * - Word：.docx（mammoth 转 HTML → turndown 转 Markdown，保留标题/列表/表格）
 *         .doc 老格式不支持，提示转换
 * - PPT：.pptx（jszip 解压 + 提取 slide XML 文本，输出 Markdown 分节）
 *         .ppt 老格式不支持，提示转换
 *
 * 所有二进制解析库均采用动态 import，仅在上传对应格式时才加载，避免首屏体积膨胀。
 *
 * 设计理念：参考 microsoft/markitdown，把文件转成结构化 Markdown 再喂给 LLM，
 * 保留标题/列表/表格等语义结构，显著提升 LLM 题库解析准确率。
 */

/** 清洗控制字符并合并多余空白 */
function cleanText(raw: string): string {
  return raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ─── HTML → Markdown（turndown）────────────────────── */

/**
 * 把 HTML 转成 Markdown，保留标题/列表/表格/加粗等语义结构。
 * turndown 是纯 JS 库，浏览器友好，无需后端。
 */
async function htmlToMarkdown(html: string): Promise<string> {
  const TurndownService = (await import('turndown')).default;
  const turndown = new TurndownService({
    headingStyle: 'atx',        // # 风格标题
    bulletListMarker: '-',      // - 列表项
    codeBlockStyle: 'fenced',   // ``` 代码块
    emDelimiter: '*',           // *斜体*
    strongDelimiter: '**',      // **加粗**
  });
  // 启用表格转换（turndown 默认不转表格，需注册规则）
  // 简单实现：把 <table> 转成 Markdown 管道表格
  turndown.addRule('tableCell', {
    filter: ['th', 'td'],
    replacement: (content, node) => {
      const cell = content.trim().replace(/\|/g, '\\|').replace(/\n/g, ' ');
      return ` ${cell} |`;
    },
  });
  turndown.addRule('tableRow', {
    filter: 'tr',
    replacement: (content, node) => {
      const cells = content.trim();
      if (!cells) return '';
      const row = `|${cells}`;
      // 表头行后加分隔行
      const tr = node as HTMLElement;
      if (tr.querySelector('th')) {
        const colCount = tr.querySelectorAll('th,td').length;
        const separator = `|${Array(colCount).fill(' --- ').join('|')}|`;
        return `${row}\n${separator}\n`;
      }
      return `${row}\n`;
    },
  });
  turndown.addRule('table', {
    filter: 'table',
    replacement: (content) => `\n\n${content}\n\n`,
  });
  return turndown.turndown(html);
}

/* ─── PDF 解析（pdfjs-dist）────────────────────────── */
let pdfWorkerReady = false;

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  if (!pdfWorkerReady) {
    // Vite 的 ?url 导入：把 worker 作为独立资源，返回其 URL
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    pdfWorkerReady = true;
  }

  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;

  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // TextItem 的 str 字段即为文本片段，按空格拼接成行
    const lineText = content.items
      .map((it) => (typeof (it as { str?: unknown }).str === 'string' ? (it as { str: string }).str : ''))
      .join(' ');
    parts.push(lineText);
  }
  return parts.join('\n');
}

/* ─── Word .docx 解析（mammoth → HTML → Markdown）──── */
async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  // 用 convertToHtml 而非 extractRawText，保留标题/列表/表格/加粗等语义结构
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value || '';
  if (!html.trim()) return '';
  // HTML → Markdown，让 LLM 拿到结构化文本而非扁平纯文本
  const markdown = await htmlToMarkdown(html);
  return cleanText(markdown);
}

/* ─── PPT .pptx 解析（jszip → Markdown 分节）────────── */
async function extractPptx(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 定位所有 slide 文件：ppt/slides/slideN.xml，按页码排序
  const slidePaths = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] ?? '0', 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] ?? '0', 10);
      return na - nb;
    });

  if (slidePaths.length === 0) {
    throw new Error('PPTX 内未找到幻灯片，可能文件已损坏');
  }

  const parts: string[] = [];
  for (let i = 0; i < slidePaths.length; i++) {
    const path = slidePaths[i];
    const xml = await zip.files[path].async('string');
    // OOXML 中正文文本节点为 <a:t>…</a:t>，提取其内容
    const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g) ?? [];
    const texts = matches
      .map((m) => m.replace(/<\/?a:t>/g, ''))
      .map((s) => s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'"));

    // 第一段文本作为幻灯片标题，其余作为内容列表
    const nonEmpty = texts.filter((t) => t.trim());
    if (nonEmpty.length === 0) continue;
    const title = nonEmpty[0].trim();
    const body = nonEmpty.slice(1);
    let slideMd = `## 幻灯片 ${i + 1}：${title}\n`;
    if (body.length > 0) {
      slideMd += body.map((t) => `- ${t.trim()}`).join('\n');
    }
    parts.push(slideMd);
  }
  // 用分隔线分节，保留幻灯片边界（LLM 能识别"这是一页一页的"）
  return parts.join('\n\n---\n\n');
}

/**
 * 从上传文件中提取纯文本。
 * @throws Error 当格式不支持或解析失败时抛出带中文提示的错误
 */
export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  // 1. 纯文本类：直接读取
  if (
    file.type === 'text/plain' ||
    file.type === 'text/markdown' ||
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.markdown') ||
    name.endsWith('.csv') ||
    name.endsWith('.log')
  ) {
    return await file.text();
  }

  // 2. PDF
  if (name.endsWith('.pdf')) {
    try {
      const text = await extractPdf(file);
      if (!text || text.trim().length < 10) {
        throw new Error('PDF 解析到的文本过少，可能是扫描件（图片型 PDF）。请复制正文为 .txt/.md 后上传，或使用下方「粘贴文本」。');
      }
      return text;
    } catch (err) {
      // pdfjs 内部错误也包装成友好提示
      throw err instanceof Error && err.message.startsWith('PDF')
        ? err
        : new Error(`PDF 解析失败：${err instanceof Error ? err.message : '未知错误'}`);
    }
  }

  // 3. Word
  if (name.endsWith('.docx')) {
    try {
      const text = await extractDocx(file);
      if (!text || text.trim().length < 10) {
        throw new Error('Word 文档解析到的文本过少，可能是空文档或纯图片文档。');
      }
      return text;
    } catch (err) {
      throw err instanceof Error && err.message.startsWith('Word')
        ? err
        : new Error(`Word 解析失败：${err instanceof Error ? err.message : '未知错误'}`);
    }
  }
  if (name.endsWith('.doc')) {
    throw new Error('暂不支持 .doc 老格式，请另存为 .docx 后上传，或直接粘贴文本内容。');
  }

  // 4. PPT
  if (name.endsWith('.pptx')) {
    try {
      const text = await extractPptx(file);
      if (!text || text.trim().length < 10) {
        throw new Error('PPT 解析到的文本过少，可能是纯图片/动画型幻灯片。');
      }
      return text;
    } catch (err) {
      throw err instanceof Error && (err.message.startsWith('PPT') || err.message.startsWith('PPTX'))
        ? err
        : new Error(`PPT 解析失败：${err instanceof Error ? err.message : '未知错误'}`);
    }
  }
  if (name.endsWith('.ppt')) {
    throw new Error('暂不支持 .ppt 老格式，请另存为 .pptx 后上传，或直接粘贴文本内容。');
  }

  // 5. 其他类型：尝试按文本读取并清洗
  try {
    const text = await file.text();
    const cleaned = cleanText(text);
    if (cleaned.length > 50) {
      return cleaned;
    }
    throw new Error('二进制文件');
  } catch {
    throw new Error('暂不支持该文件格式，请使用 .txt / .md / .pdf / .docx / .pptx，或直接粘贴文本内容。');
  }
}
