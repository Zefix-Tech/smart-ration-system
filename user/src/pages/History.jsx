import { useState, useEffect } from 'react';
import axios from 'axios';
import { History as HistoryIcon, Clock, CheckCircle, XCircle } from 'lucide-react';
import '../styles/pages.css';

const PurchaseHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = sessionStorage.getItem('srms_user_token');
                const res = await axios.get('http://localhost:5001/api/user-portal/history', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(res.data);
            } catch (err) {
                console.error('Failed to fetch history');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getStatusBadge = (status) => {
        switch(status) {
            case 'completed': return <span className="badge success">Completed</span>;
            case 'pending': return <span className="badge warning">Pending Approval</span>;
            case 'approved': return <span className="badge info">Approved</span>;
            case 'cancelled': return <span className="badge danger">Cancelled</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    const pendingRequests = orders.filter(o => o.status === 'pending');
    const purchaseHistory = orders.filter(o => o.status === 'approved' || o.status === 'completed');

    return (
        <div className="page-container">
            <header className="page-header">
                <h2><HistoryIcon size={24} /> My Ration Status</h2>
                <p>Track your active requests and past collections</p>
            </header>

            {loading ? (
                <div className="loading">Fetching your records...</div>
            ) : (
                <>
                    {/* Part 1: Request Status (Pending) */}
                    <div className="history-section">
                        <h3 className="section-subtitle"><Clock size={18} /> Active Requests</h3>
                        <div className="table-card">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Allocation</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingRequests.length > 0 ? pendingRequests.map((order) => (
                                        <tr key={order._id}>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                {order.items.map((item, i) => (
                                                    <span key={i} className="mini-item">{item.commodity} ({item.quantity}{item.unit})</span>
                                                ))}
                                            </td>
                                            <td>{getStatusBadge(order.status)}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="no-data">No pending requests.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Part 2: Purchase History (Approved / Completed) */}
                    <div className="history-section" style={{ marginTop: '2.5rem' }}>
                        <h3 className="section-subtitle"><CheckCircle size={18} /> Verified Purchase History</h3>
                        <div className="table-card">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Items Collected</th>
                                        <th>Status</th>
                                        <th>Transaction ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseHistory.length > 0 ? purchaseHistory.map((order) => (
                                        <tr key={order._id}>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="history-item">
                                                        {item.commodity.toUpperCase()} - {item.quantity} {item.unit}
                                                    </div>
                                                ))}
                                            </td>
                                            <td>{getStatusBadge(order.status)}</td>
                                            <td><code className="tx-id">{order._id.slice(-8).toUpperCase()}</code></td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="no-data">No verified purchase records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
            
            <style>{`
                .history-section { margin-bottom: 2rem; }
                .section-subtitle { display: flex; align-items: center; gap: 10px; font-size: 1.1rem; color: #334155; margin-bottom: 1rem; font-weight: 700; }
                .history-item { font-size: 0.9rem; color: #444; margin-bottom: 2px; }
                .mini-item { display: inline-block; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-right: 5px; color: #475569; }
                .tx-id { background: #eee; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
            `}</style>
        </div>
    );
};

export default PurchaseHistory;
