import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MdPictureAsPdf } from 'react-icons/md';
import Header from '../../components/Header';

interface PdfEntry {
  _id: string;
  title: string;
  subtitle?: string;
  date: string;
  category: { en: string; ta: string };
  imageUrl?: string;
  pdfUrl: string;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API;

interface PdfViewerPageProps {
  initialCategory?: 'Editorial' | 'Archive';
}

const PdfViewerPage: React.FC<PdfViewerPageProps> = ({ initialCategory }) => {
  const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New state to manage the selected PDF and show the modal
  const [, setSelectedPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const fetchPdfs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}api/pdf-uploads`);
        if (response.data.success) {
          let fetchedPdfs: PdfEntry[] = response.data.data;

          if (initialCategory) {
            fetchedPdfs = fetchedPdfs.filter(
              (pdf) => pdf.category.en === initialCategory
            );
          }

          const sortedPdfs = fetchedPdfs.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          setPdfs(sortedPdfs);
        } else {
          setError(response.data.message || 'Failed to fetch PDFs.');
        }
      } catch (err) {
        console.error('Fetch PDFs Error:', err);
        let errorMessage = 'An unexpected error occurred while fetching PDFs.';
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.message || err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPdfs();
  }, [initialCategory]);

  const headerText =
    initialCategory === 'Editorial'
      ? 'தலையங்கம் (PDF)'
      : initialCategory === 'Archive'
      ? 'காப்பகம் (PDF)'
      : 'PDFகள்';
      
  // Update the click handler to set the state instead of opening a new window
  const handleViewPdf = (pdfUrl: string) => {
    setSelectedPdfUrl(pdfUrl);
  };

  return (
    <div className="flex flex-col gap-5">
      <Header text={headerText} />
      <div className="container mx-auto p-4">
        {loading ? (
          <div className="text-center p-8 text-gray-700">Loading PDFs...</div>
        ) : error ? (
          <div className="text-center p-8 text-red-600">Error: {error}</div>
        ) : pdfs.length === 0 ? (
          <p className="text-center text-gray-600">
            No PDFs available for this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pdfs.map((pdf) => (
              <div
                key={pdf._id}
                className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out"
              >
                {pdf.imageUrl && (
                  <img
                    src={pdf.imageUrl}
                    alt={pdf.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {pdf.title}
                  </h3>
                  {pdf.subtitle && (
                    <p className="text-gray-600 text-sm mb-2">
                      {pdf.subtitle}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mb-3">
                    Date: {new Date(pdf.date).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => handleViewPdf(pdf.pdfUrl)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <MdPictureAsPdf className="mr-2 text-lg" /> View PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conditionally render the modal when a PDF is selected */}
    
    </div>
  );
};

export default PdfViewerPage;