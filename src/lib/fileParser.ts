export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  // 纯文本类：txt / md / markdown / csv / log
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

  // 二进制文档类：PDF / Word —— MVP 暂未集成解析库，给出明确提示
  if (name.endsWith('.pdf')) {
    throw new Error('暂不支持 PDF 直接解析，请将内容复制保存为 .txt/.md 后上传，或直接粘贴到文本框。');
  }
  if (name.endsWith('.doc') || name.endsWith('.docx')) {
    throw new Error('暂不支持 Word 直接解析，请将内容复制保存为 .txt/.md 后上传，或直接粘贴到文本框。');
  }

  // 其他类型：尝试按文本读取，清洗控制字符
  try {
    const text = await file.text();
    const cleaned = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length > 50) {
      return cleaned;
    }
    throw new Error('二进制文件');
  } catch {
    throw new Error('暂不支持该文件格式，请使用 .txt / .md 文件，或直接粘贴文本内容。');
  }
}
