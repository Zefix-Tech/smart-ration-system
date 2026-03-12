import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { Package, AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import '../styles/dashboard.css';

const Stock = () => {
    const { admin } = useAuth();
    const [stock, setStock] = useState({ rice: 0, wheat: 0, sugar: 0, kerosene: 0 });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchStock = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('srms_shop_token');
            const res = await axios.get(`http://localhost:5001/api/shop-stock/current/${admin.shop._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStock(res.data);
        } catch (err) {
            console.error('Failed to fetch stock', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admin?.shop?._id) fetchStock();
    }, [admin]);

    const handleUpdateStock = async (commodity, value) => {
        setUpdating(true);
        try {
            const token = localStorage.getItem('srms_shop_token');
            await axios.patch(`http://localhost:5001/api/shop-stock/update/${admin.shop._id}`, 
                { [commodity]: parseInt(value) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchStock();
        } catch (err) {
            alert('Failed to update stock');
        } finally {
            setUpdating(false);
        }
    };

    const columns = [
        { header: 'Commodity', accessor: 'name', render: row => <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{row.name}</span> },
        { header: 'Current Quantity', accessor: 'quantity', render: row => <span>{row.quantity} kg/L</span> },
        { 
            header: 'Status', 
            accessor: 'status',
            render: row => (
                <span className={`badge ${row.quantity < 50 ? 'badge-red' : 'badge-green'}`}>
                    {row.quantity < 50 ? 'Low Stock' : 'Sufficient'}
                </span>
            )
        },
        {
            header: 'Actions',
            render: row => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                        type="number" 
                        placeholder="Add Qty"
                        style={{ width: '80px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleUpdateStock(row.name, row.quantity + parseInt(e.target.value));
                                e.target.value = '';
                            }
                        }}
                    />
                </div>
            )
        }
    ];

    const data = Object.entries(stock).map(([name, quantity]) => ({ name, quantity }));

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title flex-item-center gap-2">
                        <Package color="#2563eb" /> Stock Management
                    </h1>
                    <p className="text-muted">Monitor and update inventory levels for your shop</p>
                </div>
                <button onClick={fetchStock} className="btn-icon">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            {Object.values(stock).some(v => v < 50) && (
                <div className="alert-card notif-urgent" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginBottom: '1.5rem' }}>
                    <AlertTriangle size={24} color="#dc2626" />
                    <div>
                        <h4 style={{ color: '#dc2626', fontWeight: 'bold' }}>Low Stock Alert!</h4>
                        <p style={{ fontSize: '0.875rem' }}>Some commodities are below the 50kg threshold. Please update stock soon.</p>
                    </div>
                </div>
            )}

            <DataTable 
                columns={columns} 
                data={data} 
                loading={loading}
                searchPlaceholder="Search commodities..."
            />

            <div className="chart-card" style={{ marginTop: '2rem' }}>
                <h3 className="chart-title">Add/Update Stock Summary</h3>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                    Use the action column to add quantity to existing stock. Press <b>Enter</b> to confirm.
                </p>
            </div>
        </div>
    );
};

export default Stock;
