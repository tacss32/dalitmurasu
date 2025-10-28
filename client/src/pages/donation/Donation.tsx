
import React, { useState } from 'react';

// --- Type Definitions ---

interface IFormData {
    name: string;
    phone: string;
    mail: string;
    pincode: string;
    amount: string;
}

interface IMessage {
    text: string;
    type: 'success' | 'error' | 'info' | '';
}


interface IRecordData {
    donationId: string; // or number, depending on your DB
    amount: number;
    message: string;
}



export default function Donation() {
    const [formData, setFormData] = useState<IFormData>({
        name: '',
        phone: '',
        mail: '',
        pincode: '',
        amount: '',
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<IMessage>({ text: '', type: '' });

    // IMPORTANT: Removed RAZORPAY_KEY_ID

    // Base URL for API calls
    const API_BASE_URL = import.meta.env.VITE_API;


    // Handle form input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // NOTE: Removed verifyPayment and openRazorpayCheckout functions.

    // Handle Form Submission - Record Donation
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setMessage({ text: 'Recording your donation details...', type: 'info' });

        try {
            const res = await fetch(`${API_BASE_URL}api/donation/record-donation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: Number(formData.amount) // Ensure amount is sent as a number
                }),
            });

            // We expect IRecordData on success, or an error message
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const data: IRecordData & { success: boolean; message?: string } = await res.json();

            if (data.success) {
                // On success, show confirmation
                setMessage({
                    text: data.message || `Donation of ₹${data.amount} successfully recorded. We will contact you with payment instructions if required.`,
                    type: 'success'
                });
                // Clear the form
                setFormData({ name: '', phone: '', mail: '', pincode: '', amount: '' });
            } else {
                setMessage({ text: data.message || 'Failed to record donation. Please try again.', type: 'error' });
            }
        } catch (err) {
            console.error('Donation record error:', err);
            setMessage({ text: 'An unexpected error occurred. Please try again later.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen font-inter p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/30 rounded-lg shadow-xl">
                <h1 className="text-3xl font-extrabold text-center text-gray-800">
                    💖 Support Our Cause
                </h1>
                <p className="text-center text-gray-500">
                    Your contribution helps us make a difference. Please fill out your details.
                </p>
             
                {/* Message Display */}
                {message.text && (
                    <div
                        className={`p-4 rounded-lg text-center font-medium shadow-md ${message.type === 'success' ? 'bg-green-100 text-green-700' :
                            message.type === 'error' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Form Fields - Unchanged */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                            Full Name*
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                        />
                    </div>
                    <div>
                        <label htmlFor="mail" className="block text-sm font-semibold text-gray-700 mb-1">
                            Email Address*
                        </label>
                        <input
                            type="email"
                            id="mail"
                            name="mail"
                            value={formData.mail}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                            Phone Number*
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            pattern="[0-9]{10}"
                            title="Please enter a 10-digit phone number"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="pincode" className="block text-sm font-semibold text-gray-700 mb-1">
                                Pincode*
                            </label>
                            <input
                                type="text"
                                id="pincode"
                                name="pincode"
                                pattern="\d{6}"
                                title="Please enter a 6-digit pincode"
                                value={formData.pincode}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            />
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-1">
                                Amount (INR)*
                            </label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                min="1"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-lg font-bold text-white bg-highlight-1 hover:bg-highlight-1/80 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-[1.01] transition-all duration-200"
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                `Commit to Donate ₹${formData.amount || 0}` // Updated button text
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}