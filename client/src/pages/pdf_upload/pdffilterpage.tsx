
import  { useEffect, useState } from 'react';
import axios from 'axios';
import { MdPictureAsPdf } from 'react-icons/md'; // Make sure react-icons is installed
import Header from '../../components/Header'; // Adjust path if necessary


// Reuse your PdfEntry interface
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

const API_BASE_URL = import.meta.env.VITE_API; // Ensure this is correctly set up in your .env file

export default function PdfArchivePage() {
  const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'All' | 'Editorial' | 'Archive'>('All');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on component mount

    const fetchPdfs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}api/pdf-uploads`);
        if (response.data.success) {
          // Sort by date, newest first, before setting
          const sortedPdfs = response.data.data.sort(
            (a: PdfEntry, b: PdfEntry) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setPdfs(sortedPdfs);
        } else {
          setError(response.data.message || 'PDFகளைப் பெறத் தவறிவிட்டது.'); // Failed to fetch PDFs.
        }
      } catch (err) {
        console.error('Fetch PDFs Error:', err);
        let errorMessage = 'PDFகளைப் பெறும்போது எதிர்பாராத பிழை ஏற்பட்டது.'; // An unexpected error occurred while fetching PDFs.
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.message || err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPdfs();
  }, []); // Only fetch once on component mount

  const filteredPdfs = pdfs.filter(pdf => {
    if (filterCategory === 'All') {
      return true;
    }
    return pdf.category.en === filterCategory;
  });

  const getHeaderTitle = () => {
    switch (filterCategory) {
      case 'Editorial': return 'தலையங்கம் PDFகள்';
      case 'Archive': return 'காப்பகம் PDFகள்';
      default: return 'PDF காப்பகம்'; // PDF Archive
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Header text={getHeaderTitle()} />
      <div className="container mx-auto p-4">
        {/* Category Filter Buttons */}
        <div className="mb-6 flex justify-center space-x-4">
          <button
            onClick={() => setFilterCategory('All')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filterCategory === 'All' ? 'bg-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            அனைத்தும் {/* All */}
          </button>
          <button
            onClick={() => setFilterCategory('Editorial')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filterCategory === 'Editorial' ? 'bg-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            தலையங்கம் {/* Editorial */}
          </button>
          <button
            onClick={() => setFilterCategory('Archive')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filterCategory === 'Archive' ? 'bg-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            காப்பகம் {/* Archive */}
          </button>
        </div>

        {loading ? (
          <div className="text-center p-8 text-gray-700">PDFகள் ஏற்றப்படுகிறது...</div> // Loading PDFs...
        ) : error ? (
          <div className="text-center p-8 text-red-600">பிழை: {error}</div> // Error: ...
        ) : filteredPdfs.length === 0 ? (
          <p className="text-center text-gray-600">
            இந்த வகைக்கு PDFகள் இல்லை.
          </p> // No PDFs available for this category.
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPdfs.map((pdf) => (
              <div
                key={pdf._id}
                className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out"
              >
                {/* Display image if available */}
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
                    நாள்: {new Date(pdf.date).toLocaleDateString()}
                  </p>
                  <a
                    href={pdf.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <MdPictureAsPdf className="mr-2 text-lg" /> PDF பார்க்க
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}