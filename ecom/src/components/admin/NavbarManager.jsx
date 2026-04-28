import React, { useState, useContext, useEffect } from 'react';
import ConfigContext from '../../context/ConfigContext';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
    Plus, 
    Trash2,
    Link as LinkIcon,
    ChevronDown,
    ChevronUp,
    Settings,
    Layout,
    ExternalLink,
    Zap,
    MousePointerClick,
    Save,
    Columns,
    Layers,
    Terminal,
    Cpu,
    Activity,
    MessageSquare,
    ShieldCheck,
    Headphones,
    Heart,
    BookOpen,
    HelpCircle,
    Package,
    Code,
    ShoppingCart,
    Sparkles,
    Building2,
    User,
    Mail,
    Bell,
    Type
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';

const ICON_OPTIONS = [
    "Terminal", "Cpu", "Activity", "MessageSquare", "ShieldCheck", "Headphones",
    "Zap", "Package", "Code", "ShoppingCart", "HelpCircle", "Sparkles", "Building2",
    "Heart", "User", "Mail", "Bell", "BookOpen", "Layout"
];

const NavbarManager = () => {
    const { config, fetchConfig } = useContext(ConfigContext);
    const [links, setLinks] = useState([]);
    const [resourceItems, setResourceItems] = useState([]);
    const [activeTab, setActiveTab] = useState('nodes'); // nodes or resources
    const [loading, setLoading] = useState(false);
    const { success, error } = useToast();

    useEffect(() => {
        if (config?.navbar?.links) {
            setLinks(config.navbar.links.map((link, idx) => ({ ...link, id: `link-${idx}-${Date.now()}` })));
        }
        if (config?.navbar?.resourceItems) {
            setResourceItems(config.navbar.resourceItems.map((item, idx) => ({ ...item, id: `res-${idx}-${Date.now()}` })));
        }
    }, [config]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Remove local IDs before saving
            const linksToSave = links.map(({ id, ...rest }) => rest);
            const resourcesToSave = resourceItems.map(({ id, ...rest }) => rest);
            
            const updatedConfig = { 
                ...config, 
                navbar: { 
                    links: linksToSave,
                    resourceItems: resourcesToSave
                } 
            };
            
            await api.put('/config', updatedConfig);
            await fetchConfig();
            success('Navbar configuration deployed successfully.');
        } catch (err) {
            error('Deployment failed. Check network connection.');
        } finally {
            setLoading(false);
        }
    };

    const addLink = () => {
        const newLink = {
            id: `link-${Date.now()}`,
            label: 'New Link',
            href: '/',
            type: 'link',
            key: '',
            featureFlag: '',
            isMega: false
        };
        setLinks([...links, newLink]);
    };

    const addResource = () => {
        const newRes = {
            id: `res-${Date.now()}`,
            label: 'New Resource',
            section: 'General',
            href: '/',
            icon: 'Terminal',
            desc: 'Quick description'
        };
        setResourceItems([...resourceItems, newRes]);
    };

    const removeLink = (id) => setLinks(links.filter(l => l.id !== id));
    const removeResource = (id) => setResourceItems(resourceItems.filter(r => r.id !== id));

    const updateLink = (id, field, value) => {
        setLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const updateResource = (id, field, value) => {
        setResourceItems(resourceItems.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header Control Panel */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Layout size={20} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Navigation Architect</h2>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-xl leading-relaxed">
                            Define your platform's primary navigation nodes. Manage Mega Menus, feature-gated links, and documentation hierarchy in real-time.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex items-center gap-1">
                            <button 
                                onClick={() => setActiveTab('nodes')}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'nodes' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Primary Nodes
                            </button>
                            <button 
                                onClick={() => setActiveTab('resources')}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'resources' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Resource Items
                            </button>
                        </div>
                        
                        <div className="w-px h-8 bg-slate-200 mx-1"></div>

                        <button 
                            onClick={activeTab === 'nodes' ? addLink : addResource}
                            className="h-11 px-6 bg-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                        >
                            <Plus size={14} /> Add {activeTab === 'nodes' ? 'Node' : 'Resource'}
                        </button>
                        
                        <button 
                            onClick={handleSave}
                            disabled={loading}
                            className="h-11 px-8 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-2xl shadow-slate-900/20 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : <><Save size={14} /> Deploy Changes</>}
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'nodes' ? (
                    <motion.div 
                        key="nodes"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <Reorder.Group axis="y" values={links} onReorder={setLinks} className="space-y-4">
                            {links.map((link) => (
                                <Reorder.Item 
                                    key={link.id} 
                                    value={link}
                                    className="bg-white border border-slate-200 rounded-[2rem] p-6 lg:p-8 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group"
                                >
                                    <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="cursor-grab active:cursor-grabbing text-slate-200 hover:text-indigo-400 transition-colors">
                                                <Layers size={24} />
                                            </div>
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${link.type === 'dropdown' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                                {link.type === 'dropdown' ? <ChevronDown size={22} /> : <LinkIcon size={22} />}
                                            </div>
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                                                <input 
                                                    type="text" 
                                                    value={link.label} 
                                                    onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold text-slate-900 transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Route Path</label>
                                                <div className="relative">
                                                    <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                    <input 
                                                        type="text" 
                                                        value={link.href} 
                                                        onChange={(e) => updateLink(link.id, 'href', e.target.value)}
                                                        className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-[12px] font-semibold text-slate-600 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Flow</label>
                                                <select 
                                                    value={link.type} 
                                                    onChange={(e) => updateLink(link.id, 'type', e.target.value)}
                                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold text-slate-900 appearance-none"
                                                >
                                                    <option value="link">Static Link</option>
                                                    <option value="dropdown">Dynamic Dropdown</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialization</label>
                                                {link.type === 'dropdown' ? (
                                                    <select 
                                                        value={link.key} 
                                                        onChange={(e) => updateLink(link.id, 'key', e.target.value)}
                                                        className="w-full px-5 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold text-indigo-900 appearance-none"
                                                    >
                                                        <option value="">Choose Behavior...</option>
                                                        <option value="explore">Explore Catalog</option>
                                                        <option value="resources">Platform Resources</option>
                                                        <option value="services">Unified Services</option>
                                                    </select>
                                                ) : (
                                                    <div className="relative">
                                                        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={14} />
                                                        <input 
                                                            type="text" 
                                                            value={link.featureFlag} 
                                                            placeholder="Feature Gate (Optional)"
                                                            onChange={(e) => updateLink(link.id, 'featureFlag', e.target.value)}
                                                            className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-[12px] font-semibold text-slate-400"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex lg:flex-col gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 w-full lg:w-auto">
                                            {link.type === 'dropdown' && (
                                                <button 
                                                    onClick={() => updateLink(link.id, 'isMega', !link.isMega)}
                                                    className={`h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${link.isMega ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                                                >
                                                    <Columns size={12} /> {link.isMega ? 'Mega' : 'Standard'}
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => removeLink(link.id)}
                                                className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        </div>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="resources"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {resourceItems.map((item) => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm group-hover:bg-white group-hover:shadow-md transition-all">
                                                {/* In a real app we'd map string to component here too */}
                                                <Settings size={20} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 tracking-tight">{item.label || 'Untitled'}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.section}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => removeResource(item.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Display Label</label>
                                            <input 
                                                type="text" 
                                                value={item.label} 
                                                onChange={(e) => updateResource(item.id, 'label', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 text-[13px] font-bold text-slate-900"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Section</label>
                                                <input 
                                                    type="text" 
                                                    value={item.section} 
                                                    onChange={(e) => updateResource(item.id, 'section', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 text-[11px] font-bold text-slate-900"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Icon Symbol</label>
                                                <select 
                                                    value={item.icon} 
                                                    onChange={(e) => updateResource(item.id, 'icon', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 text-[11px] font-bold text-slate-900 appearance-none"
                                                >
                                                    {ICON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Route Path</label>
                                            <input 
                                                type="text" 
                                                value={item.href} 
                                                onChange={(e) => updateResource(item.id, 'href', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 text-[11px] font-medium text-slate-500"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Narrative/Description</label>
                                            <textarea 
                                                rows="2"
                                                value={item.desc} 
                                                onChange={(e) => updateResource(item.id, 'desc', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 text-[11px] font-medium text-slate-500 resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Visual Preview / Legend */}
            <div className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl text-white relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]"></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                            <Activity size={24} />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest">Real-time Architecture</h4>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Changes deployed here are immediately propagated to the edge. Primary nodes define the horizontal structure, while resource items populate the Mega Menus.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                            <Zap size={24} className="text-amber-400" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest">Logic Gating</h4>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Use feature flags to hide/show navigation nodes based on your system configuration. Perfect for rolling out Docs or AI modules progressively.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                            <Columns size={24} className="text-blue-400" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest">Mega Menus</h4>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Toggle 'Mega' mode for dropdowns to enable the immersive full-width experience. Resource items will automatically group by section in these views.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                            <Type size={24} className="text-indigo-400" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest">Iconography</h4>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Select from a curated set of Lucide icons to represent your resource items. Ensure consistent visual metaphors across your documentation and support nodes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavbarManager;
