import React, { useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import useAuthStore from '../store/authStore';

export default function Profile() {
  const { user, updateProfile } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await updateProfile(form); toast.success('Profile updated!'); }
    catch { toast.error('Update failed'); }
    setSaving(false);
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    setSaving(true);
    try {
      await api.put('/auth/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password updated!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-orange-400 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1 shadow-sm border border-gray-100 w-fit">
          {[['profile', User, 'Profile'], ['security', Lock, 'Security']].map(([t, Icon, l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />{l}
            </button>
          ))}
        </div>
        <div className="card p-6">
          {tab === 'profile' && (
            <form onSubmit={handleProfile}>
              <h2 className="font-semibold text-gray-900 mb-5">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div><label className="label">Full Name</label><input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input" /></div>
                <div><label className="label">Phone</label><input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="input" /></div>
                <div className="sm:col-span-2"><label className="label">Email</label><input value={user?.email} className="input bg-gray-50" disabled /></div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary px-6"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}</button>
            </form>
          )}
          {tab === 'security' && (
            <form onSubmit={handlePassword}>
              <h2 className="font-semibold text-gray-900 mb-5">Change Password</h2>
              <div className="space-y-4 max-w-md">
                {[['currentPassword','Current Password'],['newPassword','New Password'],['confirmPassword','Confirm Password']].map(([f,l]) => (
                  <div key={f}><label className="label">{l}</label><input type="password" value={pwForm[f]} onChange={e => setPwForm(p => ({...p, [f]: e.target.value}))} className="input" required /></div>
                ))}
              </div>
              <button type="submit" disabled={saving} className="btn-primary mt-6 px-6"><Lock className="w-4 h-4" />{saving ? 'Updating...' : 'Update Password'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
