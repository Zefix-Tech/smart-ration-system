import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { ClipboardList } from 'lucide-react';
import '../styles/dashboard.css';

const Distribution = () => {
    const { admin } = useAuth();
    const [distributions, setDistributions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDistributions = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            const res = await axios.get(`http://localhost:5001/api/shop/distributions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDistributions(res.data);
        } catch (err) {
            console.error('Failed to fetch distributions', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admin) fetchDistributions();
    }, [admin]);

    const columns = [
        { header: 'User Name', accessor: 'user.name', render: row => <b>{row.user?.name || 'Deleted User'}</b> },
        { header: 'Ration Card', accessor: 'user.rationCard', render: row => row.user?.rationCard || 'N/A' },
        { header: 'Category', accessor: 'user.category', render: row => <span className={`badge badge-gray`}>{row.user?.category || 'N/A'}</span> },
        { header: 'Type', render: () => 'In-Shop Purchase' },
        { header: 'Distributed Date', accessor: 'updatedAt', render: row => new Date(row.updatedAt).toLocaleDateString() },
        { 
            header: 'Status', 
            render: () => <span className="badge badge-green">Completed</span>
        }
    ];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title flex-item-center gap-2">
                        <ClipboardList color="#2563eb" /> Distribution Records
                    </h1>
                    <p className="text-muted">History of completed user purchases and deliveries</p>
                </div>
            </header>

            <DataTable 
                columns={columns} 
                data={distributions} 
                loading={loading}
                searchPlaceholder="Search by user name or card no..."
            />
        </div>
    );
};

export default Distribution;
