import React, { useEffect, useState } from 'react';
import { Search, Shield, User, UserX, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      const { data } = await api.get(`/users?${params}`);
      setUsers(data.users);
      setTotal(data.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/users/stats');
      setStats(data);
    } catch {}
  };

  useEffect(() => { fetchUsers(); fetchStats(); }, [page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchUsers(); };

  const handleToggleActive = async (userId, currentState, name) => {
    setUpdating(userId);
    try {
      await api.put(`/users/${userId}`, { isActive: !currentState });
      toast.success(`${name} ${!currentState ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
    finally { setUpdating(null); }
  };

  const handleRoleChange = async (userId, newRole, name) => {
    if (!window.confirm(`Change ${name}'s role to "${newRole}"?`)) return;
    setUpdating(userId);
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      toast.success(`${name}'s role updated to ${newRole}`);
      fetchUsers();
    } catch { toast.error('Failed to update role'); }
    finally { setUpdating(null); }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-500">{total} users registered</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.totalUsers, color: 'text-blue-600 bg-blue-50' },
            { label: 'Active Users', value: stats.activeUsers, color: 'text-green-600 bg-green-50' },
            { label: 'New This Month', value: stats.newThisMonth, color: 'text-brand-600 bg-brand-50' },
            { label: 'Admins', value: stats.adminCount, color: 'text-purple-600 bg-purple-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${color.split(' ')[0]} mb-1`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..." className="input pl-9 text-sm" />
          </div>
          <button type="submit" className="btn-primary text-sm px-4">Search</button>
        </form>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${user.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-violet-600' : 'bg-gradient-to-br from-brand-400 to-orange-400'}`}>
                          {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.phone || 'No phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <select value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value, user.name)}
                        disabled={updating === user._id}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(user._id, user.isActive, user.name)}
                        disabled={updating === user._id}
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                        className={`p-2 rounded-lg transition-all disabled:opacity-50 ${user.isActive ? 'text-green-600 hover:bg-red-50 hover:text-red-500' : 'text-red-400 hover:bg-green-50 hover:text-green-600'}`}>
                        {updating === user._id
                          ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          : user.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
