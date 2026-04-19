import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ShowcaseManager = () => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();

    const { data: showcases, isLoading } = useQuery({
        queryKey: ['admin-showcases'],
        queryFn: async () => {
            return await api.get('/admin/showcases');
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return await api.patch(`/admin/showcases/${id}/status`, { status });
        },
        onSuccess: (data) => {
            success(`Status updated to ${data.status.toUpperCase()} successfully.`);
            queryClient.invalidateQueries(['admin-showcases']);
        },
        onError: () => {
            toastError("Failed to update submission status.");
        }
    });

    if (isLoading) return <div className="p-20 text-center text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Loading submissions...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-black tracking-tight">Product Showcase</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Manage customer submissions & rewards</p>
                </div>
            </div>

            <div className="grid gap-6">
                {showcases?.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500 flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden group">
                        
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-4 mb-4">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    item.status === 'approved' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' :
                                    item.status === 'rejected' ? 'bg-red-50 text-red-500 border border-red-100' :
                                    'bg-gray-50 text-gray-400 border border-gray-100'
                                }`}>
                                    {item.status}
                                </span>
                                {item.rewardPaid && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">💰 Reward Paid</span>}
                            </div>
                            
                            <h3 className="text-xl font-black text-black tracking-tight mb-2 truncate">Product: {item.product?.title || 'Unknown Product'}</h3>
                            <a 
                                href={item.liveUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm font-bold text-primary hover:underline flex items-center gap-2 mb-6"
                            >
                                🔗 {item.liveUrl}
                            </a>
                            
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-black shadow-sm">ID</div>
                                    <p className="text-[10px] font-black text-black uppercase tracking-widest">User ID: {item.userId}</p>
                                </div>
                                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Submitted: {new Date(item.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                            {item.status === 'pending' && (
                                <>
                                    <button 
                                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'approved' })}
                                        disabled={updateStatusMutation.isLoading}
                                        className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/10 hover:bg-emerald-500 transition-all active:scale-95"
                                    >
                                        Approve & Reward
                                    </button>
                                    <button 
                                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'rejected' })}
                                        disabled={updateStatusMutation.isLoading}
                                        className="px-10 py-5 bg-white border border-gray-100 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 transition-all active:scale-95"
                                    >
                                        Reject Submission
                                    </button>
                                </>
                            )}
                            {item.status !== 'pending' && (
                                <button className="px-10 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-not-allowed">
                                    Processed
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {(!showcases || showcases.length === 0) && (
                    <div className="p-40 text-center border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/20">
                        <div className="text-4xl mb-6 grayscale">📡</div>
                        <h3 className="text-xl font-black text-black mb-1">No submissions yet</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No submissions found at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShowcaseManager;
