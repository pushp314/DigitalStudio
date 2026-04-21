import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
    ShieldCheck, 
    ShieldAlert, 
    History, 
    User, 
    Github, 
    CheckCircle2, 
    XCircle,
    Info,
    Calendar,
    MessageSquare
} from 'lucide-react';

const normalizeRequest = (request = {}) => ({
    id: request.id ?? request.ID,
    userId: request.userId ?? request.user_id ?? request.UserID,
    reason: request.reason ?? request.Reason ?? '',
    status: request.status ?? request.Status ?? 'pending',
    resolved: Boolean(request.resolved ?? request.Resolved),
    createdAt: request.createdAt ?? request.CreatedAt ?? null,
    user: request.user ?? request.User ?? null,
});

const IdentityManager = () => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();

    // Fetch all requests
    const { data: requests, isLoading } = useQuery({
        queryKey: ['admin-github-requests'],
        queryFn: async () => {
            const res = await api.get('/admin/github-requests');
            return Array.isArray(res) ? res.map(normalizeRequest) : [];
        },
    });

    // Resolution Mutation
    const resolveMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return await api.patch(`/admin/github-requests/${id}`, { status });
        },
        onSuccess: (_data, variables) => {
            success(`Identity Shift ${variables.status === 'approved' ? 'Authorized' : 'Denied'}`);
            queryClient.invalidateQueries({ queryKey: ['admin-github-requests'] });
        },
        onError: () => {
            toastError("Could not resolve this request.");
        }
    });

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Identity Requests...</p>
            </div>
        );
    }

    const pendingRequests = requests?.filter(r => !r.resolved) || [];
    const archivedRequests = requests?.filter(r => r.resolved) || [];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Module */}
            <div className="flex items-center justify-between pb-8 border-b border-gray-100">
                <div>
                    <h2 className="text-3xl font-black text-black tracking-tighter">Identity Review Hub</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gated GitHub transitions & verification locks</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-sm shadow-blue-500/50"></div>
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Queue Status: {pendingRequests.length} Active</span>
                    </div>
                </div>
            </div>

            {/* Active Queue */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <ShieldAlert size={16} className="text-blue-500" />
                    <h3 className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Pending Authorized Shifts</h3>
                </div>

                {pendingRequests.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {pendingRequests.map(request => (
                            <div key={request.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -translate-y-4 translate-x-4 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-xl font-black text-black border border-gray-100 uppercase">
                                            {request.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-black text-black tracking-tighter">{request.user?.name || 'Unknown User'}</h4>
                                                <span className="px-2.5 py-1 bg-black text-white text-[8px] font-black rounded-lg uppercase">User_ID: {request.userId}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Calendar size={12} /> {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Unknown'}</span>
                                                <span className="flex items-center gap-1.5"><Github size={12} /> Current: @{request.user?.github || 'none'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 max-w-xl">
                                        <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                                            <MessageSquare size={16} className="text-gray-300 mt-1 shrink-0" />
                                            <p className="text-xs font-bold text-gray-500 leading-relaxed italic">
                                                "{request.reason}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => resolveMutation.mutate({ id: request.id, status: 'approved' })}
                                            disabled={resolveMutation.isPending}
                                            className="px-8 py-3.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 group/btn"
                                        >
                                            <CheckCircle2 size={14} className="group-hover/btn:scale-110 transition-transform text-emerald-400" />
                                            Authorize Shift
                                        </button>
                                        <button 
                                            onClick={() => resolveMutation.mutate({ id: request.id, status: 'rejected' })}
                                            disabled={resolveMutation.isPending}
                                            className="px-8 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <XCircle size={14} />
                                            Deny Access
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-center bg-gray-50/50">
                        <ShieldCheck size={48} className="text-gray-200 mb-6" />
                        <h4 className="text-xl font-black text-gray-900 tracking-tighter">Integrity Secured</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">No pending identity transitions detected</p>
                    </div>
                )}
            </section>

            {/* Audit Log */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <History size={16} className="text-gray-400" />
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transition Archive</h3>
                </div>

                <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest">Subject</th>
                                <th className="px-8 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest">Justification</th>
                                <th className="px-8 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest">Resolution</th>
                                <th className="px-8 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {archivedRequests.length > 0 ? (
                                archivedRequests.map(request => (
                                    <tr key={request.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-black text-[10px] text-black">
                                                    {request.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-xs font-black text-black">{request.user?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 max-w-xs">
                                            <p className="text-[10px] font-medium text-gray-400 truncate">{request.reason}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                request.status === 'approved' 
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                : 'bg-red-50 text-red-600 border border-red-100'
                                            }`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-[10px] font-black text-gray-400 font-mono tracking-tighter">
                                                {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Unknown'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-10 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                        No historical transitions logged
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default IdentityManager;
