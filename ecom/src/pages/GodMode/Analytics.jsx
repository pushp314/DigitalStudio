import React from 'react';

const Analytics = () => {
    // Simulated Data for "Ultimate Plan" prototype
    const stats = [
        { label: "Total Revenue", value: "$42,593", change: "+12.5%", positive: true },
        { label: "Active Users", value: "1,294", change: "+8.2%", positive: true },
        { label: "Products Sold", value: "856", change: "+23.1%", positive: true },
        { label: "Bounce Rate", value: "24.3%", change: "-2.4%", positive: true },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl group hover:border-zinc-700 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-zinc-400 text-sm font-medium">{stat.label}</h3>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${stat.positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section (CSS Only for lightweight/no-dep) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Revenue Chart */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                    <h3 className="text-white font-bold mb-6">Revenue Overview</h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                            <div key={i} className="w-full bg-zinc-800 rounded-t-sm relative group">
                                <div
                                    className="absolute bottom-0 w-full bg-[#0055FF] rounded-t-sm transition-all duration-500 group-hover:bg-[#3377FF]"
                                    style={{ height: `${h}%` }}
                                ></div>
                                {/* Tooltip */}
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    ${h * 100}k
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-zinc-500 font-mono">
                        <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
                        <span>JUL</span><span>AUG</span><span>SEP</span><span>OCT</span><span>NOV</span><span>DEC</span>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                    <h3 className="text-white font-bold mb-6">Top Selling Products</h3>
                    <div className="space-y-4">
                        {[
                            { name: "SaaS Starter Kit Pro", sales: 234, revenue: "$46,566", width: "90%" },
                            { name: "Premium UI Components", sales: 789, revenue: "$30,771", width: "75%" },
                            { name: "Auth API Complete", sales: 567, revenue: "$27,783", width: "60%" },
                            { name: "Fitness Tracker App", sales: 189, revenue: "$18,711", width: "40%" },
                            { name: "Agency Portfolio", sales: 891, revenue: "$34,749", width: "30%" }
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm text-zinc-300 mb-1">
                                    <span>{item.name}</span>
                                    <span className="font-mono text-zinc-500">{item.revenue}</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#0055FF] to-cyan-400 rounded-full"
                                        style={{ width: item.width }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Analytics;
