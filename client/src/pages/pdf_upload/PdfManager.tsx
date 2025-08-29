import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { MdEdit, MdDelete, MdPictureAsPdf, MdClose } from 'react-icons/md';

// Import for Image Cropping
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import getCroppedImg from '../../components/getCroppedImg';

// --- Interfaces ---
interface PdfFormData {
  title: string;
  subtitle: string;
  date: string;
  categoryDropdown: 'Archive' | '';
  freeViewLimit: number; // Added new field
  visibility: 'public' | 'subscribers'; // Added new field
}

interface PdfEntry {
  _id: string;
  title: string;
  subtitle?: string;
  date: string;
  category: { en: string; ta: string };
  imageUrl?: string;
  pdfUrl: string;
  createdAt: string;
  views: number; // Added new field
  freeViewLimit: number; // Added new field
  visibility: 'public' | 'subscribers'; // Added new field
}

// --- Constants ---
const API_BASE_URL = import.meta.env.VITE_API;
const CATEGORY_OPTIONS = ['Archive'] as const;

// --- Utility Function: Map English category to Tamil ---
const getTamilCategory = (englishCategory: 'Archive' | '') => {
  switch (englishCategory) {
    case 'Archive':
      return 'தலித் முரசு களஞ்சியம்';
    default:
      return '';
  }
};

// --- Full Page Loader Component ---
const FullPageLoader = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center  bg-opacity-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-700"></div>
  </div>
);

// --- PdfUploadForm Component ---
const PdfUploadForm: React.FC<{
  editPdfId?: string;
  onSubmissionSuccess: () => void;
  onCancel: () => void;
  onSubmissionStart: () => void;
  onSubmissionEnd: () => void;
}> = ({ editPdfId, onSubmissionSuccess, onCancel, onSubmissionStart, onSubmissionEnd }) => {
  const isEditMode = !!editPdfId;
  const [formData, setFormData] = useState<PdfFormData>({
    title: '',
    subtitle: '',
    date: '',
    categoryDropdown: '',
    freeViewLimit: 0,
    visibility: 'subscribers',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [currentPdfFileName, setCurrentPdfFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Image cropping states ---
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [showCropModal, setShowCropModal] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  // -----------------------------

  // Effect to fetch PDF data if in edit mode
  useEffect(() => {
    if (isEditMode && editPdfId) {
      const fetchPdfData = async () => {
        setLoading(true);
        setMessage(null);
        try {
          const response = await axios.get(`${API_BASE_URL}api/pdf-uploads/${editPdfId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          const pdf = response.data;
          if (pdf) {
            let fetchedCategoryForDropdown: 'Archive' | '' = '';
            if (pdf.category && pdf.category.en === 'Archive') {
              fetchedCategoryForDropdown = 'Archive';
            }

            setFormData({
              title: pdf.title,
              subtitle: pdf.subtitle || '',
              date: pdf.date ? new Date(pdf.date).toISOString().split('T')[0] : '',
              categoryDropdown: fetchedCategoryForDropdown,
              freeViewLimit: pdf.freeViewLimit || 0,
              visibility: pdf.visibility || 'subscribers',
            });
            setExistingImageUrl(pdf.imageUrl || null);
            setExistingPdfUrl(pdf.pdfUrl || null);
            setImagePreviewUrl(pdf.imageUrl || null);
            setPdfPreviewUrl(pdf.pdfUrl || null);
            if (pdf.pdfUrl) {
              setCurrentPdfFileName(pdf.pdfUrl.split('/').pop() || 'Existing PDF');
            } else {
              setCurrentPdfFileName(null);
            }
          } else {
            setMessage({ type: 'error', text: 'Failed to fetch PDF for editing. It might not exist.' });
          }
        } catch (error) {
          console.error('Fetch PDF for edit error:', error);
          let errorMessage = 'An unexpected error occurred while fetching PDF data.';
          if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || `Network error: ${error.message}`;
            if (error.response?.status === 404) {
              errorMessage = 'PDF not found. It may have been deleted.';
            } else if (error.response?.status === 401 || error.response?.status === 403) {
              errorMessage = 'Authentication error. Please log in again.';
            }
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          setMessage({ type: 'error', text: `Error: ${errorMessage}` });
        } finally {
          setLoading(false);
        }
      };
      fetchPdfData();
    } else {
      // Clear form on initial load or when creating a new entry
      setFormData({
        title: '',
        subtitle: '',
        date: '',
        categoryDropdown: '',
        freeViewLimit: 0,
        visibility: 'subscribers',
      });
      setImageFile(null);
      setPdfFile(null);
      setExistingImageUrl(null);
      setExistingPdfUrl(null);
      setImagePreviewUrl(null);
      setPdfPreviewUrl(null);
      setCurrentPdfFileName(null);
      setMessage(null);
      // Reset crop states
      setCrop(undefined);
      setCompletedCrop(undefined);
      setCurrentImageSrc(null);
      setShowCropModal(false);
    }
  }, [editPdfId, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'categoryDropdown') {
      setFormData((prev) => ({ ...prev, [name]: value as PdfFormData['categoryDropdown'] }));
    } else if (name === 'freeViewLimit') {
        setFormData((prev) => ({ ...prev, [name]: parseInt(value) }));
    } else if (name === 'visibility') {
        setFormData((prev) => ({ ...prev, [name]: value as PdfFormData['visibility'] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      if (name === 'image') {
        const file = files[0];
        setImageFile(file);
        setExistingImageUrl(null);
        setImagePreviewUrl(URL.createObjectURL(file));
        setCompletedCrop(undefined);
      } else if (name === 'pdf') {
        const file = files[0];
        setPdfFile(file);
        setExistingPdfUrl(null);
        setPdfPreviewUrl(URL.createObjectURL(file));
        setCurrentPdfFileName(file.name);
      }
    } else {
      if (name === 'image') {
        setImageFile(null);
        if (!existingImageUrl) {
          setImagePreviewUrl(null);
        }
        setCompletedCrop(undefined);
      } else if (name === 'pdf') {
        setPdfFile(null);
        if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(pdfPreviewUrl);
        }
        if (!existingPdfUrl) {
          setPdfPreviewUrl(null);
          setCurrentPdfFileName(null);
        } else {
          setPdfPreviewUrl(existingPdfUrl);
          setCurrentPdfFileName(existingPdfUrl.split('/').pop() || 'Existing PDF');
        }
      }
    }
  };
    // ⬅️ NEW FUNCTION TO HANDLE PDF REMOVAL
  const handleRemovePdf = () => {
    // Revoke the blob URL to free up memory
    if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    // Reset all PDF-related state variables
    setPdfFile(null);
    setExistingPdfUrl(null);
    setPdfPreviewUrl(null);
    setCurrentPdfFileName(null);
  };

  const startCropping = () => {
    if (imagePreviewUrl) {
      setCurrentImageSrc(imagePreviewUrl);
      setShowCropModal(true);
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      const aspect = 130 / 201;

      const initialCrop = centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
        width,
        height
      );
      setCrop(initialCrop);
    },
    []
  );

  const onCropComplete = useCallback((crop: PixelCrop) => {
    setCompletedCrop(crop);
  }, []);

  const handleDoneCropping = async () => {
    const imgElement = imgRef.current;
    if (imgElement && completedCrop && imageFile) {
      try {
        const croppedFile = await getCroppedImg(
          imgElement,
          completedCrop,
          `cropped_${imageFile.name}`
        );
        setImageFile(croppedFile as File);
        setImagePreviewUrl(URL.createObjectURL(croppedFile as File));
        setShowCropModal(false);
        setCurrentImageSrc(null);
      } catch (e) {
        console.error("Error cropping image:", e);
        setMessage({ type: 'error', text: 'Failed to crop image. Please try again.' });
      }
    } else {
      setMessage({ type: 'error', text: 'Please define a crop area.' });
    }
  };

  const handleCancelCropping = () => {
    setShowCropModal(false);
    setCurrentImageSrc(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [imagePreviewUrl, pdfPreviewUrl]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmissionStart();
    setLoading(true);
    setMessage(null);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("subtitle", formData.subtitle);
    data.append("date", formData.date);

    // New fields
    data.append("freeViewLimit", formData.freeViewLimit.toString());
    data.append("visibility", formData.visibility);

    if (formData.categoryDropdown) {
      data.append("category[en]", formData.categoryDropdown);
      data.append("category[ta]", getTamilCategory(formData.categoryDropdown));
    }

    if (pdfFile instanceof File) {
      data.append("pdf", pdfFile);
    }

    if (imageFile instanceof File) {
      data.append("image", imageFile);
    }

    try {
      const url = isEditMode
        ? `${API_BASE_URL}api/pdf-uploads/${editPdfId}`
        : `${API_BASE_URL}api/pdf-uploads`;
      const method = isEditMode ? axios.put : axios.post;

      const response = await method(url, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 201 || response.status === 200) {
        setMessage({
          type: "success",
          text: isEditMode
            ? "PDF updated successfully!"
            : "PDF uploaded successfully!",
        });
        if (!isEditMode) {
          setFormData({
            title: "",
            subtitle: "",
            date: "",
            categoryDropdown: "",
            freeViewLimit: 0,
            visibility: 'subscribers',
          });
          setImageFile(null);
          setPdfFile(null);
          setExistingImageUrl(null);
          setExistingPdfUrl(null);
          setImagePreviewUrl(null);
          setPdfPreviewUrl(null);
          setCurrentPdfFileName(null);
          setCompletedCrop(undefined);
        }
        onSubmissionSuccess?.();
      } else {
        setMessage({
          type: "error",
          text: response.data.message || "Upload failed.",
        });
      }
    } catch (error) {
      console.error("PDF form submission error:", error);
      let errorMessage = "An unexpected error occurred.";
      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setMessage({ type: "error", text: `Error: ${errorMessage}` });
    } finally {
      setLoading(false);
      onSubmissionEnd();
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        {isEditMode ? 'Edit PDF' : 'Upload New PDF'}
      </h2>
      {message && (
        <div
          className={`p-4 mb-4 rounded-md text-center ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
      {isEditMode && loading && !formData.title && (
        <div className="text-center text-gray-600 mb-4">Loading PDF data...</div>
      )}
      <form onSubmit={handleSubmit} className="">
        {/* Title Input */}
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-0.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Enter PDF title"
          />
        </div>
        
        {/* Subtitle Input */}
        <div className="mb-4">
          <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-0">
            Subtitle
          </label>
          <input
            type="text"
            id="subtitle"
            name="subtitle"
            value={formData.subtitle}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Enter PDF subtitle"
          />
        </div>
        
        {/* Date Input */}
        <div className="mb-4">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition duration-150 ease-in-out"
          />
        </div>
        
        {/* Category Dropdown */}
        <div className="mb-4">
          <label htmlFor="categoryDropdown" className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="categoryDropdown"
            name="categoryDropdown"
            value={formData.categoryDropdown}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition duration-150 ease-in-out"
          >
            <option value="" disabled hidden>
              -- Select a category --
            </option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        
        {/* Visibility Dropdown */}
        <div className="mb-4">
          <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
            Visibility <span className="text-red-500">*</span>
          </label>
          <select
            id="visibility"
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition duration-150 ease-in-out"
          >
            <option value="subscribers">Subscribers Only</option>
          </select>
        </div>
        
        {/* Free View Limit */}
        <div className="mb-4">
          <label htmlFor="freeViewLimit" className="block text-sm font-medium text-gray-700 mb-1">
            Free View Limit (for non-subscribers)
          </label>
          <input
            type="number"
            id="freeViewLimit"
            name="freeViewLimit"
            value={formData.freeViewLimit}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition duration-150 ease-in-out"
          />
        </div>
        
        {/* Image Upload */}
        <div className="mb-4">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Cover Image (Optional)
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-yellow-50 file:text-yellow-700
              hover:file:bg-yellow-100"
          />
          {imageFile ? (
            <p className="mt-2 text-sm text-gray-500">Selected image: {imageFile.name}</p>
          ) : (
            existingImageUrl && (
              <p className="mt-2 text-sm text-gray-500">
                Existing image:{' '}
                <a href={existingImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  View Current Image
                </a>
              </p>
            )
          )}
          {imagePreviewUrl && (
            <div className="mt-2 border rounded-md p-2 bg-gray-50 relative">
              <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
              <img
                src={imagePreviewUrl}
                alt="Image Preview"
                className="max-w-full h-20 object-contain mx-auto border border-gray-300 rounded-md"
              />
              <div className="absolute bottom-4 right-4">
                <button
                  type="button"
                  onClick={startCropping}
                  className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition"
                >
                  Crop Image
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* PDF Upload */}
        <div className="mb-4">
          <label htmlFor="pdf" className="block text-sm font-medium text-gray-700 mb-1">
            PDF File {isEditMode && !existingPdfUrl ? <span className="text-red-500">*</span> : null}
          </label>
          <input
            type="file"
            id="pdf"
            name="pdf"
            accept="application/pdf"
            onChange={handleFileChange}
            required={!isEditMode && !existingPdfUrl && !pdfFile} 
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-1 file:px-1
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-yellow-50 file:text-yellow-700
              hover:file:bg-yellow-100"
          />
          {/* ⬅️ MODIFIED PDF PREVIEW WITH REMOVE BUTTON */}
          {currentPdfFileName && (
            <div className="mt-2 text-sm text-gray-500 flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex items-center">
                <MdPictureAsPdf className="text-red-500 mr-2 text-lg" />
                <span>Current PDF: {currentPdfFileName}</span>
              </div>
              <button
                type="button"
                onClick={handleRemovePdf} // ⬅️ The new remove function
                className="text-red-500 hover:text-red-700 transition"
                title="Remove PDF"
              >
                <MdClose size={20} />
              </button>
            </div>
          )}
          {isEditMode && !pdfFile && existingPdfUrl && (
            <p className="mt-1 text-xs text-gray-500">Leave blank to keep current PDF, select a new file to replace.</p>
          )}
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-sm hover:bg-gray-300 transition duration-150 ease-in-out"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEditMode ? 'Updating...' : 'Uploading...') : (isEditMode ? 'Update PDF' : 'Upload PDF')}
          </button>
        </div>
      </form>
      
      {showCropModal && currentImageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-2xl">
            <h3 className="text-xl font-semibold mb-4 text-yellow-400">Crop Image</h3>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={onCropComplete}
              // aspect={1 / 1}
              minWidth={100}
              minHeight={100}
              className="max-w-full h-auto"
            >
              <img
                ref={imgRef}
                alt="Crop"
                src={currentImageSrc}
                onLoad={onImageLoad}
                className="max-w-full h-auto block"
              />
            </ReactCrop>
            <div className="flex gap-4 mt-6 justify-end">
              <button
                type="button"
                onClick={handleCancelCropping}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-full transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDoneCropping}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-2 px-4 rounded-full transition-all duration-200"
              >
                Done Cropping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



const PdfManager: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [errorList, setErrorList] = useState<string | null>(null);
  const [messageList, setMessageList] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editPdfId, setEditPdfId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (id) {
      setEditPdfId(id);
      setShowFormModal(true);
    } else {
      setEditPdfId(undefined);
      setShowFormModal(false);
    }
  }, [id]);

  const fetchPdfs = useCallback(async () => {
    setLoadingList(true);
    setErrorList(null);
    try {
      const response = await axios.get(`${API_BASE_URL}api/pdf-uploads`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.data) {
        const sortedPdfs = response.data.sort((a: PdfEntry, b: PdfEntry) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setPdfs(sortedPdfs);
      } else {
        setErrorList('Failed to fetch PDFs.');
      }
    } catch (err) {
      console.error('Fetch PDFs Error:', err);
      let errorMessage = 'An unexpected error occurred while fetching PDFs.';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
      }
      setErrorList(errorMessage);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchPdfs();
  }, [fetchPdfs]);

  const handleDelete = async (pdfId: string) => {
    if (!window.confirm('Are you sure you want to delete this PDF entry?')) {
      return;
    }
    setMessageList(null);
    try {
      const response = await axios.delete(`${API_BASE_URL}api/pdf-uploads/${pdfId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.data.message) {
        setMessageList({ type: 'success', text: 'PDF deleted successfully!' });
        fetchPdfs();
      } else {
        setMessageList({ type: 'error', text: response.data.message || 'Failed to delete PDF.' });
      }
    } catch (err) {
      console.error('Delete PDF Error:', err);
      let errorMessage = 'An unexpected error occurred during deletion.';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
      }
      setMessageList({ type: 'error', text: `Error: ${errorMessage}` });
    }
  };

  const handleFormSuccess = () => {
    fetchPdfs();
    setShowFormModal(false);
    setEditPdfId(undefined);
    navigate('');
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setEditPdfId(undefined);
    navigate('');
  };

  const handleCreateNewClick = () => {
    setEditPdfId(undefined);
    setShowFormModal(true);
    navigate('');
  };

  const handleEditClick = (pdfId: string) => {
    setEditPdfId(pdfId);
    setShowFormModal(true);
    navigate(``);
  };

  const handleSubmissionStart = () => {
    setIsSubmitting(true);
  };

  const handleSubmissionEnd = () => {
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {isSubmitting && <FullPageLoader />}
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl mx-auto border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">PDF Management</h2>
          <button
            onClick={handleCreateNewClick}
            className="px-5 py-2 bg-yellow-600 text-white rounded-md shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-150 ease-in-out"
          >
            Upload New PDF
          </button>
        </div>
        {messageList && (
          <div
            className={`p-4 mb-4 rounded-md text-center ${
              messageList.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {messageList.text}
          </div>
        )}
        {loadingList ? (
          <div className="text-center p-8 text-gray-700">Loading PDFs...</div>
        ) : errorList ? (
          <div className="text-center p-8 text-red-600">Error: {errorList}</div>
        ) : pdfs.length === 0 ? (
          <p className="text-center text-gray-600">
            No PDFs uploaded yet. Click "Upload New PDF" to add one!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category (EN)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Free Views
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pdfs.map((pdf) => (
                  <tr key={pdf._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pdf.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(pdf.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pdf.category.en}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pdf.visibility}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pdf.freeViewLimit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <a
                          href={`https://docs.google.com/viewer?url=${encodeURIComponent(API_BASE_URL + pdf.pdfUrl)}&embedded=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="View PDF"
                        >
                          <MdPictureAsPdf className="mr-1" /> View
                        </a>
                        <button
                          onClick={() => handleEditClick(pdf._id)}
                          className="text-yellow-600 hover:text-yellow-900 flex items-center"
                          title="Edit PDF"
                        >
                          <MdEdit className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pdf._id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          title="Delete PDF"
                        >
                          <MdDelete className="mr-1" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <PdfUploadForm
              editPdfId={editPdfId}
              onSubmissionSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              onSubmissionStart={handleSubmissionStart}
              onSubmissionEnd={handleSubmissionEnd}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfManager;