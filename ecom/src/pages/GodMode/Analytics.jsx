import React, { useEffect, useMemo, useState } from 'react';
import analyticsService from '../../services/analyticsService';
import { normalizeProduct, normalizeSalesSummary } from '../../utils/normalizers';

const Analytics = () => {
    const [sales, setSales] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [salesData, productsData] = await Promise.all([
                    analyticsService.getSales(),
                    analyticsService.getTopProducts(),
                ]);

                setSales(Array.isArray(salesData) ? salesData.map(normalizeSalesSummary) : []);
                setTopProducts(Array.isArray(productsData) ? productsData.map(normalizeProduct) : []);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const stats = useMemo(() => {
        const totalRevenue = sales.reduce((sum, entry) => sum + entry.revenue, 0);
        const totalSold = sales.reduce((sum, entry) => sum + entry.totalSold, 0);

        return [
            { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` },
            { label: 'Products Sold', value: totalSold },
            { label: 'Tracked Products', value: sales.length },
            { label: 'Top Products', value: topProducts.length },
        ];
    }, [sales, topProducts]);

    if (loading) {
        return <div className="text-zinc-400">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                        <h3 className="text-zinc-400 text-sm font-medium mb-4">{stat.label}</h3>
                        <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                    <h3 className="text-white font-bold mb-6">Revenue by Product</h3>
                    <div className="space-y-4">
                        {sales.map((entry) => (
                            <div key={entry.productId}>
                                <div className="flex justify-between text-sm text-zinc-300 mb-1">
                                    <span>{entry.title}</span>
                                    <span className="font-mono text-zinc-500">{entry.formattedRevenue}</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#0055FF] to-cyan-400 rounded-full"
                                        style={{ width: `${Math.min(100, entry.revenue > 0 ? (entry.revenue / Math.max(...sales.map((item) => item.revenue), 1)) * 100 : 0)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                    <h3 className="text-white font-bold mb-6">Top Products</h3>
                    <div className="space-y-4">
                        {topProducts.map((product) => (
                            <div key={product.id} className="flex items-center justify-between gap-4 border border-zinc-800 rounded-xl p-4">
                                <div>
                                    <p className="text-white font-bold">{product.title}</p>
                                    <p className="text-zinc-500 text-sm">{product.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-bold">{product.formattedPrice}</p>
                                    <p className="text-zinc-500 text-xs">{product.numSales} sales</p>
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
