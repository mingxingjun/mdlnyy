import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, BarChart3, FileText } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-[#111111] antialiased">
      {/* ═══════════════════════ 导航栏 ═══════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#EAEAEA]">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[4px] bg-[#111111] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">UF</span>
            </div>
            <span className="text-[13px] font-semibold text-[#111111] tracking-tight">UniFlow</span>
          </div>
          <nav className="flex items-center gap-8">
            <a href="#features" className="text-[13px] text-[#666666] hover:text-[#111111] transition-colors duration-150">功能</a>
            <a href="#pricing" className="text-[13px] text-[#666666] hover:text-[#111111] transition-colors duration-150">价格</a>
            <a href="#docs" className="text-[13px] text-[#666666] hover:text-[#111111] transition-colors duration-150">文档</a>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[13px] font-medium text-[#111111] border border-[#EAEAEA] rounded-[4px] px-4 py-1.5 hover:border-[#111111] transition-colors duration-150"
            >
              登录
            </button>
          </nav>
        </div>
      </header>

      {/* ═══════════════════════ Hero ═══════════════════════ */}
      <section className="pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-[52px] font-bold leading-[1.15] tracking-[-0.03em] text-[#111111] mb-6">
            留住真正重要的。
            <br />
            掌握你的每一场考试。
          </h1>
          <p className="text-[17px] text-[#666666] leading-[1.7] max-w-[520px] mx-auto mb-10">
            极简主动回忆与结构化复习系统，专为严谨的学术备考而设计。零干扰，纯专注。
          </p>
          <div className="flex items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[14px] font-medium text-white bg-[#111111] rounded-[5px] px-6 py-2.5 hover:bg-[#2a2a2a] transition-colors duration-150"
            >
              免费开始
            </button>
            <button className="text-[14px] font-medium text-[#666666] hover:text-[#111111] transition-colors duration-150 flex items-center gap-1.5">
              观看演示
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          </div>

          {/* 界面预览 */}
          <div className="max-w-[860px] mx-auto rounded-[6px] border border-[#EAEAEA] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 px-4 h-10 bg-[#F9F9F9] border-b border-[#EAEAEA]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ECECEC]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ECECEC]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ECECEC]" />
            </div>

            <div className="flex h-[420px] bg-white">
              {/* 侧边栏 */}
              <div className="w-[180px] border-r border-[#EAEAEA] bg-[#FCFCFC] p-3 flex flex-col gap-1">
                <div className="h-6 w-20 bg-[#111111] rounded-[3px] mb-3" />
                {['仪表盘', 'AI 冲刺核', '我的笔记', '沉浸流'].map((label, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-[4px] ${i === 0 ? 'bg-[#EEF4FF]' : ''}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-[3px] ${i === 0 ? 'bg-[#2383E2]' : 'bg-[#E5E5E5]'}`} />
                    <div className={`h-2 rounded-[2px] ${i === 0 ? 'w-12 bg-[#2383E2]' : 'w-14 bg-[#E5E5E5]'}`} />
                  </div>
                ))}
              </div>

              {/* 主内容 */}
              <div className="flex-1 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-24 bg-[#111111] rounded-[2px] mb-1.5" />
                    <div className="h-2.5 w-36 bg-[#E5E5E5] rounded-[2px]" />
                  </div>
                  <div className="h-7 w-20 bg-[#111111] rounded-[4px]" />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border border-[#EAEAEA] rounded-[4px] p-3">
                      <div className="h-2 w-10 bg-[#E5E5E5] rounded-[2px] mb-2" />
                      <div className="h-5 w-14 bg-[#111111] rounded-[2px]" />
                    </div>
                  ))}
                </div>

                <div className="flex-1 border border-[#EAEAEA] rounded-[4px] p-3 mt-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-3 w-3 rounded-[2px] bg-[#2383E2]" />
                    <div className="h-3 w-16 bg-[#111111] rounded-[2px]" />
                  </div>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 mb-2">
                      <div className="h-2.5 w-16 bg-[#E5E5E5] rounded-[2px]" />
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

              {/* 右侧面板 */}
              <div className="w-[140px] border-l border-[#EAEAEA] bg-[#FCFCFC] p-3">
                <div className="h-2.5 w-12 bg-[#E5E5E5] rounded-[2px] mb-3" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-[2px] bg-[#E5E5E5]" />
                    <div className="h-2 w-14 bg-[#F0F0F0] rounded-[2px]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 功能 ═══════════════════════ */}
      <section id="features" className="py-32 px-8 bg-[#F9F9F9]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-[0.12em] mb-3">工作方式</p>
            <h2 className="text-[32px] font-bold text-[#111111] tracking-[-0.02em] leading-[1.25]">
              完整的复习工作流，<br />只保留最本质的。
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-0 divide-x divide-[#EAEAEA]">
            {/* 功能 1 */}
            <div className="pr-12">
              <div className="mb-6">
                <Zap size={20} strokeWidth={1.5} className="text-[#111111]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#111111] mb-3 tracking-[-0.01em]">
                主动回忆引擎
              </h3>
              <p className="text-[13px] text-[#666666] leading-[1.7] mb-6">
                基于实证的闪卡与测验系统，迫使大脑主动提取信息而非简单识别。内置间隔重复算法。
              </p>
              <div className="border border-[#EAEAEA] rounded-[4px] overflow-hidden">
                <div className="px-3 py-2 bg-[#FCFCFC] border-b border-[#EAEAEA] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#666666]">闪卡预览</span>
                  <span className="text-[11px] text-[#999999]">1 / 24</span>
                </div>
                <div className="p-4 bg-white flex flex-col items-center justify-center min-h-[80px]">
                  <p className="text-[13px] font-medium text-[#111111] mb-2">费曼技巧的核心是什么？</p>
                  <div className="w-full h-[1px] bg-[#EAEAEA] my-2" />
                  <p className="text-[12px] text-[#999999]">点击翻转查看答案</p>
                </div>
              </div>
            </div>

            {/* 功能 2 */}
            <div className="px-12">
              <div className="mb-6">
                <BarChart3 size={20} strokeWidth={1.5} className="text-[#111111]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#111111] mb-3 tracking-[-0.01em]">
                结构化复习追踪
              </h3>
              <p className="text-[13px] text-[#666666] leading-[1.7] mb-6">
                跨间隔追踪每一次复习。高密度数据表格精确展示今天、明天和下周需要复习的内容。
              </p>
              <div className="border border-[#EAEAEA] rounded-[4px] overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-[#FCFCFC] border-b border-[#EAEAEA]">
                      <th className="text-left px-3 py-2 font-medium text-[#666666]">科目</th>
                      <th className="text-left px-3 py-2 font-medium text-[#666666]">间隔</th>
                      <th className="text-left px-3 py-2 font-medium text-[#666666]">下次</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { topic: '细胞生物学', interval: '1 天', next: '今天' },
                      { topic: '有机化学', interval: '3 天', next: '6月15日' },
                      { topic: '线性代数', interval: '7 天', next: '6月19日' },
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

            {/* 功能 3 */}
            <div className="pl-12">
              <div className="mb-6">
                <FileText size={20} strokeWidth={1.5} className="text-[#111111]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#111111] mb-3 tracking-[-0.01em]">
                无缝文档同步
              </h3>
              <p className="text-[13px] text-[#666666] leading-[1.7] mb-6">
                上传课件笔记、PDF 和 Markdown 文件。AI 自动提取核心概念，结构化为可复习的大纲。
              </p>
              <div className="border border-[#EAEAEA] rounded-[4px] overflow-hidden">
                <div className="px-3 py-2 bg-[#FCFCFC] border-b border-[#EAEAEA]">
                  <span className="text-[11px] font-medium text-[#666666]">文档大纲</span>
                </div>
                <div className="p-3 space-y-1.5">
                  {[
                    { label: '1. 引言', indent: 0, active: false },
                    { label: '2. 核心概念', indent: 0, active: false },
                    { label: '2.1 定义', indent: 1, active: true },
                    { label: '2.2 示例', indent: 1, active: false },
                    { label: '3. 总结', indent: 0, active: false },
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
            准备好更聪明地复习了吗？
          </h2>
          <p className="text-[15px] text-[#666666] leading-[1.7] mb-8">
            加入数千名通过结构化主动回忆改变备考方式的学生。
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-[14px] font-medium text-white bg-[#111111] rounded-[5px] px-8 py-3 hover:bg-[#2a2a2a] transition-colors duration-150"
          >
            免费开始
          </button>
        </div>
      </section>

      {/* ═══════════════════════ 页脚 ═══════════════════════ */}
      <footer className="border-t border-[#EAEAEA] py-8 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-[12px] text-[#999999]">UniFlow</span>
            <a href="#features" className="text-[12px] text-[#999999] hover:text-[#666666] transition-colors">功能</a>
            <a href="#pricing" className="text-[12px] text-[#999999] hover:text-[#666666] transition-colors">价格</a>
            <a href="#docs" className="text-[12px] text-[#999999] hover:text-[#666666] transition-colors">文档</a>
          </div>
          <span className="text-[12px] text-[#BBBBBB]">2026 UniFlow. 保留所有权利。</span>
        </div>
      </footer>
    </div>
  );
}