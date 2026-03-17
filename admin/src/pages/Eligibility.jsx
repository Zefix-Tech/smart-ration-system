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
            const token = sessionStorage.getItem('srms_token');
            const res = await axios.get('http://localhost:5001/api/eligibility/admin/requests?status=Hospital Verified', {
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
        const actionText = status === 'VERIFIED' ? 'approving' : 'rejecting';
        if (!window.confirm(`Are you sure you want to proceed with ${actionText} this request?`)) return;
        
        const loadingToast = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} request...`);
        try {
            const token = sessionStorage.getItem('srms_token');
            const res = await axios.put(`http://localhost:5001/api/eligibility/admin/verify/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success(res.data.message || `Request ${status.toLowerCase()} successfully!`, { id: loadingToast });
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
                    <div className="flex flex-col gap-1">
                        <a href={`http://localhost:5001${row.eligibilityDocumentUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                            <LuFileText /> View Proof
                        </a>
                    </div>
                ) : <span className="text-gray-400 text-sm">Missing</span>
            )
        },
        {
            header: 'AI Result', render: (row) => {
                const getConfidenceColor = (score) => {
                    if (score >= 80) return 'text-green-600';
                    if (score >= 50) return 'text-yellow-600';
                    return 'text-red-600';
                };

                return (
                    <div className="text-xs">
                        <div className={`font-bold ${row.aiVerificationStatus === 'AI_VERIFIED' ? 'text-green-600' : row.aiVerificationStatus === 'AI_REJECTED' ? 'text-red-600' : 'text-orange-500'}`}>
                            {row.aiVerificationStatus?.replace('_', ' ') || 'PENDING'}
                        </div>
                        {row.aiConfidenceScore !== undefined && (
                            <div className={`font-semibold ${getConfidenceColor(row.aiConfidenceScore)}`}>
                                Confidence: {row.aiConfidenceScore}%
                            </div>
                        )}
                        {row.detectedKeywords?.length > 0 && (
                            <div className="text-gray-400 mt-1">
                                Keywords: {row.detectedKeywords.join(', ')}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Status', render: (row) => (
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {row.eligibilityStatus}
                </span>
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
