import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    FileCheck, FileX, Hospital, LogOut, Search, Clock, 
    User, FileText, CheckCircle, AlertCircle, Eye, History, LayoutDashboard, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { hospital, logout } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('pending'); // 'pending' or 'history'
    const [users, setUsers] = useState([]);
    const [pendingCount, setPendingCount] = useState(0); // Persistent count for badge
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('hospital_token');
            
            // 1. Fetch current view data
            const endpoint = view === 'pending' 
                ? 'http://localhost:5001/api/hospital/pending-verifications'
                : 'http://localhost:5001/api/hospital/verification-history';
            
            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);

            // 2. Persistent Badge Logic: Always fetch pending count regardless of view
            if (view === 'pending') {
                setPendingCount(res.data.length);
            } else {
                // If in history view, we still need to know how many are pending for the badge
                const pRes = await axios.get('http://localhost:5001/api/hospital/pending-verifications', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPendingCount(pRes.data.length);
            }
        } catch (err) {
            console.error(err);
            toast.error(`Failed to fetch ${view} data`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [view]);

    const handleAction = async (userId, status) => {
        try {
            const token = sessionStorage.getItem('hospital_token');
            await axios.patch(`http://localhost:5001/api/hospital/verify/${userId}`, 
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Request successfully ${status === 'Hospital Verified' ? 'Approved' : 'Rejected'}`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.eligibilityType.toLowerCase().includes(search.toLowerCase()) ||
        (u.eligibilityStatus && u.eligibilityStatus.toLowerCase().includes(search.toLowerCase()))
    );

    const getStatusInfo = (status) => {
        const styles = {
            'Hospital Verified': { bg: '#ecfdf5', border: '#10b981', color: '#064e3b', label: 'Approved', actor: 'Hospital' },
            'Hospital Rejected': { bg: '#fef2f2', border: '#ef4444', color: '#7f1d1d', label: 'Rejected', actor: 'Hospital' },
            'VERIFIED': { bg: '#f0f9ff', border: '#0ea5e9', color: '#0c4a6e', label: 'Certified', actor: 'System Admin' },
            'REJECTED': { bg: '#fef2f2', border: '#f87171', color: '#7f1d1d', label: 'Rejected', actor: 'System Admin' }
        };
        return styles[status] || { bg: '#f1f5f9', border: '#94a3b8', color: '#334155', label: status, actor: 'System' };
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-box">
                        <Hospital size={22} color="#fff" />
                    </div>
                    <span>SRMS Hospital</span>
                </div>
                <nav className="sidebar-nav">
                    <div 
                        className={`nav-item ${view === 'pending' ? 'active' : ''}`}
                        onClick={() => setView('pending')}
                    >
                        <LayoutDashboard size={18} />
                        <span>Pending Reviews</span>
                        {pendingCount > 0 && <span className="badge-count">{pendingCount}</span>}
                    </div>
                    <div 
                        className={`nav-item ${view === 'history' ? 'active' : ''}`}
                        onClick={() => setView('history')}
                    >
                        <History size={18} />
                        <span>Verification History</span>
                    </div>
                </nav>
                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="profile-avatar">{hospital?.name[0]}</div>
                        <div className="profile-info">
                            <span className="p-name">{hospital?.name}</span>
                            <span className="p-role">Medical Staff</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="content-header">
                    <div className="title-section">
                        <h1>{view === 'pending' ? 'Medical Verification Queue' : 'Activity History'}</h1>
                        <p className="subtitle">
                            {view === 'pending' 
                                ? 'Authorize or decline pending medical certificates for home delivery.' 
                                : 'Track all historical medical verification decisions and system results.'}
                        </p>
                    </div>
                    <div className="header-actions">
                        <div className="search-box">
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder="Search citizens..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                <div className="table-wrapper">
                    {loading ? (
                        <div className="state-container">
                            <div className="loader"></div>
                            <p>Loading records...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="state-container">
                            <div className="empty-icon"><FileCheck size={48} /></div>
                            <h3>All Clear!</h3>
                            <p>No {view} records matched your criteria.</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Citizen Details</th>
                                    <th>Category</th>
                                    <th>{view === 'pending' ? 'Submission Date' : 'Processed At'}</th>
                                    <th>Medical Proof</th>
                                    {view === 'pending' ? <th>Verification Action</th> : <th>Decision & Actor</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => {
                                    const status = getStatusInfo(user.eligibilityStatus);
                                    return (
                                        <tr key={user._id}>
                                            <td>
                                                <div className="citizen-info">
                                                    <div className="c-avatar">{user.name[0]}</div>
                                                    <div className="c-text">
                                                        <span className="c-name">{user.name}</span>
                                                        <span className="c-id">ID: {user._id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="cat-chip">{user.eligibilityType}</span>
                                            </td>
                                            <td className="date-cell">
                                                {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : new Date(user.registeredAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <a 
                                                    href={`http://localhost:5001${user.eligibilityDocumentUrl}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="proof-link"
                                                >
                                                    <Eye size={16} /> Review
                                                </a>
                                            </td>
                                            <td>
                                                {view === 'pending' ? (
                                                    <div className="row-actions">
                                                        <button onClick={() => handleAction(user._id, 'Hospital Verified')} className="act-btn approve">
                                                            <FileCheck size={16} /> Approve
                                                        </button>
                                                        <button onClick={() => handleAction(user._id, 'Hospital Rejected')} className="act-btn reject">
                                                            <FileX size={16} /> Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="status-container">
                                                        <div className="status-badge" style={{ background: status.bg, color: status.color, borderColor: status.border }}>
                                                            {status.label}
                                                        </div>
                                                        <div className="status-actor">by {status.actor}</div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            <style>{`
                .dashboard-layout { display: flex; min-height: 100vh; background: #f1f5f9; font-family: 'Inter', sans-serif; color: #1e293b; }
                
                /* Sidebar */
                .sidebar { width: 260px; background: #075985; color: white; display: flex; flex-direction: column; padding: 1.5rem; box-shadow: 4px 0 10px rgba(0,0,0,0.05); }
                .sidebar-header { display: flex; align-items: center; gap: 0.75rem; font-size: 1.15rem; font-weight: 800; margin-bottom: 2rem; overflow: hidden; }
                .logo-box { background: #0ea5e9; padding: 0.5rem; border-radius: 0.5rem; }
                .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
                .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; border-radius: 0.75rem; cursor: pointer; transition: 0.2s; position: relative; }
                .nav-item:hover { background: rgba(255,255,255,0.05); }
                .nav-item.active { background: #0ea5e9; font-weight: 600; }
                .badge-count { position: absolute; right: 0.75rem; background: #ef4444; color: white; border-radius: 999px; font-size: 0.7rem; padding: 2px 6px; font-weight: 800; }
                .sidebar-footer { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem; }
                .user-profile { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
                .profile-avatar { width: 38px; height: 38px; background: #0ea5e9; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
                .profile-info { display: flex; flex-direction: column; }
                .p-name { font-size: 0.9rem; font-weight: 600; }
                .p-role { font-size: 0.75rem; color: #bae6fd; }
                .logout-btn { width: 100%; display: flex; align-items: center; gap: 0.5rem; justify-content: center; padding: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 0.5rem; cursor: pointer; font-size: 0.85rem; }
                .logout-btn:hover { background: #fb7185; border-color: #f43f5e; }

                /* Main Content */
                .main-content { flex: 1; padding: 2rem 3rem; overflow-y: auto; }
                .content-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
                .title-section h1 { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin-bottom: 0.35rem; }
                .subtitle { color: #64748b; font-size: 0.95rem; }
                .search-box { background: white; border: 1px solid #e2e8f0; padding: 0.625rem 1rem; border-radius: 12px; display: flex; align-items: center; gap: 0.75rem; width: 320px; transition: 0.2s; }
                .search-box:focus-within { border-color: #0ea5e9; box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1); }
                .search-box input { border: none; outline: none; width: 100%; font-size: 0.9rem; }

                /* Table Area */
                .table-wrapper { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .data-table { width: 100%; border-collapse: collapse; }
                .data-table th { text-align: left; padding: 1.25rem 1.5rem; background: #f8fafc; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
                .data-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
                .citizen-info { display: flex; align-items: center; gap: 1rem; }
                .c-avatar { width: 34px; height: 34px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #64748b; font-size: 0.85rem; }
                .c-text { display: flex; flex-direction: column; }
                .c-name { font-weight: 600; color: #1e293b; }
                .c-id { font-size: 0.75rem; color: #94a3b8; }
                .cat-chip { background: #f0f9ff; color: #0369a1; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
                .date-cell { color: #64748b; font-size: 0.85rem; }
                .proof-link { display: inline-flex; align-items: center; gap: 0.4rem; color: #0ea5e9; font-weight: 700; text-decoration: none; border: 1px solid #e0f2fe; padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.8rem; transition: 0.2s; }
                .proof-link:hover { background: #0ea5e9; color: white; }
                
                .row-actions { display: flex; gap: 0.625rem; }
                .act-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.875rem; border-radius: 8px; border: 1px solid; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .approve { background: #f0fdf4; color: #166534; border-color: #dcfce7; }
                .approve:hover { background: #166534; color: white; }
                .reject { background: #fff1f2; color: #991b1b; border-color: #fee2e2; }
                .reject:hover { background: #991b1b; color: white; }

                .status-container { display: flex; flex-direction: column; gap: 0.25rem; }
                .status-badge { display: inline-block; padding: 0.35rem 0.75rem; border: 1px solid; border-radius: 8px; font-size: 0.75rem; font-weight: 700; text-align: center; }
                .status-actor { font-size: 0.7rem; color: #94a3b8; font-style: italic; }

                .state-container { padding: 5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: #94a3b8; }
                .empty-icon { color: #e2e8f0; }
                .state-container h3 { color: #475569; margin-top: 0.5rem; }
                .loader { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #0ea5e9; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Dashboard;
