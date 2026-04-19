import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import marketingService from '../../services/marketingService';
import { useToast } from '../../context/ToastContext';

const Marketing = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [couponForm, setCouponForm] = useState({
        code: '',
        discountType: 'percentage', // percentage, flat
        discountValue: 0,
        minPurchase: 0,
        expiresAt: '',
    });

    const { data: coupons, isLoading } = useQuery({
        queryKey: ['marketing', 'coupons'],
        queryFn: () => marketingService.getCoupons(),
    });

    const createMutation = useMutation({
        mutationFn: (data) => marketingService.createCoupon(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing', 'coupons'] });
            success('Coupon code activated');
            setIsCreating(false);
            setCouponForm({ code: '', discountType: 'percentage', discountValue: 0, minPurchase: 0, expiresAt: '' });
        },
        onError: () => toastError('Failed to generate coupon'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => marketingService.deleteCoupon(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing', 'coupons'] });
            success('Coupon deactivated');
        },
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Coupon Engine - Densified */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h2 className="text-xl font-black text-black tracking-tight leading-none mb-3">Promotional Engine</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">Revenue Modifiers & Price Offsets</p>
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)} 
                        className="px-6 py-3 bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/20"
                    >
                        + Generate Modifier
                    </button>
                </div>

                {isCreating && (
                    <div className="mb-8 p-6 bg-gray-50 border border-gray-100 rounded-2xl animate-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <Field label="Key Code">
                                <input value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-lg outline-none focus:border-black font-black text-[11px] uppercase tracking-widest" placeholder="SALE50" />
                            </Field>
                            <Field label="Type">
                                <select value={couponForm.discountType} onChange={e => setCouponForm({...couponForm, discountType: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-lg outline-none focus:border-black font-black text-[11px] uppercase tracking-widest">
                                    <option value="percentage">Relief %</option>
                                    <option value="flat">Fixed ₹</option>
                                </select>
                            </Field>
                            <Field label="Impact Value">
                                <input type="number" value={couponForm.discountValue} onChange={e => setCouponForm({...couponForm, discountValue: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-lg outline-none focus:border-black font-black text-[11px]" />
                            </Field>
                            <div className="flex items-end gap-2">
                                <button onClick={() => createMutation.mutate(couponForm)} className="flex-1 py-2.5 bg-black text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-gray-800 transition-all">Enable</button>
                                <button onClick={() => setIsCreating(false)} className="px-5 py-2.5 bg-white border border-gray-100 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:text-black">Abort</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {isLoading ? (
                         <div className="col-span-full py-16 text-center text-gray-300 font-black text-[10px] uppercase tracking-widest italic">Synchronizing Offer Feed...</div>
                    ) : (
                        coupons?.map(coupon => (
                            <div key={coupon.id} className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl group relative overflow-hidden transition-all hover:-translate-y-1">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-gray-50 rounded-bl-full group-hover:bg-black/5 transition-colors"></div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black text-[10px]">₹</div>
                                    <div className="min-w-0">
                                        <p className="font-black text-black text-[12px] tracking-widest truncate">{coupon.code}</p>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Modifier Active</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xl font-black text-black tracking-tighter leading-none mb-1">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Offset Value</p>
                                    </div>
                                    <button onClick={() => deleteMutation.mutate(coupon.id)} className="px-3 py-1.5 bg-red-50 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">Revoke</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const Field = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        {children}
    </div>
);

export default Marketing;
