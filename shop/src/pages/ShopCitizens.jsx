import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, ShoppingBag, Clock } from 'lucide-react';
import DataTable from '../components/DataTable';
import '../styles/dashboard.css'; 

const ShopCitizens = () => {
    const [citizens, setCitizens] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchStats();
        fetchCitizens();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCitizens(search);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const fetchStats = async () => {
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            const res = await axios.get('/api/shop/dashboard-stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStats(res.data.stats);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchCitizens = async (searchTerm = '') => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            const res = await axios.get(`/api/shop/citizens?search=${searchTerm}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCitizens(res.data);
        } catch (err) {
            console.error('Error fetching citizens:', err);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'Citizen Name', accessor: 'name' },
        { header: 'Ration Card', accessor: 'rationCard' },
        { header: 'Mobile', accessor: 'phone' },
        { header: 'Category', accessor: 'category' },
        { header: 'Address', accessor: 'address' },
        { 
            header: 'Status', 
            render: (row) => (
                <span className={`status-badge ${row.status || 'active'}`}>
                    {(row.status || 'active').toUpperCase()}
                </span>
            ) 
        },
    ];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="dashboard-title">Shop Citizens Management</h1>
                    <p className="dashboard-subtitle">List of all citizens assigned to this ration shop</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="stat-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon-box blue-icon">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Total Citizens</p>
                        <h3 className="stat-value">{stats?.totalUsers || 0}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-box green-icon">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Monthly Purchases</p>
                        <h3 className="stat-value">{stats?.monthlyPurchases || 0}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-box orange-icon">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Pending Collection</p>
                        <h3 className="stat-value">{stats?.pendingUsers || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Citizens Table */}
            <div className="chart-card">
                <DataTable 
                    columns={columns} 
                    data={citizens} 
                    loading={loading}
                    total={citizens.length}
                    onSearch={setSearch}
                    searchPlaceholder="Search by Name or Ration Card..."
                />
            </div>

            <style>{`
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .status-badge.active { background: #e6ffec; color: #2e7d32; }
                .status-badge.suspended { background: #ffebee; color: #c62828; }
                .status-badge.inactive { background: #f5f5f5; color: #757575; }
                
                .stat-info {
                    display: flex;
                    flex-direction: column;
                }
            `}</style>
        </div>
    );
};

export default ShopCitizens;
