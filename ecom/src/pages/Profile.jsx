import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AuthContext from '../context/AuthContext';
import api, { API_URL } from '../services/api';
import { 
    Settings, Shield, CreditCard, Github, 
    Globe, Twitter, ExternalLink, LogOut, 
    LayoutDashboard, Bell, Package,
    Edit3, Check, ShieldCheck, Crown, Zap, History,
     ArrowUpRight, MessageSquare,
    Home, HelpCircle, User, Camera, 
    Download, ShoppingBag, Share2, Eye, Trash2,
    Settings2, AtSign, Lock, AlertCircle, Send, RefreshCw,
    Wallet, Users, QrCode, Link as LinkIcon, X,
    Key, Copy, Monitor, Activity
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import OAuthButton from '../components/ui/OAuthButton';
import AvatarCropModal from '../components/ui/AvatarCropModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const Profile = () => {
    const { user, setUser, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { success, error: toastError, info } = useToast();
    const fileInputRef = useRef(null);

    const [cropModal, setCropModal] = useState({ isOpen: false, image: null });
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        confirmText: '',
        onConfirm: () => {}, 
        type: 'warning' 
    });
    const queryParams = new URLSearchParams(location.search);
    const activeTab = queryParams.get('tab') || 'overview';

    const tabNames = {
        overview: 'Account Overview',
        assets: 'My Products',
        licenses: 'License Keys',
        billing: 'Billing & Invoices',
        studio: 'Sell Your Project',
        messages: 'Support Inbox',
        affiliate: 'Partner Portal',
        referral: 'Referral Program',
        settings: 'Profile Settings',
        security: 'Security & Privacy',
        notifications: 'Notifications',
    };

    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        bio: user?.bio || '',
        website: user?.website || '',
        twitter: user?.twitter || '',
        github: user?.github || '',
        avatarUrl: user?.avatarUrl || ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                username: user.username || '',
                bio: user.bio || '',
                website: user.website || '',
                twitter: user.twitter || '',
                github: user.github || '',
                avatarUrl: user.avatarUrl || ''
            });
        }
    }, [user]);

    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
    
    // Data Queries
    const { data: ownedAssets } = useQuery({
        queryKey: ['owned-assets'],
        queryFn: () => api.get('/products/owned'),
        enabled: activeTab === 'assets' || activeTab === 'overview'
    });

    const { data: orders } = useQuery({
        queryKey: ['my-orders'],
        queryFn: () => api.get('/orders/myorders'),
        enabled: activeTab === 'billing'
    });

    const { data: inquiries, refetch: refetchInquiries } = useQuery({
        queryKey: ['my-inquiries'],
        queryFn: () => api.get('/profile/inquiries'),
        enabled: activeTab === 'messages'
    });

    const updateProfile = useMutation({
        mutationFn: (data) => api.put('/profile', data),
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            queryClient.invalidateQueries(['me']);
            success('Profile updated');
            setIsEditing(false);
        },
        onError: (err) => toastError(err.message || 'Update failed')
    });

    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toastError("Image exceeds 2MB limit");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setCropModal({ isOpen: true, image: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const finalizeAvatarUpload = async (blob) => {
        setCropModal({ isOpen: false, image: null });
        setIsUploading(true);
        const fileName = `avatar-${user.id}-${Date.now()}.webp`;
        const file = new File([blob], fileName, { type: 'image/webp' });
        
        const uploadData = new FormData();
        uploadData.append('file', file);
        try {
            const res = await api.post('/profile/upload-avatar', uploadData);
            if (res.url) {
                const newAvatarUrl = res.url;
                setFormData(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
                await updateProfile.mutateAsync({ ...formData, avatarUrl: newAvatarUrl });
                success("Profile picture updated");
            }
        } catch (err) {
            toastError("Upload failed: " + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleAIsuggestUsername = async () => {
        if (!formData.name) {
            info("Profile setup requires your full name.");
            return;
        }
        setIsSuggesting(true);
        try {
            const res = await api.post('/ai/suggest-usernames', { name: formData.name });
            if (res.suggestions) setSuggestions(res.suggestions);
            success("Profile handle suggestions generated.");
        } catch (err) {
            toastError("Could not generate username ideas.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDownloadAsset = async (asset) => {
        try {
            const response = await api.get(`/products/${asset.id}/download`);
            if (!response?.downloadUrl) {
                throw new Error('Download link is unavailable right now.');
            }
            window.location.assign(response.downloadUrl);
        } catch (err) {
            toastError(err.message || 'Unable to start the download.');
        }
    };

    const setTab = (tab) => navigate(`/account?tab=${tab}`);

    // --- Tab Components ---

    const { data: authoredAssets, refetch: refetchAuthored } = useQuery({
        queryKey: ['authored-assets'],
        queryFn: () => api.get(`/profile/${user.username}`),
        select: (data) => data.products || [],
        enabled: activeTab === 'studio'
    });

    const unpublishTemplate = useMutation({
        mutationFn: (id) => api.put(`/products/${id}`, { moderationStatus: 'pending' }),
        onSuccess: () => {
            success("Project unpublished and moved to pending review.");
            refetchAuthored();
        },
        onError: (err) => toastError(err.message || "Failed to unpublish project.")
    });

    const deleteTemplate = useMutation({
        mutationFn: (id) => api.delete(`/products/${id}`),
        onSuccess: () => {
            success("Project record deleted.");
            refetchAuthored();
        },
        onError: (err) => toastError(err.message || "Failed to delete project.")
    });

    const BenefitItem = ({ icon, text, action }) => (
        <button onClick={action} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left w-full">
            <div className="text-amber-400">{icon}</div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{text}</span>
        </button>
    );

    const EliteBenefitsCard = () => {
        if (user?.subscriptionPlan !== 'elite') return null;
        return (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl text-white relative overflow-hidden group shadow-2xl shadow-indigo-900/40">
                <div className="absolute -top-10 -right-10 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Crown size={180} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Crown size={16} className="text-amber-400" fill="currentColor" />
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Elite Member Benefits</p>
                    </div>
                    <h4 className="text-xl font-bold tracking-tight mb-6 leading-tight">Exclusive access to high-priority channels and custom builds.</h4>
                    <div className="space-y-3 mb-8">
                        <BenefitItem icon={<MessageSquare size={14} />} text="Private Developer Channel" action={() => window.open('https://discord.gg/your-link', '_blank')} />
                        <BenefitItem icon={<Send size={14} />} text="1 Free Custom Build Request" action={() => setTab('messages')} />
                        <BenefitItem icon={<ShieldCheck size={14} />} text="Commercial License Active" action={() => setTab('assets')} />
                    </div>
                    <Link to="/pricing" className="block w-full py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl text-[10px] font-bold text-center uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">Manage Subscription</Link>
                </div>
            </div>
        );
    };

    const OverviewTab = () => (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Account Level" value={user?.isPro ? (user?.subscriptionPlan === 'elite' ? 'Elite' : 'Pro Member') : 'Free Member'} change="Active" sub={`Member ID: ${user?.id}`} icon={<Crown size={18} />} color={user?.isPro ? "text-amber-500" : "text-slate-900"} />
                <StatCard label="Reward Points" value={(user?.xp || 0).toLocaleString()} change="+5%" sub="Community Experience" icon={<Zap size={18} />} color="text-blue-600" />
                <StatCard label="Owned Products" value={ownedAssets?.length || 0} change="Verified" sub="Purchased apps and kits" icon={<Package size={18} />} color="text-emerald-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-white ring-1 ring-slate-100 shadow-xl overflow-hidden flex-shrink-0">
                                     {user?.avatarUrl ? <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-slate-200" />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">{user?.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg inline-block">@{user?.username}</p>
                                        {user?.isPro && (
                                            <span className="text-[8px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md uppercase tracking-widest">Pro</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setTab('settings')} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                <Settings2 size={20} />
                            </button>
                        </div>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-xl">
                            {user?.bio || "No bio established yet. Update your profile settings to share more about yourself."}
                        </p>
                    </div>

                    {user?.isPro && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Zap size={120} />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <ShieldCheck size={16} className="text-emerald-500" /> Active Membership
                                    </h3>
                                    <p className="text-lg font-bold text-slate-900 tracking-tight capitalize">
                                        {user.subscriptionPlan} Access
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                        Expires: {user.proExpiresAt ? new Date(user.proExpiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Lifetime'}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => navigate('/pricing')}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg"
                                >
                                    Renew / Upgrade
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                             <Shield size={16} className="text-blue-600" /> Security Status
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all shadow-sm">
                                        <Lock size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">Account Security</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Password last updated recently</p>
                                    </div>
                                </div>
                                <button onClick={() => setTab('security')} className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Manage</button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-all shadow-sm">
                                        <History size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">Recent Activity</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Logged in from current device</p>
                                    </div>
                                </div>
                                <button className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest">View Logs</button>
                            </div>
                        </div>
                    </div>
                </div>

                    <div className="space-y-6">
                        <EliteBenefitsCard />
                        
                        {!user?.isPro && (
                            <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden group shadow-2xl shadow-slate-900/40">
                                <div className="absolute -top-10 -right-10 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <Zap size={180} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Pro Membership</p>
                                    <h4 className="text-xl font-bold tracking-tight mb-8 leading-tight">Get priority help, premium guides, and better community access.</h4>
                                    <Link to="/pricing" className="block w-full py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-bold text-center uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">Compare Plans</Link>
                                </div>
                            </div>
                        )}
                    
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center group">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                             <HelpCircle size={20} />
                        </div>
                        <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-2">Need Help?</h5>
                        <p className="text-[10px] text-slate-400 font-medium mb-6">Open help for setup, deployment, or purchase questions.</p>
                        <button onClick={() => navigate('/support')} className="w-full py-3 border-2 border-slate-100 rounded-xl text-[10px] font-bold text-slate-900 uppercase tracking-widest hover:border-slate-900 transition-all">Open Support Request</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const AssetsTab = () => (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">My Products</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apps, kits, dashboards, and assets you have purchased.</p>
                </div>
                <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{ownedAssets?.length || 0} Items</span>
                </div>
            </div>

            {!ownedAssets || ownedAssets.length === 0 ? (
                <div className="py-32 px-10 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm max-w-4xl mx-auto">
                     <Package size={48} className="mx-auto text-slate-100 mb-8" />
                     <h4 className="text-2xl font-bold text-slate-900 uppercase tracking-tight mb-4">No ready products in your vault</h4>
                     <p className="text-sm text-slate-500 max-w-lg mx-auto mb-10 leading-relaxed">
                        You haven't purchased any ready-to-use apps or assets yet. You can explore our catalog, compare membership plans for better pricing, or ask us for a custom recommendation.
                     </p>
                     <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/apps" className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-all">Explore Apps</Link>
                        <Link to="/pricing" className="px-10 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">Compare Plans</Link>
                        <Link to="/contact" className="w-full mt-4 text-[11px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Get help choosing a product</Link>
                     </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {ownedAssets.map(asset => (
                        <div key={asset.id} className="group bg-white rounded-[2.5rem] border border-slate-200 hover:border-blue-600 transition-all overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-600/10 flex flex-col h-full">
                            <div className="aspect-[16/10] bg-slate-50 relative overflow-hidden">
                                 {asset.image ? (
                                     <img src={asset.image} alt={asset.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center text-slate-100">
                                         <Package size={48} />
                                     </div>
                                 )}
                                 <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-widest shadow-xl border border-white/20">
                                      {asset.category}
                                 </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col">
                                <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-2 group-hover:text-blue-600 transition-colors leading-tight">{asset.title}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                                     <Check size={12} className="text-emerald-500" /> Active License
                                </p>
                                <div className="mt-auto flex items-center gap-3">
                                    <Link to={`/apps/${asset.id}`} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest text-center hover:bg-blue-600 transition-all">
                                         View Product
                                    </Link>
                                    <button onClick={() => handleDownloadAsset(asset)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all" title="Download product">
                                         <Download size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {ownedAssets?.length > 0 && (
                <div className="grid md:grid-cols-3 gap-6 pt-12 border-t border-slate-100">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-sm mb-4">
                            <ExternalLink size={18} />
                        </div>
                        <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-2">1. Deployment Guides</h4>
                        <p className="text-[10px] text-slate-500 font-medium mb-4 leading-relaxed">Read technical documentation for setup, environment config, and cloud deployment.</p>
                        <Link to="/docs" className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Browse Docs</Link>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-sm mb-4">
                            <MessageSquare size={18} />
                        </div>
                        <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-2">2. Community Chat</h4>
                        <p className="text-[10px] text-slate-500 font-medium mb-4 leading-relaxed">Connect with other builders and get informal help in the community chat.</p>
                        <Link to="/chat" className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Open Chat</Link>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-sm mb-4">
                            <HelpCircle size={18} />
                        </div>
                        <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-2">3. Setup Assistance</h4>
                        <p className="text-[10px] text-slate-500 font-medium mb-4 leading-relaxed">Need us to handle it? Request expert setup or customization services.</p>
                        <Link to="/support" className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Get Expert Help</Link>
                    </div>
                </div>
            )}
        </div>
    );

    // ==================== LICENSES TAB ====================
    const { data: licensesData } = useQuery({
        queryKey: ['my-licenses'],
        queryFn: () => api.get('/licenses/my'),
        enabled: activeTab === 'licenses',
    });

    const handleCopyKey = (key) => {
        navigator.clipboard.writeText(key);
        success('Copied to clipboard');
    };

    const handleDeactivateLicense = async (licenseId, activationId) => {
        try {
            await api.post('/licenses/deactivate', { licenseId, activationId });
            success('Activation deactivated');
            queryClient.invalidateQueries(['my-licenses']);
        } catch (err) {
            error(err.message || 'Failed to deactivate');
        }
    };

    const LicensesTab = () => {
        const licenses = licensesData?.licenses || [];
        return (
            <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">License Keys</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signed licenses for your purchased products.</p>
                    </div>
                    <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{licenses.length} Licenses</span>
                    </div>
                </div>

                {licenses.length === 0 ? (
                    <div className="py-32 px-10 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm max-w-4xl mx-auto">
                        <Key size={48} className="mx-auto text-slate-100 mb-8" />
                        <h4 className="text-2xl font-bold text-slate-900 uppercase tracking-tight mb-4">No licenses yet</h4>
                        <p className="text-sm text-slate-500 max-w-lg mx-auto mb-10 leading-relaxed">
                            Licenses are automatically issued when you purchase a product.
                        </p>
                        <Link to="/apps" className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-all">Browse Products</Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {licenses.map(lic => (
                            <div key={lic.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${lic.status === 'active' ? 'bg-emerald-500' : lic.status === 'suspended' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{lic.product?.title || `Product #${lic.productId}`}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {lic.status} &middot; Plan: {lic.plan} &middot; {lic.activationCount}/{lic.maxActivations} activations
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleCopyKey(lic.licenseKey)} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[9px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                                        <Copy size={12} /> Copy Key
                                    </button>
                                </div>
                                <div className="px-8 py-4">
                                    <code className="text-[10px] font-mono text-slate-500 bg-slate-50 px-4 py-2 rounded-lg block overflow-x-auto">{lic.licenseKey}</code>
                                </div>
                                {lic.activations?.length > 0 && (
                                    <div className="px-8 py-4 border-t border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Active Deployments</p>
                                        <div className="space-y-2">
                                            {lic.activations.map(act => (
                                                <div key={act.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <Monitor size={14} className="text-slate-400" />
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-700">{act.fingerprintValue}</p>
                                                            <p className="text-[8px] text-slate-400 uppercase">{act.fingerprintType} &middot; {new Date(act.activatedAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeactivateLicense(lic.id, act.id)} className="text-[8px] font-bold text-rose-500 uppercase tracking-widest hover:text-rose-700">
                                                        Deactivate
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // ==================== AFFILIATE TAB ====================
    const { data: affiliateData, refetch: refetchAffiliate } = useQuery({
        queryKey: ['my-affiliate'],
        queryFn: () => api.get('/affiliate/dashboard'),
        enabled: activeTab === 'affiliate',
        retry: false,
    });

    const [payoutAmount, setPayoutAmount] = useState('');

    const handleApplyAffiliate = async () => {
        try {
            await api.post('/affiliate/apply', { displayName: user?.name, payoutEmail: user?.email });
            success('Affiliate application submitted!');
            refetchAffiliate();
        } catch (err) {
            error(err.message || 'Failed to apply');
        }
    };

    const handleRequestPayout = async () => {
        const amount = parseFloat(payoutAmount);
        if (!amount || amount <= 0) { error('Enter a valid amount'); return; }
        try {
            await api.post('/affiliate/payout-request', { amount, method: 'bank_transfer' });
            success('Payout request submitted for review');
            setPayoutAmount('');
            refetchAffiliate();
        } catch (err) {
            error(err.message || 'Failed to request payout');
        }
    };

    const AffiliateTab = () => {
        const aff = affiliateData?.affiliate;
        if (!aff) {
            return (
                <div className="py-32 px-10 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm max-w-4xl mx-auto animate-in fade-in duration-500">
                    <Users size={48} className="mx-auto text-slate-100 mb-8" />
                    <h4 className="text-2xl font-bold text-slate-900 uppercase tracking-tight mb-4">Become a Partner</h4>
                    <p className="text-sm text-slate-500 max-w-lg mx-auto mb-10 leading-relaxed">
                        Earn commission by referring customers. Get your unique referral link and start earning.
                    </p>
                    <button onClick={handleApplyAffiliate} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-all">
                        Apply for Partner Program
                    </button>
                </div>
            );
        }

        if (aff.status === 'pending') {
            return (
                <div className="py-20 px-10 text-center bg-amber-50 rounded-[3rem] border border-amber-200 max-w-4xl mx-auto animate-in fade-in duration-500">
                    <AlertCircle size={48} className="mx-auto text-amber-400 mb-6" />
                    <h4 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-3">Application Under Review</h4>
                    <p className="text-sm text-slate-600">Your application is being reviewed. You will be notified once approved.</p>
                </div>
            );
        }

        const convs = affiliateData?.recentConversions || [];

        return (
            <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[{ label: 'Total Clicks', value: aff.totalClicks, icon: <Eye size={16} /> },
                      { label: 'Conversions', value: aff.totalConversions, icon: <Activity size={16} /> },
                      { label: 'Pending Balance', value: `₹${aff.pendingBalance?.toLocaleString()}`, icon: <Wallet size={16} /> },
                      { label: 'Total Earned', value: `₹${aff.totalEarnings?.toLocaleString()}`, icon: <CreditCard size={16} /> },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="text-slate-400 mb-3">{stat.icon}</div>
                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-8">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Your Referral Code</h4>
                    <div className="flex items-center gap-4">
                        <code className="flex-1 bg-slate-50 px-6 py-4 rounded-2xl font-mono text-sm font-bold text-slate-900">{aff.referralCode}</code>
                        <button onClick={() => handleCopyKey(aff.referralCode)} className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all">
                            <Copy size={14} />
                        </button>
                    </div>
                </div>

                {aff.pendingBalance > 0 && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-8">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Request Payout</h4>
                        <div className="flex items-center gap-4">
                            <input type="number" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} placeholder="Amount" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold" />
                            <button onClick={handleRequestPayout} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all">Request</button>
                        </div>
                    </div>
                )}

                {convs.length > 0 && (
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Recent Conversions</h4>
                        </div>
                        <table className="w-full">
                            <thead><tr className="bg-slate-50">
                                <th className="px-8 py-4 text-left text-[9px] font-bold text-slate-400 uppercase">Order</th>
                                <th className="px-8 py-4 text-left text-[9px] font-bold text-slate-400 uppercase">Commission</th>
                                <th className="px-8 py-4 text-left text-[9px] font-bold text-slate-400 uppercase">Status</th>
                                <th className="px-8 py-4 text-left text-[9px] font-bold text-slate-400 uppercase">Date</th>
                            </tr></thead>
                            <tbody>
                                {convs.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition">
                                        <td className="px-8 py-4 text-xs font-bold text-slate-900">#{c.orderId}</td>
                                        <td className="px-8 py-4 text-xs font-bold text-emerald-600">₹{c.commissionAmount}</td>
                                        <td className="px-8 py-4"><span className="text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-600">{c.commissionStatus}</span></td>
                                        <td className="px-8 py-4 text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const SettingsTab = () => (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                             <User size={16} className="text-blue-600" /> Profile Details
                        </h3>
                    </div>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest">Cancel</button>
                            <button onClick={() => updateProfile.mutate(formData)} className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg">Save Changes</button>
                        </div>
                    )}
                </div>
                <div className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <Field label="Full Name" icon={<User size={14} />} value={formData.name} onChange={v => setFormData({...formData, name: v})} disabled={!isEditing} />
                        <div className="space-y-3 relative group">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username Handle</label>
                                {isEditing && (
                                    <button 
                                        type="button"
                                        onClick={handleAIsuggestUsername}
                                        disabled={isSuggesting}
                                        className="text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1.5 transition-all"
                                    >
                                        {isSuggesting ? <RefreshCw size={10} className="animate-spin" /> : <Zap size={10} />} Suggest Handle
                                </button>
                                )}
                            </div>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"><AtSign size={14} /></div>
                                <input 
                                    disabled={!isEditing || (user?.lastUsernameChangeAt && new Date(new Date(user.lastUsernameChangeAt).getTime() + 30 * 24 * 60 * 60 * 1000) > new Date())}
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    className={`w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-xs font-bold transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 ${(!isEditing || (user?.lastUsernameChangeAt && new Date(new Date(user.lastUsernameChangeAt).getTime() + 30 * 24 * 60 * 60 * 1000) > new Date())) ? 'text-slate-400' : 'text-slate-900 animate-in fade-in'}`}
                                    placeholder="your_handle"
                                />
                            </div>
                            {isEditing && (user?.lastUsernameChangeAt && new Date(new Date(user.lastUsernameChangeAt).getTime() + 30 * 24 * 60 * 60 * 1000) > new Date()) && (
                                <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest ml-2 flex items-center gap-1.5 mt-1">
                                    <Lock size={10} /> Handle Locked (Available: {new Date(new Date(user.lastUsernameChangeAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()})
                                </p>
                            )}
                            {suggestions.length > 0 && isEditing && (
                                <div className="mt-3 flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-300">
                                    {suggestions.map(s => (
                                        <button 
                                            key={s} 
                                            onClick={() => { setFormData({...formData, username: s}); setSuggestions([]); }}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"
                                        >
                                            @{s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
                            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold text-slate-400 flex items-center justify-between">
                                 {user?.email}
                                 <ShieldCheck size={14} className="text-emerald-500" />
                            </div>
                        </div>
                        <Field label="Website Portfolio" icon={<Globe size={14} />} value={formData.website} onChange={v => setFormData({...formData, website: v})} disabled={!isEditing} placeholder="https://example.com" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Bio / Professional Summary</label>
                        <textarea disabled={!isEditing} value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 min-h-[160px] resize-none transition-all placeholder:text-slate-300" placeholder="Tell us about yourself..." />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2">
                      <Zap size={14} className="text-amber-500" /> Social Integrations
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <Field label="X / Twitter" icon={<Twitter size={14} />} value={formData.twitter} onChange={v => setFormData({...formData, twitter: v})} disabled={!isEditing} placeholder="@username" />
                        <Field label="GitHub ID" icon={<Github size={14} />} value={formData.github} onChange={v => setFormData({...formData, github: v})} disabled={!isEditing} placeholder="github_id" />
                     </div>
                     <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col justify-center gap-6">
                         {user?.github ? (
                             <>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-lg">
                                            <Github size={14} />
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-900 uppercase">Identity Verified</h4>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed">Your GitHub identity is currently synchronized. To update or unlink, please submit a formal request.</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        const reason = prompt("Please state the reason for identity update:");
                                        if (reason) {
                                            api.post('/profile/github-request', { reason })
                                                .then(() => success("Identity update request submitted."))
                                                .catch(err => toastError(err.message));
                                        }
                                    }}
                                    className="w-full py-3 border-2 border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all"
                                >
                                    Request Identity Update
                                </button>
                             </>
                         ) : (
                             <>
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase">Sync GitHub Identity</h4>
                                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed">Connect your developer identity to verify contributions and unlock exclusive badges.</p>
                                </div>
                                <OAuthButton 
                                    provider="GitHub" 
                                    variant="slate" 
                                    onClick={() => {
                                        const token = localStorage.getItem('token');
                                        window.location.href = `${API_URL}/auth/github/connect?token=${token}`;
                                    }} 
                                />
                             </>
                         )}
                     </div>
                 </div>
            </div>
        </div>
    );

    const SecurityTab = () => {
        const [pwData, setPwData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
        const [changing, setChanging] = useState(false);

        const handleChangePw = async (e) => {
            e.preventDefault();
            if (pwData.newPassword !== pwData.confirmPassword) return toastError("Passwords do not match.");
            setChanging(true);
            try {
                await api.post('/profile/change-password', { oldPassword: pwData.oldPassword, newPassword: pwData.newPassword });
                success("Password updated successfully.");
                setPwData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } catch (err) {
                toastError(err.message || "Failed to update password.");
            } finally {
                setChanging(false);
            }
        };

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-10">
                    <div className="text-center mb-10">
                         <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-6">
                              <Lock size={24} />
                         </div>
                         <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-2">Change Password</h3>
                         <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Update your security credentials.</p>
                    </div>
                    
                    <form onSubmit={handleChangePw} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Current Password</label>
                            <input type="password" required value={pwData.oldPassword} onChange={e => setPwData({...pwData, oldPassword: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold focus:bg-white focus:outline-none transition-all" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">New Password</label>
                                <input type="password" required value={pwData.newPassword} onChange={e => setPwData({...pwData, newPassword: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold focus:bg-white focus:outline-none transition-all" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Confirm New Password</label>
                                <input type="password" required value={pwData.confirmPassword} onChange={e => setPwData({...pwData, confirmPassword: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold focus:bg-white focus:outline-none transition-all" />
                            </div>
                        </div>
                        <button type="submit" disabled={changing} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 mt-4">
                            {changing ? <RefreshCw className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Update Password
                        </button>
                    </form>
                </div>

                <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 flex items-start gap-4">
                    <AlertCircle className="text-rose-600 shrink-0 mt-1" size={18} />
                    <div>
                         <h4 className="text-[11px] font-bold text-rose-600 uppercase tracking-widest mb-1">Security Notice</h4>
                         <p className="text-[9px] text-rose-500 font-medium leading-relaxed">Updating your password will sign you out of all other active sessions for your protection.</p>
                    </div>
                </div>
            </div>
        );
    };

    const NotificationsTab = () => {
        const [settings, setSettings] = useState({ email: true, inApp: true, marketing: false, security: true });
        
        const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                             <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-1">Notification Preferences</h3>
                             <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Manage how you receive updates and alerts.</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                             <Bell size={20} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <ToggleSetting label="Email Notifications" sub="Receive invoices, product updates, and key information" active={settings.email} onClick={() => toggle('email')} />
                        <ToggleSetting label="In-App Notifications" sub="Real-time alerts while browsing the marketplace" active={settings.inApp} onClick={() => toggle('inApp')} />
                        <ToggleSetting label="Marketing Communications" sub="Special offers, new arrivals, and marketplace highlights" active={settings.marketing} onClick={() => toggle('marketing')} />
                        <ToggleSetting label="Security Alerts" sub="Immediate notice of login activity or account changes" active={settings.security} onClick={() => toggle('security')} />
                    </div>
                    
                    <button onClick={() => success("Notification settings updated.")} className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">Save Preferences</button>
                </div>
            </div>
        );
    };

    const ReferralTab = () => {
        const referralLink = `${window.location.origin}/register?ref=${user?.partnerCode || ''}`;
        
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
                         <div className="absolute top-0 right-0 p-8 opacity-10">
                              <Wallet size={100} />
                         </div>
                         <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Earnings History</p>
                         <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-2">Available Balance</h4>
                         <h3 className="text-4xl font-bold tracking-tight mb-8">₹{(user?.partnerBalance || 0).toLocaleString()}</h3>
                         <button onClick={() => info("Withdrawal requires a minimum balance of ₹1,000.")} className="px-8 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-50 transition-all">Withdraw Funds</button>
                     </div>
                     <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm flex flex-col justify-between">
                         <div className="flex items-center justify-between mb-8">
                              <div>
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Affiliate ID</h4>
                                  <h3 className="text-xl font-bold text-slate-900 uppercase">{user?.partnerCode || 'DEFAULT'}</h3>
                              </div>
                              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                   <QrCode size={32} className="text-slate-900" />
                              </div>
                         </div>
                         <div className="space-y-4">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Your Referral Link</label>
                             <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group">
                                 <span className="text-[10px] font-medium text-slate-400 truncate pr-4">{referralLink}</span>
                                 <button onClick={() => { navigator.clipboard.writeText(referralLink); success("Referral link copied to clipboard."); }} className="p-2 text-slate-400 hover:text-slate-900 transition-all">
                                      <LinkIcon size={16} />
                                 </button>
                             </div>
                         </div>
                     </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                         <Users size={16} className="text-blue-600" /> Program Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                         <ProgramDetail label="Total Referrals" val="0" />
                         <ProgramDetail label="Active Conversions" val="0" />
                         <ProgramDetail label="Recent Clicks" val="0" />
                         <ProgramDetail label="Success Rate" val="0.0%" />
                    </div>
                </div>
            </div>
        );
    };

    const BillingTab = () => (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500 pb-20">
            <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard size={16} className="text-blue-600" /> Billing History
                 </h3>
            </div>
            <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-50">
                            <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
                            <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                            <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Invoice</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {!orders || orders.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-32 text-center">
                                     <div className="max-w-xs mx-auto">
                                          <ShoppingBag size={32} className="text-slate-100 mx-auto mb-6" />
                                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">No transactions recorded</p>
                                     </div>
                                </td>
                            </tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-6">
                                        <p className="text-xs font-bold text-slate-900">#ORD-{order.id}</p>
                                        {(order.addDeploymentService || order.add_deployment_service) && (
                                            <span className="mt-1 inline-flex items-center gap-1 text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                                                + Deployment Service
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-10 py-6 text-xs font-medium text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-10 py-6 text-xs font-bold text-slate-900">₹{order.totalPrice.toLocaleString()}</td>
                                    <td className="px-10 py-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm border ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <button 
                                            onClick={() => setSelectedOrderForInvoice(order)}
                                            className="p-2 text-slate-400 hover:text-slate-900 transition-all border border-slate-100 rounded-lg hover:border-slate-900"
                                        >
                                             <Download size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const InvoiceModal = ({ order, onClose }) => {
        if (!order) return null;

        const handlePrint = () => {
             window.print();
        };

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose}></div>
                
                <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:rounded-none print:max-h-full">
                    <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center print:hidden">
                        <div>
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Order Invoice</h3>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Official Transaction Record</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all">
                                <Download size={14} /> Download PDF
                            </button>
                            <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-900 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div id="invoice-content" className="p-12 md:p-16 overflow-y-auto print:p-0 print:overflow-visible">
                        <div className="flex justify-between items-start mb-14">
                            <div className="space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">B</div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">BizCode</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Premium Apps & Services</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Invoice #</h4>
                                <p className="text-lg font-bold text-slate-900">BC-{(order.id + 1000).toString()}</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 mb-14 pb-14 border-b border-slate-100">
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Billed To</h4>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                                    <p className="text-[11px] text-slate-500 font-medium tracking-tight">@{user?.username}</p>
                                    <p className="text-[11px] text-slate-500 font-medium tracking-tight">{user?.email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Issuing Entity</h4>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-900">Appnity Softwares (India)</p>
                                    <p className="text-[11px] text-slate-500 font-medium tracking-tight">Digital Services Division</p>
                                    <p className="text-[11px] text-slate-500 font-medium tracking-tight">business@appnity.co.in</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-14">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Service Breakdown</h4>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {order.orderItems?.map(item => (
                                        <tr key={item.id}>
                                            <td className="py-5">
                                                <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{item.product?.title || 'Digital Asset'}</p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Software License • v{item.product?.version || '1.0'}</p>
                                            </td>
                                            <td className="py-5 text-center text-xs font-bold text-slate-900">{item.Quantity || item.quantity}</td>
                                            <td className="py-5 text-right text-xs font-bold text-slate-900">₹{item.Price?.toLocaleString() || item.price?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-8 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <ShieldCheck size={80} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction Status</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Verified Payment</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount Paid</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">₹{order.totalPrice.toLocaleString()}</h3>
                            </div>
                        </div>

                        <div className="mt-12 text-center">
                            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Thank you for accelerating development with BizCode.</p>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #invoice-content, #invoice-content * { visibility: visible; }
                        #invoice-content { 
                            position: fixed; 
                            left: 0; 
                            top: 0; 
                            width: 100% !important; 
                            padding: 20mm !important;
                            background: white !important;
                        }
                    }
                `}</style>
            </div>
        );
    }

    const MessagesTab = () => {
        const [replyingTo, setReplyingTo] = useState(null);
        const [replyMsg, setReplyMsg] = useState('');
        const [sending, setSending] = useState(false);

        const handleReply = async () => {
            if (!replyMsg.trim()) return;
            setSending(true);
            try {
                await api.post(`/profile/inquiries/${replyingTo.id}/reply`, { message: replyMsg });
                success("Reply sent successfully.");
                setReplyingTo(null);
                setReplyMsg('');
                refetchInquiries();
            } catch (err) {
                toastError("Failed to send message. Please check your connection.");
            } finally {
                setSending(false);
            }
        };

        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                             <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-2">Expert Inbox</h3>
                             <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Inquiries and requests for technical help.</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                             <MessageSquare size={20} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {!inquiries || inquiries.length === 0 ? (
                            <div className="text-center py-32 px-10 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
                                 <Send size={48} className="mx-auto text-slate-200 mb-8" />
                                 <h4 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-4">Your Inbox is empty</h4>
                                 <p className="text-sm text-slate-500 max-w-md mx-auto mb-10 leading-relaxed">
                                    You don't have any active support requests or technical inquiries. If you need help with a purchase or have a pre-purchase question, our experts are ready to assist.
                                 </p>
                                 <div className="flex flex-wrap justify-center gap-4">
                                     <Link to="/support" className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-all">Open Support Request</Link>
                                     <Link to="/contact" className="px-10 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">Ask a Question</Link>
                                 </div>
                            </div>
                        ) : (
                            inquiries.map(inq => (
                                <div key={inq.id} className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:border-blue-200 transition-all group overflow-hidden relative">
                                    <div className="flex items-start justify-between mb-8">
                                         <div>
                                             <div className="flex items-center gap-3 mb-2">
                                                 <span className="px-3 py-1 bg-white text-[9px] font-bold text-slate-900 border border-slate-100 rounded-lg shadow-sm uppercase tracking-widest">ID #{inq.id}</span>
                                                 <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm ${inq.status === 'replied' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                      {inq.status}
                                                 </span>
                                             </div>
                                             <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{inq.subject || 'Support Inquiry'}</h4>
                                         </div>
                                         <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(inq.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="p-5 bg-white border border-slate-50 shadow-sm rounded-2xl text-sm font-medium text-slate-600 leading-relaxed">
                                            {inq.message}
                                        </div>
                                        
                                        {inq.reply && (
                                            <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-semibold leading-relaxed relative flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                                                     <Check size={14} className="text-white" />
                                                </div>
                                                <div className="flex-1 whitespace-pre-line">
                                                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-2">Technical Assistant</p>
                                                    {inq.reply}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-white flex justify-end">
                                        {replyingTo?.id === inq.id ? (
                                            <div className="w-full space-y-4 animate-in slide-in-from-top-4 duration-300">
                                                <textarea value={replyMsg} onChange={e => setReplyMsg(e.target.value)} placeholder="Type your reply here..." className="w-full p-6 bg-white border border-slate-100 rounded-2xl outline-none text-xs font-semibold focus:ring-2 focus:ring-blue-500/10 min-h-[140px] resize-none shadow-inner" />
                                                <div className="flex gap-4 justify-end">
                                                    <button onClick={() => setReplyingTo(null)} className="px-6 py-3 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest">Cancel</button>
                                                    <button onClick={handleReply} disabled={sending} className="px-10 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2">
                                                        {sending ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />} Send Reply
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setReplyingTo(inq)} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all">
                                                <RefreshCw size={14} /> Reply to Thread
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const StudioTab = () => (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Sell Your Project</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submit apps, templates, and software kits for approval-based listing.</p>
                </div>
                <Link to="/account/submit" className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">
                    Submit New Project
                </Link>
            </div>

            {!authoredAssets || authoredAssets.length === 0 ? (
                <div className="py-40 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                     <Zap size={48} className="mx-auto text-slate-100 mb-6" />
                     <h4 className="text-lg font-bold text-slate-300 uppercase tracking-[0.2em]">No submissions yet</h4>
                     <p className="text-[10px] text-slate-400 font-medium mb-8 uppercase tracking-widest">Submit your first project for review.</p>
                     <Link to="/account/submit" className="inline-block px-10 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-all">Submit First Project</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {authoredAssets.map(asset => (
                        <div key={asset.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between group hover:border-slate-900 transition-all shadow-sm">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                                    <img src={asset.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{asset.title}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${asset.moderationStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {asset.moderationStatus}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{asset.category} • v{asset.version}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link to={`/account/templates/${asset.id}/edit`} title="Edit Project" className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                                     <Edit3 size={16} />
                                </Link>
                                {asset.moderationStatus === 'approved' && (
                                    <button 
                                        onClick={() => setConfirmModal({
                                            isOpen: true,
                                            title: "Unpublish Project?",
                                            message: "This will immediately hide this project from the catalog. You can republish it after review.",
                                            confirmText: "Unpublish",
                                            type: "warning",
                                            onConfirm: () => {
                                                unpublishTemplate.mutate(asset.id);
                                                setConfirmModal(p => ({ ...p, isOpen: false }));
                                            }
                                        })} 
                                        title="Unpublish Project" 
                                        className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-amber-500 hover:text-white transition-all"
                                    >
                                         <Eye size={16} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => setConfirmModal({
                                        isOpen: true,
                                        title: "Delete Forever?",
                                            message: "This product record and all associated metadata will be deleted. This action is irreversible.",
                                        confirmText: "Delete Record",
                                        type: "danger",
                                        onConfirm: () => {
                                            deleteTemplate.mutate(asset.id);
                                            setConfirmModal(p => ({ ...p, isOpen: false }));
                                        }
                                    })} 
                                    title="Delete Project" 
                                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                                >
                                     <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fafafa] flex font-sans text-slate-900 antialiased h-screen overflow-hidden">
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleAvatarUpload} />

            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col pt-8 flex-shrink-0">
                <Link to="/account?tab=overview" className="flex items-center gap-3 px-6 mb-10 group/brand hover:opacity-80 transition-opacity">
                    <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center font-bold text-white text-base group-hover/brand:scale-110 transition-transform shadow-xl shadow-slate-900/20">B</div>
                    <div>
                        <h1 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.2em] leading-none mb-1">BizCode Account</h1>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Products, support, billing</p>
                    </div>
                </Link>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <NavLink active={activeTab === 'overview'} onClick={() => setTab('overview')} icon={<LayoutDashboard size={18} />} label="Account Overview" />
                    <NavLink active={activeTab === 'assets'} onClick={() => setTab('assets')} icon={<Package size={18} />} label="My Products" />
                    <NavLink active={activeTab === 'licenses'} onClick={() => setTab('licenses')} icon={<Key size={18} />} label="License Keys" />
                    <NavLink active={activeTab === 'billing'} onClick={() => setTab('billing')} icon={<CreditCard size={18} />} label="Billing & Invoices" />
                    <NavLink active={activeTab === 'studio'} onClick={() => setTab('studio')} icon={<Zap size={18} />} label="Sell Your Project" />
                    <NavLink active={activeTab === 'messages'} onClick={() => setTab('messages')} icon={<MessageSquare size={18} />} label="Support Inbox" />
                    <div className="h-4"></div>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest ml-4 mb-2">Growth</p>
                    <NavLink active={activeTab === 'affiliate'} onClick={() => setTab('affiliate')} icon={<Activity size={18} />} label="Partner Portal" />
                    <NavLink active={activeTab === 'referral'} onClick={() => setTab('referral')} icon={<Share2 size={18} />} label="Referral Program" />
                    <div className="h-4"></div>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest ml-4 mb-2">Account Settings</p>
                    <NavLink active={activeTab === 'settings'} onClick={() => setTab('settings')} icon={<Settings size={18} />} label="Profile Settings" />
                    <NavLink active={activeTab === 'security'} onClick={() => setTab('security')} icon={<Shield size={18} />} label="Security" />
                    <NavLink active={activeTab === 'notifications'} onClick={() => setTab('notifications')} icon={<Bell size={18} />} label="Notifications" />
                </nav>

                <div className="p-5 border-t border-slate-100 bg-slate-50/50 mt-auto">
                    <div className="flex items-center gap-4 px-3 mb-6 group/pfp cursor-pointer relative" onClick={() => fileInputRef.current.click()}>
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-bold text-slate-200 text-sm border-2 border-slate-100 relative overflow-hidden shadow-sm shadow-slate-200/50 transition-all">
                            {user?.avatarUrl ? <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" /> : <User />}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/pfp:opacity-100 flex items-center justify-center transition-opacity">
                                <Camera size={14} className="text-white" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-900 truncate uppercase tracking-tight">{user?.name}</p>
                            <Link to={`/@${user?.username}`} className="text-[9px] text-blue-600 font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">View Profile <ArrowUpRight size={8} /></Link>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 border border-rose-100 rounded-xl transition-all">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 bg-[#fafafa] overflow-y-auto custom-scrollbar flex flex-col pt-10">
                <header className="fixed top-0 right-0 left-64 z-40 h-20 bg-white/40 backdrop-blur-3xl border-b border-slate-100 px-10 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">{tabNames[activeTab] || activeTab}</h2>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status: Online</p>
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <Link to="/" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-2 group">
                             <Home size={14} className="group-hover:-translate-y-0.5 transition-transform" /> Back to BizCode
                        </Link>
                    </div>

                    <div className="flex items-center gap-6">
                         <Link to={`/@${user?.username || user?.id}`} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-bold text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all uppercase tracking-widest flex items-center gap-2">
                             <ExternalLink size={12} /> View Profile
                         </Link>
                         <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Secure Session</span>
                         </div>
                    </div>
                </header>

                <div className="p-12 max-w-7xl mx-auto w-full pt-16">
                    {activeTab === 'overview' && <OverviewTab />}
                    {activeTab === 'settings' && <SettingsTab />}
                    {activeTab === 'assets' && <AssetsTab />}
                    {activeTab === 'studio' && <StudioTab />}
                    {activeTab === 'security' && <SecurityTab />}
                    {activeTab === 'notifications' && <NotificationsTab />}
                    {activeTab === 'referral' && <ReferralTab />}
                    {activeTab === 'billing' && <BillingTab />}
                    {activeTab === 'messages' && <MessagesTab />}
                    {activeTab === 'licenses' && <LicensesTab />}
                    {activeTab === 'affiliate' && <AffiliateTab />}
                </div>

                <AvatarCropModal 
                    isOpen={cropModal.isOpen} 
                    image={cropModal.image} 
                    onClose={() => setCropModal({ isOpen: false, image: null })}
                    onCrop={finalizeAvatarUpload}
                />

                <InvoiceModal 
                    order={selectedOrderForInvoice} 
                    onClose={() => setSelectedOrderForInvoice(null)} 
                />
            </main>
            <ConfirmationModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
                isLoading={unpublishTemplate.isPending || deleteTemplate.isPending}
            />
        </div>
    );
};

const NavLink = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all group ${active ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
        <span className={`${active ? 'text-blue-500' : 'text-slate-300 group-hover:text-blue-600'}`}>{icon}</span>
        <span className="truncate">{label}</span>
    </button>
);

const StatCard = ({ label, value, change, sub, icon, color }) => (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">{icon}</div>
        <div className="flex items-center justify-between mb-6">
            <div className={`p-4 rounded-2xl bg-slate-50 border border-slate-100 ${color} shadow-sm`}>{icon}</div>
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 uppercase tracking-widest border border-emerald-100">{change}</span>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{label}</p>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tighter mt-2 mb-2">{value}</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{sub}</p>
    </div>
);

const Field = ({ label, icon, value, onChange, disabled, placeholder }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">{label}</label>
        <div className="relative">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">{icon}</div>
            <input 
                disabled={disabled}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all disabled:opacity-40 placeholder:text-slate-300 shadow-sm"
                placeholder={placeholder}
            />
        </div>
    </div>
);

const ToggleSetting = ({ label, sub, active, onClick }) => (
    <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-slate-200 transition-all">
        <div>
            <p className="text-[11px] font-bold text-slate-900 uppercase mb-1">{label}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{sub}</p>
        </div>
        <button onClick={onClick} className={`w-12 h-6 rounded-full relative transition-all duration-300 ${active ? 'bg-blue-600' : 'bg-slate-200 shadow-inner'}`}>
             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${active ? 'left-7' : 'left-1'}`}></div>
        </button>
    </div>
);

const ProgramDetail = ({ label, val }) => (
    <div className="p-6 bg-slate-50/80 border border-slate-100 rounded-2xl">
         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
         <h4 className="text-xl font-bold text-slate-900">{val}</h4>
    </div>
);

export default Profile;
