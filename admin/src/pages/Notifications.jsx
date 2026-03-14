import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Plus, Trash2, Clock } from 'lucide-react';
import '../styles/page.css';
import '../styles/dashboard.css'; // for loading spinner

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('announcement');
    const [priority, setPriority] = useState('normal');
    const [targetAudience, setTargetAudience] = useState('all');

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('srms_token');
            const res = await axios.get('http://localhost:5001/api/notifications/admin', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
            
            // Mark as read automatically when viewed
            const unreadIds = res.data.filter(n => !n.isRead).map(n => n._id);
            if (unreadIds.length > 0) {
                await axios.post('http://localhost:5001/api/notifications/mark-read', 
                    { notificationIds: unreadIds },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('srms_token');
            await axios.post('http://localhost:5001/api/notifications',
                { title, message, type, priority, targetAudience },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowForm(false);
            setTitle(''); setMessage(''); setType('announcement'); setPriority('normal'); setTargetAudience('all');
            fetchNotifications();
        } catch (err) {
            alert('Failed to send notification');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this notification?')) return;
        try {
            const token = sessionStorage.getItem('srms_token');
            await axios.delete(`http://localhost:5001/api/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            alert('Failed to delete notification');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title flex-item-center gap-2">
                        <Bell className="text-yellow-500" /> System Notifications
                    </h1>
                    <p className="page-subtitle">Broadcast important updates to users and shop owners</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary flex-item-center gap-2"
                >
                    {showForm ? 'Cancel' : <><Plus /> Compose Alert</>}
                </button>
            </div>

            {showForm && (
                <div className="chart-card">
                    <h2 className="alert-heading" style={{ marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>New Announcement</h2>
                    <form onSubmit={handleSubmit} className="form-group">
                        <div className="form-grid">
                            <div>
                                <label className="form-label">Title</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} type="text" className="form-input" placeholder="e.g. Stock Arrival Update" />
                            </div>
                            <div className="form-grid">
                                <div>
                                    <label className="form-label">Type</label>
                                    <select value={type} onChange={e => setType(e.target.value)} className="form-input">
                                        <option value="announcement">Announcement</option>
                                        <option value="stock_update">Stock Update</option>
                                        <option value="alert">System Alert</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Priority</label>
                                    <select value={priority} onChange={e => setPriority(e.target.value)} className="form-input">
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Target Audience</label>
                                <select value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="form-input">
                                    <option value="all">Global (All Users)</option>
                                    <option value="users">Citizens Only</option>
                                    <option value="shop_owners">Shop Owners Only</option>
                                    <option value="admin">System Admins Only</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Message Content</label>
                            <textarea required value={message} onChange={e => setMessage(e.target.value)} rows="3" className="form-input" placeholder="Detail the announcement..." />
                        </div>
                        <div>
                            <button type="submit" className="btn-primary">Send Notification</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                {loading ? (
                    <div className="loading-container"><div className="loading-spinner"></div></div>
                ) : notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: '1rem', border: '1px dashed #d1d5db', color: '#6b7280' }}>No sent notifications found.</div>
                ) : (
                    notifications.map(notif => (
                        <div key={notif._id} className={`notif-card ${notif.priority === 'urgent' ? 'notif-urgent' :
                            notif.priority === 'high' ? 'notif-high' :
                                notif.priority === 'normal' ? 'notif-normal' : ''
                            }`}>
                            <div style={{ flex: 1 }}>
                                <div className="flex-item-center gap-3" style={{ marginBottom: '0.25rem' }}>
                                    <h3 className="notif-title">
                                        {notif.isRead === false && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', marginRight: 6 }}></span>}
                                        {notif.title}
                                    </h3>
                                    <span className="notif-type">
                                        {notif.type.replace('_', ' ')}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>{notif.message}</p>
                                <div className="notif-time">
                                    <Clock /> {new Date(notif.sentAt).toLocaleString()}
                                </div>
                            </div>
                            <button onClick={() => handleDelete(notif._id)} className="btn-action badge-gray p-2" title="Delete" style={{ alignSelf: 'flex-start' }}>
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
