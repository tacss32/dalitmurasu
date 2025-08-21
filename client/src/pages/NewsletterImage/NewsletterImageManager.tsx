
import React, { useState, useEffect, type ChangeEvent } from 'react';
import axios from 'axios';
import type { JSX } from 'react/jsx-runtime';

export default function NewsletterImageManager(): JSX.Element {

  const API_BASE_URL = import.meta.env.VITE_API;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false); // Used for button loader
  const [isLoadingFullPage, setIsLoadingFullPage] = useState<boolean>(false); // New state for full-page loader


  useEffect(() => {
    fetchNewsletterImage();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Function to fetch the current newsletter image from the backend
  const fetchNewsletterImage = async (): Promise<void> => {
    setLoading(true); // Set loading to true while fetching
    setIsLoadingFullPage(true); // Show full-page loader
    setMessage(''); // Clear any previous messages
    try {
      const response = await axios.get<{ imageUrl: string | null }>(`${API_BASE_URL}api/newsletter-image`);
      setCurrentImageUrl(response.data.imageUrl);
      setMessage(response.data.imageUrl ? 'Current newsletter image loaded.' : 'No newsletter image uploaded yet.');
    } catch (error) {
      console.error('Error fetching newsletter image:', error);
      setMessage('Failed to load current newsletter image.');
      setCurrentImageUrl(null); // Ensure no old image is displayed on error
    } finally {
      setLoading(false); // Set loading to false after fetch completes
      setIsLoadingFullPage(false); // Hide full-page loader
    }
  };

const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
  if (event.target.files && event.target.files.length > 0) {
    const file = event.target.files[0];
    setSelectedFile(file); // Simply set the file directly
    setMessage('Image selected. Ready to upload.');
  } else {
    setSelectedFile(null);
    setMessage('');
  }
};

  // Handler for the image upload process
  const handleUpload = async (): Promise<void> => {
    if (!selectedFile) {
      setMessage('Please select an image to upload.');
      return;
    }

    setLoading(true); // Set loading to true during upload
    setIsLoadingFullPage(true); // Show full-page loader
    setMessage('Uploading image...'); // Provide feedback to the user

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await axios.post<{ message: string; imageUrl: string }>(`${API_BASE_URL}api/newsletter-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setCurrentImageUrl(response.data.imageUrl);
      setMessage('Newsletter image uploaded successfully!');
      setSelectedFile(null); // Clear the selected file input
    } catch (error: unknown) {
      console.error('Error uploading newsletter image:', error);
      let errorMessage = 'An unexpected error occurred.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setMessage(`Failed to upload image: ${errorMessage}`);
    } finally {
      setLoading(false); // Set loading to false after upload completes
      setIsLoadingFullPage(false); // Hide full-page loader
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-800 text-white rounded-lg shadow-lg max-w-2xl mt-8 relative"> {/* Added relative for loader positioning */}
      {/* Full-Page Loader Overlay */}
      {isLoadingFullPage && (
        <div className="fixed inset-0 bg-gray-900  backdrop-filter ba ckdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-700"></div>
            <p className="mt-4 text-xl text-white">Uploading...</p>
          </div>
        </div>
      )}

      <h2 className="text-3xl font-bold mb-6 text-yellow-400 text-center">Manage Newsletter Image</h2>

      {/* Display current image */}
      <div className="mb-6 text-center">
        {loading && !currentImageUrl && (
          <p className="text-gray-400">Loading current image...</p>
        )}
        {currentImageUrl && (
          <>
            <p className="text-lg font-semibold mb-3">Current Newsletter Image:</p>
            <img
              src={currentImageUrl}
              alt="Current Newsletter"
              className="max-w-full h-auto rounded-md shadow-md mx-auto border border-gray-600"
              style={{ maxHeight: '300px', objectFit: 'contain' }}
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "https://placehold.co/300x200/4B5563/FFFFFF?text=Image+Not+Found";
                setMessage('Error loading current image. Displaying placeholder.');
              }}
            />
          </>
        )}
        {!currentImageUrl && !loading && message && (
          <p className="text-gray-400">{message}</p>
        )}
      </div>

      {/* Upload Form */}
      <div className="flex flex-col items-center space-y-4">
        <label htmlFor="image-upload" className="block text-lg font-medium text-gray-300">
          Upload New Newsletter Image:
        </label>
        {/* Note added here */}
        <p className="text-sm text-gray-400">
          *Note: Please upload the image in **680 x 130** resolution for best results.
        </p>
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-yellow-500 file:text-white
                    hover:file:bg-yellow-600
                    cursor-pointer"
        />

        <button
          onClick={handleUpload}
          disabled={loading || isLoadingFullPage || !selectedFile} // Disable button when any loading is active or no file selected
          className={`w-full px-6 py-3 rounded-md text-lg font-semibold transition-colors duration-200
                    ${loading || isLoadingFullPage || !selectedFile
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
        >
          {loading ? 'Uploading...' : 'Upload Image'}
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <p className={`mt-4 text-center text-md ${message.includes('Error') || message.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}