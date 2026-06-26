export async function extractFileText(file: File): Promise<string> {
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return await file.text();
  }

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
    throw new Error('暂不支持该文件格式，请使用TXT文件或直接复制文本内容粘贴。PDF/Word支持将在后续版本添加。');
  }
}
