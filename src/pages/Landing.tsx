import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, BarChart3, FileText } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-[#111111] antialiased">
      {/* ═══════════════════════ Navigation ═══════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#EAEAEA]">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[4px] bg-[#111111] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">UF</span>
            </div>
            <span className="text-[13px] font-semibold text-[#111111] tracking-tight">UniFlow</span>
          </div>
          <nav className="flex items-center gap-8">
            <a href="#features" className="text-[13px] text-[#666666] hover:text-[#111111] transition-colors duration-150">Features</a>
            <a href="#pricing" className="text-[13px] text-[#666666] hover:text-[#111111] transition-colors duration-150">Pricing</a>
            <a href="#docs" className="text-[13px] text-[#666666] hover:text-[#111111] transition-colors duration-150">Documentation</a>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[13px] font-medium text-[#111111] border border-[#EAEAEA] rounded-[4px] px-4 py-1.5 hover:border-[#111111] transition-colors duration-150"
            >
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* ═══════════════════════ Hero ═══════════════════════ */}
      <section className="pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-[56px] font-bold leading-[1.1] tracking-[-0.03em] text-[#111111] mb-6">
            Retain what matters.
            <br />
            Master your exams.
          </h1>
          <p className="text-[17px] text-[#666666] leading-[1.7] max-w-[540px] mx-auto mb-10">
            A minimalist active recall and structured review system designed for rigorous academic preparation. Zero distractions, pure focus.
          </p>
          <div className="flex items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[14px] font-medium text-white bg-[#111111] rounded-[5px] px-6 py-2.5 hover:bg-[#2a2a2a] transition-colors duration-150"
            >
              Get Started Free
            </button>
            <button className="text-[14px] font-medium text-[#666666] hover:text-[#111111] transition-colors duration-150 flex items-center gap-1.5">
              Watch brief demo
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          </div>

          {/* Interface Preview Mockup */}
          <div className="max-w-[860px] mx-auto rounded-[6px] border border-[#EAEAEA] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {/* Mockup header bar */}
            <div className="flex items-center gap-2 px-4 h-10 bg-[#F9F9F9] border-b border-[#EAEAEA]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ECECEC]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ECECEC]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ECECEC]" />
            </div>

            {/* Mockup body - simulated dashboard */}
            <div className="flex h-[420px] bg-white">
              {/* Sidebar */}
              <div className="w-[180px] border-r border-[#EAEAEA] bg-[#FCFCFC] p-3 flex flex-col gap-1">
                <div className="h-6 w-24 bg-[#111111] rounded-[3px] mb-3" />
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-[4px] ${i === 0 ? 'bg-[#EEF4FF]' : ''}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-[3px] ${i === 0 ? 'bg-[#2383E2]' : 'bg-[#E5E5E5]'}`} />
                    <div className={`h-2 rounded-[2px] ${i === 0 ? 'w-12 bg-[#2383E2]' : 'w-14 bg-[#E5E5E5]'}`} />
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-28 bg-[#111111] rounded-[2px] mb-1.5" />
                    <div className="h-2.5 w-40 bg-[#E5E5E5] rounded-[2px]" />
                  </div>
                  <div className="h-7 w-24 bg-[#111111] rounded-[4px]" />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mt-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border border-[#EAEAEA] rounded-[4px] p-3">
                      <div className="h-2 w-12 bg-[#E5E5E5] rounded-[2px] mb-2" />
                      <div className="h-5 w-16 bg-[#111111] rounded-[2px]" />
                    </div>
                  ))}
                </div>

                {/* Content area */}
                <div className="flex-1 border border-[#EAEAEA] rounded-[4px] p-3 mt-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-3 w-3 rounded-[2px] bg-[#2383E2]" />
                    <div className="h-3 w-20 bg-[#111111] rounded-[2px]" />
                  </div>
                  {/* Progress bars */}
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 mb-2">
                      <div className="h-2.5 w-20 bg-[#E5E5E5] rounded-[2px]" />
                      <div className="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#111111] rounded-full"
                          style={{ width: `${80 - i * 18}%` }}
                        />
                      </div>
                      <div className="h-2 w-6 bg-[#E5E5E5] rounded-[2px]" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right panel */}
              <div className="w-[140px] border-l border-[#EAEAEA] bg-[#FCFCFC] p-3">
                <div className="h-2.5 w-14 bg-[#E5E5E5] rounded-[2px] mb-3" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-[2px] bg-[#E5E5E5]" />
                    <div className="h-2 w-16 bg-[#F0F0F0] rounded-[2px]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ Features ═══════════════════════ */}
      <section id="features" className="py-32 px-8 bg-[#F9F9F9]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-[0.12em] mb-3">How it works</p>
            <h2 className="text-[32px] font-bold text-[#111111] tracking-[-0.02em] leading-[1.25]">
              A complete review workflow,<br />stripped to its essence.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-0 divide-x divide-[#EAEAEA]">
            {/* Feature 1 */}
            <div className="pr-12">
              <div className="mb-6">
                <Zap size={20} strokeWidth={1.5} className="text-[#111111]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#111111] mb-3 tracking-[-0.01em]">
                Active Recall Engine
              </h3>
              <p className="text-[13px] text-[#666666] leading-[1.7] mb-6">
                Evidence-based flashcard and quiz system that forces your brain to retrieve information, not just recognize it. Spaced repetition built in.
              </p>
              <div className="border border-[#EAEAEA] rounded-[4px] overflow-hidden">
                <div className="px-3 py-2 bg-[#FCFCFC] border-b border-[#EAEAEA] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#666666]">Flashcard Preview</span>
                  <span className="text-[11px] text-[#999999]">1 / 24</span>
                </div>
                <div className="p-4 bg-white flex flex-col items-center justify-center min-h-[80px]">
                  <p className="text-[13px] font-medium text-[#111111] mb-2">What is the Feynman Technique?</p>
                  <div className="w-full h-[1px] bg-[#EAEAEA] my-2" />
                  <p className="text-[12px] text-[#999999]">Click to reveal answer</p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="px-12">
              <div className="mb-6">
                <BarChart3 size={20} strokeWidth={1.5} className="text-[#111111]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#111111] mb-3 tracking-[-0.01em]">
                Structured Revision Tracking
              </h3>
              <p className="text-[13px] text-[#666666] leading-[1.7] mb-6">
                Track every review session across intervals. Data-dense tables show exactly what to review today, tomorrow, and next week.
              </p>
              <div className="border border-[#EAEAEA] rounded-[4px] overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-[#FCFCFC] border-b border-[#EAEAEA]">
                      <th className="text-left px-3 py-2 font-medium text-[#666666]">Topic</th>
                      <th className="text-left px-3 py-2 font-medium text-[#666666]">Interval</th>
                      <th className="text-left px-3 py-2 font-medium text-[#666666]">Next</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { topic: 'Cell Biology', interval: '1 day', next: 'Today' },
                      { topic: 'Organic Chemistry', interval: '3 days', next: 'Jun 15' },
                      { topic: 'Linear Algebra', interval: '7 days', next: 'Jun 19' },
                    ].map((row, i) => (
                      <tr key={i} className={i < 2 ? 'border-b border-[#FAFAFA]' : ''}>
                        <td className="px-3 py-2 text-[#111111]">{row.topic}</td>
                        <td className="px-3 py-2 text-[#666666]">{row.interval}</td>
                        <td className="px-3 py-2 text-[#666666]">{row.next}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="pl-12">
              <div className="mb-6">
                <FileText size={20} strokeWidth={1.5} className="text-[#111111]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#111111] mb-3 tracking-[-0.01em]">
                Seamless Document Sync
              </h3>
              <p className="text-[13px] text-[#666666] leading-[1.7] mb-6">
                Upload lecture notes, PDFs, and markdown files. AI extracts key concepts and structures them into reviewable outlines automatically.
              </p>
              <div className="border border-[#EAEAEA] rounded-[4px] overflow-hidden">
                <div className="px-3 py-2 bg-[#FCFCFC] border-b border-[#EAEAEA]">
                  <span className="text-[11px] font-medium text-[#666666]">Document Outline</span>
                </div>
                <div className="p-3 space-y-1.5">
                  {[
                    { label: '1. Introduction', indent: 0, active: false },
                    { label: '2. Key Concepts', indent: 0, active: false },
                    { label: '2.1 Definition', indent: 1, active: true },
                    { label: '2.2 Examples', indent: 1, active: false },
                    { label: '3. Summary', indent: 0, active: false },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`text-[11px] py-0.5 px-2 rounded-[3px] transition-colors ${
                        item.active
                          ? 'bg-[#EEF4FF] text-[#2383E2]'
                          : 'text-[#666666]'
                      }`}
                      style={{ paddingLeft: `${12 + item.indent * 16}px` }}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA ═══════════════════════ */}
      <section className="py-32 px-8 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[32px] font-bold text-[#111111] tracking-[-0.02em] leading-[1.25] mb-4">
            Ready to study smarter?
          </h2>
          <p className="text-[15px] text-[#666666] leading-[1.7] mb-8">
            Join thousands of students who transformed their exam preparation with structured active recall.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-[14px] font-medium text-white bg-[#111111] rounded-[5px] px-8 py-3 hover:bg-[#2a2a2a] transition-colors duration-150"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* ═══════════════════════ Footer ═══════════════════════ */}
      <footer className="border-t border-[#EAEAEA] py-8 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-[12px] text-[#999999]">UniFlow</span>
            <a href="#features" className="text-[12px] text-[#999999] hover:text-[#666666] transition-colors">Features</a>
            <a href="#pricing" className="text-[12px] text-[#999999] hover:text-[#666666] transition-colors">Pricing</a>
            <a href="#docs" className="text-[12px] text-[#999999] hover:text-[#666666] transition-colors">Documentation</a>
          </div>
          <span className="text-[12px] text-[#BBBBBB]">2026 UniFlow. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}