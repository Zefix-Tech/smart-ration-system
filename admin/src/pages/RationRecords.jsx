import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Plus, Trash2, Edit3, Search, Users, X, Save, RefreshCw, UserCheck } from 'lucide-react';

const API = 'http://localhost:5001/api/ration-records';
const SHOPS_API = 'http://localhost:5001/api/shops';

const emptyForm = {
    rationCardNumber: '',
    category: 'PHH',
    address: '',
    district: '',
    assignedShop: '',
    members: [{ name: '', aadhaar: '', relation: 'Head', gender: 'Male', dob: '' }]
};

const RationRecords = () => {
    const [records, setRecords] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const token = sessionStorage.getItem('srms_token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}?search=${search}&page=${page}&limit=15`, { headers });
            setRecords(res.data.records);
            setTotalPages(res.data.pages);
        } catch (err) {
            console.error('Failed to load ration records', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchShops = async () => {
        try {
            const res = await axios.get(`${SHOPS_API}?limit=100`, { headers });
            setShops(res.data.shops || res.data);
        } catch (err) { /* ignore */ }
    };

    useEffect(() => { fetchShops(); }, []);
    useEffect(() => { fetchRecords(); }, [search, page]);

    const openAdd = () => { setForm(emptyForm); setEditId(null); setModalOpen(true); };
    const openEdit = (rec) => {
        setForm({
            rationCardNumber: rec.rationCardNumber,
            category: rec.category,
            address: rec.address,
            district: rec.district,
            assignedShop: rec.assignedShop?._id || '',
            members: rec.members.length ? rec.members : [{ name: '', aadhaar: '', relation: 'Head', gender: 'Male', dob: '' }]
        });
        setEditId(rec._id);
        setModalOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editId) {
                await axios.put(`${API}/${editId}`, form, { headers });
            } else {
                await axios.post(API, form, { headers });
            }
            setModalOpen(false);
            fetchRecords();
        } catch (err) {
            alert(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this ration card record?')) return;
        try {
            await axios.delete(`${API}/${id}`, { headers });
            fetchRecords();
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    const addMember = () => setForm({ ...form, members: [...form.members, { name: '', aadhaar: '', relation: 'Other', gender: 'Male', dob: '' }] });
    const removeMember = (i) => setForm({ ...form, members: form.members.filter((_, idx) => idx !== i) });
    const updateMember = (i, field, val) => {
        const updated = [...form.members];
        updated[i] = { ...updated[i], [field]: val };
        setForm({ ...form, members: updated });
    };

    const catColors = { AAY: '#fef9c3:#854d0e', PHH: '#dbeafe:#1d4ed8', NPHH: '#dcfce7:#15803d', AY: '#fce7f3:#be185d' };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <ShieldCheck size={24} color="#2563eb" /> Government Ration Card Records
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Pre-loaded records used to validate citizen registration</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={fetchRecords} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>
                        <RefreshCw size={16} color="#64748b" />
                    </button>
                    <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <Plus size={15} /> Add Record
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by card no, district, or name..."
                    style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div>
            ) : records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
                    No records found. Add your first ration card record.
                </div>
            ) : (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Card No', 'District', 'Category', 'Members', 'Shop', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((rec, i) => {
                                const [bg, fg] = (catColors[rec.category] || '#f1f5f9:#475569').split(':');
                                return (
                                    <>
                                        <tr key={rec._id} style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === rec._id ? null : rec._id)}>
                                            <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#1e293b' }}>{rec.rationCardNumber}</td>
                                            <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{rec.district}</td>
                                            <td style={{ padding: '0.85rem 1rem' }}><span style={{ background: bg, color: fg, fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>{rec.category}</span></td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#475569' }}><Users size={13} /> {rec.members.length}</span>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>{rec.assignedShop?.shopId || '—'}</td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                {rec.isRegistered
                                                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#15803d', fontSize: '0.78rem', fontWeight: '600' }}><UserCheck size={13} /> Registered</span>
                                                    : <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Available</span>}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => openEdit(rec)} style={{ padding: '0.3rem 0.6rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}><Edit3 size={12} /></button>
                                                    <button onClick={() => handleDelete(rec._id)} style={{ padding: '0.3rem 0.6rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}><Trash2 size={12} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === rec._id && (
                                            <tr key={`${rec._id}-expanded`} style={{ background: '#f8fafc' }}>
                                                <td colSpan={7} style={{ padding: '0.75rem 1rem 0.75rem 1.5rem' }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.4rem' }}><strong>Address:</strong> {rec.address}</div>
                                                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                                        {rec.members.map((m, mi) => (
                                                            <div key={mi} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}>
                                                                <div style={{ fontWeight: '700', color: '#1e293b' }}>{m.name}</div>
                                                                <div style={{ color: '#64748b' }}>{m.relation} · {m.aadhaar}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)} style={{ padding: '0.4rem 0.8rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: p === page ? '#2563eb' : '#fff', color: p === page ? '#fff' : '#475569', cursor: 'pointer', fontWeight: '600' }}>{p}</button>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b', margin: 0 }}>{editId ? 'Edit Record' : 'Add New Ration Card Record'}</h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            {[
                                { label: 'Ration Card Number *', key: 'rationCardNumber', type: 'text', placeholder: 'e.g. TN-RC-001001' },
                                { label: 'District *', key: 'district', type: 'text', placeholder: 'e.g. Salem' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '0.8rem', color: '#374151', marginBottom: '0.3rem' }}>{f.label}</label>
                                    <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                        style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            ))}
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.8rem', color: '#374151', marginBottom: '0.3rem' }}>Category</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '0.875rem', outline: 'none' }}>
                                    {['AAY', 'PHH', 'NPHH', 'AY'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.8rem', color: '#374151', marginBottom: '0.3rem' }}>Assigned Shop</label>
                                <select value={form.assignedShop} onChange={e => setForm({ ...form, assignedShop: e.target.value })}
                                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '0.875rem', outline: 'none' }}>
                                    <option value="">— Select Shop —</option>
                                    {shops.map(s => <option key={s._id} value={s._id}>{s.shopId} – {s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.8rem', color: '#374151', marginBottom: '0.3rem' }}>Address *</label>
                            <input type="text" placeholder="Full address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                        </div>

                        {/* Members */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontWeight: '700', fontSize: '0.875rem', color: '#1e293b' }}>Family Members</label>
                                <button onClick={addMember} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>
                                    <Plus size={12} /> Add Member
                                </button>
                            </div>
                            {form.members.map((m, i) => (
                                <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.6rem', background: '#f8fafc' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', gap: '0.6rem', alignItems: 'end' }}>
                                        {[
                                            { label: 'Name', key: 'name', type: 'text', placeholder: 'Full name' },
                                            { label: 'Aadhaar (12 digits)', key: 'aadhaar', type: 'text', placeholder: '123456789012' },
                                        ].map(f => (
                                            <div key={f.key}>
                                                {i === 0 && <label style={{ display: 'block', fontWeight: '600', fontSize: '0.72rem', color: '#64748b', marginBottom: '0.2rem' }}>{f.label}</label>}
                                                <input type={f.type} placeholder={f.placeholder} value={m[f.key]} onChange={e => updateMember(i, f.key, e.target.value)}
                                                    style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
                                            </div>
                                        ))}
                                        <div>
                                            {i === 0 && <label style={{ display: 'block', fontWeight: '600', fontSize: '0.72rem', color: '#64748b', marginBottom: '0.2rem' }}>Relation</label>}
                                            <select value={m.relation} onChange={e => updateMember(i, 'relation', e.target.value)}
                                                style={{ width: '100%', padding: '0.45rem 0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}>
                                                {['Head', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other'].map(r => <option key={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            {i === 0 && <label style={{ display: 'block', fontWeight: '600', fontSize: '0.72rem', color: '#64748b', marginBottom: '0.2rem' }}>Gender</label>}
                                            <select value={m.gender} onChange={e => updateMember(i, 'gender', e.target.value)}
                                                style={{ width: '100%', padding: '0.45rem 0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}>
                                                {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
                                            </select>
                                        </div>
                                        <button onClick={() => removeMember(i)} disabled={form.members.length === 1} style={{ padding: '0.45rem 0.5rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', marginTop: i === 0 ? '1rem' : 0 }}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: '600', color: '#64748b' }}>Cancel</button>
                            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '0.65rem', border: 'none', borderRadius: '8px', background: saving ? '#93c5fd' : '#2563eb', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {saving ? <RefreshCw size={15} /> : <Save size={15} />} {saving ? 'Saving...' : 'Save Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RationRecords;
