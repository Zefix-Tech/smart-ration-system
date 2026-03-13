import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { ShoppingCart, CheckCircle, XCircle, Clock } from 'lucide-react';
import '../styles/dashboard.css';

const Purchases = () => {
    const { admin } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('srms_shop_token');
            const res = await axios.get(`http://localhost:5001/api/shop/purchase-requests?status=${statusFilter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admin) fetchOrders();
    }, [admin, statusFilter]);

    const handleAction = async (id, status) => {
        try {
            const token = localStorage.getItem('srms_shop_token');
            await axios.patch(`http://localhost:5001/api/shop-purchases/update/${id}`, 
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchOrders();
        } catch (err) {
            alert('Action failed');
        }
    };

    const columns = [
        { header: 'User', accessor: 'user.name', render: row => <b>{row.user?.name}</b> },
        { header: 'Card No', accessor: 'user.rationCard' },
        { 
            header: 'Items', 
            render: row => (
                <div style={{ fontSize: '0.8rem' }}>
                    {row.items.map((it, i) => <div key={i}>{it.commodity}: {it.quantity} {it.unit}</div>)}
                </div>
            )
        },
        { header: 'Date', accessor: 'createdAt', render: row => new Date(row.createdAt).toLocaleDateString() },
        { 
            header: 'Status', 
            render: row => (
                <span className={`badge ${row.status === 'completed' ? 'badge-green' : row.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>
                    {row.status}
                </span>
            )
        },
        {
            header: 'Actions',
            render: row => row.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleAction(row._id, 'completed')} className="btn-icon text-green-600" title="Approve & Complete">
                        <CheckCircle size={20} />
                    </button>
                    <button onClick={() => handleAction(row._id, 'cancelled')} className="btn-icon text-red-600" title="Reject">
                        <XCircle size={20} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title flex-item-center gap-2">
                        <ShoppingCart color="#2563eb" /> Purchase Requests
                    </h1>
                    <p className="text-muted">Manage user ration purchase claims and verify completions</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                        onClick={() => setStatusFilter('pending')} 
                        className={`btn-primary ${statusFilter === 'pending' ? '' : 'btn-outline'}`}
                    >
                        Pending
                    </button>
                    <button 
                        onClick={() => setStatusFilter('completed')} 
                        className={`btn-primary ${statusFilter === 'completed' ? '' : 'btn-outline'}`}
                    >
                        Completed
                    </button>
                </div>
            </header>

            <DataTable 
                columns={columns} 
                data={orders} 
                loading={loading}
                searchPlaceholder="Search by user or card no..."
            />
        </div>
    );
};

export default Purchases;
