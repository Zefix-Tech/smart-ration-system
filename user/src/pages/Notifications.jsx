import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Info, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import '../styles/pages.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = sessionStorage.getItem('srms_user_token');
                const res = await axios.get('http://localhost:5001/api/user-portal/notifications', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNotifications(res.data);
                
                const unreadIds = res.data.filter(n => !n.isRead).map(n => n._id);
                if (unreadIds.length > 0) {
                    await axios.post('http://localhost:5001/api/user-portal/notifications/mark-read', 
                        { notificationIds: unreadIds },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                }
            } catch (err) {
                console.error('Failed to fetch notifications');
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const getIcon = (type) => {
        switch(type) {
            case 'stock_alert': return <Package size={20} color="#ffc107" />;
            case 'purchase_approved': return <CheckCircle size={20} color="#28a745" />;
            case 'delivery_update': return <Info size={20} color="#007bff" />;
            case 'delivery_otp': return <AlertTriangle size={20} color="#ef4444" />;
            default: return <Bell size={20} color="#666" />;
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h2><Bell size={24} /> Your Notifications</h2>
                <p>Stay updated with shop announcements and your request status</p>
            </header>

            {loading ? (
                <div className="loading">Checking for updates...</div>
            ) : (
                <div className="notifications-list">
                    {notifications.length > 0 ? notifications.map((n) => (
                        <div key={n._id} className={`notification-item ${n.type || 'info'}`}>
                            <div className="n-icon">{getIcon(n.type)}</div>
                            <div className="n-content">
                                <h3>
                                    {n.isRead === false && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', marginRight: 8, transform: 'translateY(-2px)' }}></span>}
                                    {n.title}
                                </h3>
                                <p>{n.message}</p>
                                <span className="n-time">{new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="empty-state">
                            <Bell size={48} />
                            <p>No notifications yet. You're all caught up!</p>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .notifications-list { display: flex; flex-direction: column; gap: 1rem; }
                .notification-item { 
                    background: white; 
                    padding: 1.5rem; 
                    border-radius: 12px; 
                    display: flex; 
                    gap: 1.5rem; 
                    box-shadow: var(--card-shadow);
                    border-left: 5px solid #ddd;
                    transition: transform 0.2s;
                }
                .notification-item:hover { transform: translateX(5px); }
                .n-icon { margin-top: 2px; }
                .n-content h3 { font-size: 1.1rem; color: var(--primary-color); margin-bottom: 0.3rem; }
                .n-content p { color: #666; font-size: 0.95rem; line-height: 1.4; }
                .n-time { font-size: 0.75rem; color: #999; margin-top: 0.8rem; display: block; }
                
                .empty-state { text-align: center; padding: 4rem; color: #ccc; }
                .empty-state p { margin-top: 1rem; font-size: 1.1rem; }
            `}</style>
        </div>
    );
};

export default Notifications;
