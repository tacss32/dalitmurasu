import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const API_BASE_URL = import.meta.env.VITE_API;

interface GalleryImage {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
}

// Helper function to convert a File object to a data URL
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
};

// Helper function to get a cropped image blob
const getCroppedImageBlob = (
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(null);
      return;
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg", 0.95);
  });
};

const AddPhotoForm: React.FC = () => {
  // --- Unified Form States ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // --- General & Gallery States ---
  const [loading, setLoading] = useState<boolean>(false); // Used for button loader
  const [isLoadingFullPage, setIsLoadingFullPage] = useState<boolean>(false); // New state for full-page loader
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState<boolean>(true); // Existing gallery loader
  const [galleryError, setGalleryError] = useState<string>("");

  // --- Image Cropping States ---
  const imgRef = useRef<HTMLImageElement>(null);
  const topOfFormRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  // --- Fetch Gallery Images ---
  const fetchGalleryImages = useCallback(async () => {
    setIsLoadingFullPage(true); // Show full-page loader
    setGalleryLoading(true); // Keep existing gallery loader for initial fetch message
    setGalleryError("");
    try {
      const res = await fetch(`${API_BASE_URL}api/gallery`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: GalleryImage[] = await res.json();
      setGalleryImages(data);
    } catch (err) {
      console.error("Error fetching gallery images:", err);
      setGalleryError("Failed to load gallery images.");
    } finally {
      setGalleryLoading(false);
      setIsLoadingFullPage(false); // Hide full-page loader
    }
  }, []);

  useEffect(() => {
    fetchGalleryImages();
  }, [fetchGalleryImages]);

  // --- Reset All Form Fields ---
  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setSelectedFile(null);
    setImageSrc(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    const fileInput = document.getElementById(
      "image-upload-input"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // --- Handle File Selection ---
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSuccessMessage("");
    setErrorMessage("");
    setCompletedCrop(undefined); // Critical: Reset completed crop on new file selection

    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      const dataURL = await fileToDataURL(file);
      setImageSrc(dataURL); // Set image source for the cropper
    } else {
      setSelectedFile(null);
      setImageSrc(null);
    }
  };

  // --- Image Load for Cropping ---
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      const aspect = 1; // 1:1 aspect ratio
      const initialCrop = centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
        width,
        height
      );
      setCrop(initialCrop);
    },
    []
  );

  // --- Handle Edit Button Click ---
  const handleEditClick = (image: GalleryImage) => {
    setSuccessMessage("");
    setErrorMessage("");
    setEditingId(image._id);
    setTitle(image.title);
    setContent(image.content || "");
    setImageSrc(image.imageUrl); // Show current image
    setSelectedFile(null); // Clear file input until a new one is selected
    setCompletedCrop(undefined); // Reset crop state for the new edit session
    setCrop(undefined);
    topOfFormRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Handle Cancel Edit ---
  const handleCancelEdit = () => {
    resetForm();
    setSuccessMessage("");
    setErrorMessage("");
  };

  // --- Unified Form Submission (Create & Update) ---
  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("Please enter a title for the image.");
      return;
    }

    // A new file must be selected and cropped for a new upload.
    if (!editingId && (!selectedFile || !completedCrop)) {
      setErrorMessage("Please select and crop an image to upload.");
      return;
    }

    // If editing and a new file is chosen, it must be cropped.
    if (editingId && selectedFile && !completedCrop) {
      setErrorMessage("Please confirm the crop for the new image.");
      return;
    }

    setLoading(true); // For button loader
    setIsLoadingFullPage(true); // For full-page loader

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    // Append image only if a new file has been selected and cropped
    if (selectedFile && completedCrop && imgRef.current) {
      const croppedBlob = await getCroppedImageBlob(
        imgRef.current,
        completedCrop
      );
      if (!croppedBlob) {
        setErrorMessage("Failed to process the cropped image.");
        setLoading(false);
        setIsLoadingFullPage(false); // Hide full-page loader
        return;
      }
      formData.append("image", croppedBlob, selectedFile.name);
    }

    try {
      const isUpdating = editingId !== null;
      const url = isUpdating
        ? `${API_BASE_URL}api/gallery/${editingId}`
        : `${API_BASE_URL}api/gallery`;
      const method = isUpdating ? "PUT" : "POST";

      const response = await fetch(url, { method, body: formData });
      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(
          data.message ||
            `Image ${isUpdating ? "updated" : "uploaded"} successfully!`
        );
        resetForm();
        fetchGalleryImages(); // Refetch gallery images to update the list
      } else {
        setErrorMessage(
          data.error || `Failed to ${isUpdating ? "update" : "upload"} image.`
        );
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setErrorMessage(
        "An error occurred. Please ensure the server is running and accessible."
      );
    } finally {
      setLoading(false); // Hide button loader
      setIsLoadingFullPage(false); // Hide full-page loader
    }
  };

  // --- Delete Handler ---
  const handleDeleteClick = async (imageId: string) => {
    // Using a custom message box instead of window.confirm
    const confirmDelete = await new Promise((resolve) => {
      const handleConfirm = () => {
        document.body.removeChild(dialog);
        resolve(true);
      };
      const handleCancel = () => {
        document.body.removeChild(dialog);
        resolve(false);
      };

      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 bg-opacity-50 flex items-center justify-center z-50';
      dialog.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl text-center">
          <p class="mb-4 text-gray-800">Are you sure you want to delete this image?</p>
          <button id="confirmBtn" class="bg-red-600 text-white px-4 py-2 rounded-md mr-2"> Delete</button>
          <button id="cancelBtn" class="bg-gray-400 text-white px-4 py-2 rounded-md">Cancel</button>
        </div>
      `;
      document.body.appendChild(dialog);

      document.getElementById('confirmBtn')?.addEventListener('click', handleConfirm);
      document.getElementById('cancelBtn')?.addEventListener('click', handleCancel);
    });


    if (confirmDelete) {
      setLoading(true); // For button loader
      setIsLoadingFullPage(true); // For full-page loader

      // If the image being deleted is also the one being edited, cancel the edit.
      if (editingId === imageId) {
        handleCancelEdit();
      }
      try {
        const response = await fetch(`${API_BASE_URL}api/gallery/${imageId}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (response.ok) {
          setSuccessMessage(data.message || "Image deleted successfully!");
          fetchGalleryImages();
        } else {
          setErrorMessage(data.error || "Failed to delete image.");
        }
      } catch (error) {
        console.error("Delete error:", error);
        setErrorMessage("An error occurred during deletion.");
      } finally {
        setLoading(false); // Hide button loader
        setIsLoadingFullPage(false); // Hide full-page loader
      }
    }
  };

  // Determine if the submit button should be disabled
  const isSubmitDisabled = !!(
    loading ||
    isLoadingFullPage || // Disable if full page is loading
    !title.trim() ||
    (!editingId && !completedCrop) ||
    (editingId && selectedFile && !completedCrop)
  );
  return (
    <div
      ref={topOfFormRef}
      className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8 relative" // Added relative for loader positioning
    >
      {/* Full-Page Loader Overlay */}
      {isLoadingFullPage && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-filter backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-700"></div> {/* Red loader */}
            <p className="mt-4 text-xl text-white">Loading...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-6 sm:p-8 space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
          {editingId ? "Edit Image" : "Upload New Photo"}
        </h2>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md text-center">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6 mb-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Image Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a title for the image"
              required
            />
          </div>
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Image Content (Optional)
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add some descriptive content"
            ></textarea>
          </div>
          <div>
            <label
              htmlFor="image-upload-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {editingId ? "Replace Image (Optional)" : "Select Image"}
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m-4-4v-2m-4-4h.01M12 24v-4h4v4h-4z"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="image-upload-input"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="image-upload-input"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500 text-center">
              For best results, we recommend uploading an image with a 1:1 aspect ratio.
            </p>
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected:{" "}
                <span className="font-semibold">{selectedFile.name}</span>
              </p>
            )}
          </div>

          {imageSrc && (
            <div className="mt-4 border p-4 rounded-md shadow-inner text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Crop Image (1:1 Ratio)
              </h3>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                minWidth={50}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Source for cropping"
                  onLoad={onImageLoad}
                  className="max-w-full h-auto block mx-auto"
                />
              </ReactCrop>
              <p className="text-sm text-gray-600 mt-2">
                {completedCrop
                  ? "Crop confirmed. You can now submit."
                  : "Adjust the crop area above to enable submission."}
              </p>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white transition duration-200 ${
                isSubmitDisabled
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
            >
              {loading ? (
                <svg
                  className="animate-spin h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : editingId ? (
                "Update Image"
              ) : (
                "Upload Photo"
              )}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-md transition duration-200"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="mt-8 pt-6 border-t">
        <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Manage Gallery Images
        </h3>
        {galleryLoading && <p className="text-center">Loading images...</p>}
        {galleryError && (
          <p className="text-center text-red-600">{galleryError}</p>
        )}
        {galleryImages.length === 0 && !galleryLoading && !galleryError && (
          <p className="text-center text-gray-500">No images uploaded yet.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((img) => (
            <div
              key={img._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <img
                src={img.imageUrl}
                alt={img.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h4
                  className="text-md font-semibold text-gray-800 truncate"
                  title={img.title}
                >
                  {img.title}
                </h4>
                {img.content && (
                  <p
                    className="text-sm text-gray-600 mt-1 line-clamp-2"
                    title={img.content}
                  >
                    {img.content}
                  </p>
                )}
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => handleEditClick(img)}
                    className="flex-1 bg-yellow-500 text-white py-1 px-3 rounded-md hover:bg-yellow-600 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(img._id)}
                    className="flex-1 bg-red-600 text-white py-1 px-3 rounded-md hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddPhotoForm;