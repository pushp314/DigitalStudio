import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import ConfigContext from '../context/ConfigContext';
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
    Search,
    ArrowUpRight,
    ExternalLink,
    Home,
    MessageSquare,
    Users,
    Flag,
    Info,
    AlertCircle,
    ChevronLeft
} from 'lucide-react';

const PublicProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { config } = useContext(ConfigContext);
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (config?.features?.profiles === false) {
        navigate('/');
        return null;
    }

    // Sidebar Branding Standardized (Responsive)
    const Sidebar = () => (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed inset-y-0 left-0 z-[101] w-72 bg-white border-r border-slate-200 flex flex-col pt-8 transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-50 lg:w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between px-6 mb-10 lg:block">
                    <Link to="/" className="flex items-center gap-3 group/brand hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center font-bold text-white text-sm group-hover/brand:scale-110 transition-transform shadow-lg shadow-slate-900/10">B</div>
                        <div>
                            <h1 className="text-xs font-bold text-slate-900 uppercase tracking-widest">BizCode</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Verified Seller</p>
                        </div>
                    </Link>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-900">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-3 space-y-0.5">
                    <SidebarItem active icon={<Info size={18} />} label="Overview" onClick={() => { navigate(`/@${handle}`); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={<Package size={18} />} label="Explore Apps" onClick={() => { navigate('/apps'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={<Users size={18} />} label="Community" onClick={() => { navigate('/chat'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={<ShieldCheck size={18} />} label="Support" onClick={() => { navigate('/support'); setIsSidebarOpen(false); }} />
                </nav>

                <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50/50">
                     <div className="flex items-center gap-3 px-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/account')}>
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-[10px] overflow-hidden">
                            {profile?.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                profile?.name?.charAt(0) || '?'
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-900 truncate">@{profile?.username || handle}</p>
                            <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Verified Seller</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );

    // Header Standardized
    const Header = () => (
        <header className="sticky top-0 z-40 h-16 sm:h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-slate-900">
                    <Menu size={20} />
                </button>
                <button 
                    onClick={() => navigate(-1)}
                    className="hidden sm:flex group p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-slate-500 hover:text-slate-900 shadow-sm"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div className="hidden sm:block h-8 w-px bg-slate-200" />
                <div className="flex flex-col">
                    <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">Member Profile</h2>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified Seller</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <Link to="/register" className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-900 text-white rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 scale-95 hover:scale-100">
                    <span className="hidden sm:inline">Join BizCode</span>
                    <span className="sm:hidden">Join</span>
                    <ArrowUpRight size={12} />
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
                    <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                        <div className="max-w-md w-full bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 text-center shadow-sm animate-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-8 shadow-sm">
                                <Search size={32} />
                            </div>
                            <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Profile Unavailable</h4>
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-4">Profile Not Found</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-10">
                                This seller profile is not published or could not be found.
                            </p>
                            <Link to="/apps" className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10">
                                Explore Inventory
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
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-700">
                        
                        {/* Profile Identity Card Standardized */}
                        <div className="relative group">
                            <div className="absolute -top-10 -left-10 -right-10 h-64 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 opacity-5 blur-3xl pointer-events-none group-hover:opacity-10 transition-opacity"></div>
                            
                            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-10 flex flex-col md:flex-row items-center gap-6 sm:gap-10 relative overflow-hidden shadow-sm transition-all hover:shadow-xl">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
                                    <Crown size={150} />
                                </div>
                                
                                <div className="relative shrink-0">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center text-3xl sm:text-4xl font-black text-slate-900 overflow-hidden">
                                        {profile.avatarUrl ? (
                                            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                                        ) : (
                                            profile.name?.charAt(0)
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-emerald-500 rounded-full border-4 border-white shadow-lg"></div>
                                </div>

                                <div className="flex-1 text-center md:text-left relative z-10">
                                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 mb-2">
                                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase">{profile.name}</h1>
                                        <span className="px-2.5 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                                            {profile.rank || 'Standard Member'}
                                        </span>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-6">Handle: @{profile.username}</p>
                                    <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed max-w-2xl mx-auto md:mx-0">
                                        {profile.bio || "No biography provided by this user."}
                                    </p>
                                </div>

                                <div className="w-full md:w-auto min-w-[180px] relative z-10">
                                    <button 
                                        onClick={handleOpenReport}
                                        className={`w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                            <AdminStatCard label="Activity Score" value={(profile.xp || 0).toLocaleString()} change="ACTIVE" sub="Contribution" icon={<Zap size={18} />} color="text-blue-600" />
                            <AdminStatCard label="Account Verification" value="01" change="STABLE" sub="Verified" icon={<ShieldCheck size={18} />} color="text-emerald-500" />
                            <AdminStatCard label="Listed Apps" value={profile.products?.length || '00'} change={profile.products?.length > 0 ? "STABLE" : "EMPTY"} sub="Approved" icon={<Package size={18} />} color="text-indigo-500" />
                            <AdminStatCard label="Live Demos" value={profile.showcases?.length || '00'} change={profile.showcases?.length > 0 ? "ACTIVE" : "EMPTY"} sub="Production" icon={<Terminal size={18} />} color="text-slate-400" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             {/* Left Column: Technical Arsenal */}
                             <div className="lg:col-span-1 space-y-6 sm:space-y-8">
                                 <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                         <Terminal size={14} className="text-blue-500" /> Tech Arsenal
                                     </h3>
                                     <div className="flex flex-wrap gap-2">
                                         {Array.from(new Set(profile.products?.flatMap(p => p.techStack || []) || [])).length > 0 ? (
                                             Array.from(new Set(profile.products?.flatMap(p => p.techStack || []) || [])).map(tech => (
                                                 <span key={tech} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all cursor-default">
                                                     {tech}
                                                 </span>
                                             ))
                                         ) : (
                                             <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest p-6 border-2 border-dashed border-slate-50 rounded-2xl w-full text-center">
                                                 No data available
                                             </div>
                                         )}
                                     </div>
                                 </div>

                                 <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                         <Globe size={14} className="text-indigo-500" /> Connection Points
                                     </h3>
                                     <div className="space-y-3">
                                         <SocialLink icon={<Github size={14} />} label="GitHub" value={profile.github} />
                                         <SocialLink icon={<Twitter size={14} />} label="Twitter" value={profile.twitter} />
                                         <SocialLink icon={<Globe size={14} />} label="Portfolio" value={profile.website} />
                                     </div>
                                 </div>
                             </div>

                             {/* Right Column: Experience & Gallery */}
                             <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                                 {/* Product Gallery */}
                                 <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                                     <div className="flex items-center justify-between mb-8">
                                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                             <Package size={14} className="text-emerald-500" /> App Inventory
                                         </h3>
                                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{profile.products?.length || 0} Items</span>
                                     </div>
                                     
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                         {profile.products?.length > 0 ? (
                                             profile.products.map(product => (
                                                 <Link to={`/apps/${product.id}`} key={product.id} className="group/item relative bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden hover:border-slate-900 transition-all p-4">
                                                     <div className="aspect-video rounded-xl overflow-hidden bg-slate-200 mb-4 shadow-sm">
                                                         <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500" />
                                                     </div>
                                                     <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1 truncate">{product.title}</h4>
                                                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{product.category}</p>
                                                     <div className="absolute top-6 right-6 p-2 bg-white/90 backdrop-blur rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity shadow-lg">
                                                         <ArrowUpRight size={14} className="text-slate-900" />
                                                     </div>
                                                 </Link>
                                             ))
                                         ) : (
                                             <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-50 rounded-[2rem]">
                                                 <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                                                     <Package size={24} />
                                                  </div>
                                                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No items published yet</p>
                                             </div>
                                         )}
                                     </div>
                                 </div>

                                 {/* Deployment Showcase */}
                                 {profile.showcases?.length > 0 && (
                                     <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                             <Zap size={14} className="text-rose-500" /> Live Deployments
                                         </h3>
                                         <div className="space-y-4">
                                             {profile.showcases.map(showcase => (
                                                 <a href={showcase.liveUrl} target="_blank" rel="noreferrer" key={showcase.id} className="flex items-center gap-4 sm:gap-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-900 transition-all group/pulse">
                                                     <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shadow-sm flex-shrink-0">
                                                         <img src={showcase.thumbnail} alt={showcase.projectName} className="w-full h-full object-cover" />
                                                     </div>
                                                     <div className="min-w-0 flex-1">
                                                         <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-tight mb-0.5 truncate">{showcase.projectName}</h4>
                                                         <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div> Live
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
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsReportModalOpen(false)} />
                        <div className="relative bg-white rounded-[2rem] w-full max-w-md p-8 sm:p-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 border border-rose-100 shadow-sm shadow-rose-100/50">
                                <AlertCircle size={24} />
                            </div>
                            <h2 className="text-xl font-black tracking-tight mb-2 uppercase">Report Profile</h2>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mb-8">
                                Specify violation details for <span className="font-black text-slate-900">@{profile.username}</span>. Our team will review within 24 hours.
                            </p>

                            <textarea 
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Violation details..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-medium outline-none focus:border-slate-900 focus:bg-white transition-all min-h-[120px] mb-8"
                            />

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setIsReportModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleReportSubmit}
                                    className="flex-1 py-4 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const SidebarItem = ({ active, icon, label, disabled, onClick }) => (
    <button 
        onClick={!disabled ? onClick : undefined}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all group ${
        disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
    } ${
        active 
        ? 'bg-slate-100 text-slate-900 shadow-sm' 
        : disabled ? 'text-slate-300' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
    }`}>
        <span className={`${active ? 'text-blue-600' : disabled ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-500'}`}>{icon}</span>
        <span className="truncate">{label}</span>
    </button>
);

const AdminStatCard = ({ label, value, change, sub, icon, color }) => (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl bg-slate-50 border border-slate-100 ${color}`}>{icon}</div>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${change === 'EMPTY' ? 'bg-slate-50 text-slate-300' : 'bg-emerald-50 text-emerald-600'}`}>{change}</span>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter mt-1 mb-1">{value}</h3>
        <p className="text-[10px] text-slate-300 font-medium tracking-tight uppercase">{sub}</p>
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
                <div className="min-w-0">
                   <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{label}</p>
                   <p className="text-[8px] font-black text-slate-300 uppercase truncate max-w-[80px] sm:max-w-[120px]">{value || 'Not Linked'}</p>
                </div>
            </div>
            {value && <ArrowUpRight size={10} className="text-slate-300 group-hover:text-slate-900 flex-shrink-0" />}
        </a>
    );
};

export default PublicProfile;
