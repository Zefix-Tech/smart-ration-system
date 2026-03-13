import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LuInfo, LuTrendingDown, LuTrendingUp, LuPackage, LuX, LuSearch, LuStore } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../styles/page.css';
import '../styles/dashboard.css'; // for chart-card styles

const Stock = () => {
    const [trends, setTrends] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [currentStock, setCurrentStock] = useState({ rice: 0, wheat: 0, sugar: 0 });
    const [loading, setLoading] = useState(true);
    const [shopStocks, setShopStocks] = useState([]);
    const [shopSearch, setShopSearch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ rice: '', wheat: '', sugar: '' });

    const fetchStockData = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('srms_token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [trendsRes, alertsRes, statsRes, shopsRes] = await Promise.all([
                axios.get('http://localhost:5001/api/stock/trends', config),
                axios.get('http://localhost:5001/api/stock/alerts', config),
                axios.get('http://localhost:5001/api/dashboard/stats', config),
                axios.get('http://localhost:5001/api/shops?limit=100', config)
            ]);

            setTrends(trendsRes.data);
            setAlerts(alertsRes.data);
            if (statsRes.data?.stockSummary) {
                setCurrentStock({
                    rice: statsRes.data.stockSummary.rice?.remaining || 0,
                    wheat: statsRes.data.stockSummary.wheat?.remaining || 0,
                    sugar: statsRes.data.stockSummary.sugar?.remaining || 0
                });
            }
            setShopStocks(shopsRes.data.shops || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load stock data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStockData();
    }, []);

    const handleUpdateStock = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Updating local stock quantities...');
        try {
            const token = sessionStorage.getItem('srms_token');
            const payload = {};
            if (formData.rice) payload.rice = Number(formData.rice);
            if (formData.wheat) payload.wheat = Number(formData.wheat);
            if (formData.sugar) payload.sugar = Number(formData.sugar);

            await axios.post('http://localhost:5001/api/stock/update', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Stock updated successfully', { id: loadingToast });
            setIsModalOpen(false);
            setFormData({ rice: '', wheat: '', sugar: '' });
            fetchStockData();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update stock', { id: loadingToast });
        }
    };

    if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="page-container relative">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Stock Monitoring</h1>
                    <p className="page-subtitle">Real-time commodity levels and historical trends</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary flex-item-center gap-2">
                    <LuPackage /> Update Stock
                </button>
            </div>

            <div className="stat-cards-grid">
                <div className="stat-card" style={{ padding: '1.25rem' }}>
                    <div className="stat-card-icon-wrapper icon-blue" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1.25rem' }}>
                        <LuPackage />
                    </div>
                    <div className="stat-card-content">
                        <h3 className="stat-card-title">Rice Stock</h3>
                        <p className="stat-card-value">{currentStock.rice.toLocaleString()} kg</p>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: '1.25rem' }}>
                    <div className="stat-card-icon-wrapper icon-orange" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1.25rem' }}>
                        <LuPackage />
                    </div>
                    <div className="stat-card-content">
                        <h3 className="stat-card-title">Wheat Stock</h3>
                        <p className="stat-card-value">{currentStock.wheat.toLocaleString()} kg</p>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: '1.25rem' }}>
                    <div className="stat-card-icon-wrapper icon-green" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1.25rem' }}>
                        <LuPackage />
                    </div>
                    <div className="stat-card-content">
                        <h3 className="stat-card-title">Sugar Stock</h3>
                        <p className="stat-card-value">{currentStock.sugar.toLocaleString()} kg</p>
                    </div>
                </div>
            </div>

            <div className="stock-grid">
                {/* Alerts Sidebar */}
                <div className="stock-sidebar">
                    <h2 className="alert-heading">
                        <FiAlertCircle className="text-orange-500" /> Low Stock Alerts
                    </h2>

                    {alerts.length === 0 ? (
                        <div className="alert-healthy">
                            All commodity stocks are healthy.
                        </div>
                    ) : (
                        alerts.map((alert, i) => {
                            const getAlertClass = (pct) => {
                                if (pct <= 10) return 'alert-card-critical';
                                if (pct <= 15) return 'alert-card-warning';
                                if (pct <= 20) return 'alert-card-caution';
                                return 'alert-card-success';
                            };
                            return (
                                <div key={i} className={`alert-card ${getAlertClass(alert.percentage)}`}>
                                    <h3 className="alert-card-title">{alert.commodity}</h3>
                                    <div className="alert-stats-row">
                                        <span className="alert-pct">{alert.percentage}% remaining</span>
                                        <span className="alert-qty">{alert.remaining} / {alert.total} kg</span>
                                    </div>
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{ width: `${alert.percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Charts Area */}
                <div className="stock-main">
                    <div className="chart-card">
                        <h2 className="alert-heading" style={{ marginBottom: '1.5rem' }}>
                            <LuTrendingUp className="text-primary-500" /> Historical Distribution Trends
                        </h2>
                        <div className="chart-container-bar">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trends} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(v) => `${v / 1000}k`} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="rice" name="Rice" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="wheat" name="Wheat" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="sugar" name="Sugar" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Per-Shop Stock Overview */}
            <div className="chart-card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 className="alert-heading">
                        <LuStore className="text-primary-500" /> Shop-wise Stock Overview
                    </h2>
                    <div style={{ position: 'relative' }}>
                        <LuSearch size={15} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search shop or district..."
                            value={shopSearch}
                            onChange={e => setShopSearch(e.target.value)}
                            style={{ paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', width: '220px' }}
                        />
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Shop ID', 'Shop Name', 'District', 'Rice (kg)', 'Wheat (kg)', 'Sugar (kg)', 'Kerosene (L)', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {shopStocks
                                .filter(s => {
                                    const q = shopSearch.toLowerCase();
                                    return !q || s.name?.toLowerCase().includes(q) || s.shopId?.toLowerCase().includes(q) || s.district?.toLowerCase().includes(q);
                                })
                                .map((shop, i) => {
                                    const s = shop.stock || {};
                                    const isLow = Object.values(s).some(v => v < 50);
                                    return (
                                        <tr key={shop._id} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                            <td style={{ padding: '0.75rem 1rem', color: '#6366f1', fontWeight: '600', fontFamily: 'monospace' }}>{shop.shopId}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#1e293b' }}>{shop.name}</td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{shop.district}</td>
                                            <td style={{ padding: '0.75rem 1rem', color: s.rice < 50 ? '#dc2626' : '#1e293b', fontWeight: s.rice < 50 ? '700' : '400' }}>{(s.rice || 0).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 1rem', color: s.wheat < 50 ? '#dc2626' : '#1e293b', fontWeight: s.wheat < 50 ? '700' : '400' }}>{(s.wheat || 0).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 1rem', color: s.sugar < 50 ? '#dc2626' : '#1e293b', fontWeight: s.sugar < 50 ? '700' : '400' }}>{(s.sugar || 0).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 1rem', color: s.kerosene < 50 ? '#dc2626' : '#1e293b', fontWeight: s.kerosene < 50 ? '700' : '400' }}>{(s.kerosene || 0).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{ background: isLow ? '#fef2f2' : '#f0fdf4', color: isLow ? '#dc2626' : '#16a34a', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                                                    {isLow ? '⚠ Low Stock' : '✓ Sufficient'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                            {shopStocks.filter(s => {
                                const q = shopSearch.toLowerCase();
                                return !q || s.name?.toLowerCase().includes(q) || s.shopId?.toLowerCase().includes(q) || s.district?.toLowerCase().includes(q);
                            }).length === 0 && (
                                    <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No shops match your search.</td></tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Update Stock Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">Update Current Month Stock</h3>
                            <button onClick={() => setIsModalOpen(false)} className="modal-close"><LuX size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p className="text-sm text-gray-600 mb-4">Enter the quantity (in kg) to add to the existing stock for the current month. Leave blank to ignore.</p>
                            <form id="stockForm" onSubmit={handleUpdateStock} className="flex-col gap-3">
                                <div>
                                    <h4 className="modal-section-title">Commodity Quantities</h4>
                                    <div className="flex-col gap-2">
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Add Rice (kg)</label>
                                            <div className="input-icon-wrapper">
                                                <LuPackage />
                                                <input type="number" min="0" className="form-input" value={formData.rice} onChange={(e) => setFormData({ ...formData, rice: e.target.value })} placeholder="e.g. 5000" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Add Wheat (kg)</label>
                                            <div className="input-icon-wrapper">
                                                <LuPackage />
                                                <input type="number" min="0" className="form-input" value={formData.wheat} onChange={(e) => setFormData({ ...formData, wheat: e.target.value })} placeholder="e.g. 2000" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Add Sugar (kg)</label>
                                            <div className="input-icon-wrapper">
                                                <LuPackage />
                                                <input type="number" min="0" className="form-input" value={formData.sugar} onChange={(e) => setFormData({ ...formData, sugar: e.target.value })} placeholder="e.g. 1000" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" form="stockForm" className="btn-primary">Update Stock</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stock;
