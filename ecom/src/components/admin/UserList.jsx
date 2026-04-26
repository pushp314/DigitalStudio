import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../../services/userService';
import { normalizeUser } from '../../utils/normalizers';
import { useToast } from '../../context/ToastContext';
import { Shield, User, Zap, Mail, Key, Download, Ban, CheckCircle2 } from 'lucide-react';

const UserList = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();

    const { data: userData, isLoading: loading, error } = useQuery({
        queryKey: ['users'],
        queryFn: () => userService.adminList(),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => userService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            success('Identity modified successfully.');
        },
        onError: () => toastError('Authorization update failed.'),
    });

    const resetPasswordMutation = useMutation({
        mutationFn: ({ id, password }) => userService.resetPassword(id, password),
        onSuccess: () => {
            success('Temporary password saved.');
        },
        onError: (err) => toastError(err.message || 'Password reset failed.'),
    });

    const users = useMemo(() => 
        Array.isArray(userData) ? userData.map(normalizeUser) : [],
    [userData]);

    const handleUpdate = (id, field, value) => {
        updateMutation.mutate({ id, data: { [field]: value } });
    };

    const handleResetPassword = (user) => {
        const password = window.prompt(`Set a temporary password for ${user.name}:`);
        if (!password) {
            return;
        }
        if (password.length < 6) {
            toastError('Temporary password must be at least 6 characters.');
            return;
        }
        resetPasswordMutation.mutate({ id: user.id, password });
    };

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Users...</p>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-red-600">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Connection Error</h3>
            <p className="text-sm font-medium">{error.message}</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
            
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
                <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">User Directory</h2>
                    <p className="text-xs text-slate-500">Manage authorization levels and subscription statuses across the matrix.</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                        <UsersIcon count={users.length} />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="table-responsive">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
                                <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Role</th>
                                <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Subscription</th>
                                <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-4 sm:px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-900 uppercase shadow-sm">
                                                {user.name?.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Mail size={10} className="text-slate-300" />
                                                    <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-center">
                                        <select 
                                            value={user.role} 
                                            onChange={(e) => handleUpdate(user.id, 'role', e.target.value)}
                                            className="bg-transparent text-[10px] font-bold text-slate-900 uppercase tracking-widest border-none outline-none cursor-pointer hover:text-blue-600 transition-colors text-center"
                                        >
                                            <option value="user">User</option>
                                            <option value="contributor">Contributor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-center">
                                         <Badge 
                                            variant={user.subscriptionPlan === 'pro' ? 'success' : user.subscriptionPlan === 'enterprise' ? 'primary' : 'neutral'}
                                            label={user.subscriptionPlan}
                                         />
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleUpdate(user.id, 'suspended', !user.suspended)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
                                                user.suspended 
                                                ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-black hover:text-white' 
                                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-slate-900 hover:text-white'
                                            }`}
                                        >
                                            {user.suspended ? <Ban size={10} /> : <CheckCircle2 size={10} />}
                                            {user.suspended ? 'Suspended' : 'Verified'}
                                        </button>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <ActionButton icon={<Key size={14} />} onClick={() => handleResetPassword(user)} title="Reset Password" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const UsersIcon = ({ count }) => (
    <div className="flex items-center gap-2">
        <User size={14} className="text-blue-600" />
        <span className="text-xs font-bold text-slate-900">{count} Active</span>
    </div>
);

const Badge = ({ variant, label }) => {
    const styles = {
        success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        primary: 'bg-blue-50 text-blue-700 border-blue-100',
        neutral: 'bg-slate-50 text-slate-500 border-slate-100'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${styles[variant]}`}>
            {label}
        </span>
    );
};

const ActionButton = ({ icon, onClick, title }) => (
    <button 
        onClick={onClick}
        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
        title={title}
    >
        {icon}
    </button>
);

export default UserList;
