import { useState, type CSSProperties } from 'react';

/**
 * 二次元主题插画组件：通过统一文生图 API 实时生成。
 *
 * 设计要点：
 *  - 加载中显示纸张色占位卡片（opacity 0），加载完成淡入，体验平滑
 *  - 加载失败静默隐藏（onError），不影响页面其他内容
 *  - 外观做成"贴在手账上的拍立得"：纸张色底 + 暖色细边 + 柔阴影，融入复古纸张主题
 *  - aria-hidden，纯装饰不朗读
 *
 * 用法：
 *   <AnimeMascot prompt="anime style, ..." size="portrait_4_3" className="w-28 h-36" />
 */
type ImageSize =
  | 'square_hd'
  | 'square'
  | 'portrait_4_3'
  | 'portrait_16_9'
  | 'landscape_4_3'
  | 'landscape_16_9';

interface AnimeMascotProps {
  /** SDXL 风格的英文 prompt，描述要具体、可视 */
  prompt: string;
  size?: ImageSize;
  className?: string;
  style?: CSSProperties;
}

const API_BASE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';

export default function AnimeMascot({
  prompt,
  size = 'portrait_4_3',
  className,
  style,
}: AnimeMascotProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  const src = `${API_BASE}?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={className}
      style={{
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.6s ease',
        // 加载中/失败时显示纸张色卡片，避免空白突兀
        background: 'linear-gradient(135deg, #EDE4D3 0%, #E0D4C0 100%)',
        border: '1px solid rgba(92, 64, 51, 0.15)',
        boxShadow: '0 4px 14px rgba(92, 64, 51, 0.15)',
        objectFit: 'cover',
        ...style,
      }}
    />
  );
}
