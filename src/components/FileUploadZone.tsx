import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PaperCard from '@/components/PaperCard';
import VintageButton from '@/components/VintageButton';
import VintageTag from '@/components/VintageTag';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';

interface FileUploadZoneProps {
  onUploadComplete?: (points: string[]) => void;
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'parsing' | 'complete';

const knowledgePointPools: Record<string, string[]> = {
  math: ['极限与连续', '导数与微分', '中值定理', '不定积分', '定积分应用', '微分方程', '多元函数微分', '重积分'],
  english: ['核心词汇Unit1-5', '虚拟语气', '定语从句', '阅读理解技巧', '写作模板', '翻译技巧', '时态语态'],
  linear: ['行列式计算', '矩阵运算', '向量空间', '特征值特征向量', '二次型', '线性方程组', '矩阵对角化'],
  programming: ['数据结构基础', '排序算法', '递归与分治', '动态规划', '面向对象', '链表操作', '二叉树遍历'],
  physics: ['牛顿运动定律', '动量守恒', '电磁感应', '波动光学', '热力学', '刚体转动', '静电场'],
};

const parsingSteps = [
  '识别章节结构...',
  '提取核心公式...',
  '标注重点考点...',
  '整理知识脉络...',
];

const subjectKeys = Object.keys(knowledgePointPools);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function HandDrawnProgressBar({ progress }: { progress: number }) {
  return (
    <div className="relative h-3 bg-paper-300/60 rounded-[2px] overflow-hidden"
      style={{ 
        borderBottom: '1px solid rgba(92,64,51,0.15)',
        boxShadow: 'inset 0 1px 2px rgba(92,64,51,0.08)'
      }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: progress === 100 ? 0.3 : 0.5, ease: 'easeOut' }}
        className="h-full relative"
        style={{ 
          backgroundColor: '#8B2500',
          opacity: 0.85,
          borderRadius: '1px',
        }}
      >
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q10 8 20 10 T40 10' stroke='rgba(255,255,255,0.15)' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: '0 50%',
        }} />
        <div className="absolute right-0 top-0 h-full w-[2px] bg-white/30 rounded-full" />
      </motion.div>
    </div>
  );
}

export default function FileUploadZone({ onUploadComplete }: FileUploadZoneProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [parsedPoints, setParsedPoints] = useState<string[]>([]);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const { addKnowledgePoints, subjects } = useAppStore();
  const { addToast } = useToastStore();

  const resetUpload = useCallback(() => {
    setUploadState('idle');
    setIsDragging(false);
    setUploadedFile(null);
    setProgress(0);
    setParsedPoints([]);
    setVisibleSteps([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    setUploadedFile({ name: file.name, size: file.size });
    setUploadState('uploading');
    setProgress(0);
    setVisibleSteps([]);

    const uploadDuration = 800;
    const uploadStartTime = Date.now();
    
    const uploadInterval = setInterval(() => {
      const elapsed = Date.now() - uploadStartTime;
      const newProgress = Math.min(100, (elapsed / uploadDuration) * 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(uploadInterval);
        setUploadState('parsing');
        
        let stepIndex = 0;
        const stepInterval = setInterval(() => {
          if (stepIndex < parsingSteps.length) {
            setVisibleSteps(prev => [...prev, stepIndex]);
            stepIndex++;
          } else {
            clearInterval(stepInterval);
            
            const randomSubject = subjectKeys[Math.floor(Math.random() * subjectKeys.length)];
            const pool = knowledgePointPools[randomSubject];
            const count = 5 + Math.floor(Math.random() * 4);
            const shuffled = [...pool].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(count, pool.length));
            
            setParsedPoints(selected);
            
            setTimeout(() => {
              setUploadState('complete');
            }, 400);
          }
        }, 350);
      }
    }, 30);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadState === 'idle') {
      setIsDragging(true);
      setUploadState('dragging');
    }
  }, [uploadState]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
      if (uploadState === 'dragging') {
        setUploadState('idle');
      }
    }
  }, [uploadState]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleButtonClick = useCallback(() => {
    if (uploadState === 'idle' || uploadState === 'dragging') {
      fileInputRef.current?.click();
    }
  }, [uploadState]);

  const handleStartPractice = useCallback(() => {
    if (parsedPoints.length > 0) {
      const defaultSubjectId = subjects.length > 0 ? subjects[0].id : 'math';
      const points = parsedPoints.map((name, i) => ({
        id: `kp-${Date.now()}-${i}`,
        subjectId: defaultSubjectId,
        name,
        mastery: Math.floor(Math.random() * 30) + 10,
      }));
      addKnowledgePoints(points);
      addToast('success', `资料解析成功，已生成${parsedPoints.length}个知识点`);
      onUploadComplete?.(parsedPoints);
      navigate('/ai-engine');
    }
  }, [parsedPoints, subjects, addKnowledgePoints, addToast, onUploadComplete, navigate]);

  const tagColors: Array<'seal' | 'ink' | 'gold' | 'green' | 'worn'> = ['seal', 'ink', 'gold', 'green', 'worn'];

  return (
    <PaperCard status="active" className="overflow-hidden">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative transition-all duration-300 ${
          uploadState === 'idle' || uploadState === 'dragging' ? 'cursor-pointer' : ''
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {(uploadState === 'idle' || uploadState === 'dragging') && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`p-8 md:p-10 rounded-[3px] border-2 border-dashed transition-all duration-300 ${
                uploadState === 'dragging'
                  ? 'border-seal bg-seal/10'
                  : 'border-ink-600/30 bg-paper-100/50 hover:border-seal/50 hover:bg-seal/5'
              }`}
              onClick={handleButtonClick}
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  animate={uploadState === 'dragging' ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="text-6xl mb-4"
                >
                  {uploadState === 'dragging' ? '📥' : '📂'}
                </motion.div>
                <h3 className="font-serif text-xl text-ink-800 font-semibold mb-2">
                  {uploadState === 'dragging' ? '松开即可上传 ✨' : '拖拽复习资料到这里'}
                </h3>
                <p className="font-serif text-sm text-ink-600 mb-6">
                  支持 PDF / Word / 图片 / TXT
                </p>
                <VintageButton variant="stamp" size="lg" onClick={(e) => { e.stopPropagation(); handleButtonClick(); }}>
                  选择文件
                </VintageButton>
              </div>
            </motion.div>
          )}

          {uploadState === 'uploading' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 md:p-8"
            >
              <div className="max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-ink-800 font-medium truncate">
                      {uploadedFile?.name}
                    </p>
                    <p className="font-serif text-xs text-ink-500">
                      {uploadedFile && formatFileSize(uploadedFile.size)} · 上传中...
                    </p>
                  </div>
                </div>

                <motion.div
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ transformOrigin: 'top' }}
                  className="bg-paper-50 border border-ink-600/15 rounded-sm p-4 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-paper-200/50 to-transparent" />
                  <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-paper-300 shadow-inner" />
                  <div className="mt-4 space-y-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ 
                          width: `${60 + Math.random() * 35}%`, 
                          opacity: 0.4 + (progress / 100) * 0.6 
                        }}
                        transition={{ duration: 0.4 + i * 0.15, delay: i * 0.1 }}
                        className="h-2 bg-ink-600/20 rounded-[1px]"
                      />
                    ))}
                  </div>
                </motion.div>

                <div className="mt-4">
                  <HandDrawnProgressBar progress={progress} />
                  <p className="font-serif text-xs text-ink-500 mt-2 text-right tabular-nums">
                    {Math.round(progress)}%
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {uploadState === 'parsing' && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 md:p-8"
            >
              <div className="max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-3xl"
                  >
                    ✒️
                  </motion.span>
                  <div className="flex-1">
                    <p className="font-serif text-lg text-ink-800 font-semibold">
                      AI 正在解析知识点...
                    </p>
                    <p className="font-serif text-xs text-ink-500">
                      墨迹晕染中，请稍候
                    </p>
                  </div>
                </div>

                <div className="bg-paper-50 border border-ink-600/15 rounded-sm p-5 shadow-sm relative overflow-hidden min-h-[140px]">
                  <div className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(92,64,51,0.08) 27px, rgba(92,64,51,0.08) 28px)',
                    }}
                  />
                  
                  <div className="space-y-3 relative z-[1]">
                    <AnimatePresence>
                      {parsingSteps.map((step, i) => (
                        visibleSteps.includes(i) && (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, filter: 'blur(4px)', x: -10 }}
                            animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="flex items-center gap-2"
                          >
                            <span className="text-seal text-sm">✦</span>
                            <span className="font-serif text-sm text-ink-700">{step}</span>
                          </motion.div>
                        )
                      ))}
                    </AnimatePresence>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      className="flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-ink-600/30" />
                      <motion.span
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="font-serif text-sm text-ink-500"
                      >
                        ...
                      </motion.span>
                    </motion.div>
                  </div>
                </div>

                <div className="mt-4">
                  <HandDrawnProgressBar progress={100} />
                </div>
              </div>
            </motion.div>
          )}

          {uploadState === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="p-6 md:p-8"
            >
              <div className="text-center mb-5">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: -5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="inline-block mb-3"
                >
                  <span className="text-5xl">✨</span>
                </motion.div>
                <h3 className="font-serif text-xl text-ink-800 font-semibold mb-1">
                  解析完成！
                </h3>
                <p className="font-serif text-sm text-ink-600">
                  从资料中提取了 <span className="text-seal font-semibold">{parsedPoints.length}</span> 个核心知识点
                </p>
              </div>

              <div className="bg-paper-100/50 border border-ink-600/10 rounded-sm p-4 md:p-5 mb-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  {parsedPoints.map((point, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 500, 
                        damping: 20,
                        delay: 0.1 + i * 0.08
                      }}
                    >
                      <VintageTag color={tagColors[i % tagColors.length]}>
                        {point}
                      </VintageTag>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <VintageButton variant="stamp" size="lg" onClick={handleStartPractice}>
                  开始练习
                </VintageButton>
                <VintageButton variant="ghost" size="md" onClick={resetUpload}>
                  重新上传
                </VintageButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PaperCard>
  );
}
