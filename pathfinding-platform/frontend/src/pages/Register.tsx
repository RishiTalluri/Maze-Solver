import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui';

export const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({ username:'', email:'', password:'', confirm:'' });
  const [error, setError] = useState('');
  const { register, login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    try { await register(form.username, form.email, form.password); await login(form.email, form.password); navigate('/dashboard'); }
    catch (err: any) { setError(err.response?.data?.error || 'Registration failed'); }
  };

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f=>({...f,[k]:e.target.value}));

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ background:'linear-gradient(135deg, #1E1E1E 0%, #242424 50%, #1a120d 100%)' }}>
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none"/>
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background:'linear-gradient(135deg,#FF6B35,#b93f16)' }}>
            <span className="text-white font-black">PF</span>
          </Link>
          <h1 className="text-2xl font-bold text-surface-50">Create account</h1>
          <p className="text-surface-400 text-sm mt-1">Start solving mazes today — it's free</p>
        </div>

        <div className="glass-strong rounded-2xl p-6 space-y-4">
          {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{error}</div>}
          <Input label="Username" value={form.username} onChange={setField('username')} placeholder="cooluser" required/>
          <Input label="Email" type="email" value={form.email} onChange={setField('email')} placeholder="you@example.com" required/>
          <Input label="Password" type="password" value={form.password} onChange={setField('password')} placeholder="Min 6 characters" required/>
          <Input label="Confirm password" type="password" value={form.confirm} onChange={setField('confirm')} placeholder="••••••••" required/>
          <button onClick={handleSubmit as any} disabled={isLoading} className="w-full btn-lg btn-primary mt-1">
            {isLoading ? 'Creating...' : 'Create Account →'}
          </button>
        </div>

        <p className="text-center text-surface-500 text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
