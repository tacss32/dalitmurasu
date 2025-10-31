import React, { useState } from 'react';

// Define the interface for the props (onClose is now optional)
interface FeedbackFormProps {
    onClose?: () => void; // optional close function
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
    // State for form data
    const [formData, setFormData] = useState({
        name: '',
        mail: '',
        subject: '',
        message: '',
    });

    // State for loading and message feedback
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<'success' | 'error' | null>(null);


    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    const API_BASE_URL = import.meta.env.VITE_API;
    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}api/feedback/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setMessage('success');
                setFormData({ name: '', mail: '', subject: '', message: '' });

                // Optionally close form after 3 seconds (only if onClose is provided)
                setTimeout(() => onClose?.(), 3000);
            } else {
                setMessage('error');
                console.error("Feedback submission failed:", result.message);
            }
        } catch (error) {
            setMessage('error');
            console.error("Error submitting feedback:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 p-4 shadow rounded-md">
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">
                We appreciate your feedback!
            </h2>
            {/* Name Input */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                />
            </div>

            {/* Email Input */}
            <div>
                <label htmlFor="mail" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    type="email"
                    name="mail"
                    id="mail"
                    value={formData.mail}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                />
            </div>

            {/* Subject Input */}
            <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                />
            </div>

            {/* Message Textarea */}
            <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                    name="message"
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                ></textarea>
            </div>

            {/* Submission Status */}
            {message === 'success' && (
                <p className="text-green-600 font-medium">Thank you for your feedback! We've received it.</p>
            )}
            {message === 'error' && (
                <p className="text-red-600 font-medium">Failed to submit feedback. Please try again.</p>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-highlight-1 hover:bg-highlight-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {isLoading ? 'Sending...' : 'Submit Feedback'}
            </button>

            {/* Close Button (optional) */}
            {onClose && (
                <button
                    type="button"
                    onClick={() => onClose?.()}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mt-2"
                >
                    Cancel
                </button>
            )}
        </form>
    );
};

export default FeedbackForm;
