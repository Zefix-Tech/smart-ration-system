import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Package, AlertTriangle, RefreshCw, Plus, X, CheckCircle } from 'lucide-react';
import '../styles/dashboard.css';
import toast from 'react-hot-toast';

const COMMODITIES = ['rice', 'wheat', 'sugar', 'kerosene'];

const Stock = () => {
    const { admin } = useAuth();
    const [stock, setStock] = useState({ rice: 0, wheat: 0, sugar: 0, kerosene: 0 });
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCommodity, setSelectedCommodity] = useState(null);
    const [addQty, setAddQty] = useState('');
    const [saving, setSaving] = useState(false);

    const token = sessionStorage.getItem('srms_shop_token');
    const shopId = admin?.shop?._id;

    const fetchStock = async () => {
        if (!shopId) return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/shop-stock/current/${shopId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStock(res.data);
        } catch (err) {
            console.error('Failed to fetch stock', err);
            toast.error('Failed to load stock data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (shopId) fetchStock();
    }, [shopId]);

    const openAddModal = (commodity) => {
        setSelectedCommodity(commodity);
        setAddQty('');
        setModalOpen(true);
    };

    const handleAddStock = async () => {
        const qty = parseInt(addQty);
        if (!qty || qty <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }
        setSaving(true);
        try {
            const res = await axios.patch(
                `/api/shop-stock/add/${shopId}`,
                { [selectedCommodity]: qty },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStock(res.data.stock);
            toast.success(`Added ${qty} kg/L of ${selectedCommodity} to stock`);
            setModalOpen(false);
        } catch (err) {
            toast.error('Failed to update stock');
        } finally {
            setSaving(false);
        }
    };

    const getStatus = (qty) => {
        if (qty === 0) return { label: 'Empty', color: '#dc2626', bg: '#fef2f2' };
        if (qty < 50) return { label: 'Low Stock', color: '#dc2626', bg: '#fef2f2' };
        if (qty < 200) return { label: 'Moderate', color: '#d97706', bg: '#fffbeb' };
        return { label: 'Sufficient', color: '#16a34a', bg: '#f0fdf4' };
    };

    const commodityIcons = { rice: '🌾', wheat: '🌽', sugar: '🍬', kerosene: '🛢️' };
    const hasLowStock = Object.values(stock).some(v => v < 50);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title flex-item-center gap-2">
                        <Package color="#2563eb" /> Stock Management
                    </h1>
                    <p className="text-muted">Monitor and update inventory levels for your shop</p>
                </div>
                <button onClick={fetchStock} className="btn-icon" title="Refresh">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            {hasLowStock && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px' }}>
                    <AlertTriangle size={22} color="#dc2626" />
                    <div>
                        <h4 style={{ color: '#dc2626', fontWeight: '700', marginBottom: '0.15rem' }}>Low Stock Alert!</h4>
                        <p style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>Some commodities are below the 50 kg/L threshold. Please replenish stock.</p>
                    </div>
                </div>
            )}

            {/* Stock Cards */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div className="loading-spinner" />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    {COMMODITIES.map(commodity => {
                        const qty = stock[commodity] || 0;
                        const status = getStatus(qty);
                        return (
                            <div key={commodity} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <span style={{ fontSize: '1.5rem' }}>{commodityIcons[commodity]}</span>
                                        <h3 style={{ fontWeight: '700', fontSize: '1rem', textTransform: 'capitalize', marginTop: '0.35rem', color: '#1e293b' }}>{commodity}</h3>
                                    </div>
                                    <span style={{ background: status.bg, color: status.color, fontSize: '0.72rem', fontWeight: '700', padding: '0.25rem 0.6rem', borderRadius: '999px' }}>
                                        {status.label}
                                    </span>
                                </div>
                                <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', lineHeight: 1 }}>{qty.toLocaleString()}</p>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>kg{commodity === 'kerosene' ? '/L' : ''} available</p>
                                <button
                                    onClick={() => openAddModal(commodity)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.5rem 0.85rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', width: '100%', justifyContent: 'center' }}
                                >
                                    <Plus size={14} /> Add Stock
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Stock Table */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>
                    Stock Summary
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commodity</th>
                            <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</th>
                            <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                            <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {COMMODITIES.map((commodity, i) => {
                            const qty = stock[commodity] || 0;
                            const status = getStatus(qty);
                            return (
                                <tr key={commodity} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                                    <td style={{ padding: '0.9rem 1.25rem', fontWeight: '600', textTransform: 'capitalize', color: '#1e293b' }}>
                                        {commodityIcons[commodity]} {commodity}
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem', color: qty < 50 ? '#dc2626' : '#1e293b', fontWeight: qty < 50 ? '700' : '400' }}>
                                        {qty.toLocaleString()} kg{commodity === 'kerosene' ? '/L' : ''}
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem' }}>
                                        <span style={{ background: status.bg, color: status.color, fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                                        <button onClick={() => openAddModal(commodity)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                                            <Plus size={12} /> Add
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
                💡 <strong>Note:</strong> Stock is automatically reduced when purchase orders are approved. Use "Add Stock" to replenish inventory.
            </div>

            {/* Add Stock Modal */}
            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b', textTransform: 'capitalize' }}>
                                {commodityIcons[selectedCommodity]} Add {selectedCommodity} Stock
                            </h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                        </div>

                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#64748b' }}>
                            Current stock: <strong style={{ color: '#1e293b' }}>{(stock[selectedCommodity] || 0).toLocaleString()} kg</strong>
                        </div>

                        <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                            Quantity to Add (kg{selectedCommodity === 'kerosene' ? '/L' : ''})
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={addQty}
                            onChange={e => setAddQty(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddStock()}
                            placeholder="e.g. 500"
                            autoFocus
                            style={{ width: '100%', padding: '0.65rem 0.9rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' }}
                            onFocus={e => e.target.style.borderColor = '#3b82f6'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />

                        {addQty && parseInt(addQty) > 0 && (
                            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.6rem 0.9rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#1d4ed8' }}>
                                New total: <strong>{((stock[selectedCommodity] || 0) + parseInt(addQty)).toLocaleString()} kg</strong>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: '600', color: '#64748b' }}>
                                Cancel
                            </button>
                            <button onClick={handleAddStock} disabled={saving || !addQty || parseInt(addQty) <= 0} style={{ flex: 2, padding: '0.65rem', border: 'none', borderRadius: '8px', background: saving ? '#93c5fd' : '#2563eb', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {saving ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                                {saving ? 'Saving...' : 'Confirm Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stock;
