import React, { useState, useEffect, useCallback } from 'react';

// --- Type Definitions for Admin View ---

interface IDonation {
    _id: string;
    name: string;
    phone: string;
    mail: string;
    pincode: string;
    amount: number; // in INR
    razorpay_order_id: string;
    razorpay_payment_id: string; // The property we are displaying
    payment_status: 'pending' | 'success' | 'failed';
    createdAt: string;
    updatedAt: string;
}

interface IDonationsResponse {
    success: boolean;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    donations: IDonation[];
}

interface ITotalStatsResponse {
    success: boolean;
    totalAmount: number;
    totalDonations: number;
}

interface IReconcileResponse {
    success: boolean;
    message: string;
}

interface IFilterState {
    page: number;
    limit: number;
    status: string; // 'pending', 'success', 'failed', or ''
    search: string; // Search query for name, mail, phone
}

// --- Helper Function: GET ADMIN TOKEN ---
/**
 * Retrieves the admin authentication token from local storage.
 * @returns The token string or null if not found.
 */
const getAdminToken = (): string | null => {
    return localStorage.getItem("token");
};

const STATUS_OPTIONS = [
    { label: 'All Statuses', value: '' },
    { label: 'Success', value: 'success' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
];

export default function DonationManagement() {
    const [donationsData, setDonationsData] = useState<IDonationsResponse | null>(null);
    const [totalStats, setTotalStats] = useState<ITotalStatsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isReconciling, setIsReconciling] = useState<boolean>(false); // NEW state for reconciliation
    const [filter, setFilter] = useState<IFilterState>({
        page: 1,
        limit: 20,
        status: '',
        search: '',
    });
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

    // Base URL for API calls
    const API_BASE_URL = import.meta.env.VITE_API;
    const ADMIN_TOKEN = getAdminToken();

    // Fetch Donations List
    const fetchDonations = useCallback(async () => {
        // If there's no token, stop the fetch attempt
        if (!ADMIN_TOKEN) {
            setMessage({ text: 'Access Denied: Please log in as an administrator.', type: 'error' });
            return;
        }

        setLoading(true);
        // Clear message only when starting a new fetch, not for reconciliation
        if (!isReconciling) {
            setMessage({ text: '', type: '' });
        }

        // Construct the query string from the filter state
        const queryParams = new URLSearchParams({
            page: filter.page.toString(),
            limit: filter.limit.toString(),
            ...(filter.status && { status: filter.status }),
            ...(filter.search && { search: filter.search }),
        }).toString();

        try {
            const res = await fetch(`${API_BASE_URL}api/donation/all?${queryParams}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_TOKEN}`, // Use the retrieved token
                },
            });

            // Define a type to handle both success (IDonationsResponse) and failure (includes message)
            type ResponseType = IDonationsResponse & { message?: string, success: boolean };
            const data: ResponseType = await res.json();


            if (data.success) {
                // Cast to the successful response type for state storage
                setDonationsData(data as IDonationsResponse);
            } else {
                setMessage({ text: data.message || 'Failed to fetch donations list. Unauthorized or Server Error.', type: 'error' });
            }
        } catch (err) {
            console.error('Fetch donations error:', err);
            setMessage({ text: 'Network error while fetching donations.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [filter.page, filter.limit, filter.status, filter.search, API_BASE_URL, ADMIN_TOKEN, isReconciling]); // Added isReconciling

    // Fetch Total Stats (Amount and Count)
    const fetchTotalStats = useCallback(async () => {
        if (!ADMIN_TOKEN) return; // Prevent fetch if no token is present

        try {
            const res = await fetch(`${API_BASE_URL}api/donation/total`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_TOKEN}`,
                },
            });
            const data: ITotalStatsResponse & { message?: string } = await res.json();

            if (data.success) {
                setTotalStats(data);
            } else {
                console.error('Failed to fetch total stats:', data.message);
            }
        } catch (err) {
            console.error('Fetch total stats error:', err);
        }
    }, [API_BASE_URL, ADMIN_TOKEN]);


    // NEW: Handle Reconciliation
    const handleReconcile = useCallback(async () => {
        if (!ADMIN_TOKEN || isReconciling) return;

        setIsReconciling(true);
        setMessage({ text: 'Starting payment reconciliation...', type: '' });

        try {
            const res = await fetch(`${API_BASE_URL}api/donation/reconcile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_TOKEN}`,
                },
            });
            const data: IReconcileResponse = await res.json();

            if (data.success) {
                setMessage({ text: `Reconciliation successful! ${data.message}`, type: 'success' });
                // Re-fetch the donations list and stats to update the UI
                fetchDonations();
                fetchTotalStats();
            } else {
                setMessage({ text: `Reconciliation failed: ${data.message}`, type: 'error' });
            }
        } catch (err) {
            console.error('Reconciliation error:', err);
            setMessage({ text: 'Network error during reconciliation. Check server connectivity.', type: 'error' });
        } finally {
            setIsReconciling(false);
        }
    }, [API_BASE_URL, ADMIN_TOKEN, isReconciling, fetchDonations, fetchTotalStats]); // Added dependencies

    // Initial load and whenever filters change
    useEffect(() => {
        fetchDonations();
    }, [fetchDonations]);

    // Fetch total stats only once or when mounted
    useEffect(() => {
        fetchTotalStats();
    }, [fetchTotalStats]);

    // --- Handlers ---

    const handlePageChange = (newPage: number) => {
        if (donationsData && newPage >= 1 && newPage <= donationsData.totalPages) {
            setFilter(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilter(prev => ({ ...prev, status: e.target.value, page: 1 })); // Reset to page 1
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilter(prev => ({ ...prev, search: e.target.value, page: 1 })); // Reset to page 1
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const getStatusStyles = (status: IDonation['payment_status']) => {
        switch (status) {
            case 'success':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };



    // Crucial check: if the token is null, stop rendering the content
    if (!ADMIN_TOKEN && !loading) {
        return <div className="flex items-center justify-center min-h-screen p-8">
            <div className="bg-red-50 border border-red-300 p-6 rounded-xl shadow-lg text-center">
                <h2 className="text-xl font-bold text-red-800 mb-2">🛑 Access Forbidden</h2>
                <p className="text-red-700">You must be logged in as an administrator to view this page. Please log in to gain access.</p>
            </div>
        </div>;
    }

    // Define the column count for colspan logic
    const COLUMN_COUNT = 8;

    return (
        <div className="p-8 min-h-screen bg-gray-50 font-sans">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">💰 Donation Management</h1>
            <p className="text-gray-500 mb-4">View, search, and manage all donation records.</p>

            {/* --- Reconciliation Button --- */}
            <div className="mb-8 flex justify-end">
                <button
                    onClick={handleReconcile}
                    disabled={isReconciling || loading}
                    className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 transition duration-150"
                >
                    {isReconciling ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Reconciling...</span>
                        </>
                    ) : (
                        <>
                            <span>🔄 Reconcile Payments</span>
                        </>
                    )}
                </button>
            </div>

            {/* --- Overall Statistics --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Total Donations Count"
                    value={totalStats?.totalDonations.toLocaleString('en-IN') ?? '...'}
                    icon="📊"
                />
                <StatCard
                    title="Total Amount Collected"
                    value={formatAmount(totalStats?.totalAmount ?? 0)}
                    icon="📈"
                />
                <StatCard
                    title="Pending Donations"
                    // Display pending count from donationsData if available, otherwise '...'
                    value={donationsData?.donations.filter(d => d.payment_status === 'pending').length.toLocaleString('en-IN') ?? '...'}
                    icon="⏳"
                />
            </div>

            {/* Message Display */}
            {message.text && (
                <div className={`p-4 rounded-lg text-center font-medium mb-6 ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {message.text}
                </div>
            )}

            {/* --- Filter and Search Bar --- */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm items-center justify-between">
                <div className="flex items-center space-x-4 w-full md:w-auto">
                    <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Status:</label>
                    <select
                        id="status-filter"
                        value={filter.status}
                        onChange={handleStatusChange}
                        className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        {STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
                <div className="w-full md:w-1/3">
                    <input
                        type="search"
                        placeholder="Search by name, email, or phone..."
                        value={filter.search}
                        onChange={handleSearchChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* --- Donations Table --- */}
            <div className="bg-white overflow-hidden shadow-lg rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                {/* --- 8 columns total --- */}
                                {['Date', 'Name', 'Email/Phone', 'Pincode', 'Amount (₹)', 'Payment Status', 'Order ID', 'Payment ID'].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    {/* Updated colspan to 8 */}
                                    <td colSpan={COLUMN_COUNT} className="px-6 py-4 text-center text-gray-500">
                                        Loading donations...
                                    </td>
                                </tr>
                            ) : donationsData?.donations.length === 0 ? (
                                <tr>
                                    {/* Updated colspan to 8 */}
                                    <td colSpan={COLUMN_COUNT} className="px-6 py-4 text-center text-gray-500">
                                        No donations found matching the criteria.
                                    </td>
                                </tr>
                            ) : (
                                donationsData?.donations.map((d) => (
                                    <tr key={d._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(d.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {d.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {d.mail} <br /> {d.phone}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {d.pincode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                            {formatAmount(d.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles(d.payment_status)}`}>
                                                {d.payment_status.charAt(0).toUpperCase() + d.payment_status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {d.razorpay_order_id}
                                        </td>

                                        {/* --- Razorpay Payment ID Column --- */}
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {d.razorpay_payment_id || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Pagination --- */}
                {donationsData && donationsData.totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 border-t border-gray-200">
                        <p className="text-sm text-gray-700">
                            Showing page <span className="font-semibold">{donationsData.currentPage}</span> of <span className="font-semibold">{donationsData.totalPages}</span>
                            {' ('}{donationsData.totalCount} total results)
                        </p>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePageChange(donationsData.currentPage - 1)}
                                disabled={donationsData.currentPage === 1 || loading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(donationsData.currentPage + 1)}
                                disabled={donationsData.currentPage === donationsData.totalPages || loading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper component for the stat cards (Remains unchanged)
const StatCard: React.FC<{ title: string; value: string; icon: string }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 border-l-4 border-indigo-500">
        <div className="text-3xl">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);