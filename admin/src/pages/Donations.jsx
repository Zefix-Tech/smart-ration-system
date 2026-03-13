import { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../components/DataTable';
import { LuHeart, LuArrowRight, LuX, LuBuilding, LuCheck } from 'react-icons/lu';
import toast from 'react-hot-toast';
import '../styles/page.css';

const Donations = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [orphanages, setOrphanages] = useState([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [selectedOrphanageId, setSelectedOrphanageId] = useState('');

    const fetchDonations = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('srms_token');
            const res = await axios.get(`http://localhost:5001/api/donations?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data.donations);
            setPages(res.data.pages);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrphanages = async () => {
        try {
            const token = sessionStorage.getItem('srms_token');
            const res = await axios.get('http://localhost:5001/api/admin/orphanages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrphanages(res.data);
            if (res.data.length > 0) setSelectedOrphanageId(res.data[0]._id);
        } catch(err) {
            console.error('Failed to load orphanages', err);
        }
    };

    useEffect(() => {
        fetchDonations();
        fetchOrphanages();
    }, [page]);

    const handleAssignClick = (row) => {
        setSelectedDonation(row);
        setIsAssignModalOpen(true);
    };

    const handleConfirmAssign = async () => {
        if (!selectedDonation || !selectedOrphanageId) return;
        const loadingToast = toast.loading('Assigning donation...');
        try {
            const token = sessionStorage.getItem('srms_token');
            await axios.post(`http://localhost:5001/api/admin/donations/assign`, {
                donationId: selectedDonation._id,
                orphanageId: selectedOrphanageId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Donation successfully assigned.', { id: loadingToast });
            setIsAssignModalOpen(false);
            fetchDonations();
        } catch (err) {
            console.error(err);
            toast.error('Failed to assign donation', { id: loadingToast });
        }
    };

    const handleDistribute = async (id) => {
        if (!window.confirm('Mark this donation as successfully distributed to the assigned organization?')) return;
        const loadingToast = toast.loading('Updating distribution status...');
        try {
            const token = sessionStorage.getItem('srms_token');
            await axios.patch(`http://localhost:5001/api/donations/${id}/distribute`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Status updated to distributed', { id: loadingToast });
            fetchDonations();
        } catch (err) {
            console.error(err);
            toast.error('Failed to update status', { id: loadingToast });
        }
    };

    const columns = [
        {
            header: 'Donor Info', render: (row) => (
                <div>
                    <div className="font-semibold text-gray-900">{row.donorName}</div>
                    <div className="text-xs text-gray-500 text-capitalize">{row.donorType}</div>
                </div>
            )
        },
        {
            header: 'Donated Items', render: (row) => (
                <div className="donation-items">
                    {row.items.map((item, i) => (
                        <span key={i} className="donation-item-tag">
                            {item.quantity} {item.unit} <span className="text-capitalize">{item.commodity}</span>
                        </span>
                    ))}
                </div>
            )
        },
        {
            header: 'Assignment Target', render: (row) => (
                row.status === 'received' ? <span className="text-gray-400 text-sm italic">Unassigned</span> :
                    <div>
                        <div className="font-semibold text-gray-900">{row.assignedTo}</div>
                        <div className="text-xs text-gray-500 text-capitalize">{row.assignedType.replace('_', ' ')}</div>
                    </div>
            )
        },
        {
            header: 'Status', render: (row) => (
                <span className={`badge-outline ${row.status === 'distributed' ? 'badge-outline-green' :
                    row.status === 'assigned' ? 'badge-outline-blue' :
                        'badge-outline-orange'
                    }`}>
                    {row.status.toUpperCase()}
                </span>
            )
        },
        {
            header: 'Actions', render: (row) => (
                <div className="flex-item gap-2 text-sm">
                    {row.status === 'received' && (
                        <button onClick={() => handleAssignClick(row)} className="btn-action btn-action-blue">
                            Assign &rarr;
                        </button>
                    )}
                    {row.status === 'assigned' && (
                        <button onClick={() => handleDistribute(row._id)} className="btn-action btn-action-green">
                            Mark Distributed
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title flex-item-center gap-2">
                        <LuHeart className="text-pink-500" /> Donation Management
                    </h1>
                    <p className="page-subtitle">Track external ration donations and assign to vulnerable institutions</p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                total={total}
                page={page}
                pages={pages}
                onPageChange={setPage}
            />

            {isAssignModalOpen && (
                <div className="modal-overlay" style={{ 
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
                }}>
                    <div style={{ 
                        background: 'white', borderRadius: '12px', padding: '24px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)', width: '100%', maxWidth: '420px'
                    }}>
                        <div className="mb-2">
                            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                                Assign Donation to Orphanage
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
                                Select an orphanage to receive this donation.
                            </p>
                        </div>

                        {/* Donation Information Card */}
                        <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                            <div className="text-sm text-gray-700">
                                <span className="font-bold">Donor:</span> {selectedDonation?.donorName}
                            </div>
                            <div className="text-sm text-gray-700 mt-1">
                                <span className="font-bold">Items:</span> {selectedDonation?.items.map(i => `${i.quantity}${i.unit} ${i.commodity}`).join(', ')}
                            </div>
                        </div>

                        {/* Orphanage Select */}
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-gray-700">Select Orphanage</label>
                            <select 
                                style={{
                                    width: '100%', padding: '8px 10px', border: '1px solid #d1d5db',
                                    borderRadius: '6px', marginTop: '6px'
                                }}
                                value={selectedOrphanageId} 
                                onChange={(e) => setSelectedOrphanageId(e.target.value)}
                            >
                                <option value="" disabled>Choose an institution...</option>
                                {orphanages.map(org => {
                                    const isMatch = selectedDonation?.district === org.location;
                                    return (
                                        <option key={org._id} value={org._id}>
                                            {org.name} — {org.location} {isMatch ? '(Matching District)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button 
                                style={{
                                    background: '#e5e7eb', color: '#374151', padding: '8px 16px',
                                    borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#d1d5db'}
                                onMouseOut={(e) => e.target.style.background = '#e5e7eb'}
                                onClick={() => setIsAssignModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                style={{
                                    background: '#2563eb', color: 'white', padding: '8px 16px',
                                    borderRadius: '6px', border: 'none', fontWeight: '500', 
                                    cursor: 'pointer', transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
                                onMouseOut={(e) => e.target.style.background = '#2563eb'}
                                onClick={handleConfirmAssign}
                            >
                                Confirm Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Donations;
