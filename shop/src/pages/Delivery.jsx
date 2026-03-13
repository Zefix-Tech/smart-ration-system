import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Truck, CheckCircle, XCircle, Send, KeyRound, RefreshCw, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/dashboard.css';

const Delivery = () => {
    const { admin } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [otpModal, setOtpModal] = useState(null); // { deliveryId, mode: 'dispatch' | 'verify' }
    const [otpInput, setOtpInput] = useState('');
    const [processing, setProcessing] = useState(false);

    const token = sessionStorage.getItem('srms_shop_token');
    const isAdmin = admin?.role === 'shop_owner';
    const isDeliveryPerson = admin?.role === 'delivery_person';

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5001/api/shop/delivery-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (err) {
            toast.error('Failed to load delivery requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admin) fetchRequests();
    }, [admin]);

    const handleAction = async (id, status) => {
        try {
            await axios.patch(`http://localhost:5001/api/shop-delivery/update/${id}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Request ${status}`);
            fetchRequests();
        } catch (err) {
            toast.error('Action failed');
        }
    };

    const handleDispatch = async (deliveryId) => {
        setProcessing(true);
        try {
            await axios.post(`http://localhost:5001/api/shop-delivery/dispatch/${deliveryId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Delivery dispatched successfully!`); 
            fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to dispatch');
        } finally {
            setProcessing(false);
        }
    };

    const handleGenerateOtp = async (deliveryId) => {
        setProcessing(true);
        try {
            const res = await axios.post(`http://localhost:5001/api/shop-delivery/generate-otp/${deliveryId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`OTP generated and sent to citizen successfully!`); 
            fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate OTP');
        } finally {
            setProcessing(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpInput || otpInput.length !== 6) {
            toast.error('Enter the 6-digit OTP');
            return;
        }
        setProcessing(true);
        try {
            await axios.post(`http://localhost:5001/api/shop-delivery/verify-otp/${otpModal.deliveryId}`,
                { otp: otpInput, deliveryPersonId: admin?.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Delivery verified successfully! ✅');
            setOtpModal(null);
            setOtpInput('');
            fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.message || 'OTP verification failed');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            pending: { color: '#92400e', bg: '#fef3c7', label: 'Pending' },
            approved: { color: '#1d4ed8', bg: '#dbeafe', label: 'Approved' },
            dispatched: { color: '#7c3aed', bg: '#ede9fe', label: 'Dispatched' },
            delivered: { color: '#15803d', bg: '#dcfce7', label: 'Delivered' },
            rejected: { color: '#dc2626', bg: '#fef2f2', label: 'Rejected' }
        };
        const s = map[status] || { color: '#64748b', bg: '#f1f5f9', label: status };
        return <span style={{ background: s.bg, color: s.color, fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>{s.label}</span>;
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title flex-item-center gap-2">
                        <Truck color="#2563eb" /> Delivery Requests
                    </h1>
                    <p className="text-muted">
                        {isAdmin ? 'Approve, dispatch, and track doorstep deliveries' : 'Enter OTP from citizen to confirm delivery'}
                    </p>
                </div>
                <button onClick={fetchRequests} className="btn-icon" title="Refresh">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            {isDeliveryPerson && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#1d4ed8' }}>
                    <strong>Delivery Person View:</strong> Select a dispatched delivery, then enter the OTP the citizen tells you to confirm delivery.
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div className="loading-spinner" />
                </div>
            ) : requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Truck size={48} style={{ marginBottom: '1rem' }} />
                    <p>No delivery requests found.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {requests.map(req => (
                        <div key={req._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                                        <h4 style={{ fontWeight: '700', color: '#1e293b', margin: 0 }}>{req.user?.name}</h4>
                                        {getStatusBadge(req.status)}
                                        <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '999px', fontWeight: '600' }}>
                                            {({
                                                pregnant: 'Pregnant Woman',
                                                senior_citizen: 'Senior Citizen (60+)',
                                                injured: 'Injured / Temp. Disability',
                                                disabled: 'Permanently Disabled',
                                                medically_eligible: 'Medically Eligible',
                                                osteogenesis_imperfecta: 'Osteogenesis Imperfecta (Bone Disorder)',
                                                other: 'Other'
                                            })[req.reason] || req.reason?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>📞 {req.user?.phone} &nbsp;|&nbsp; 📍 {req.user?.address}</p>
                                    {req.order?.items?.length > 0 && (
                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            {req.order.items.map((it, i) => (
                                                <span key={i} style={{ background: '#f0fdf4', color: '#15803d', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '600' }}>
                                                    <Package size={11} style={{ display: 'inline', marginRight: '2px' }} />
                                                    {it.commodity}: {it.quantity} {it.unit}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {req.deliveredBy && (
                                        <p style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '0.35rem' }}>✓ Delivered by {req.deliveredBy?.name || 'Delivery Person'}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    {isAdmin && req.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleAction(req._id, 'approved')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '7px', padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                                                <CheckCircle size={14} /> Approve
                                            </button>
                                            <button onClick={() => handleAction(req._id, 'rejected')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '7px', padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </>
                                    )}
                                    {isAdmin && req.status === 'approved' && (
                                        <button onClick={() => handleDispatch(req._id)} disabled={processing} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '7px', padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer' }}>
                                            <Send size={14} /> Dispatch
                                        </button>
                                    )}
                                    {isDeliveryPerson && req.status === 'dispatched' && (
                                        <button onClick={() => handleGenerateOtp(req._id)} disabled={processing} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '7px', padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer' }}>
                                            <KeyRound size={14} /> Generate OTP
                                        </button>
                                    )}
                                    {isDeliveryPerson && req.status === 'dispatched' && (
                                        <button onClick={() => { setOtpModal({ deliveryId: req._id }); setOtpInput(''); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#15803d', color: '#fff', border: 'none', borderRadius: '7px', padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                                            <KeyRound size={14} /> Verify OTP
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* OTP Verify Modal */}
            {otpModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <KeyRound size={20} color="#15803d" /> Verify Delivery OTP
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                            Ask the citizen for the OTP sent to their registered phone number.
                        </p>
                        <input
                            type="text"
                            maxLength={6}
                            value={otpInput}
                            onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 6-digit OTP"
                            autoFocus
                            style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '1.4rem', textAlign: 'center', letterSpacing: '0.3em', fontWeight: '700', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' }}
                            onFocus={e => e.target.style.borderColor = '#15803d'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => { setOtpModal(null); setOtpInput(''); }} style={{ flex: 1, padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: '600', color: '#64748b' }}>Cancel</button>
                            <button onClick={handleVerifyOtp} disabled={processing || otpInput.length !== 6} style={{ flex: 2, padding: '0.65rem', border: 'none', borderRadius: '8px', background: processing ? '#86efac' : '#15803d', color: '#fff', cursor: processing ? 'not-allowed' : 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {processing ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                                {processing ? 'Verifying...' : 'Confirm Delivery'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Delivery;
