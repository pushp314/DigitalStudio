import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import marketingService from '../../services/marketingService';
import { useToast } from '../../context/ToastContext';
import { 
    Zap, 
    Megaphone, 
    Trash2, 
    Edit3,
    ArrowUpRight,
    ShieldCheck,
    Clock,
    Activity,
    X,
    CheckCircle2
} from 'lucide-react';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const Marketing = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
    const [couponForm, setCouponForm] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minPurchase: 0,
        usageLimit: 0,
        expiresAt: ''
    });

    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();

    const { data: coupons, isLoading } = useQuery({
        queryKey: ['admin-coupons'],
        queryFn: marketingService.getCoupons,
    });

    const createMutation = useMutation({
        mutationFn: marketingService.createCoupon,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            success('Coupon created successfully.');
            setIsCreating(false);
            resetForm();
        },
        onError: (err) => toastError(err.message || 'Failed to create coupon.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => marketingService.updateCoupon(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            success('Coupon details updated.');
            setEditingId(null);
            resetForm();
        },
        onError: (err) => toastError(err.message || 'Update failed.'),
    });

    const revokeMutation = useMutation({
        mutationFn: marketingService.revokeCoupon,
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            success(res.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: marketingService.deleteCoupon,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            success('Coupon deleted successfully.');
            setConfirmModal({ isOpen: false, id: null });
        },
    });

    const resetForm = () => {
        setCouponForm({ code: '', discountType: 'percentage', discountValue: 0, minPurchase: 0, usageLimit: 0, expiresAt: '' });
    };

    const handleEditStart = (coupon) => {
        setEditingId(coupon.id);
        setCouponForm({
            ...coupon,
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : ''
        });
    };

    if (isLoading) return (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Scanning Marketing Pulse...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Header / Global Action */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-3">
                        Marketing Console <Activity size={20} className="text-emerald-500" />
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Orchestrate marketplace promotions and manage discount codes.</p>
                </div>
                {!isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-3 relative z-10 hover:scale-105 active:scale-95"
                    >
                        <Zap size={16} className="fill-current" /> Create New Coupon
                    </button>
                )}
            </div>

            {/* Creation Surface */}
            {isCreating && (
                <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-x-32 -translate-y-32"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-widest mb-1">Coupon Configuration</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Administrator Marketing Access</p>
                            </div>
                            <button onClick={() => setIsCreating(false)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"><X size={20} /></button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                            <InputField label="Coupon Code" value={couponForm.code} onChange={v => setCouponForm({...couponForm, code: v.toUpperCase()})} placeholder="e.g. ALPHA_50" />
                            <SelectField label="Discount Type" value={couponForm.discountType} onChange={v => setCouponForm({...couponForm, discountType: v})}>
                                <option value="percentage">Percentage Off (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </SelectField>
                            <InputField label="Discount Value" type="number" value={couponForm.discountValue} onChange={v => setCouponForm({...couponForm, discountValue: Number(v)})} />
                            <InputField label="Min. Purchase" type="number" value={couponForm.minPurchase} onChange={v => setCouponForm({...couponForm, minPurchase: Number(v)})} />
                            <InputField label="Usage Limit" type="number" value={couponForm.usageLimit} onChange={v => setCouponForm({...couponForm, usageLimit: Number(v)})} />
                            <InputField label="Expiration Date" type="date" value={couponForm.expiresAt} onChange={v => setCouponForm({...couponForm, expiresAt: v})} />
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => createMutation.mutate({ ...couponForm, expiresAt: couponForm.expiresAt || null })} 
                                className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 flex-1 md:flex-none"
                            >
                                Create Coupon
                            </button>
                            <button onClick={() => setIsCreating(false)} className="px-10 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white transition-all">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Coupon Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons?.map(coupon => (
                    <div key={coupon.id} className={`group relative bg-white p-8 rounded-[2.5rem] border-2 transition-all duration-500 shadow-sm hover:shadow-2xl overflow-hidden ${coupon.active ? 'border-slate-50 hover:border-slate-900' : 'opacity-60 grayscale border-slate-100 bg-slate-50/50'}`}>
                        {editingId === coupon.id ? (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200 h-full flex flex-col">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Editing {coupon.code}</h4>
                                    <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount Value</label>
                                            <input type="number" value={couponForm.discountValue} onChange={e => setCouponForm({...couponForm, discountValue: Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white focus:ring-1 focus:ring-slate-900" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Min. Threshold</label>
                                            <input type="number" value={couponForm.minPurchase} onChange={e => setCouponForm({...couponForm, minPurchase: Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white focus:ring-1 focus:ring-slate-900" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                        <input type="date" value={couponForm.expiresAt} onChange={e => setCouponForm({...couponForm, expiresAt: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black outline-none focus:bg-white focus:ring-1 focus:ring-slate-900" />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => updateMutation.mutate({ id: coupon.id, data: couponForm })}
                                    className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg"
                                >
                                    Update Coupon
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-colors ${coupon.active ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}>%</div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Modifier</p>
                                                <h3 className="text-base font-black text-slate-900 truncate tracking-tight">{coupon.code}</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 translate-x-2 -translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <ActionButton icon={<Edit3 size={14} />} onClick={() => handleEditStart(coupon)} color="text-blue-500" title="Edit Coupon" />
                                        <ActionButton 
                                            icon={<ShieldCheck size={14} />} 
                                            onClick={() => revokeMutation.mutate(coupon.id)} 
                                            color={coupon.active ? "text-amber-500" : "text-emerald-500"} 
                                            title={coupon.active ? "Pause Coupon" : "Activate Coupon"} 
                                        />
                                        <ActionButton icon={<Trash2 size={14} />} onClick={() => setConfirmModal({ isOpen: true, id: coupon.id })} color="text-rose-500" title="Delete Coupon" />
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Impact</p>
                                    <h4 className="text-4xl font-black text-slate-900 tracking-tighter">
                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                                        <span className="text-[10px] font-bold text-slate-400 ml-2 tracking-normal uppercase">off</span>
                                    </h4>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <StatItem label="Min. Requirement" icon={<Zap size={10} />} value={`₹${coupon.minPurchase}`} />
                                    <StatItem label="Total Usage" icon={<ArrowUpRight size={10} />} value={`${coupon.usageCount || 0}/${coupon.usageLimit || '∞'}`} />
                                    <StatItem label="Expiry Date" icon={<Clock size={10} />} value={coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Permanent'} />
                                    <StatItem label="Status" icon={<Activity size={10} />} value={coupon.active ? 'Active' : 'Paused'} color={coupon.active ? 'text-emerald-500' : 'text-slate-400'} />
                                </div>

                                {!coupon.active && (
                                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-[2.5rem] flex items-center justify-center p-6 text-center select-none pointer-events-none">
                                        <p className="text-[11px] font-black text-slate-900 border-2 border-slate-900 px-6 py-2.5 rounded-full rotate-[-8deg] shadow-2xl bg-white/80 uppercase tracking-[0.4em]">Node Revoked</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}

                {(!coupons || coupons.length === 0) && !isLoading && (
                    <div className="col-span-full py-32 border-4 border-dashed border-slate-50 rounded-[3rem] text-center">
                        <Megaphone size={48} className="mx-auto text-slate-100 mb-6" />
                        <p className="text-sm font-black text-slate-300 uppercase tracking-[0.2em]">No active coupons found.</p>
                    </div>
                )}
            </div>
            <ConfirmationModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={() => deleteMutation.mutate(confirmModal.id)}
                title="Purge Coupon Node?"
                message="This marketing asset will be permanently erased from the technical ledger. This action is irreversible."
                confirmText="Delete Coupon"
                type="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

const InputField = ({ label, type = "text", ...props }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        <input {...props} type={type} className="w-full px-5 py-3.5 bg-slate-800/50 border border-slate-800 rounded-2xl outline-none focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 transition-all font-bold text-xs" />
    </div>
);

const SelectField = ({ label, children, ...props }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        <select {...props} className="w-full px-5 py-3.5 bg-slate-800/50 border border-slate-800 rounded-2xl outline-none focus:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest">
            {children}
        </select>
    </div>
);

const StatItem = ({ label, icon, value, color = "text-slate-900" }) => (
    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 transition-colors">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            {icon}
            <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <p className={`text-[10px] font-black uppercase tracking-tighter ${color}`}>{value}</p>
    </div>
);

const ActionButton = ({ icon, onClick, title, color }) => (
    <button 
        onClick={onClick}
        title={title}
        className={`w-9 h-9 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${color} hover:shadow-md`}
    >
        {icon}
    </button>
);

export default Marketing;
