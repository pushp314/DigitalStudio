import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import licenseService from '../../services/licenseService';
import { useToast } from '../../context/ToastContext';

const LicenseManager = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: licenses, isLoading } = useQuery({
        queryKey: ['admin', 'licenses'],
        queryFn: () => licenseService.getAll(),
    });

    const revokeMutation = useMutation({
        mutationFn: (id) => licenseService.revoke(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'licenses'] });
            success('License access revoked');
        },
    });

    const filteredLicenses = licenses?.filter(l => 
        l.key?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-black tracking-tight">License Keys</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{filteredLicenses.length} active licenses found</p>
                </div>
                <div className="w-full md:w-96 px-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                    <span className="text-lg opacity-40">🔍</span>
                    <input 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search key or owner..." 
                        className="bg-transparent border-none outline-none font-bold text-xs flex-1 text-black placeholder-gray-300" 
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <th className="px-10 py-6">License Key</th>
                                <th className="px-10 py-6">Customer</th>
                                <th className="px-10 py-6 text-center">Version</th>
                                <th className="px-10 py-6 text-center">Status</th>
                                <th className="px-10 py-6 text-right">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {isLoading ? (
                                <tr><td colSpan="5" className="py-20 text-center text-gray-300 font-bold uppercase text-[10px]">Loading licenses...</td></tr>
                            ) : (
                                filteredLicenses.map(l => (
                                    <tr key={l.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3 font-mono text-[10px] font-black text-black tracking-widest bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 w-fit">
                                                {l.key?.match(/.{1,4}/g)?.join('-')}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="font-bold text-black">{l.user?.name || 'Anonymous'}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{l.user?.email}</p>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">V{l.version || '1.0'}</span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${l.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${l.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>{l.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button 
                                                onClick={() => revokeMutation.mutate(l.id)} 
                                                disabled={l.status !== 'active'}
                                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-400 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-black hover:text-white hover:border-black transition-all disabled:opacity-30 active:scale-95"
                                            >
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LicenseManager;
