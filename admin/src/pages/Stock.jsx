import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LuInfo, LuTrendingDown, LuTrendingUp, LuPackage, LuX } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../styles/page.css';
import '../styles/dashboard.css'; // for chart-card styles

const Stock = () => {
    const [trends, setTrends] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [currentStock, setCurrentStock] = useState({ rice: 0, wheat: 0, sugar: 0 });
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ rice: '', wheat: '', sugar: '' });

    const fetchStockData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('srms_token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [trendsRes, alertsRes, statsRes] = await Promise.all([
                axios.get('http://localhost:5001/api/stock/trends', config),
                axios.get('http://localhost:5001/api/stock/alerts', config),
                axios.get('http://localhost:5001/api/dashboard/stats', config)
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
            const token = localStorage.getItem('srms_token');
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
                        alerts.map((alert, i) => (
                            <div key={i} className="alert-card">
                                <h3 className="alert-card-title">{alert.commodity}</h3>
                                <div className="alert-stats-row">
                                    <span className="alert-pct">{alert.percentage}% remaining</span>
                                    <span className="alert-qty">{alert.remaining} / {alert.total} kg</span>
                                </div>
                                <div className="progress-track">
                                    <div className="progress-fill" style={{ width: `${alert.percentage}%` }}></div>
                                </div>
                            </div>
                        ))
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

            {/* Update Stock Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">Update Current Month Stock</h3>
                            <button onClick={() => setIsModalOpen(false)} className="modal-close"><LuX size={20}/></button>
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
                                                <LuPackage  />
                                                <input type="number" min="0" className="form-input" value={formData.rice} onChange={(e) => setFormData({...formData, rice: e.target.value})} placeholder="e.g. 5000" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Add Wheat (kg)</label>
                                            <div className="input-icon-wrapper">
                                                <LuPackage  />
                                                <input type="number" min="0" className="form-input" value={formData.wheat} onChange={(e) => setFormData({...formData, wheat: e.target.value})} placeholder="e.g. 2000" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Add Sugar (kg)</label>
                                            <div className="input-icon-wrapper">
                                                <LuPackage  />
                                                <input type="number" min="0" className="form-input" value={formData.sugar} onChange={(e) => setFormData({...formData, sugar: e.target.value})} placeholder="e.g. 1000" />
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
