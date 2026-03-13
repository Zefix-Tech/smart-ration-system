import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, ShoppingBag, Bell, CheckCircle, Send, TrendingUp, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import '../styles/dashboard.css';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            const res = await axios.get('http://localhost:5001/api/shop/dashboard-stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            toast.error('Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const sendAlert = async () => {
        if (!stats || stats.stats.pendingUsers === 0) return;

        setSending(true);
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            const res = await axios.post('http://localhost:5001/api/shop/alerts/send', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message);
            fetchDashboardData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send alert');
        } finally {
            setSending(false);
        }
    };

    if (loading || !stats) return <div className="loading-state">Loading dashboard...</div>;

    const statCards = [
        { label: 'Registered Users', value: stats.stats.totalUsers, icon: <Users />, theme: 'blue-icon' },
        { label: 'Monthly Purchases', value: stats.stats.monthlyPurchases, icon: <ShoppingBag />, theme: 'green-icon' },
        { label: 'Pending Users', value: stats.stats.pendingUsers, icon: <Bell />, theme: 'orange-icon' },
        { label: 'Completion Rate', value: `${stats.stats.completionRate}%`, icon: <CheckCircle />, theme: 'blue-icon' },
    ];

    // Chart Data: Daily Distribution
    const barData = {
        labels: stats.history.map(h => h.date),
        datasets: [
            {
                label: 'Rations Distributed',
                data: stats.history.map(h => h.count),
                backgroundColor: '#2e7d32',
                borderRadius: 4,
            }
        ]
    };

    // Chart Data: Stock Levels
    const doughnutData = {
        labels: ['Rice', 'Wheat', 'Sugar', 'Kerosene'],
        datasets: [
            {
                data: [
                    stats.stock.rice || 0,
                    stats.stock.wheat || 0,
                    stats.stock.sugar || 0,
                    stats.stock.kerosene || 0
                ],
                backgroundColor: ['#1a5c38', '#4caf50', '#81c784', '#a5d6a7'],
                borderWidth: 0,
            }
        ]
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Shop Overview</h1>
                    <p className="dashboard-subtitle">Manage your ration shop operations and alerts</p>
                </div>
                <div className="date-display">
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
            </header>

            <div className="stat-grid">
                {statCards.map((stat, i) => (
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
                            Notify users who haven't collected their ration. Currently {stats.stats.pendingUsers} users are remaining for this month.
                        </p>
                    </div>
                </div>
                <div className="alert-stats">
                    <div className="mini-stat">
                        <span>{stats.stats.pendingUsers}</span>
                        <p>Pending</p>
                    </div>
                    <button
                        className={`btn-send-alert ${stats.stats.pendingUsers === 0 ? 'disabled' : ''}`}
                        disabled={stats.stats.pendingUsers === 0 || sending}
                        onClick={sendAlert}
                    >
                        {sending ? 'Sending...' : (
                            <>
                                <Send size={18} />
                                Send Alert to {stats.stats.pendingUsers} Users
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="charts-row">
                <div className="chart-card">
                    <div className="flex-between mb-4">
                        <h2 className="chart-title flex-item-center gap-2">
                            <TrendingUp size={18} color="#2e7d32" /> Weekly Activity
                        </h2>
                    </div>
                    <div className="chart-container" style={{ height: '250px' }}>
                        <Bar
                            data={barData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                                plugins: { legend: { display: false } }
                            }}
                        />
                    </div>
                </div>
                <div className="chart-card">
                    <div className="flex-between mb-4">
                        <h2 className="chart-title flex-item-center gap-2">
                            <Package size={18} color="#2e7d32" /> Stock Inventory
                        </h2>
                    </div>
                    <div className="chart-container" style={{ height: '250px' }}>
                        <Doughnut
                            data={doughnutData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'bottom' } }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
