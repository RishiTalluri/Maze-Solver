import React from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'ghost', size = 'md', loading, children, disabled, className = '', ...props
}) => {
  const sizes = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' };
  const variants = {
    primary: 'btn-primary', accent: 'btn-accent',
    ghost: 'btn-ghost', danger: 'btn-danger', outline: 'btn-outline',
  };
  return (
    <button disabled={disabled || loading}
      className={`${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string;
}
export const Input: React.FC<InputProps> = ({ label, error, hint, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="label">{label}</label>}
    <input className={`input ${error ? 'border-red-500/60 focus:border-red-400' : ''} ${className}`} {...props}/>
    {error && <p className="text-xs text-red-400">{error}</p>}
    {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string; }
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}/>
      <div className={`relative w-full ${maxWidth} glass-strong rounded-2xl overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-sm font-bold text-surface-50">{title}</h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-white/10 transition-all text-lg leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-10 w-10' }[size];
  return (
    <svg className={`animate-spin ${s} text-primary-500`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ icon?: string; title: string; description?: string }> = ({ icon='📭', title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-4xl mb-3 opacity-60">{icon}</div>
    <h3 className="text-surface-200 font-semibold mb-1">{title}</h3>
    {description && <p className="text-surface-400 text-sm max-w-xs">{description}</p>}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="section-title">{title}</h1>
      {subtitle && <p className="section-sub">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0 ml-4">{action}</div>}
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard: React.FC<{ label: string; value: string | number; icon: string; color?: string }> = ({ label, value, icon, color = '#EA580C' }) => (
  <div className="glass rounded-xl p-4 relative overflow-hidden">
    <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse at top right, ${color}33 0%, transparent 60%)` }}/>
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-2xl font-black font-mono" style={{ color }}>{value}</span>
      </div>
      <div className="text-xs font-semibold text-surface-400 uppercase tracking-wide">{label}</div>
    </div>
  </div>
);
