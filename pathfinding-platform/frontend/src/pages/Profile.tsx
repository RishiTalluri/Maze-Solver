import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { Input, SectionHeader } from '../components/ui';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError(''); setPwSuccess('');
    if (pwForm.new_password !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (pwForm.new_password.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await authApi.changePassword(pwForm.old_password, pwForm.new_password);
      setPwSuccess('Password updated successfully');
      setPwForm({ old_password: '', new_password: '', confirm: '' });
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Failed to update password');
    } finally { setSaving(false); }
  };

  const setField = (k: keyof typeof pwForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPwForm(f => ({ ...f, [k]: e.target.value }));

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <SectionHeader title="Profile" subtitle="Manage your account settings" />

      {/* Profile card */}
      <div className="glass rounded-2xl p-5">
        <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-4">Account Info</p>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #EA580C, #9a3412)', boxShadow: '0 0 20px rgba(234,88,12,0.3)' }}>
            <span className="text-white text-2xl font-black">{user.username[0].toUpperCase()}</span>
          </div>
          <div>
            <div className="font-bold text-surface-50 text-lg">{user.username}</div>
            <div className="text-surface-400 text-sm">{user.email}</div>
            <span className={`inline-flex mt-1.5 ${user.role === 'admin' ? 'badge-orange' : 'badge-green'} text-[10px]`}>
              {user.role.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/6">
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] text-surface-500 font-medium mb-1">Member since</div>
            <div className="text-sm font-semibold text-surface-200 font-mono">
              {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] text-surface-500 font-medium mb-1">Last login</div>
            <div className="text-sm font-semibold text-surface-200 font-mono">
              {user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="glass rounded-2xl p-5">
        <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-4">Change Password</p>
        {pwSuccess && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-accent-500/10 border border-accent-500/25 text-accent-400 text-sm font-medium">
            ✓ {pwSuccess}
          </div>
        )}
        {pwError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{pwError}</div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input label="Current password" type="password" value={pwForm.old_password}
            onChange={setField('old_password')} placeholder="••••••••" required />
          <Input label="New password" type="password" value={pwForm.new_password}
            onChange={setField('new_password')} placeholder="Min 6 characters" required
            hint="Must be at least 6 characters" />
          <Input label="Confirm new password" type="password" value={pwForm.confirm}
            onChange={setField('confirm')} placeholder="••••••••" required />
          <button type="submit" disabled={saving} className="btn-md btn-primary">
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl p-5 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.04)' }}>
        <p className="text-[10px] font-bold text-red-400/70 uppercase tracking-widest mb-2">Danger Zone</p>
        <p className="text-sm text-surface-500 mb-4">Permanently delete your account and all data. This cannot be undone.</p>
        <button className="btn-sm btn-danger" onClick={() => alert('Contact admin to delete your account')}>
          Delete Account
        </button>
      </div>
    </div>
  );
};
