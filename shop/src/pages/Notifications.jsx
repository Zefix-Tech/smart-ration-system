import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { Bell, Send, CheckSquare, Square, Info, MessageSquare, Clock } from 'lucide-react';
import '../styles/dashboard.css';

const Notifications = () => {
    const { admin } = useAuth();
    const [activeTab, setActiveTab] = useState('received'); // 'received' or 'send'
    const [receivedNotifs, setReceivedNotifs] = useState([]);
    const [usersToAlert, setUsersToAlert] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            
            // 1. Fetch received announcements
            const resNotifs = await axios.get('/api/shop/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReceivedNotifs(resNotifs.data);

            // 2. Fetch pending users for "Shop Empty Alert" (Only for Shop Owners)
            if (admin?.role === 'shop_owner') {
                const resUsers = await axios.get(`/api/shop-notifications/pending-users/${admin.shop._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsersToAlert(resUsers.data);
            }

            // Mark unread as read automatically
            const unreadIds = resNotifs.data.filter(n => !n.isRead).map(n => n._id);
            if (unreadIds.length > 0) {
                await axios.post('/api/notifications/mark-read', 
                    { notificationIds: unreadIds },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
        } catch (err) {
            console.error('Failed to fetch notification data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admin) fetchAllData();
    }, [admin]);

    const toggleSelect = (id) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(uid => uid !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const handleBroadcast = async () => {
        if (selectedUsers.length === 0) return alert('Select at least one user');
        setSending(true);
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            await axios.post(`/api/shop-notifications/broadcast`, 
                { 
                    userIds: selectedUsers,
                    shopName: admin.shop.name 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Broadcast sent to ${selectedUsers.length} users!`);
            setSelectedUsers([]);
        } catch (err) {
            alert('Failed to send broadcast');
        } finally {
            setSending(false);
        }
    };

    const userColumns = [
        { 
            header: 'Select', 
            render: row => (
                <button onClick={() => toggleSelect(row._id)} className="btn-icon">
                    {selectedUsers.includes(row._id) ? <CheckSquare size={20} color="#2563eb" /> : <Square size={20} color="#94a3b8" />}
                </button>
            )
        },
        { header: 'User Name', accessor: 'name' },
        { header: 'Ration Card', accessor: 'rationCard' },
        { header: 'Category', accessor: 'category', render: row => <span className="badge badge-gray">{row.category}</span> },
        { header: 'Phone', accessor: 'phone' }
    ];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title flex-item-center gap-2">
                        <Bell color="#2563eb" /> System Notifications
                    </h1>
                    <p className="dashboard-subtitle">Stay updated with administrative announcements and alerts</p>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="tabs-container" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <button 
                    className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
                    onClick={() => setActiveTab('received')}
                    style={{
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: 'none',
                        color: activeTab === 'received' ? '#2563eb' : '#64748b',
                        borderBottom: activeTab === 'received' ? '2px solid #2563eb' : 'none',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquare size={18} /> Announcements
                        {receivedNotifs.filter(n => !n.isRead).length > 0 && (
                            <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>
                                {receivedNotifs.filter(n => !n.isRead).length}
                            </span>
                        )}
                    </div>
                </button>
                {admin?.role === 'shop_owner' && (
                    <button 
                        className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
                        onClick={() => setActiveTab('send')}
                        style={{
                            padding: '0.75rem 1rem',
                            border: 'none',
                            background: 'none',
                            color: activeTab === 'send' ? '#2563eb' : '#64748b',
                            borderBottom: activeTab === 'send' ? '2px solid #2563eb' : 'none',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Send size={18} /> Shop Empty Alert
                        </div>
                    </button>
                )}
            </div>

            {/* Tab Content */}
            {activeTab === 'received' ? (
                <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading notifications...</div>
                    ) : receivedNotifs.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-lg border border-dashed border-gray-300">
                             <Bell size={40} style={{ margin: '0 auto 1rem', display: 'block', color: '#cbd5e1' }} />
                             <p className="text-gray-500">No announcements found for your role.</p>
                        </div>
                    ) : (
                        receivedNotifs.map(notif => (
                            <div 
                                key={notif._id} 
                                className={`notification-card ${notif.isRead ? 'read' : 'unread'}`}
                                style={{
                                    background: 'white',
                                    padding: '1.25rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    borderLeft: `4px solid ${notif.priority === 'high' || notif.priority === 'urgent' ? '#ef4444' : '#2563eb'}`,
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>{notif.title}</h3>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={14} /> {new Date(notif.sentAt).toLocaleString()}
                                    </span>
                                </div>
                                <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5' }}>{notif.message}</p>
                                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                    <span className={`badge ${notif.type === 'delivery_update' ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                                        {notif.type?.replace('_', ' ').toUpperCase()}
                                    </span>
                                    {notif.priority === 'high' && (
                                        <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>HIGH PRIORITY</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="send-alert-section">
                    <div className="flex-between mb-4">
                        <div className="alert-card badge-blue" style={{ padding: '1rem', flex: 1, marginRight: '1rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                            <Info size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                            <b>Tip:</b> Selecting users and sending an alert helps manage crowds when the shop is free.
                        </div>
                        <button 
                            disabled={selectedUsers.length === 0 || sending} 
                            onClick={handleBroadcast}
                            className="btn-primary flex-item-center gap-2"
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            <Send size={18} /> {sending ? 'Sending...' : `Send Alert to ${selectedUsers.length} Users`}
                        </button>
                    </div>

                    <DataTable 
                        columns={userColumns} 
                        data={usersToAlert} 
                        loading={loading}
                        searchPlaceholder="Search by name or card no..."
                    />
                </div>
            )}
        </div>
    );
};

export default Notifications;
