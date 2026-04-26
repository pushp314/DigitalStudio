import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import analyticsService from '../../services/analyticsService';
import { normalizeProduct, normalizeSalesSummary } from '../../utils/normalizers';

const Analytics = () => {
    const { data: salesData, isLoading: salesLoading, error: salesError } = useQuery({
        queryKey: ['analytics', 'sales'],
        queryFn: () => analyticsService.getSales(),
    });

    const { data: templatesData, isLoading: templatesLoading, error: templatesError } = useQuery({
        queryKey: ['analytics', 'top-templates'],
        queryFn: () => analyticsService.getTopTemplates(),
    });

    const sales = useMemo(() => 
        Array.isArray(salesData) ? salesData.map(normalizeSalesSummary) : [],
    [salesData]);

    const topTemplates = useMemo(() => 
        Array.isArray(templatesData) ? templatesData.map(normalizeProduct) : [],
    [templatesData]);

    const loading = salesLoading || templatesLoading;
    const error = salesError?.message || templatesError?.message;

    const stats = useMemo(() => {
        const totalRevenue = sales.reduce((sum, entry) => sum + entry.revenue, 0);
        const totalSold = sales.reduce((sum, entry) => sum + entry.totalSold, 0);

        return [
            { label: 'Market Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: '💰', trend: '+12%', color: 'from-emerald-500 to-teal-400' },
            { label: 'Global Units', value: totalSold, icon: '📦', trend: '+5%', color: 'from-blue-500 to-cyan-400' },
            { label: 'Active Catalog', value: sales.length, icon: '🏷️', trend: 'Stable', color: 'from-indigo-500 to-purple-400' },
            { label: 'Top Products', value: topTemplates.length, icon: '🏆', trend: '+2', color: 'from-amber-500 to-orange-400' },
        ];
    }, [sales, topTemplates]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-3xl"></div>)}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 p-8 rounded-[2rem] text-red-500 flex items-center gap-4">
               <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               <div>
                    <h3 className="font-black uppercase text-xs tracking-widest mb-1">Telemetry Interrupted</h3>
                    <p className="text-sm font-medium opacity-80">{error}</p>
               </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-[0.03] rounded-bl-full group-hover:opacity-[0.08] transition-opacity`}></div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                {stat.icon}
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</h3>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Revenue Breakdown */}
                <div className="bg-white border border-slate-100 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-sm">
                    <div className="flex justify-between items-center mb-8 sm:mb-10">
                        <div>
                            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Revenue Performance</h3>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Per-product performance</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10 shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                    </div>
                    
                    <div className="space-y-6 sm:space-y-8">
                        {sales.length === 0 ? (
                            <div className="text-center py-16 sm:py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Awaiting First Transaction</p>
                            </div>
                        ) : (
                            sales.map((entry) => {
                                const percentage = Math.min(100, entry.revenue > 0 ? (entry.revenue / Math.max(...sales.map((item) => item.revenue), 1)) * 100 : 0);
                                return (
                                    <div key={entry.productId} className="group">
                                        <div className="flex justify-between items-end gap-4 mb-3">
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{entry.title}</p>
                                                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{entry.totalSold} Units Sold</p>
                                            </div>
                                            <span className="font-black text-slate-900 text-xs sm:text-sm whitespace-nowrap">{entry.formattedRevenue}</span>
                                        </div>
                                        <div className="h-2 sm:h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div
                                                className="h-full bg-gradient-to-r from-slate-900 via-blue-600 to-cyan-500 rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white border border-slate-100 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-sm">
                    <div className="flex justify-between items-center mb-8 sm:mb-10">
                        <div>
                            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Market Leaders</h3>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">High conversion products</p>
                        </div>
                        <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" /></svg>
                        </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        {topTemplates.length === 0 ? (
                             <div className="text-center py-16 sm:py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Catalog Empty</p>
                            </div>
                        ) : (
                            topTemplates.map((template, idx) => (
                                <div key={template.id} className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-50 hover:border-slate-200 hover:bg-slate-50 transition-all group">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                                        {template.image ? <img src={template.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="text-slate-100">📦</div>}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[8px] sm:text-[9px] font-black text-slate-900 uppercase">Rank #{idx+1}</span>
                                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 tracking-widest uppercase truncate">{template.category}</span>
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">{template.title}</h4>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[11px] sm:text-sm font-black text-slate-900">{template.formattedPrice}</p>
                                        <p className="text-[8px] sm:text-[10px] text-emerald-500 font-bold uppercase">{template.numSales} Sold</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
