import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { MessageSquare, CheckCircle, Send } from 'lucide-react';
import '../styles/dashboard.css';

const Complaints = () => {
    const { admin } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState(null);
    const [responseText, setResponseText] = useState('');

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            const res = await axios.get(`/api/shop/complaints`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComplaints(res.data);
        } catch (err) {
            console.error('Failed to fetch complaints', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admin) fetchComplaints();
    }, [admin]);

    const handleResolve = async (id) => {
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            await axios.patch(`/api/shop-complaints/resolve/${id}`, 
                { response: responseText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setResolvingId(null);
            setResponseText('');
            fetchComplaints();
        } catch (err) {
            alert('Failed to resolve complaint');
        }
    };

    const columns = [
        { header: 'User', accessor: 'user.name', render: row => <b>{row.user?.name}</b> },
        { header: 'Message', accessor: 'message', render: row => <div style={{ maxWidth: '300px', fontSize: '0.85rem' }}>{row.message}</div> },
        { header: 'Date', accessor: 'createdAt', render: row => new Date(row.createdAt).toLocaleDateString() },
        { 
            header: 'Status', 
            render: row => (
                <span className={`badge ${row.status === 'resolved' ? 'badge-green' : 'badge-yellow'}`}>
                    {row.status}
                </span>
            )
        },
        {
            header: 'Actions',
            render: row => row.status === 'pending' && (
                <div>
                    {resolvingId === row._id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                                type="text" 
                                value={responseText}
                                onChange={e => setResponseText(e.target.value)}
                                placeholder="Response..."
                                style={{ padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4' }}
                            />
                            <button onClick={() => handleResolve(row._id)} className="btn-icon text-primary-600">
                                <Send size={18} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setResolvingId(row._id)} className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                            Respond
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title flex-item-center gap-2">
                        <MessageSquare color="#2563eb" /> Complaint Management
                    </h1>
                    <p className="text-muted">Review and resolve user complaints regarding shop services</p>
                </div>
            </header>

            <DataTable 
                columns={columns} 
                data={complaints} 
                loading={loading}
                searchPlaceholder="Search complaints..."
            />
        </div>
    );
};

export default Complaints;
