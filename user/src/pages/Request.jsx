import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Send, Info, Users, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/pages.css';

const RequestRation = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [eligibleItems, setEligibleItems] = useState([]);
    const [hasRequested, setHasRequested] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    useEffect(() => {
        if (user) {
            const familySize = user.familyMembers || 1;
            setEligibleItems([
                { commodity: 'rice', quantity: familySize * 5, unit: 'kg' },
                { commodity: 'wheat', quantity: familySize * 2, unit: 'kg' },
                { commodity: 'sugar', quantity: 1, unit: 'kg' }
            ]);
            checkRequestStatus();
        }
    }, [user]);

    const checkRequestStatus = async () => {
        try {
            const token = sessionStorage.getItem('srms_user_token');
            const res = await axios.get('http://localhost:5001/api/user-portal/check-request-status', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasRequested(res.data.hasRequested);
        } catch (err) {
            console.error('Failed to check request status:', err);
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = sessionStorage.getItem('srms_user_token');
            await axios.post('http://localhost:5001/api/user-portal/request-ration', 
                {}, // Backend calculates this now
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage({ type: 'success', text: 'Ration request submitted successfully! Wait for shop approval.' });
            setHasRequested(true);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit request. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) return <div className="loading-state">Checking your ration status...</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h2><ShoppingCart size={24} /> Request Your Ration</h2>
                <p>Your eligible monthly quota is automatically calculated based on your family size</p>
            </header>

            {message.text && (
                <div className={`alert ${message.type}`}>
                    {message.text}
                </div>
            )}

            {hasRequested ? (
                <div className="already-requested-card">
                    <CheckCircle size={48} color="#28a745" />
                    <h3>Ration Already Requested</h3>
                    <p>You have already placed your ration request for this month.</p>
                    <button className="secondary-btn" onClick={() => window.location.href='/history'}>View Purchase History</button>
                </div>
            ) : (
                <>
                    <div className="info-card">
                        <div className="info-header">
                            <Users size={20} />
                            <h3>Family Details</h3>
                        </div>
                        <div className="info-content">
                            <p><strong>Registered Family Members:</strong> {user?.familyMembers || 1}</p>
                            <p className="text-secondary">Your allocation relies on the rule: 5kg Rice and 2kg Wheat per member, plus 1kg Sugar base limit.</p>
                        </div>
                    </div>

                    <div className="form-card" style={{ marginTop: '1.5rem' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="request-grid read-only-grid">
                                {eligibleItems.map((item) => (
                                    <div key={item.commodity} className="request-item-card active read-only">
                                        <div className="item-details">
                                            <strong>{item.commodity.toUpperCase()}</strong>
                                            <span className="qty-badge">{item.quantity} {item.unit}</span>
                                        </div>
                                        <div className="auto-calc-tag">Auto calculated</div>
                                    </div>
                                ))}
                            </div>

                            <div className="submit-section">
                                <button type="submit" className="submit-btn" disabled={loading || eligibleItems.length === 0}>
                                    {loading ? 'Submitting...' : <><Send size={18} /> Confirm Request ({eligibleItems.length} Items)</>}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="warning-box">
                        <Info size={20} />
                        <p>All ration requests must be collected at your assigned shop. Modifications or extra quantity requests must be handled via the Complaints section.</p>
                    </div>
                </>
            )}

            <style>{`
                .already-requested-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    padding: 3rem;
                    border-radius: 12px;
                    border: 1px solid #c3e6cb;
                    margin-top: 2rem;
                    text-align: center;
                    gap: 1rem;
                }
                .already-requested-card h3 { color: #155724; font-size: 1.5rem; margin: 0; }
                .already-requested-card p { color: #383d41; font-size: 1.1rem; }
                .secondary-btn {
                    margin-top: 1rem;
                    padding: 10px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                }
                .secondary-btn:hover { background: #5a6268; }
                
                .info-card {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 1.5rem;
                }
                .info-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--primary-color);
                    margin-bottom: 1rem;
                }
                .info-content p { margin: 0.5rem 0; }
                .text-secondary { color: #6c757d; font-size: 0.9rem; }
                
                .read-only-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }
                .request-item-card.read-only {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 1.5rem;
                    background: #f1f8ff;
                    border: 1px solid #cce5ff;
                    pointer-events: none; /* Make entirely unclickable */
                    gap: 0.5rem;
                }
                .item-details {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }
                .qty-badge {
                    background: #007bff;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 1.2rem;
                }
                .auto-calc-tag {
                    font-size: 0.8rem;
                    color: #856404;
                    background: #fff3cd;
                    padding: 2px 8px;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default RequestRation;
