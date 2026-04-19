import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../../services/userService';
import { normalizeUser } from '../../utils/normalizers';
import { useToast } from '../../context/ToastContext';

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
            success('User profile updated');
        },
        onError: () => toastError('Failed to update user identity'),
    });

    const users = useMemo(() => 
        Array.isArray(userData) ? userData.map(normalizeUser) : [],
    [userData]);

    const handleUpdate = (id, field, value) => {
        updateMutation.mutate({ id, data: { [field]: value } });
    };

    if (loading) return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-20 text-center animate-pulse">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Users...</p>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-12 text-red-500">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Connection Error</h3>
            <p className="text-sm font-medium">{error.message}</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
            
             <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-24 h-24 bg-gray-50/50 rounded-br-full -translate-y-4 -translate-x-4"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-black text-black tracking-tight leading-none mb-3">Account Registry</h2>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest">{users.length} Active Profiles</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Live Registry
                        </span>
                    </div>
                </div>
                <div className="relative z-10 flex gap-3">
                    <button onClick={() => success('Exporting CSV...')} className="px-6 py-2.5 bg-gray-50 text-gray-500 hover:text-black hover:bg-white border border-gray-100 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all shadow-sm">Export</button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100">
                                <th className="px-6 py-5">Member Identity</th>
                                <th className="px-6 py-5 text-center">Authorization</th>
                                <th className="px-6 py-5 text-center">Subscription</th>
                                <th className="px-6 py-5 text-center">Status</th>
                                <th className="px-6 py-5 text-right">Access</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/30 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-sm text-black uppercase shadow-inner group-hover:scale-105 transition-transform duration-300">
                                                {user.name?.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-black text-sm tracking-tight leading-none mb-1">{user.name}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <select 
                                            value={user.role} 
                                            onChange={(e) => handleUpdate(user.id, 'role', e.target.value)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all outline-none shadow-sm cursor-pointer appearance-none text-center ${
                                                user.role === 'admin' 
                                                ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                                : user.role === 'contributor'
                                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                : 'bg-gray-100 text-gray-600 border-gray-100'
                                            }`}
                                        >
                                            <option value="user">USER</option>
                                            <option value="contributor">STAFF</option>
                                            <option value="admin">DIRECTOR</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <select 
                                            value={user.subscriptionPlan} 
                                            onChange={(e) => handleUpdate(user.id, 'subscriptionPlan', e.target.value)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all outline-none shadow-sm cursor-pointer appearance-none text-center ${
                                                user.subscriptionPlan === 'enterprise' 
                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                                                : user.subscriptionPlan === 'pro'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-white text-gray-400 border-gray-100'
                                            }`}
                                        >
                                            <option value="free">FREE</option>
                                            <option value="pro">PRO</option>
                                            <option value="enterprise">CORP</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleUpdate(user.id, 'suspended', !user.suspended)}
                                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${
                                                user.suspended 
                                                ? 'bg-red-50 text-red-600 border-red-100 hover:bg-black hover:text-white' 
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-red-50 hover:text-red-700'
                                            }`}
                                        >
                                            {user.suspended ? 'REVOKED' : 'ACTIVE'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => success(`Tokens refreshed for ${user.email}`)}
                                            className="w-8 h-8 bg-white border border-gray-100 text-gray-400 hover:text-black hover:border-black rounded-lg transition-all shadow-sm flex items-center justify-center group/btn"
                                            title="Reset"
                                        >
                                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                        </button>
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

export default UserList;
