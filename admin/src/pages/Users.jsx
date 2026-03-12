import { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../components/DataTable';
import { LuBan, LuCheck, LuX, LuUserPlus, LuUser, LuPhone, LuFileText, LuMapPin, LuUsers } from 'react-icons/lu';
import toast from 'react-hot-toast';
import '../styles/page.css';

const Users = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', phone: '', aadhaarNumber: '', rationCard: '', familyMembers: 1, address: '', password: ''
    });

    const handleOpenAddModal = () => {
        setFormData({ name: '', phone: '', aadhaarNumber: '', rationCard: '', familyMembers: 1, address: '', password: '' });
        setIsAddModalOpen(true);
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('srms_token');
            const res = await axios.get(`http://localhost:5001/api/users?page=${page}&limit=10&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data.users);
            setPages(res.data.pages);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    const handleStatusChange = async (userId, newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} this user?`)) return;
        const loadingToast = toast.loading('Updating user status...');
        try {
            const token = localStorage.getItem('srms_token');
            await axios.patch(`http://localhost:5001/api/users/${userId}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`User ${newStatus === 'suspended' ? 'disabled' : 'enabled'} successfully`, { id: loadingToast });
            fetchUsers();
        } catch (err) {
            console.error(err);
            toast.error('Failed to update user status', { id: loadingToast });
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Creating user account...');
        try {
            const payload = { ...formData, role: 'user' };
            await axios.post('http://localhost:5001/api/auth/register', payload);
            toast.success('User created successfully', { id: loadingToast });
            setIsAddModalOpen(false);
            fetchUsers();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Operation failed', { id: loadingToast });
        }
    };

    const columns = [
        { header: 'User ID', accessor: '_id', render: (row) => <div className="font-mono text-xs text-gray-500">{row._id.slice(-8).toUpperCase()}</div> },
        { header: 'Name', accessor: 'name', render: (row) => <div className="font-semibold text-gray-900">{row.name}</div> },
        { header: 'Phone Number', accessor: 'phone', render: (row) => <div className="text-gray-600">{row.phone || 'N/A'}</div> },
        { header: 'Ration Card Number', accessor: 'rationCard', render: (row) => <div className="badge badge-gray font-mono inline-block">{row.rationCard}</div> },
        {
            header: 'Status', accessor: 'status', render: (row) => (
                <span className={`badge flex-item-center gap-1 ${row.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                    {row.status === 'active' ? <LuCheck size={12} /> : <LuBan size={12} />}
                    <span className="text-capitalize">{row.status}</span>
                </span>
            )
        },
        {
            header: 'Actions', render: (row) => (
                <div className="flex-item gap-2">
                    <button onClick={() => setSelectedUser(row)} className="btn-action btn-action-blue">View</button>
                    {row.status === 'active' ? (
                        <button onClick={() => handleStatusChange(row._id, 'suspended')} className="btn-action btn-action-red">Disable</button>
                    ) : (
                        <button onClick={() => handleStatusChange(row._id, 'active')} className="btn-action btn-action-green">Enable</button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="page-container relative">
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Manage all registered ration card holders across Tamil Nadu</p>
                </div>
                <button onClick={handleOpenAddModal} className="btn-primary flex-item-center gap-2">
                    <LuUserPlus /> Add New User
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
                onSearch={(val) => { setSearch(val); setPage(1); }}
                searchPlaceholder="Search by name or card number..."
            />

            {selectedUser && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">User Details</h3>
                            <button onClick={() => setSelectedUser(null)} className="modal-close"><LuX size={20}/></button>
                        </div>
                        <div className="modal-body">
                            <div className="flex-col gap-2">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Full Name</p>
                                    <p className="font-semibold text-gray-800">{selectedUser.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Ration Card No.</p>
                                    <p className="font-mono text-gray-800">{selectedUser.rationCard}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Aadhaar No.</p>
                                    <p className="font-mono text-gray-800">{selectedUser.aadhaarNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                                    <p className="text-gray-800">{selectedUser.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Family Members</p>
                                    <p className="text-gray-800 badge badge-blue inline-block">{selectedUser.familyMembers || 1}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Status</p>
                                    <p className={`font-semibold capitalize ${selectedUser.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{selectedUser.status}</p>
                                </div>
                                <div className="">
                                    <p className="text-xs text-gray-500 mb-1">Home Address</p>
                                    <p className="text-gray-800 bg-gray-50 p-2 rounded border">{selectedUser.address || 'N/A'}</p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Assigned Shop ID</p>
                                    <p className="font-mono text-blue-600">{selectedUser.shopId || 'Not Assigned'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setSelectedUser(null)} className="btn-secondary">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">Add New User</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="modal-close"><LuX size={20}/></button>
                        </div>
                        <div className="modal-body">
                            <form id="addUserForm" onSubmit={handleAddUser} className="flex-col gap-3">
                                {/* Basic Information */}
                                <div>
                                    <h4 className="modal-section-title">Basic Information</h4>
                                    <div className="flex-col gap-2">
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                                            <div className="input-icon-wrapper">
                                                <LuUser  />
                                                <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="e.g. John Doe" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Family Members <span className="text-red-500">*</span></label>
                                            <div className="input-icon-wrapper">
                                                <LuUsers  />
                                                <input type="number" min="1" max="15" className="form-input" value={formData.familyMembers} onChange={(e) => setFormData({...formData, familyMembers: e.target.value})} required placeholder="e.g. 4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Identity & Contact Details */}
                                <div>
                                    <h4 className="modal-section-title">Identity & Contact Details</h4>
                                    <div className="flex-col gap-2">
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Ration Card No <span className="text-red-500">*</span></label>
                                            <div className="input-icon-wrapper">
                                                <LuFileText  />
                                                <input type="text" className="form-input" value={formData.rationCard} onChange={(e) => setFormData({...formData, rationCard: e.target.value})} required placeholder="12-digit card number" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Aadhaar No <span className="text-red-500">*</span></label>
                                            <div className="input-icon-wrapper">
                                                <LuFileText  />
                                                <input type="text" className="form-input" value={formData.aadhaarNumber} onChange={(e) => setFormData({...formData, aadhaarNumber: e.target.value})} required placeholder="12-digit aadhar" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Phone Number <span className="text-red-500">*</span></label>
                                            <div className="input-icon-wrapper">
                                                <LuPhone  />
                                                <input type="tel" pattern="[0-9]{10}" title="Ten digit mobile number" className="form-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required placeholder="10-digit mobile" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Initial Password <span className="text-red-500">*</span></label>
                                            <div className="input-icon-wrapper">
                                                <LuFileText  />
                                                <input type="text" className="form-input" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required placeholder="Temporary password" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Information */}
                                <div>
                                    <h4 className="modal-section-title">Location Information</h4>
                                    <div className="flex-col gap-2">
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Full Address</label>
                                            <div className="input-icon-wrapper">
                                                <LuMapPin  />
                                                <input type="text" className="form-input" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Residential address" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" form="addUserForm" className="btn-primary">Create User</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;

