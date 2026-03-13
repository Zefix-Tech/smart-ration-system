import { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../components/DataTable';
import { LuCheck, LuX, LuFileText } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import '../styles/page.css';

const Eligibility = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('srms_token');
            const res = await axios.get('http://localhost:5001/api/eligibility/admin/requests?status=PENDING', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch eligibility requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id, status) => {
        if (!window.confirm(`Are you sure you want to mark this request as ${status}?`)) return;
        
        const loadingToast = toast.loading(`Marking as ${status}...`);
        try {
            const token = localStorage.getItem('srms_token');
            await axios.put(`http://localhost:5001/api/eligibility/admin/verify/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Request ${status} successfully!`, { id: loadingToast });
            fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed', { id: loadingToast });
        }
    };

    const columns = [
        {
            header: 'Citizen Info', render: (row) => (
                <div>
                    <div className="font-semibold text-gray-900">{row.name}</div>
                    <div className="text-sm text-gray-500">Card: {row.rationCard}</div>
                    <div className="text-sm text-gray-500">{row.phone}</div>
                </div>
            )
        },
        {
            header: 'Claimed Eligibility', render: (row) => (
                <div className="flex-col gap-1 text-sm">
                    <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-1 rounded inline-block w-max mb-1">
                        {row.eligibilityType || 'Not specified'}
                    </span>
                    {row.eligibilityReason && (
                        <div className="text-xs text-gray-500 mt-1 italic max-w-[250px]">{row.eligibilityReason}</div>
                    )}
                </div>
            )
        },
        {
            header: 'Document', render: (row) => (
                row.eligibilityDocumentUrl ? (
                    <a href={`http://localhost:5001${row.eligibilityDocumentUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                        <LuFileText /> View Proof
                    </a>
                ) : <span className="text-gray-400 text-sm">Missing</span>
            )
        },
        {
            header: 'Actions', render: (row) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => handleAction(row._id, 'VERIFIED')} className="btn-action btn-action-green flex items-center justify-center p-2" title="Approve">
                        <LuCheck size={18} />
                    </button>
                    <button onClick={() => handleAction(row._id, 'REJECTED')} className="btn-action btn-action-red flex items-center justify-center p-2" title="Reject">
                        <LuX size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="page-container">
            <div className="page-header justify-between">
                <div>
                    <h1 className="page-title">Eligibility Verification</h1>
                    <p className="page-subtitle">Verify citizen documents to unlock the delivery feature</p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                total={data.length}
                page={1}
                pages={1}
                onPageChange={() => {}}
            />
        </div>
    );
};

export default Eligibility;
