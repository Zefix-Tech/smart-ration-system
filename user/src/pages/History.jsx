import { useState, useEffect } from 'react';
import axios from 'axios';
import { History as HistoryIcon, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import '../styles/pages.css';

const PurchaseHistory = () => {
    const [data, setData] = useState({ activeRequests: [], purchaseHistory: [], deliveryRequests: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = sessionStorage.getItem('srms_user_token');
                const res = await axios.get('http://localhost:5001/api/citizen/ration-status', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (err) {
                console.error('Failed to fetch history');
                setData({ activeRequests: [], purchaseHistory: [], deliveryRequests: [] });
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getStatusBadge = (status) => {
        if (!status) return <span className="status-badge">Unknown</span>;

        const s = status.toString().toLowerCase().trim();
        switch (s) {
            case 'completed':
            case 'delivered':
                return <span className="status-badge success">Delivered</span>;
            case 'pending':
                return <span className="status-badge warning">Pending</span>;
            case 'approved':
                return <span className="status-badge info">Approved</span>;
            case 'dispatched':
            case 'out_for_delivery':
            case 'out for delivery':
                return <span className="status-badge info">Out for Delivery</span>;
            case 'cancelled':
            case 'rejected':
                return <span className="status-badge danger">Rejected</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    const { activeRequests, purchaseHistory, deliveryRequests = [] } = data;

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
                                    {activeRequests.length > 0 ? activeRequests.map((order) => (
                                        <tr key={order.id}>
                                            <td>{new Date(order.date).toLocaleDateString()}</td>
                                            <td>
                                                {order.items.map((item, i) => (
                                                    <span key={i} className="mini-item">{item}</span>
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
                                    {purchaseHistory.length > 0 ? purchaseHistory.map((order, idx) => (
                                        <tr key={idx}>
                                            <td>{new Date(order.date).toLocaleDateString()}</td>
                                            <td>
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="history-item">
                                                        {item}
                                                    </div>
                                                ))}
                                            </td>
                                            <td>{getStatusBadge(order.status)}</td>
                                            <td><code className="tx-id">{order.transactionId}</code></td>
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

                    {/* Part 3: Delivery Request History */}
                    <div className="history-section" style={{ marginTop: '2.5rem' }}>
                        <h3 className="section-subtitle"><Truck size={18} /> Delivery Request History</h3>
                        <div className="table-card">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveryRequests.length > 0 ? deliveryRequests.map((req, idx) => (
                                        <tr key={idx}>
                                            <td>{new Date(req.date).toLocaleDateString()}</td>
                                            <td>{req.reason}</td>
                                            <td>{getStatusBadge(req.status)}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{req.address}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="no-data">No delivery request records found.</td>
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
