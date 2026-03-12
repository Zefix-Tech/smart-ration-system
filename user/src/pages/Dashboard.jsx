import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Truck, Package, Activity, ChevronRight, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const token = localStorage.getItem('srms_user_token');
                const res = await axios.get('http://localhost:5001/api/user-portal/summary', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSummary(res.data);
            } catch (err) {
                console.error('Failed to fetch summary');
                setSummary({
                    stock: [],
                    purchaseStatus: 'Error loading data',
                    deliveryStatus: 'Error loading data',
                    user: { name: user?.name, rationCard: user?.rationCard, shop: 'Unknown' }
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) return <div className="loading-state">Loading your dashboard...</div>;

    const stats = [
        { title: 'Purchase Status', value: summary?.purchaseStatus || 'N/A', icon: <ShoppingBag size={24} />, color: '#ffc107' },
        { title: 'Delivery Status', value: summary?.deliveryStatus || 'N/A', icon: <Truck size={24} />, color: '#dc3545' }
    ];

    return (
        <div className="dashboard-wrapper">
            <header className="dashboard-header">
                <div>
                    <h1>Welcome, {user?.name}</h1>
                    <p>Registered Shop: <strong>{summary?.user?.shop || 'Loading...'}</strong></p>
                </div>
                <div className="date-badge">
                   {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </header>

            <div className="stats-grid">
                {summary?.user?.eligibilityStatus === 'PENDING' && (
                    <div className="alert-item" style={{ gridColumn: '1 / -1', background: '#fff8e1', border: '1px solid #ffe082', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="alert-dot warning"></div>
                        <div className="alert-info">
                            <p style={{ color: '#f57c00', margin: 0 }}><strong>Verification Pending</strong></p>
                            <span style={{ color: '#ffb300' }}>Eligibility verification pending admin approval.</span>
                        </div>
                    </div>
                )}
                {summary?.user?.eligibilityStatus === 'VERIFIED' && (
                    <div className="alert-item" style={{ gridColumn: '1 / -1', background: '#e0f2f1', border: '1px solid #b2dfdb', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="alert-dot success"></div>
                        <div className="alert-info">
                            <p style={{ color: '#00796b', margin: 0 }}><strong>Verified!</strong></p>
                            <span style={{ color: '#00897b' }}>Delivery request approved. You can now request ration.</span>
                        </div>
                    </div>
                )}
                {stats.map((stat, index) => (
                    <div className="stat-card" key={index}>
                        <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-info">
                            <h3>{stat.value}</h3>
                            <p>{stat.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <section className="dashboard-section main-section">
                    <div className="section-header">
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="actions-grid">
                        <button className="action-card" onClick={() => window.location.href='/request'}>
                            <ShoppingCart size={24} />
                            <span>Request Ration</span>
                        </button>
                        <button className="action-card" onClick={() => window.location.href='/donate'} style={{ backgroundColor: '#fff3e0' }}>
                            <Package size={24} color="#f57c00" />
                            <span style={{ color: '#e65100' }}>Donate / Skip Ration</span>
                        </button>
                        <button className="action-card" onClick={() => window.location.href='/delivery'}>
                            <Truck size={24} />
                            <span>Delivery Request</span>
                        </button>
                        <button className="action-card" onClick={() => window.location.href='/profile'}>
                            <User size={24} />
                            <span>Update Profile</span>
                        </button>
                    </div>
                </section>

                <section className="dashboard-section side-section">
                    <div className="section-header">
                        <h2>Live Alerts</h2>
                    </div>
                    <div className="alerts-list">
                        <div className="alert-item">
                            <div className="alert-dot success"></div>
                            <div className="alert-info">
                                <p><strong>Shop is Free!</strong></p>
                                <span>No crowd currently at your shop.</span>
                            </div>
                        </div>
                        <div className="alert-item">
                            <div className="alert-dot warning"></div>
                            <div className="alert-info">
                                <p><strong>New Stock Arrived</strong></p>
                                <span>Fresh rice and sugar available now.</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            
            <style>{`
                .loading-state { display: flex; justify-content: center; align-items: center; height: 100%; font-size: 1.2rem; color: #666; }
            `}</style>
        </div>
    );
};

// Supporting Icons not in previous imports
const MessageSquare = ({ size }) => <Activity size={size} />; 

export default Dashboard;
