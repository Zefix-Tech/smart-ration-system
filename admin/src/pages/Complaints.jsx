import { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../components/DataTable';
import { LuMessageSquare, LuCornerUpLeft, LuCheck, LuX } from 'react-icons/lu';
import toast from 'react-hot-toast';
import '../styles/page.css';

const Complaints = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [replyText, setReplyText] = useState('');

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('srms_token');
            const res = await axios.get(`http://localhost:5001/api/complaints?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data.complaints);
            setPages(res.data.pages);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load complaints');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, [page]);

    const handleOpenReply = (complaint) => {
        setSelectedComplaint(complaint);
        setReplyText(complaint.adminResponse || '');
        setReplyModalOpen(true);
    };

    const submitReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) {
            toast.error('Response cannot be empty');
            return;
        }
        
        const loadingToast = toast.loading('Sending reply...');
        try {
            const token = localStorage.getItem('srms_token');
            await axios.patch(`http://localhost:5001/api/complaints/${selectedComplaint._id}`, { adminResponse: replyText, status: 'in_progress' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Reply submitted successfully', { id: loadingToast });
            setReplyModalOpen(false);
            fetchComplaints();
        } catch (err) {
            console.error(err);
            toast.error('Failed to send response', { id: loadingToast });
        }
    };

    const handleResolve = async (id) => {
        if (!window.confirm('Mark this complaint as resolved?')) return;
        const loadingToast = toast.loading('Resolving complaint...');
        try {
            const token = localStorage.getItem('srms_token');
            await axios.patch(`http://localhost:5001/api/complaints/${id}`, { status: 'resolved' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Complaint resolved', { id: loadingToast });
            fetchComplaints();
        } catch (err) {
            console.error(err);
            toast.error('Failed to resolve complaint', { id: loadingToast });
        }
    };

    const columns = [
        { header: 'Complaint ID', accessor: '_id', render: (row) => <div className="font-mono text-xs text-gray-500">{row._id.slice(-8).toUpperCase()}</div> },
        { header: 'User Name', accessor: 'user.name', render: (row) => <div className="font-semibold text-gray-900">{row.user?.name}</div> },
        { header: 'Message', accessor: 'message', render: (row) => <div className="complaint-msg">{row.message}</div> },
        { header: 'Date', render: (row) => <span className="text-sm text-gray-700">{new Date(row.createdAt).toLocaleDateString()}</span> },
        {
            header: 'Status', render: (row) => (
                <span className={`badge-outline ${row.status === 'resolved' ? 'badge-outline-green' :
                    row.status === 'in_progress' ? 'badge-outline-blue' :
                        'badge-outline-orange'
                    }`}>
                    {row.status.replace('_', ' ').toUpperCase()}
                </span>
            )
        },
        {
            header: 'Actions', render: (row) => (
                <div className="flex-item flex-col gap-2">
                    {row.status !== 'resolved' && (
                        <>
                            <button onClick={() => handleOpenReply(row)} className="btn-action btn-action-blue flex-item-center gap-1 justify-center">
                                <LuCornerUpLeft size={14} /> Reply
                            </button>
                            <button onClick={() => handleResolve(row._id)} className="btn-action btn-action-green flex-item-center gap-1 justify-center">
                                <LuCheck size={14} /> Resolve
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="page-container relative">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Complaints & Grievances</h1>
                    <p className="page-subtitle">Monitor and respond to citizen complaints</p>
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

            {/* Reply Modal */}
            {replyModalOpen && selectedComplaint && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title flex-item-center gap-2">
                                <LuMessageSquare className="text-blue-500" /> Respond to Complaint
                            </h3>
                            <button onClick={() => setReplyModalOpen(false)} className="modal-close"><LuX size={20}/></button>
                        </div>
                        <div className="modal-body">
                            <form id="replyForm" onSubmit={submitReply} className="flex-col gap-3">
                                <div>
                                    <h4 className="modal-section-title">Complaint Details</h4>
                                    <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-2">
                                            <LuMessageSquare className="text-blue-500" /> Citizen's Message ({selectedComplaint.user?.name})
                                        </p>
                                        <p className="text-gray-800 text-sm whitespace-pre-wrap">{selectedComplaint.message}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="modal-section-title">Admin Response</h4>
                                    <div className="flex flex-col gap-1 relative">
                                        <label className="form-label">Your Response <span className="text-red-500">*</span></label>
                                        <div className="input-icon-wrapper">
                                            <textarea 
                                                className="form-input min-h-[120px] resize-none" 
                                                value={replyText} 
                                                onChange={(e) => setReplyText(e.target.value)} 
                                                placeholder="Type your official response to the citizen here..." 
                                                required
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={() => setReplyModalOpen(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" form="replyForm" className="btn-primary">Send Response</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Complaints;
