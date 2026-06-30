import { useMemo, type ElementType, type ReactNode } from 'react';
import katex from 'katex';

/**
 * MathText：数学公式渲染组件
 *
 * 解析 $...$（行内公式）和 $$...$$（块级公式），使用 KaTeX 渲染。
 *
 * 智能处理 DOM 嵌套：
 *   - 当 as="p" 但文本含 $$...$$ 块级公式时，自动降级为 <div> 渲染
 *     （因为块级公式会渲染出 <div>，不能嵌套在 <p> 内，否则触发 DOM 警告）
 *
 * 错误降级：公式解析失败时，回退为原始文本显示，不抛错。
 *
 * 用法：
 *   <MathText>当 $x>0$ 时，$\frac{1}{x}$ 有意义</MathText>
 *   <MathText as="p" block>{`$$\\int_0^1 x\\,dx = \\frac{1}{2}$$`}</MathText>
 */

interface MathTextProps {
  children: string | ReactNode;
  as?: ElementType;
  className?: string;
  /** 强制块级渲染（即使只有行内公式也用 div 包裹） */
  block?: boolean;
}

/** 检测文本是否包含 $$...$$ 块级公式 */
function hasBlockFormula(text: string): boolean {
  return /\$\$[\s\S]+?\$\$/.test(text);
}

/** 安全调用 katex.renderToString，失败返回 null */
function renderTex(tex: string, displayMode: boolean): string | null {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      output: 'html',
      strict: 'ignore',
      trust: false,
    });
  } catch {
    return null;
  }
}

interface Segment {
  type: 'text' | 'inline' | 'block';
  content: string;
}

/** 将文本拆分为 普通文本 / 行内公式 / 块级公式 三类片段 */
function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // 匹配 $$...$$ (块级) 或 $...$ (行内)，非贪婪
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('$$')) {
      segments.push({ type: 'block', content: token.slice(2, -2) });
    } else {
      segments.push({ type: 'inline', content: token.slice(1, -1) });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return segments;
}

export default function MathText({ children, as, className, block = false }: MathTextProps) {
  const text = typeof children === 'string' ? children : '';

  const { Tag, html } = useMemo(() => {
    // 智能选择标签：含块级公式或强制 block 时，不能用 p
    const useBlock = block || hasBlockFormula(text);
    const resolvedTag = as ?? (useBlock ? 'div' : 'span');

    // 若用户指定 as="p" 但文本含块级公式，强制降级为 div
    const finalTag: ElementType =
      as === 'p' && useBlock ? 'div' : resolvedTag;

    if (!text) {
      return { Tag: finalTag, html: null };
    }

    const segs = parseSegments(text);
    const parts = segs.map((seg) => {
      if (seg.type === 'text') {
        // 转义 HTML 特殊字符，避免注入
        return seg.content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }
      if (seg.type === 'inline') {
        return renderTex(seg.content, false) ?? seg.content;
      }
      // block: 用 katex displayMode，外层包一个 block 容器
      const rendered = renderTex(seg.content, true) ?? seg.content;
      return `<span class="math-block-wrap" style="display:block;margin:0.5em 0;text-align:center;">${rendered}</span>`;
    });

    return { Tag: finalTag, html: parts.join('') };
  }, [text, as, block]);

  if (!text) {
    // 非字符串 children（如 JSX 元素）直接渲染
    const FallbackTag = (as ?? 'span') as ElementType;
    return <FallbackTag className={className}>{children}</FallbackTag>;
  }

  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html ?? '' }} />;
}
