interface PaperSpinnerProps {
  text?: string;
}

export default function PaperSpinner({ text = '加载中...' }: PaperSpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-seal paper-spinner-dot"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
      <p className="font-serif text-sm text-ink-600">{text}</p>
    </div>
  );
}
