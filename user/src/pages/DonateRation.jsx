import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Heart, Package, CheckCircle, Info } from 'lucide-react';
import '../styles/dashboard.css'; // Reuse dashboard styles for cards

const DonateRation = () => {
    const { user } = useAuth();
    const [preference, setPreference] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alreadyPurchased, setAlreadyPurchased] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const init = async () => {
            await fetchPreference();
            await checkPurchaseStatus();
        };
        init();
    }, []);

    const fetchPreference = async () => {
        try {
            const token = sessionStorage.getItem('srms_user_token');
            const res = await axios.get('http://localhost:5001/api/user-portal/ration-preference', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPreference(res.data);
        } catch (err) {
            console.error('Failed to fetch preference:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkPurchaseStatus = async () => {
        try {
            const token = sessionStorage.getItem('srms_user_token');
            const res = await axios.get('http://localhost:5001/api/user-portal/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const purchasedThisMonth = res.data.some(p => {
                const date = new Date(p.createdAt);
                return date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear && 
                       p.status === 'completed';
            });
            
            setAlreadyPurchased(purchasedThisMonth);
        } catch (err) {
            console.error('Failed to check purchase status');
        }
    };

    const handlePreference = async (status) => {
        if (!window.confirm(`Are you sure you want to change your preference to "${status === 'collect' ? 'Collect My Ration' : 'Skip / Donate My Ration'}"?`)) return;
        
        setUpdating(true);
        setMessage('');
        try {
            const token = sessionStorage.getItem('srms_user_token');
            const res = await axios.post('http://localhost:5001/api/user-portal/ration-preference', 
            { status },
            { headers: { Authorization: `Bearer ${token}` } }
            );
            setPreference(res.data.preference);
            setMessage(res.data.message);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to update preference.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="loading">Loading details...</div>;

    const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="page-container">
            <header className="page-header">
                <h2><Heart size={24} /> Donate / Skip Ration</h2>
                <p>Manage your ration collection preference for {currentMonthName}</p>
            </header>

            {message && (
                <div className={`alert ${message.includes('success') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="dashboard-card preference-card">
                    <div className="card-header">
                        <h3>Current Status: <span className={`status-badge ${preference?.status}`}>{preference?.status === 'donated' ? 'Donated' : 'Collect'}</span></h3>
                    </div>
                    
                    <div className="preference-info">
                        <Info size={20} className="info-icon" />
                        <p>
                            Users who do not want their ration for a particular month can donate it through the system. 
                            The donated ration will automatically be redirected to orphanages or old age homes.
                        </p>
                    </div>

                    <div className="preference-actions">
                        <button 
                            className={`auth-btn ${preference?.status === 'collect' ? 'active-pref' : 'outline'}`}
                            onClick={() => handlePreference('collect')}
                            disabled={updating || preference?.status === 'donated' || alreadyPurchased} 
                        >
                            <Package size={20} /> Collect My Ration
                        </button>
                        
                        <button 
                            className={`auth-btn donate-btn ${preference?.status === 'donated' ? 'active-donate' : 'outline'}`}
                            onClick={() => handlePreference('donated')}
                            disabled={updating || preference?.status === 'donated' || alreadyPurchased}
                            style={alreadyPurchased ? { background: '#94a3b8', borderColor: '#94a3b8', cursor: 'not-allowed' } : {}}
                        >
                            <Heart size={20} /> {alreadyPurchased ? "Donation not available after purchase" : "Skip / Donate My Ration"}
                        </button>
                    </div>

                    {preference?.status === 'donated' && (
                        <div className="donation-success-message">
                            <CheckCircle size={24} color="var(--success-color)" />
                            <div>
                                <h4>Thank you for donating your ration this month!</h4>
                                <p>Your generous contribution will bring comfort to an orphanage or old age home. You cannot change this preference back for the current month.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .preference-card {
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: bold;
                    text-transform: capitalize;
                }
                .status-badge.donated { background: #ffebee; color: #c62828; }
                .status-badge.collect { background: #e8f5e9; color: #2e7d32; }
                
                .preference-info {
                    display: flex;
                    gap: 1rem;
                    background: #e3f2fd;
                    padding: 1rem;
                    border-radius: 8px;
                    align-items: flex-start;
                    color: #1565c0;
                    line-height: 1.5;
                }
                .info-icon { flex-shrink: 0; margin-top: 2px; }
                
                .preference-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                }
                
                .auth-btn.outline {
                    background: transparent;
                    border: 2px solid var(--primary-color);
                    color: var(--primary-color);
                }
                
                .donate-btn {
                    background: #f44336;
                    border-color: #f44336;
                }
                .donate-btn.outline {
                    background: transparent;
                    border-color: #f44336;
                    color: #f44336;
                }
                
                .active-pref { box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2); }
                .active-donate { 
                    background: #d32f2f; 
                    box-shadow: 0 4px 12px rgba(211, 47, 47, 0.2); 
                    border-color: #d32f2f;
                }
                
                .auth-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .donation-success-message {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                    padding: 1.5rem;
                    background: #f1f8e9;
                    border: 1px solid #c5e1a5;
                    border-radius: 8px;
                    align-items: center;
                }
                .donation-success-message h4 { color: #33691e; margin-bottom: 5px; }
                .donation-success-message p { color: #558b2f; font-size: 0.9rem; margin: 0; }
                
                @media (max-width: 768px) {
                    .preference-actions { flex-direction: column; }
                }
            `}</style>
        </div>
    );
};

export default DonateRation;
