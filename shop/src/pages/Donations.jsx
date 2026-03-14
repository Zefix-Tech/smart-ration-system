import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { HeartHandshake, CheckCircle, Package } from 'lucide-react';
import '../styles/dashboard.css';

const Donations = () => {
    const { admin } = useAuth();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDonations = async () => {
        if (!admin?.shop?._id) return;
        setLoading(true);
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            const res = await axios.get(`/api/shop-donations/${admin.shop._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDonations(res.data);
        } catch (err) {
            console.error('Failed to fetch donations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonations();
    }, [admin]);

    const handleAction = async (id, status) => {
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            await axios.patch(`/api/shop-donations/update/${id}`, 
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchDonations();
        } catch (err) {
            alert('Action failed');
        }
    };

    const columns = [
        { header: 'Donor', accessor: 'user.name', render: row => <b>{row.user?.name}</b> },
        { 
            header: 'Item', 
            render: row => (
                <div>
                   {row.items.map((it, i) => <div key={i}>{it.commodity}: {it.quantity} {it.unit}</div>)}
                </div>
            ) 
        },
        { header: 'Date', accessor: 'createdAt', render: row => new Date(row.createdAt).toLocaleDateString() },
        { 
            header: 'Status', 
            render: row => (
                <span className={`badge ${row.status === 'distributed' ? 'badge-green' : 'badge-yellow'}`}>
                    {row.status}
                </span>
            )
        },
        {
            header: 'Actions',
            render: row => row.status === 'collected' && (
                <button onClick={() => handleAction(row._id, 'distributed')} className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                    Mark Distributed
                </button>
            )
        }
    ];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title flex-item-center gap-2">
                        <HeartHandshake color="#2563eb" /> Donation Management
                    </h1>
                    <p className="text-muted">Track and distribute items donated by regular users to those in need</p>
                </div>
            </header>

            <DataTable 
                columns={columns} 
                data={donations} 
                loading={loading}
                searchPlaceholder="Search donations..."
            />
        </div>
    );
};

export default Donations;
