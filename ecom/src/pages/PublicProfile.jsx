import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { 
    Fingerprint, 
    Zap, 
    Crown, 
    Github, 
    Twitter, 
    Globe, 
    ShieldCheck, 
    Package,
    Terminal,
    ArrowUpRight,
    ExternalLink,
    Home,
    MessageSquare,
    Users,
    Flag,
    Info,
    AlertCircle
} from 'lucide-react';

const PublicProfile = () => {
    const { username } = useParams();
    const handle = username?.startsWith('@') ? username.substring(1) : username;

    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['public-profile', handle],
        queryFn: () => api.get(`/profile/${handle}`),
        retry: false,
        enabled: !!handle && handle !== 'undefined'
    });

    const { success, info } = useToast();
    const [isReported, setIsReported] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');

    const handleReportSubmit = async () => {
        if (!reportReason.trim()) {
            info("Please provide a reason for the report.");
            return;
        }

        try {
            await api.post(`/profile/${handle}/report`, { reason: reportReason });
            setIsReported(true);
            setIsReportModalOpen(false);
            success("Profile reported for review.");
        } catch (err) {
            info(err.message || "Failed to submit report.");
        }
    };

    const handleOpenReport = () => {
        if (isReported) {
            info("You have already reported this profile.");
            return;
        }
        setIsReportModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full bg-[#fafafa] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Sidebar Branding Standardized
    const Sidebar = () => (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col pt-8 flex-shrink-0 relative z-50">
            <Link to="/" className="flex items-center gap-3 px-6 mb-10 group/brand hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center font-bold text-white text-sm group-hover/brand:scale-110 transition-transform shadow-lg shadow-slate-900/10">N</div>
                <div>
                    <h1 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Public Directory</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Verified User Profile</p>
                </div>
            </Link>

            <nav className="flex-1 px-3 space-y-0.5">
                <SidebarItem active icon={<Info size={18} />} label="Overview" />
                <SidebarItem icon={<Package size={18} />} label="Products" disabled />
                <SidebarItem icon={<Users size={18} />} label="Network" disabled />
            </nav>

            <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50/50">
                 <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-[10px] overflow-hidden">
                        {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            profile?.name?.charAt(0) || '?'
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate">@{profile?.username || handle}</p>
                        <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Verified User</p>
                    </div>
                </div>
                <Link to="/register" className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10">
                    Get Started <ArrowUpRight size={12} />
                </Link>
            </div>
        </aside>
    );

    // Header Standardized
    const Header = () => (
        <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <h2 className="text-sm font-bold text-slate-900 capitalize">User Profile</h2>
                <div className="h-4 w-px bg-slate-200"></div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Online Cache v6.3</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Link to="/" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Home size={14} /> Marketplace
                </Link>
                <div className="h-4 w-px bg-slate-100"></div>
                <Link to="/chat" className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                    <MessageSquare size={18} />
                </Link>
            </div>
        </header>
    );

    if (error || !profile) {
        return (
            <div className="h-screen bg-[#fafafa] flex overflow-hidden font-sans text-slate-900 antialiased">
                <Sidebar />
                <main className="flex-1 flex flex-col min-w-0">
                    <Header />
                    <div className="flex-1 flex items-center justify-center p-12">
                         <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm animate-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-8 shadow-sm">
                                <Fingerprint size={32} />
                            </div>
                            <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4">Error 404</h4>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase mb-4">User Not Found</h3>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-10">
                                The specified user handle does not exist in our directory.
                            </p>
                            <Link to="/" className="inline-flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10">
                                Back to Directory
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#fafafa] flex overflow-hidden font-sans text-slate-900 antialiased">
            <Sidebar />
            
            <main className="flex-1 flex flex-col min-w-0 bg-white">
                <Header />
                
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
                        
                        {/* Profile Identity Card Standardized */}
                        <div className="relative group">
                            {/* Technical Banner */}
                            <div className="absolute -top-10 -left-10 -right-10 h-64 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 opacity-10 blur-3xl pointer-events-none group-hover:opacity-20 transition-opacity"></div>
                            
                            <div className="bg-white border border-slate-200 rounded-3xl p-10 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden shadow-sm transition-all hover:shadow-xl hover:border-slate-300">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
                                    <Crown size={150} />
                                </div>
                                
                                <div className="relative shrink-0">
                                    <div className="w-28 h-28 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center text-4xl font-bold text-slate-900 overflow-hidden">
                                        {profile.avatarUrl ? (
                                            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                                        ) : (
                                            profile.name?.charAt(0)
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-white shadow-lg"></div>
                                </div>

                                <div className="flex-1 text-center md:text-left relative z-10">
                                    <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                                        <h1 className="text-2xl font-bold text-slate-900 tracking-tighter uppercase">{profile.name}</h1>
                                        <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-full">
                                            {profile.rank || 'Standard User'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">User Handle: @{profile.username}</p>
                                    <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-2xl mx-auto md:mx-0">
                                        {profile.bio || "No biography provided by this user."}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 min-w-[180px] relative z-10">
                                    <button 
                                        onClick={handleOpenReport}
                                        className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                                            isReported 
                                            ? 'bg-rose-50 text-rose-600 border-rose-200 cursor-default' 
                                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                        }`}
                                    >
                                        <Flag size={12} /> {isReported ? 'Profile Reported' : 'Report Profile'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Metric Grid Standardized */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <AdminStatCard label="Total Contribution" value={(profile.xp || 0).toLocaleString()} change="ACTIVE" sub="Accumulated XP" icon={<Zap size={18} />} color="text-blue-600" />
                            <AdminStatCard label="Verification Status" value="01" change="STABLE" sub="Account Verified" icon={<ShieldCheck size={18} />} color="text-emerald-500" />
                            <AdminStatCard label="Published Assets" value={profile.products?.length || '00'} change={profile.products?.length > 0 ? "STABLE" : "EMPTY"} sub="Shared Templates" icon={<Package size={18} />} color="text-indigo-500" />
                            <AdminStatCard label="Live Showcases" value={profile.showcases?.length || '00'} change={profile.showcases?.length > 0 ? "ACTIVE" : "EMPTY"} sub="Production Links" icon={<Terminal size={18} />} color="text-slate-400" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             {/* Left Column: Technical Arsenal */}
                             <div className="lg:col-span-1 space-y-8">
                                 <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                         <Terminal size={14} className="text-blue-500" /> Engineering Arsenal
                                     </h3>
                                     <div className="flex flex-wrap gap-2">
                                         {Array.from(new Set(profile.products?.flatMap(p => p.techStack || []) || [])).length > 0 ? (
                                             Array.from(new Set(profile.products?.flatMap(p => p.techStack || []) || [])).map(tech => (
                                                 <span key={tech} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all cursor-default">
                                                     {tech}
                                                 </span>
                                             ))
                                         ) : (
                                             <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest p-4 border-2 border-dashed border-slate-50 rounded-xl w-full text-center">
                                                 No stack metadata available
                                             </div>
                                         )}
                                     </div>
                                 </div>

                                 <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                         <Globe size={14} className="text-indigo-500" /> Social Identity
                                     </h3>
                                     <div className="space-y-3">
                                         <SocialLink icon={<Github size={14} />} label="GitHub" value={profile.github} />
                                         <SocialLink icon={<Twitter size={14} />} label="Twitter" value={profile.twitter} />
                                         <SocialLink icon={<Globe size={14} />} label="Portfolio" value={profile.website} />
                                     </div>
                                 </div>
                             </div>

                             {/* Right Column: Experience & Gallery */}
                             <div className="lg:col-span-2 space-y-8">
                                 {/* Templates Gallery */}
                                 <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                                     <div className="flex items-center justify-between mb-8">
                                         <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                             <Package size={14} className="text-emerald-500" /> Template Gallery
                                         </h3>
                                         <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{profile.products?.length || 0} Assets</span>
                                     </div>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         {profile.products?.length > 0 ? (
                                             profile.products.map(product => (
                                                 <Link to={`/templates/${product.id}`} key={product.id} className="group/item relative bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden hover:border-slate-900 transition-all p-4">
                                                     <div className="aspect-video rounded-xl overflow-hidden bg-slate-200 mb-4 shadow-sm">
                                                         <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500" />
                                                     </div>
                                                     <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1 truncate">{product.title}</h4>
                                                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{product.category}</p>
                                                     <div className="absolute top-6 right-6 p-2 bg-white/90 backdrop-blur rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                         <ArrowUpRight size={14} className="text-slate-900" />
                                                     </div>
                                                 </Link>
                                             ))
                                         ) : (
                                             <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                                                 <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                                                     <Package size={24} />
                                                 </div>
                                                 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Gallery under maintenance</p>
                                             </div>
                                         )}
                                     </div>
                                 </div>

                                 {/* Deployment Showcase */}
                                 {profile.showcases?.length > 0 && (
                                     <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                                         <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                             <Zap size={14} className="text-rose-500" /> Production Pulse
                                         </h3>
                                         <div className="space-y-4">
                                             {profile.showcases.map(showcase => (
                                                 <a href={showcase.liveUrl} target="_blank" rel="noreferrer" key={showcase.id} className="flex items-center gap-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-900 transition-all group/pulse">
                                                     <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shadow-sm flex-shrink-0">
                                                         <img src={showcase.thumbnail} alt={showcase.projectName} className="w-full h-full object-cover" />
                                                     </div>
                                                     <div className="min-w-0 flex-1">
                                                         <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-tight mb-0.5">{showcase.projectName}</h4>
                                                         <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div> Local Deployment Stable
                                                         </p>
                                                     </div>
                                                     <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover/pulse:text-slate-900 group-hover/pulse:border-slate-900 transition-all">
                                                         <ExternalLink size={14} />
                                                     </div>
                                                 </a>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>
                    </div>
                </div>
                
                {/* Report Reason Modal */}
                {isReportModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsReportModalOpen(false)} />
                        <div className="relative bg-white rounded-3xl w-full max-w-md p-10 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
                            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
                                <AlertCircle size={24} />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight mb-2 uppercase">Report Profile</h2>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                                Please specify the reason for reporting <span className="font-bold text-slate-900">@{profile.username}</span>. Our moderation team will review this case within 24 hours.
                            </p>

                            <textarea 
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Violation details..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-medium outline-none focus:border-slate-900 focus:bg-white transition-all min-h-[120px] mb-8"
                            />

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setIsReportModalOpen(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleReportSubmit}
                                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const SidebarItem = ({ active, icon, label, disabled }) => (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
        disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-not-allowed'
    } ${
        active 
        ? 'bg-slate-100 text-slate-900 shadow-sm' 
        : disabled ? 'text-slate-300' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
    }`}>
        <span className={`${active ? 'text-blue-600' : disabled ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-600'}`}>{icon}</span>
        <span className="truncate">{label}</span>
    </div>
);

const AdminStatCard = ({ label, value, change, sub, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-lg bg-slate-50 border border-slate-100 ${color}`}>{icon}</div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${change === 'EMPTY' ? 'bg-slate-50 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>{change}</span>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 mb-1">{value}</h3>
        <p className="text-[10px] text-slate-300 font-medium tracking-tight">{sub}</p>
    </div>
);

const SocialLink = ({ icon, label, value }) => {
    const getHref = () => {
        if (!value) return null;
        if (label === 'GitHub') return `https://github.com/${value.replace('@', '')}`;
        if (label === 'Twitter') return `https://twitter.com/${value.replace('@', '')}`;
        if (value.startsWith('http')) return value;
        return `https://${value}`;
    };

    const href = getHref();

    return (
        <a 
            href={href || '#'}
            target={href ? "_blank" : undefined}
            rel="noopener noreferrer"
            onClick={(e) => !href && e.preventDefault()}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${value ? 'bg-slate-50 border-slate-100 hover:border-slate-900 group' : 'bg-slate-50/50 border-slate-50 opacity-40 cursor-not-allowed'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg bg-white border border-slate-100 ${value ? 'text-slate-900' : 'text-slate-200'}`}>{icon}</div>
                <div>
                   <p className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">{label}</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase truncate max-w-[80px]">{value || 'Not Sync'}</p>
                </div>
            </div>
            {value && <ArrowUpRight size={10} className="text-slate-300 group-hover:text-slate-900" />}
        </a>
    );
};

export default PublicProfile;
