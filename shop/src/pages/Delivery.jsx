import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { Truck, CheckCircle, XCircle, FileText } from 'lucide-react';
import '../styles/dashboard.css';

const Delivery = () => {
    const { admin } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('srms_shop_token');
            const res = await axios.get(`http://localhost:5001/api/shop/delivery-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch delivery requests', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admin) fetchRequests();
    }, [admin]);

    const handleAction = async (id, status) => {
        try {
            const token = localStorage.getItem('srms_shop_token');
            await axios.patch(`http://localhost:5001/api/shop-delivery/update/${id}`, 
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchRequests();
        } catch (err) {
            alert('Action failed');
        }
    };

    const columns = [
        { header: 'User', accessor: 'user.name', render: row => <b>{row.user?.name}</b> },
        { header: 'Reason', accessor: 'reason', render: row => <span className="badge badge-gray">{row.reason.replace('_', ' ')}</span> },
        { header: 'Address', accessor: 'user.address', render: row => <div style={{ maxWidth: '200px', fontSize: '0.8rem' }}>{row.user?.address}</div> },
        { 
            header: 'Status', 
            render: row => (
                <span className={`badge ${row.status === 'delivered' ? 'badge-green' : row.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>
                    {row.status}
                </span>
            )
        },
        {
            header: 'Actions',
            render: row => row.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleAction(row._id, 'approved')} className="btn-icon text-blue-600" title="Approve">
                        <CheckCircle size={20} />
                    </button>
                    <button onClick={() => handleAction(row._id, 'rejected')} className="btn-icon text-red-600" title="Reject">
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
                        <Truck color="#2563eb" /> Delivery Requests
                    </h1>
                    <p className="text-muted">Manage doorstep delivery for senior citizens and special categories</p>
                </div>
            </header>

            <DataTable 
                columns={columns} 
                data={requests} 
                loading={loading}
                searchPlaceholder="Search by user name..."
            />
        </div>
    );
};

export default Delivery;
