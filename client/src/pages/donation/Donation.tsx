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

// Data received from our backend /api/donation/create-order
interface IOrderData {
    orderId: string;
    amount: number; // This is amount in paisa
    currency: string;
    donationId: string; // or number, depending on your DB
}

// Response from Razorpay's handler
interface IRazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

// For Razorpay's failed payment response
interface IRazorpayError {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata?: {
        order_id: string;
        payment_id: string;
    };
}

// Define the Razorpay options
interface IRazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: IRazorpayResponse) => void;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    notes: {
        pincode: string;
    };
    theme: {
        color: string;
    };
}

// NOTE: The previous 'declare global' block has been removed to fix the conflict.

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

    // IMPORTANT: Replace with your actual Razorpay Key ID
    const RAZORPAY_KEY_ID: string = import.meta.env.VITE_RAZORPAY_KEY

    // Base URL for API calls
    const API_BASE_URL = import.meta.env.VITE_API;


    // Handle form input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // 1. Verify payment on the backend
    const verifyPayment = async (response: IRazorpayResponse) => {
        setLoading(true);
        setMessage({ text: 'Verifying your payment, please wait...', type: 'info' });

        try {
            const res = await fetch(`${API_BASE_URL}api/donation/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                }),
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const data: { success: boolean; message?: string } = await res.json();

            if (data.success) {
                setMessage({ text: 'Donation successful! Thank you for your support.', type: 'success' });
                // Clear the form only upon success
                setFormData({ name: '', phone: '', mail: '', pincode: '', amount: '' });
            } else {
                setMessage({ text: data.message || 'Payment verification failed. Please contact support.', type: 'error' });
            }
        } catch (err) {
            console.error('Verification error:', err);
            setMessage({ text: 'An error occurred during payment verification.', type: 'error' });
        }
        setLoading(false);
    };

    // 2. Open Razorpay Checkout
    const openRazorpayCheckout = (orderData: IOrderData) => {
        const options: IRazorpayOptions = {
            key: RAZORPAY_KEY_ID,
            amount: orderData.amount, // Amount in paisa (received from backend)
            currency: orderData.currency,
            name: 'Dalitmurasu', // Replace with your org name
            description: 'Thank you for your donation',
            order_id: orderData.orderId, // Received from backend
            handler: function (response: IRazorpayResponse) {
                // This function is called on successful payment
                verifyPayment(response);
            },
            prefill: {
                name: formData.name,
                email: formData.mail,
                contact: formData.phone,
            },
            notes: {
                pincode: formData.pincode,
            },
            theme: {
                color: '#feebbd', // Brand color
            },
        };

        // Check if Razorpay script is loaded
        if (!window.Razorpay) {
            setMessage({ text: 'Razorpay SDK not loaded. Please ensure the script tag is present in index.html.', type: 'error' });
            setLoading(false);
            return;
        }

        // --- FIX: Use a local type assertion instead of global declaration ---
        type RazorpayConstructor = new (options: IRazorpayOptions) => {
            open: () => void;
            on: (event: 'payment.failed', callback: (response: { error: IRazorpayError }) => void) => void;
        };

        const RazorpayInstance = window.Razorpay as unknown as RazorpayConstructor;
        // --- END FIX ---

        // Open the Razorpay modal
        const rzp1 = new RazorpayInstance(options);
        rzp1.on('payment.failed', function (response: { error: IRazorpayError }) {
            console.error('Payment Failed:', response.error);
            setMessage({
                text: `Payment failed: ${response.error.description || 'Unknown error'}. Please try again.`,
                type: 'error'
            });
            setLoading(false);
        });

        rzp1.open();
    };

    // 3. Handle Form Submission - Create Order
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setMessage({ text: 'Processing your request...', type: 'info' });

        try {
            const res = await fetch(`${API_BASE_URL}api/donation/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: Number(formData.amount) // Ensure amount is sent as a number
                }),
            });

            // We expect IOrderData on success, or an error message
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const data: IOrderData & { success: boolean; message?: string } = await res.json();

            if (data.success) {
                // On success, open the checkout modal
                setMessage({ text: 'Redirecting to payment...', type: 'info' });
                openRazorpayCheckout(data);
                // Loading will be set to false by the handler or on failure
            } else {
                setMessage({ text: data.message || 'Failed to create order.', type: 'error' });
                setLoading(false);
            }
        } catch (err) {
            console.error('Order creation error:', err);
            setMessage({ text: 'An error occurred. Please try again later.', type: 'error' });
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen  font-inter p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/30 rounded-lg shadow-xl">
                <h1 className="text-3xl font-extrabold text-center text-gray-800">
                    💖 Support Our Cause
                </h1>
                <p className="text-center text-gray-500">
                    Your contribution helps us make a difference. Thank you!
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
                    {/* Form Fields */}
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
                                `Donate ₹${formData.amount || 0}`
                            )}
                        </button>
                    </div>
                </form>
                {/* Note about Razorpay integration */}

            </div>
        </div>
    );
}