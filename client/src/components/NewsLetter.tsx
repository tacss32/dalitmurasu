import { useState, useEffect } from 'react';
import axios from 'axios';
import type { JSX } from 'react/jsx-runtime';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

export default function NewsletterImageDisplay(): JSX.Element {
  const API_BASE_URL = import.meta.env.VITE_API;
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Loading newsletter image...');
  const [loading, setLoading] = useState<boolean>(true);

  const navigate = useNavigate(); // Initialize useNavigate

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
    navigate('/subscriptions'); // Navigate to the subscriptions page
  };

  return (
    <div className=" w-full p-4 rounded-lg shadow-md mx-auto text-center space-y-4">
      <h2 className="text-2xl font-bold">
      </h2>

      {loading && (
        <p className="text-gray-400">{message}</p>
      )}

      {!loading && currentImageUrl && (
        <div className="relative flex justify-center items-center"> {/* Added relative positioning */}
          <img
            src={currentImageUrl}
            alt="Newsletter"
            className="w-full h-auto rounded-md shadow-md border border-gray-600"
            style={{
              aspectRatio: '68 / 13',  // Force layout ratio
              objectFit: 'cover',      // Fill the area, crop if needed
              maxHeight: '400px'
            }}
          />
          {/* Button positioned over the image */}
          <button
            onClick={handleSubscribeClick}
            className="absolute bottom-4 right-4 bg-red-700 text-white px-4 py-2 rounded-md shadow-lg hover:bg-black transition-colors duration-200"
          >
            Subscribe Now!
          </button>
        </div>
      )}

      {!loading && !currentImageUrl && message && (
        <p className="text-gray-400">{message}</p>
      )}
    </div>
  );
}