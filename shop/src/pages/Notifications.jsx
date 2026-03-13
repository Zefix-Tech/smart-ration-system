import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { Bell, Send, CheckSquare, Square } from 'lucide-react';
import '../styles/dashboard.css';

const Notifications = () => {
    const { admin } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const fetchPendingUsers = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            const res = await axios.get(`http://localhost:5001/api/shop/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admin) fetchPendingUsers();
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
            await axios.post(`http://localhost:5001/api/shop-notifications/broadcast`, 
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

    const columns = [
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
                        <Bell color="#2563eb" /> Shop Empty Alert
                    </h1>
                    <p className="text-muted">Notify users who haven't collected their monthly ration yet</p>
                </div>
                <button 
                    disabled={selectedUsers.length === 0 || sending} 
                    onClick={handleBroadcast}
                    className="btn-primary flex-item-center gap-2"
                >
                    <Send size={18} /> {sending ? 'Sending...' : `Send Alert to ${selectedUsers.length} Users`}
                </button>
            </header>

            <div className="alert-card badge-blue" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                <b>Tip:</b> Selecting users and sending an alert helps manage crowds when the shop is free.
            </div>

            <DataTable 
                columns={columns} 
                data={users} 
                loading={loading}
                searchPlaceholder="Search by name or card no..."
            />
        </div>
    );
};

export default Notifications;
