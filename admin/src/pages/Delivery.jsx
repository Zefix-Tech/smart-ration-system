import { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../components/DataTable';
import { LuCheck, LuX, LuFileText, LuPlus, LuUser, LuMapPin, LuClipboardList } from 'react-icons/lu';
import '../styles/page.css';

const Delivery = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        userId: '', reason: 'pregnant', description: '', address: ''
    });

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('srms_token');
            const res = await axios.get(`http://localhost:5001/api/delivery?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data.requests);
            setPages(res.data.pages);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [page]);

    const handleAction = async (id, status) => {
        const note = window.prompt(`Enter note for ${status} decision (optional):`);
        if (note === null) return; // cancelled
        try {
            const token = localStorage.getItem('srms_token');
            await axios.patch(`http://localhost:5001/api/delivery/${id}`, { status, adminNote: note }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRequests();
        } catch (err) {
            alert('Failed to update request');
        }
    };

    const handleAddRequest = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Submitting delivery request...');
        try {
            const token = localStorage.getItem('srms_token');
            await axios.post('http://localhost:5001/api/delivery', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Request submitted successfully', { id: loadingToast });
            setIsAddModalOpen(false);
            setFormData({ userId: '', reason: 'pregnant', description: '', address: '' });
            fetchRequests();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Operation failed', { id: loadingToast });
        }
    };

    const columns = [
        {
            header: 'User Name', render: (row) => (
                <div className="font-semibold text-gray-900">{row.user?.name}</div>
            )
        },
        {
            header: 'Delivery Reason', render: (row) => (
                <span className="delivery-reason">
                    {row.reason.replace('_', ' ')}
                </span>
            )
        },
        {
            header: 'Uploaded Medical Certificate', render: (row) => (
                row.certificateUrl ? (
                    <a href="#" className="doc-link">
                        <LuFileText /> View Certificate
                    </a>
                ) : <span className="text-gray-400 text-sm">No certificate</span>
            )
        },
        { header: 'Date', render: (row) => <span className="text-sm text-gray-700">{new Date(row.requestDate).toLocaleDateString()}</span> },
        {
            header: 'Status', render: (row) => (
                <span className={`badge ${row.status === 'approved' ? 'badge-green' :
                    row.status === 'rejected' ? 'badge-red' :
                        'badge-gray'
                    }`}>
                    {row.status.toUpperCase()}
                </span>
            )
        },
        {
            header: 'Actions', render: (row) => (
                row.status === 'pending' ? (
                    <div className="flex-item gap-2">
                        <button onClick={() => handleAction(row._id, 'approved')} className="btn-action btn-action-green flex-item-center justify-center p-2" title="Approve">
                            <LuCheck size={18} />
                        </button>
                        <button onClick={() => handleAction(row._id, 'rejected')} className="btn-action btn-action-red flex-item-center justify-center p-2" title="Reject">
                            <LuX size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500" title={row.adminNote || 'No note'}>
                        {row.adminNote || '-'}
                    </div>
                )
            )
        }
    ];

    return (
        <div className="page-container">
            <div className="page-header justify-between">
                <div>
                    <h1 className="page-title">Delivery Requests</h1>
                    <p className="page-subtitle">Verify and approve special home delivery requests</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex-item-center gap-2">
                    <LuPlus /> Add Delivery Request
                </button>
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

            {/* Add Delivery Request Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">Add Delivery Request</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="modal-close"><LuX size={20}/></button>
                        </div>
                        <div className="modal-body">
                            <form id="addDeliveryForm" onSubmit={handleAddRequest} className="flex-col gap-3">
                                {/* Basic Information */}
                                <div>
                                    <h4 className="modal-section-title">Basic Information</h4>
                                    <div className="flex-col gap-2">
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Target User ID <span className="text-red-500">*</span></label>
                                            <div className="input-icon-wrapper">
                                                <LuUser  />
                                                <input type="text" className="form-input" value={formData.userId} onChange={(e) => setFormData({...formData, userId: e.target.value})} required placeholder="e.g. 64a8c..." />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Approval Reason <span className="text-red-500">*</span></label>
                                            <div className="input-icon-wrapper">
                                                <LuClipboardList  />
                                                <select className="form-input" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} required>
                                                    <option value="pregnant">Pregnant Woman</option>
                                                    <option value="senior_citizen">Senior Citizen (Above 60)</option>
                                                    <option value="disabled">Differently Abled</option>
                                                    <option value="injured">Temporarily Disabled/Injured</option>
                                                    <option value="other">Other Eligible Need</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="form-label">Request Notes</label>
                                            <textarea className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Additional details..." />
                                        </div>
                                    </div>
                                </div>

                                {/* Location Information */}
                                <div>
                                    <h4 className="modal-section-title">Target Location</h4>
                                    <div className="flex flex-col gap-1 relative">
                                        <label className="form-label">Delivery Address <span className="text-red-500">*</span></label>
                                        <div className="input-icon-wrapper">
                                            <LuMapPin  />
                                            <input type="text" className="form-input" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required placeholder="Enter home address" />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" form="addDeliveryForm" className="btn-primary">Create Request</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Delivery;
