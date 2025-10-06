import { useState, useEffect } from 'react';
import axios from 'axios';
import type { JSX } from 'react/jsx-runtime';
import { useNavigate } from 'react-router-dom';

export default function NewsletterImageDisplay(): JSX.Element {
  const API_BASE_URL = import.meta.env.VITE_API;
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Loading newsletter image...');
  const [loading, setLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchNewsletterImage();
  }, []);

  const fetchNewsletterImage = async (): Promise<void> => {
    setLoading(true);
    setMessage('Loading newsletter image...');
    try {
      const response = await axios.get<{ imageUrl: string | null }>(`${API_BASE_URL}api/newsletter-image`);
      if (response.data.imageUrl) {
        setCurrentImageUrl(response.data.imageUrl);
        setMessage('');
      } else {
        setCurrentImageUrl(null);
        setMessage('No newsletter image available.');
      }
    } catch (error) {
      console.error('Error fetching newsletter image:', error);
      setMessage('Failed to load newsletter image.');
      setCurrentImageUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeClick = () => {
    navigate('/subscriptions');
  };

  return (
    <div className="w-full p-4 rounded-lg shadow-md mx-auto text-center space-y-4">
      <h2 className="text-2xl font-bold">
      </h2>

      {loading && (
        <p className="text-gray-400">{message}</p>
      )}

      {!loading && currentImageUrl && (
        // New structure to manage the image and the button wrapper
        <div className="w-full">
            
          {/* Image and Desktop-Only Button Positioning */}
          <div className="relative flex justify-center items-center w-full">
            <img
              src={currentImageUrl}
              alt="Newsletter"
              className="w-full h-auto rounded-md shadow-md border border-gray-600"
              style={{
                aspectRatio: '68 / 13',
                objectFit: 'cover',
                maxHeight: '400px'
              }}
            />
            
            {/* Desktop Button: ABSOLUTE position (md: prefix ensures it takes effect on larger screens) */}
            <button
              onClick={handleSubscribeClick}
              // Hide on mobile screens, show on medium and larger screens
              className="hidden md:block absolute bottom-4 right-4 px-4 py-2 text-base bg-red-700 text-white rounded-md shadow-lg hover:bg-black transition-colors duration-200"
            >
              Subscribe Now!
            </button>
          </div>
            
          {/* Mobile Button: Flowing position (No md: prefix ensures it takes effect on mobile screens) */}
          <div className="md:hidden pt-1 px-0 w-full">
            <button
              onClick={handleSubscribeClick}
              // Show on mobile screens, take full width for better touch target
              className="w-full px-4 py-2 text-base bg-red-700 text-white rounded-md shadow-lg hover:bg-black transition-colors duration-200"
            >
              Subscribe Now!
            </button>
          </div>
        </div>
      )}

      {!loading && !currentImageUrl && message && (
        <p className="text-gray-400">{message}</p>
      )}
    </div>
  );
}