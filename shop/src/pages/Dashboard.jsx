import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, ShoppingBag, Package, Truck, Bell, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/dashboard.css';

const Dashboard = () => {
    const [pendingData, setPendingData] = useState({ totalUsers: 0, purchasedUsers: 0, remainingUsers: 0 });
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchAlertData();
    }, []);

    const fetchAlertData = async () => {
        try {
            const token = localStorage.getItem('srms_token');
            const res = await axios.get('http://localhost:5001/api/shop/alerts/pending-users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingData(res.data);
        } catch (err) {
            console.error('Error fetching alert data:', err);
        } finally {
            setLoading(false);
        }
    };

    const sendAlert = async () => {
        if (pendingData.remainingUsers === 0) return;
        
        setSending(true);
        try {
            const token = localStorage.getItem('srms_token');
            const res = await axios.post('http://localhost:5001/api/shop/alerts/send', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message);
            fetchAlertData(); // Auto update after sending
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send alert');
        } finally {
            setSending(false);
        }
    };

    const stats = [
        { label: 'Registered Users', value: pendingData.totalUsers, icon: <Users />, theme: 'blue-icon' },
        { label: 'Monthly Purchases', value: pendingData.purchasedUsers, icon: <ShoppingBag />, theme: 'green-icon' },
        { label: 'Pending Users', value: pendingData.remainingUsers, icon: <Bell />, theme: 'orange-icon' },
        { label: 'Completion Rate', value: `${pendingData.totalUsers > 0 ? Math.round((pendingData.purchasedUsers / pendingData.totalUsers) * 100) : 0}%`, icon: <CheckCircle />, theme: 'blue-icon' },
    ];

    if (loading) return <div className="loading-state">Loading dashboard...</div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Shop Overview</h1>
                    <p className="dashboard-subtitle">Manage your ration shop operations and alerts</p>
                </div>
                <div className="date-display">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </header>

            <div className="stat-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className={`stat-icon-box ${stat.theme}`}>
                            {stat.icon}
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">{stat.label}</p>
                            <h3 className="stat-value">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="alert-section-card">
                <div className="alert-info">
                    <div className="alert-icon-circle">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h2 className="alert-card-title">Shop Empty Alert</h2>
                        <p className="alert-card-desc">
                            Notify users who haven't collected their ration. Current queue is empty.
                        </p>
                    </div>
                </div>
                <div className="alert-stats">
                    <div className="mini-stat">
                        <span>{pendingData.remainingUsers}</span>
                        <p>Pending</p>
                    </div>
                    <button 
                        className={`btn-send-alert ${pendingData.remainingUsers === 0 ? 'disabled' : ''}`}
                        disabled={pendingData.remainingUsers === 0 || sending}
                        onClick={sendAlert}
                    >
                        {sending ? 'Sending...' : (
                            <>
                                <Send size={18} />
                                Send Alert to {pendingData.remainingUsers} Users
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="charts-row">
                <div className="chart-card">
                    <h2 className="chart-title">Daily Ration Distribution</h2>
                    <div className="chart-placeholder">
                        [Distribution Chart - Real data hooking pending]
                    </div>
                </div>
                <div className="chart-card">
                    <h2 className="chart-title">Current Stock Level</h2>
                    <div className="chart-placeholder">
                        [Stock Level Chart]
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
