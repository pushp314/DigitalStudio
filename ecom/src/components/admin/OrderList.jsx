import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import orderService from '../../services/orderService';
import { normalizeOrder } from '../../utils/normalizers';
import { useToast } from '../../context/ToastContext';

const OrderList = () => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();

    const { data: orderData, isLoading: loading, error } = useQuery({
        queryKey: ['admin-orders', statusFilter],
        queryFn: () => orderService.adminList(statusFilter),
    });

    const updateOrderMutation = useMutation({
        mutationFn: ({ id, data }) => orderService.adminUpdate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            success('Order updated');
        },
        onError: () => toastError('Update failed'),
    });

    const orders = Array.isArray(orderData) ? orderData.map(normalizeOrder) : [];

    const handleUpdateStatus = (id, field, value) => {
        updateOrderMutation.mutate({ id, data: { [field]: value } });
    };

    if (loading) return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-20 text-center animate-pulse">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Orders...</p>
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
            
            {/* Order Detail Drawer - Densified */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all" onClick={() => setSelectedOrder(null)}></div>
                    <div className="w-full max-w-lg bg-white h-full relative z-10 shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-black tracking-tighter uppercase leading-none">Order Manifest</h3>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1.5 opacity-60">REF-ID: {selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm text-xs">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {/* Customer Profile */}
                            <section className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-3 border-black pl-3">Account</p>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4 group hover:bg-white hover:shadow-lg transition-all duration-300">
                                    <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center text-lg font-black">{selectedOrder.user?.name?.charAt(0)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-black text-base tracking-tight truncate leading-none mb-1">{selectedOrder.user?.name || 'Anonymous'}</p>
                                        <p className="text-[10px] text-gray-400 font-bold truncate">{selectedOrder.user?.email}</p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-lg uppercase">Auth</span>
                                </div>
                            </section>

                            {/* Inventory Breakdown */}
                            <section className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-3 border-black pl-3">Assets</p>
                                <div className="grid gap-2">
                                    {(selectedOrder.items || []).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-sm">💎</div>
                                                <div>
                                                    <p className="text-xs font-black text-black tracking-tight leading-none mb-1">{item.product?.title || 'Asset'}</p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">DS-Inventory</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-black tracking-tighter">₹{item.price}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Financial Summary */}
                            <section className="space-y-4 pt-4 border-t border-gray-100">
                                <div className="bg-black text-white p-8 rounded-3xl shadow-xl flex justify-between items-center relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -translate-y-2 translate-x-2"></div>
                                    <div className="relative z-10">
                                        <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-2">Net Value</p>
                                        <p className="text-3xl font-black tracking-tighter">{selectedOrder.formattedTotalPrice}</p>
                                    </div>
                                    <div className="relative z-10 text-right">
                                        <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-2">Settlement</p>
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${selectedOrder.paymentStatus === 'paid' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-amber-500 text-white border-amber-400'}`}>
                                            {selectedOrder.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </div>
                        <div className="p-8 border-t border-gray-50 flex gap-3 bg-gray-50/50">
                             <button onClick={() => { handleUpdateStatus(selectedOrder.id, 'paymentStatus', 'paid'); setSelectedOrder(p => ({...p, paymentStatus: 'paid'})) }} className="flex-1 py-3.5 bg-black text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-gray-900 transition-all">Settle</button>
                             <button onClick={() => { handleUpdateStatus(selectedOrder.id, 'entitlementStatus', 'revoked'); setSelectedOrder(p => ({...p, entitlementStatus: 'revoked'})) }} className="flex-1 py-3.5 bg-white border border-gray-100 text-red-500 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-red-50 transition-all">Revoke</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden group relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-black text-black tracking-tight leading-none mb-3">Financial Ledger</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{orders.length} Global Entries Recorded</p>
                </div>
                <div className="relative z-10 flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 shadow-inner">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">Registry</span>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-black transition-all shadow-sm"
                    >
                        <option value="all">Comprehensive</option>
                        <option value="paid">Settled</option>
                        <option value="pending">Escrow</option>
                        <option value="failed">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100">
                                <th className="px-6 py-5">Reference</th>
                                <th className="px-6 py-5">User Account</th>
                                <th className="px-6 py-5 text-center">Net Impact (₹)</th>
                                <th className="px-6 py-5 text-center">Status</th>
                                <th className="px-6 py-5 text-right">Registry</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/30 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-black transition-all"></div>
                                            <span className="text-[10px] font-black text-gray-500 font-mono tracking-tighter uppercase">ID-{String(order.id || '').slice(-8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="min-w-0">
                                            <p className="font-black text-black text-sm tracking-tight leading-none mb-1">{order.user?.name || 'Guest'}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{order.user?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center font-black text-black text-sm tracking-tighter">
                                        {order.formattedTotalPrice}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                         <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all duration-300 ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-500 group-hover:text-white'}`}>
                                            {order.paymentStatus}
                                         </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button 
                                            onClick={() => setSelectedOrder(order)}
                                            className="px-5 py-2.5 bg-white border border-gray-100 text-gray-400 hover:text-black hover:border-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm group-hover:bg-gray-50/50"
                                        >
                                            Examine
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

export default OrderList;
