import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import orderService from '../../services/orderService';
import { normalizeOrder } from '../../utils/normalizers';
import { useToast } from '../../context/ToastContext';
import { 
    FileText, 
    User, 
    CreditCard, 
    Download, 
    X, 
    CheckCircle2, 
    AlertCircle, 
    ExternalLink,
    Filter,
    Calendar,
    ArrowUpRight,
    Eye
} from 'lucide-react';

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
            success('Order status updated.');
        },
        onError: () => toastError('Order update failed.'),
    });
    
    const refundMutation = useMutation({
        mutationFn: (id) => orderService.adminRefund(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            success('Refund processed successfully.');
            setSelectedOrder(null);
        },
        onError: (err) => toastError(err.response?.data?.error || 'Refund initiation failed.'),
    });

    const orders = Array.isArray(orderData) ? orderData.map(normalizeOrder) : [];

    const handleUpdateStatus = (id, field, value) => {
        updateOrderMutation.mutate({ id, data: { [field]: value } });
    };

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Orders...</p>
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
            
            {/* Professional Audit Drawer */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-all" onClick={() => setSelectedOrder(null)}></div>
                    <div className="w-full max-w-xl bg-white h-full relative z-10 shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col border-l border-slate-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 tracking-tight">Order Details</h3>
                                <p className="text-[10px] text-slate-400 font-mono tracking-tighter mt-0.5">TX_REF_{String(selectedOrder.id).toUpperCase()}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {/* Customer Profile */}
                            <section className="space-y-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Information</p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">{selectedOrder.user?.name?.charAt(0)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 text-sm truncate">{selectedOrder.user?.name || 'Anonymous'}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{selectedOrder.user?.email}</p>
                                    </div>
                                    <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-bold text-slate-400">ID_{selectedOrder.userId}</div>
                                </div>
                            </section>

                            {/* Product Summary */}
                            <section className="space-y-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Summary</p>
                                <div className="space-y-2">
                                    {(selectedOrder.orderItems || []).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <Download size={14} className="text-slate-300" />
                                                <p className="text-xs font-bold text-slate-900">{item.product?.title || 'Product Bundle'}</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-900">₹{item.price}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Financial Summary */}
                            <section className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Total Paid</p>
                                        <p className="text-2xl font-bold tracking-tight">{selectedOrder.formattedTotalPrice}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Status</p>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${selectedOrder.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                            {selectedOrder.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex flex-col gap-3 bg-slate-50/50">
                             <div className="flex gap-3">
                                <button onClick={() => { handleUpdateStatus(selectedOrder.id, 'entitlementStatus', 'granted'); setSelectedOrder(p => ({...p, entitlementStatus: 'granted'})) }} className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm">Grant Access</button>
                                <button onClick={() => { handleUpdateStatus(selectedOrder.id, 'entitlementStatus', 'revoked'); setSelectedOrder(p => ({...p, entitlementStatus: 'revoked'})) }} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all">Revoke Access</button>
                             </div>
                             {selectedOrder.paymentStatus === 'paid' && (
                                <button 
                                    onClick={() => {
                                        if(window.confirm('Are you sure you want to initiate a full refund? This will also suspend all associated licenses.')) {
                                            refundMutation.mutate(selectedOrder.id);
                                        }
                                    }} 
                                    className="w-full py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                                >
                                    Initiate Full Refund
                                </button>
                             )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-xl border border-slate-200">
                <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">Orders</h2>
                    <p className="text-xs text-slate-500">Manage customer orders and payment statuses.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <StatusFilter current={statusFilter} target="all" label="All" onClick={setStatusFilter} />
                        <StatusFilter current={statusFilter} target="paid" label="Paid" onClick={setStatusFilter} />
                        <StatusFilter current={statusFilter} target="pending" label="Pending" onClick={setStatusFilter} />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} className="text-slate-300" />
                                            <span className="text-[11px] font-bold text-slate-400 font-mono tracking-tighter uppercase whitespace-nowrap">ID_{String(order.id).toUpperCase()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight">{order.user?.name || 'Guest'}</p>
                                            <p className="text-[10px] text-slate-400 font-medium truncate">{order.user?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-900 text-sm tracking-tight whitespace-nowrap">
                                        {order.formattedTotalPrice}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                         <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                            {order.paymentStatus}
                                         </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setSelectedOrder(order)}
                                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                            title="View Details"
                                        >
                                            <Eye size={16} />
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

const StatusFilter = ({ current, target, label, onClick }) => (
    <button 
        onClick={() => onClick(target)}
        className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
            current === target ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
        }`}
    >
        {label}
    </button>
);

export default OrderList;
