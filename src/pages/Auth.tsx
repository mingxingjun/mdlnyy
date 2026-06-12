import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Github } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';

/* ─── Types ─── */
type Mode = 'login' | 'register';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/* ─── Agent Nodes Data ─── */
const agentNodes = [
  { id: 1, x: 30, y: 25, color: '#6C7CFF', size: 8 },
  { id: 2, x: 65, y: 18, color: '#7C5CFF', size: 6 },
  { id: 3, x: 78, y: 50, color: '#4FD1C5', size: 7 },
  { id: 4, x: 55, y: 72, color: '#34d399', size: 6 },
  { id: 5, x: 22, y: 65, color: '#fbbf24', size: 7 },
  { id: 6, x: 48, y: 45, color: '#6C7CFF', size: 5 },
];

const agentLines = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  { from: 5, to: 1 },
  { from: 6, to: 1 },
  { from: 6, to: 3 },
  { from: 6, to: 5 },
];

/* ─── Validation ─── */
function validate(mode: Mode, data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (mode === 'register' && !data.name.trim()) {
    errors.name = '请输入用户名';
  }
  if (!data.email.includes('@')) {
    errors.email = '请输入有效的邮箱地址';
  }
  if (data.password.length < 6) {
    errors.password = '密码至少需要 6 个字符';
  }
  if (mode === 'register' && data.confirmPassword !== data.password) {
    errors.confirmPassword = '两次输入的密码不一致';
  }
  return errors;
}

/* ─── Floating Dot Component ─── */
function FloatingDot({ x, y, color, size, delay }: { x: number; y: number; color: string; size: number; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2}px ${color}60, 0 0 ${size * 4}px ${color}30`,
      }}
      animate={{
        y: [0, -8, 4, -6, 0],
        x: [0, 4, -3, 5, 0],
      }}
      transition={{
        duration: 6 + delay,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: delay * 0.5,
      }}
    />
  );
}

/* ─── Agent Visualization ─── */
function AgentVisualization() {
  return (
    <div className="relative w-full max-w-[280px] aspect-square mx-auto mt-10">
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.2 }}>
        {agentLines.map((line) => {
          const from = agentNodes.find((n) => n.id === line.from)!;
          const to = agentNodes.find((n) => n.id === line.to)!;
          return (
            <line
              key={`${line.from}-${line.to}`}
              x1={`${from.x}%`}
              y1={`${from.y}%`}
              x2={`${to.x}%`}
              y2={`${to.y}%`}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      {/* Dots */}
      {agentNodes.map((node, i) => (
        <FloatingDot
          key={node.id}
          x={node.x}
          y={node.y}
          color={node.color}
          size={node.size}
          delay={i * 0.8}
        />
      ))}
    </div>
  );
}

/* ─── Input Field Component ─── */
function InputField({
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  rightElement,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <div>
      <div className="relative">
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5c5f73]" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#1a1b2e] border border-white/[0.06] rounded-[12px] px-4 py-3 pl-11 text-[#e8eaf0] placeholder-[#5c5f73] text-sm outline-none transition-all duration-200 focus:border-[#6C7CFF] focus:shadow-[0_0_0_3px_rgba(108,124,255,0.15)]"
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-[#f87171] text-xs mt-1.5 ml-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Social Button ─── */
function SocialButton({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number | string }>; label: string }) {
  return (
    <button
      type="button"
      className="flex-1 flex items-center justify-center gap-2 border border-white/[0.08] rounded-[12px] py-2.5 text-[#8b8fa3] text-sm hover:border-white/[0.15] hover:text-[#e8eaf0] transition-all duration-200"
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   AUTH PAGE
   ═══════════════════════════════════════════════════════ */
export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (submitted) {
      const newData = { ...formData, [field]: value };
      setErrors(validate(mode, newData));
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setErrors({});
    setSubmitted(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const newErrors = validate(mode, formData);
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      useAppStore.getState().setCurrentUser(formData.name || formData.email.split('@')[0]);
      useToastStore.getState().addToast('success', mode === 'login' ? '登录成功，欢迎回来！' : '注册成功！');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ═══════════════════════ Left Panel ═══════════════════════ */}
      <div className="hidden lg:flex w-[40%] bg-[#0a0b14] relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Background radial gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 80%, rgba(108,124,255,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(124,92,255,0.08) 0%, transparent 50%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-14 h-14 rounded-[10px] bg-gradient-to-br from-[#6C7CFF] to-[#7C5CFF] flex items-center justify-center shadow-[0_0_24px_rgba(108,124,255,0.3)] mb-6"
          >
            <span className="text-white text-[18px] font-bold tracking-tight">UF</span>
          </motion.div>

          {/* Brand name */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[28px] font-bold text-[#e8eaf0] mb-3"
          >
            UniFlow
          </motion.h1>

          {/* Slogan */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[18px] text-[#8b8fa3] leading-relaxed"
          >
            你的期末复习，<br />被多 Agent 接管了。
          </motion.p>

          {/* Agent visualization */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full"
          >
            <AgentVisualization />
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════ Right Panel ═══════════════════════ */}
      <div className="flex-1 bg-[#0e0f1a] flex items-center justify-center p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-[#12131f]/80 backdrop-blur-xl border border-white/[0.06] rounded-[24px] p-6 sm:p-8 w-full max-w-[420px] mx-4 sm:mx-auto"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#6C7CFF] to-[#7C5CFF] flex items-center justify-center shadow-[0_0_16px_rgba(108,124,255,0.3)]">
              <span className="text-white text-[12px] font-bold tracking-tight">UF</span>
            </div>
            <span className="text-[18px] font-bold text-[#e8eaf0]">UniFlow</span>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-6 mb-8">
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => switchMode(tab)}
                className="relative pb-2.5 text-[16px] font-medium transition-colors duration-200"
                style={{ color: mode === tab ? '#e8eaf0' : '#5c5f73' }}
              >
                {tab === 'login' ? '登录' : '注册'}
                {mode === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{
                      background: 'linear-gradient(to right, #6C7CFF, #7C5CFF)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Form content */}
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <InputField
                  icon={Mail}
                  type="email"
                  placeholder="邮箱地址"
                  value={formData.email}
                  onChange={updateField('email')}
                  error={errors.email}
                />
                <InputField
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="密码"
                  value={formData.password}
                  onChange={updateField('password')}
                  error={errors.password}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#5c5f73] hover:text-[#8b8fa3] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />

                {/* Forgot password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-[#6C7CFF] text-sm hover:text-[#7C5CFF] transition-colors"
                  >
                    忘记密码?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#6C7CFF] to-[#7C5CFF] text-white rounded-[12px] py-3 font-medium shadow-[0_4px_16px_rgba(108,124,255,0.25)] hover:shadow-[0_4px_24px_rgba(108,124,255,0.35)] transition-shadow duration-300 text-sm"
                >
                  登录
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-[1px] bg-white/[0.06]" />
                  <span className="text-[#5c5f73] text-xs">或</span>
                  <div className="flex-1 h-[1px] bg-white/[0.06]" />
                </div>

                {/* Social login */}
                <div className="flex gap-3">
                  <SocialButton icon={Github} label="GitHub" />
                  <SocialButton
                    icon={() => (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    label="Google"
                  />
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <InputField
                  icon={User}
                  type="text"
                  placeholder="用户名"
                  value={formData.name}
                  onChange={updateField('name')}
                  error={errors.name}
                />
                <InputField
                  icon={Mail}
                  type="email"
                  placeholder="邮箱地址"
                  value={formData.email}
                  onChange={updateField('email')}
                  error={errors.email}
                />
                <InputField
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="密码"
                  value={formData.password}
                  onChange={updateField('password')}
                  error={errors.password}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#5c5f73] hover:text-[#8b8fa3] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <InputField
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="确认密码"
                  value={formData.confirmPassword}
                  onChange={updateField('confirmPassword')}
                  error={errors.confirmPassword}
                />

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#6C7CFF] to-[#7C5CFF] text-white rounded-[12px] py-3 font-medium shadow-[0_4px_16px_rgba(108,124,255,0.25)] hover:shadow-[0_4px_24px_rgba(108,124,255,0.35)] transition-shadow duration-300 text-sm"
                >
                  创建账户
                </button>

                {/* Switch to login */}
                <p className="text-center text-sm text-[#5c5f73]">
                  已有账户？{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-[#6C7CFF] hover:text-[#7C5CFF] transition-colors"
                  >
                    登录
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
