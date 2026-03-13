import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Trash2, X, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/dashboard.css';

const DeliveryTeam = () => {
    const { admin } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });

    const token = sessionStorage.getItem('srms_shop_token');

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5001/api/shop/delivery-team', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembers(res.data);
        } catch (err) {
            toast.error('Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admin) fetchMembers();
    }, [admin]);

    const handleAdd = async () => {
        if (!form.name || !form.phone || !form.email || !form.password) {
            toast.error('All fields are required');
            return;
        }
        setSaving(true);
        try {
            await axios.post('http://localhost:5001/api/shop/delivery-team/add', form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`${form.name} added to delivery team`);
            setModalOpen(false);
            setForm({ name: '', phone: '', email: '', password: '' });
            fetchMembers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add member');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (id, name) => {
        if (!window.confirm(`Remove ${name} from the delivery team?`)) return;
        try {
            await axios.delete(`http://localhost:5001/api/shop/delivery-team/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`${name} removed`);
            fetchMembers();
        } catch (err) {
            toast.error('Failed to remove member');
        }
    };

    if (admin?.role !== 'shopadmin') {
        return (
            <div className="dashboard-container">
                <div style={{ padding: '3rem', textAlign: 'center', color: '#dc2626' }}>
                    <Users size={48} style={{ marginBottom: '1rem' }} />
                    <h3>Access Denied</h3>
                    <p>Only shop admins can manage the delivery team.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title flex-item-center gap-2">
                        <Users color="#2563eb" /> Delivery Team
                    </h1>
                    <p className="text-muted">Manage delivery personnel for your shop</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={fetchMembers} className="btn-icon" title="Refresh">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setModalOpen(true)} className="btn-primary flex-item-center gap-2">
                        <UserPlus size={16} /> Add Member
                    </button>
                </div>
            </header>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div className="loading-spinner" />
                </div>
            ) : members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <Users size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ color: '#475569', fontWeight: '600' }}>No delivery team members yet</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Add your first delivery person to get started</p>
                    <button onClick={() => setModalOpen(true)} className="btn-primary flex-item-center gap-2" style={{ margin: '0 auto' }}>
                        <UserPlus size={16} /> Add First Member
                    </button>
                </div>
            ) : (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Name', 'Email', 'Role', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((m, i) => (
                                <tr key={m._id} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                                    <td style={{ padding: '0.9rem 1.25rem', fontWeight: '600', color: '#1e293b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: '700', fontSize: '0.85rem' }}>
                                                {m.name?.charAt(0).toUpperCase()}
                                            </div>
                                            {m.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem', color: '#64748b' }}>{m.email}</td>
                                    <td style={{ padding: '0.9rem 1.25rem' }}>
                                        <span style={{ background: '#fef9c3', color: '#854d0e', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                                            Delivery Person
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem' }}>
                                        <button onClick={() => handleRemove(m._id, m.name)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                                            <Trash2 size={13} /> Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Member Modal */}
            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>Add Delivery Person</h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                        </div>

                        <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.6rem 0.9rem', borderRadius: '8px' }}>
                            The delivery person will use their email & password to log into the Shop Portal.
                        </p>

                        {[
                            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Ravi Kumar' },
                            { label: 'Email', key: 'email', type: 'email', placeholder: 'e.g. ravi@shop.com' },
                            { label: 'Phone', key: 'phone', type: 'tel', placeholder: 'e.g. 9876543210' },
                            { label: 'Password', key: 'password', type: 'password', placeholder: 'Min. 8 characters' }
                        ].map(f => (
                            <div key={f.key} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.82rem', color: '#374151', marginBottom: '0.35rem' }}>{f.label}</label>
                                <input
                                    type={f.type}
                                    placeholder={f.placeholder}
                                    value={form[f.key]}
                                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                    style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        ))}

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: '600', color: '#64748b' }}>Cancel</button>
                            <button onClick={handleAdd} disabled={saving} style={{ flex: 2, padding: '0.65rem', border: 'none', borderRadius: '8px', background: saving ? '#93c5fd' : '#2563eb', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {saving ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                                {saving ? 'Adding...' : 'Add Member'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryTeam;
