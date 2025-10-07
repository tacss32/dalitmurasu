
import { useEffect, useState, useRef, useCallback } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import RichTextEditor from "../../components/RichTextEditor";
import getCroppedImg from "../../components/getCroppedImg";
import axios from "axios";

type Category = {
  _id: string;
  name: {
    ta: string;
    en: string;
  };
};

export default function AddUniversalPosts() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  // Only cropped image files will be stored here
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isHome, setIsHome] = useState<boolean>(false);
  const [isRecent, setIsRecent] = useState<boolean>(false);
  const [date, setDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [fetchedCategories, setFetchedCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFullPage, setIsLoadingFullPage] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  // Image cropping states
  const [fileToCrop, setFileToCrop] = useState<File | null>(null); // New state for the file currently being cropped
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  // currentImageIndex is no longer needed since we handle one file at a time for cropping
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const SERVER_URL = import.meta.env.VITE_API;

  // Fetch categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingFullPage(true);
      try {
        const categoriesRes = await axios.get<Category[]>(`${SERVER_URL}api/categories?available=true`);
        setFetchedCategories(categoriesRes.data);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setServerMessage("Failed to load categories. Please try again.");
        setMessageType('error');
      } finally {
        setIsLoadingFullPage(false);
      }
    };
    fetchData();
  }, [SERVER_URL]);

  // Modified to start cropping immediately
  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0]; // Only take the first file, since we want a cropped-only flow.
      setFileToCrop(file); // Set the file to be cropped

      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result?.toString() || null;
        setCurrentImageSrc(src); // Show the image in the crop modal
        setCrop(undefined);
        setCompletedCrop(undefined);
        setServerMessage(null); // Clear messages
        setMessageType(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setServerMessage("Image removed.");
    setMessageType('success');
  };

  // startCropping is now implicitly called by handleFileSelect

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      const aspect = 1 / 1;

      const initialCrop = centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
        width,
        height
      );

      setCrop(initialCrop);
    },
    []
  );

  const onCropComplete = useCallback((crop: PixelCrop, _percentCrop: Crop) => {
    setCompletedCrop(crop);
  }, []);

  const handleDoneCropping = async () => {
    const imgElement = imgRef.current;
    const completedCropData = completedCrop;

    if (imgElement && completedCropData && fileToCrop) {
      const originalFileName = fileToCrop.name;

      try {
        const croppedFile = await getCroppedImg(
          imgElement,
          completedCropData,
          `cropped_${originalFileName}`
        );

        // ADD THE CROPPED FILE TO imageFiles
        setImageFiles((prev) => [...prev, croppedFile]);

        setServerMessage("Image cropped and added successfully! 🎉");
        setMessageType('success');
      } catch (e) {
        console.error("Error cropping image:", e);
        setServerMessage("Failed to crop image. Please try again.");
        setMessageType('error');
      } finally {
        // Reset cropping states after success or failure
        setCurrentImageSrc(null);
        setFileToCrop(null); // Clear the file being cropped
        setCrop(undefined);
        setCompletedCrop(undefined);
      }
    } else {
      setServerMessage("Please define a crop area.");
      setMessageType('error');
    }
  };

  const cancelCropping = () => {
    // Just reset the cropping states, the original file was never added to imageFiles
    setCurrentImageSrc(null);
    setFileToCrop(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setServerMessage("Image selection cancelled.");
    setMessageType('error');
  };

  const handleSubmit = async () => {
    setServerMessage(null);
    setMessageType(null);

    // Validation for required fields
    if (!title.trim() || !content.trim() || !category) {
      setServerMessage("Title, content, and category are required.");
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setIsLoadingFullPage(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subtitle", subtitle);
    formData.append("content", content);
    formData.append("author", author);
    formData.append("category", category);
    formData.append("isHome", isHome ? "true" : "false");
    formData.append("isRecent", isRecent ? "true" : "false");
    formData.append("date", date);

    // Only cropped images are in imageFiles, ready for submission
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const res = await fetch(`${SERVER_URL}api/universal-posts`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setServerMessage("Post created successfully! ✅");
        setMessageType('success');
        // Reset form fields
        setTitle("");
        setSubtitle("");
        setContent("");
        setAuthor("");
        setCategory("");
        setImageFiles([]);
        setIsHome(false);
        setIsRecent(false);
        setDate(new Date().toISOString().substring(0, 10));
      } else {
        const errorData = await res.json();
        setServerMessage(`Failed to create post: ${errorData.error || res.statusText} ❌`);
        setMessageType('error');
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setServerMessage("An unexpected error occurred while submitting the form. ⚠️");
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
      setIsLoadingFullPage(false);
      // Clear message after a few seconds if successful
      if (messageType === 'success') {
        setTimeout(() => {
          setServerMessage(null);
          setMessageType(null);
        }, 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-10 px-4 relative">
      {/* Full-Page Loader Overlay */}
      {isLoadingFullPage && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-filter backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-700"></div>
            <p className="mt-4 text-xl text-white">
              {isSubmitting ? "Submitting post..." : "Loading categories..."}
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl backdrop-blur-lg bg-white/70 border border-gray-200 shadow-xl rounded-2xl p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          Add New Post
        </h2>

        {serverMessage && (
          <div className={`p-3 rounded-md text-center ${messageType === 'success' ? 'bg-green-100 text-green-700 border-green-400' : 'bg-red-100 text-red-700 border-red-400'}`}>
            {serverMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Subtitle
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          {/* Rich Text Editor for Content */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content *
            </label>
            <RichTextEditor content={content} setContent={setContent} />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              {fetchedCategories.map((item) => (
                <option key={item._id} value={item.name.en || item.name.ta}>
                  {item.name.ta}
                </option>
              ))}
            </select>
          </div>

          {/* Images Section */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">
              Images (Select and Crop to Add)
            </label>
            <input
              type="file"
              accept="image/*"
              // Multiple removed to enforce a clearer single-file-crop-and-add flow
              onChange={(e) => handleFileSelect(e.target.files)}
              // Reset the input value so the same file can be selected again after cancelling or cropping
              onClick={(e) => (e.currentTarget.value = '')}
              className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />

            {/* Display selected images (which are now guaranteed to be cropped) */}
            {imageFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {imageFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative border border-gray-300 rounded-lg overflow-hidden"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Image ${index + 1}`}
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {/* Removed the 'Crop' button as images in this array are already cropped */}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Image Cropping Modal - Now triggered immediately on file selection */}
            {currentImageSrc && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
                  <h3 className="text-lg font-semibold mb-4">Crop Image (Aspect Ratio 1:1)</h3>
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={onCropComplete}
                    aspect={1 / 1}
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
                  <div className="flex gap-4 mt-4 justify-end">
                    <button
                      type="button"
                      onClick={cancelCropping}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDoneCropping}
                      disabled={!completedCrop}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Done Cropping
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkboxes for Home and Recent */}
          <div className="flex flex-col md:flex-row gap-4 md:col-span-2">
            <label className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                checked={isHome}
                onChange={(e) => setIsHome(e.target.checked)}
              />
              <span className="ml-2">Show on Home Page</span>
            </label>

            <label className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                checked={isRecent}
                onChange={(e) => setIsRecent(e.target.checked)}
              />
              <span className="ml-2">Show in Recent Posts</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingFullPage}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isSubmitting || isLoadingFullPage ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {isSubmitting ? "Submitting..." : "Add Post"}
          </button>
        </div>
      </div>
    </div>
  );
}