import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Import for Image Cropping
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import getCroppedImg from "../../components/getCroppedImg"; // Ensure this path is correct

// Import for Rich Text Editor
import RichTextEditor from "../../components/RichTextEditor"; // Ensure this path is correct

const API_BASE_URL = import.meta.env.VITE_API;

// --- Type Definitions ---

interface ICategoryOption {
  value: string;
  label: string;
}

interface IPremiumPostFormInput {
  title: string;
  subtitle?: string;
  content: string;
  author: string;
  category: ICategoryOption | null; // Use ICategoryOption for react-select
  images: File[]; // For new image uploads (this will be managed by react-hook-form)
  isHome: boolean;
  isRecent: boolean;
  visibility: "subscribers"; // Only 'subscribers' allowed now
  freeViewLimit: number; // This will now apply to both public and subscribers
  date: Date;
}

// Interface for fetching existing post data (images here are URLs)
interface IPremiumPostApiResponse {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  author: string;
  category: string; // From API, it's a string name
  images: string[]; // URLs of existing images
  isHome: boolean;
  isRecent: boolean;
  visibility: "public" | "subscribers"; // Keep both here as existing posts might have 'public'
  views: number;
  freeViewLimit: number; // Existing posts will also have this
  date: string; // ISO date string from API
  createdAt: string;
  updatedAt: string;
}

// --- Hardcoded Premium Categories ---
const PREMIUM_CATEGORIES: ICategoryOption[] = [
  { value: "Premium Articles", label: "Premium Articles" },
  // Add more premium categories if needed
];

export default function PremiumArticleForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Specify type for useParams
  const isEditing = !!id;

  const [selectedImages, setSelectedImages] = useState<File[]>([]); // For image preview of new files
  const [existingImages, setExistingImages] = useState<string[]>([]); // For image URLs already on the post
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoadingFullPage, setIsLoadingFullPage] = useState(false); // New state for full-page loader

  // --- Image cropping states ---
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  // -----------------------------

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IPremiumPostFormInput>({
    defaultValues: {
      title: "",
      subtitle: "",
      content: "",
      author: "Admin", // Default author
      category: PREMIUM_CATEGORIES[0] || null, // Set a default premium category
      images: [],
      isHome: false,
      isRecent: false,
      visibility: "subscribers", // Default visibility is now always 'subscribers'
      date: new Date(),
      freeViewLimit: 0, // Default free view limit
    },
  });


  // --- Admin Token Verification Function ---
  const verifyAdminToken = async (): Promise<boolean> => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found. Redirecting to login.");
      navigate("/admin/login"); // or your admin login route
      return false;
    }

    try {
      await axios.post(
        `${API_BASE_URL}api/auth/admin/verify-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Token verified successfully.");
      return true;
    } catch (err) {
      console.error("Token verification failed:", err);
      // Token is invalid or expired; clear it and redirect to login
      localStorage.removeItem("token");
      navigate("/admin/login");
      return false;
    }
  };

  // If editing, fetch existing post data
  useEffect(() => {
    if (isEditing) {
      const fetchPost = async () => {
        setIsLoadingFullPage(true); // Show loader when fetching post data for editing
        const isValid = await verifyAdminToken();
        if (!isValid) {
          setIsLoadingFullPage(false); // Hide loader if token invalid
          return;
        }

        try {
          const token = localStorage.getItem("token");
          const response = await axios.get<IPremiumPostApiResponse>(
            `${API_BASE_URL}api/premium-posts/admin/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const post = response.data;

          console.log("Fetched post for editing:", post);

          const foundCategory =
            PREMIUM_CATEGORIES.find((cat) => cat.value === post.category) || {
              value: post.category,
              label: post.category,
            };

          reset({
            title: post.title,
            subtitle: post.subtitle,
            content: post.content,
            author: post.author,
            category: foundCategory,
            images: [],
            isHome: post.isHome,
            isRecent: post.isRecent,
            visibility:
              post.visibility === "public" ? "subscribers" : post.visibility,
            freeViewLimit: post.freeViewLimit,
            date: new Date(post.date),
          });

          setExistingImages(post.images);
        } catch (err) {
          console.error("Failed to fetch post:", err);
          setServerError("Failed to load post data. Please try again.");
        } finally {
          setIsLoadingFullPage(false); // Hide loader after fetching post data
        }
      };
      fetchPost();
    }
  }, [id, isEditing, navigate, reset]);

  // --- Image Handling Functions ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages((prev) => [...prev, ...files]);
    setValue("images", [...watch("images"), ...files]);
    e.target.value = "";
  };

  const removeSelectedImage = (index: number) => {
    const updatedSelectedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedSelectedImages);
    setValue("images", updatedSelectedImages);
  };

  const removeExistingImage = (imageUrlToRemove: string) => {
    const updatedExistingImages = existingImages.filter(
      (url) => url !== imageUrlToRemove
    );
    setExistingImages(updatedExistingImages);
  };

  // --- Image Cropping Logic ---

  const startCropping = (index: number) => {
    const file = selectedImages[index];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result?.toString() || null;
        setCurrentImageSrc(src);
        setCurrentImageIndex(index);
        setCrop(undefined);
        setCompletedCrop(undefined);
      };
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      const aspect = 1 / 1; // Square aspect ratio for cropping

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

    if (imgElement && completedCropData && currentImageIndex >= 0) {
      const originalFile = selectedImages[currentImageIndex];
      const originalFileName = originalFile.name;

      try {
        const croppedFile = await getCroppedImg(
          imgElement,
          completedCropData,
          `cropped_${originalFileName}`
        );

        setSelectedImages((prev) =>
          prev.map((file, index) =>
            index === currentImageIndex ? (croppedFile as File) : file
          )
        );
        setValue(
          "images",
          watch("images").map((file, index) =>
            index === currentImageIndex ? (croppedFile as File) : file
          )
        );

        setCurrentImageSrc(null);
        setCurrentImageIndex(-1);
        setCrop(undefined);
        setCompletedCrop(undefined);
      } catch (e) {
        console.error("Error cropping image:", e);
        setServerError("Failed to crop image. Please try again.");
      }
    } else {
      setServerError("Please select an image and define a crop area.");
    }
  };

  const cancelCropping = () => {
    setCurrentImageSrc(null);
    setCurrentImageIndex(-1);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  // --- Form Submission ---
  const onSubmit: SubmitHandler<IPremiumPostFormInput> = async (data) => {
    setServerError(null);
    setIsLoadingFullPage(true); // Show full-page loader on form submission

    const formData = new FormData();

    formData.append("title", data.title);
    if (data.subtitle) formData.append("subtitle", data.subtitle);
    formData.append("content", data.content);
    formData.append("author", data.author);
    formData.append("category", data.category?.value || "");
    formData.append("isHome", String(data.isHome));
    formData.append("isRecent", String(data.isRecent));
    formData.append("visibility", data.visibility);
    formData.append("freeViewLimit", String(data.freeViewLimit));
    formData.append("date", data.date.toISOString());

    data.images.forEach((file) => {
      formData.append("images", file);
    });

    existingImages.forEach((url) => {
      formData.append("existingImages", url);
    });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setServerError("Authentication token not found. Please log in.");
        return;
      }

      let response;
      if (isEditing) {
        response = await axios.put(
          `${API_BASE_URL}api/premium-posts/${id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        console.log("Post updated:", response.data);
        setServerError("Premium post updated successfully!");
        setTimeout(() => {
          setServerError(null);
          navigate("/admin/premium-articles");
        }, 2000);
      } else {
        response = await axios.post(
          `${API_BASE_URL}api/premium-posts`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        console.log("Post created:", response.data);
        setServerError("Premium post created successfully!");
        setTimeout(() => {
          setServerError(null);
          navigate("/admin/premium-articles");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error saving post:", err);
      setServerError(
        err.response?.data?.details ||
        err.response?.data?.error ||
        "An unexpected error occurred."
      );
    } finally {
      setIsLoadingFullPage(false); // Hide full-page loader after submission
    }
  };

  return (
    <div className="container p-6 bg-gray-800 text-white rounded-lg shadow-lg relative w-4/5 mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-yellow-400">
        {isEditing ? "Edit Premium Article" : "Create New Premium Article"}
      </h2>

      {serverError && (
        <div
          className={`text-white p-3 rounded mb-4 ${
            serverError.includes("successfully") ? "bg-green-500" : "bg-red-500"
          }`}
          role="alert"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 ">
        <div>
          <label htmlFor="title" className="block text-lg font-medium mb-2">
            Title:
          </label>
          <input
            id="title"
            {...register("title", { required: "Title is required" })}
            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500"
          />
          {errors.title && (
            <p className="text-red-400 text-sm mt-1">
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="subtitle"
            className="block text-lg font-medium mb-2"
          >
            Subtitle:
          </label>
          <input
            id="subtitle"
            {...register("subtitle")}
            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500"
          />
        </div>

        {/* Rich Text Editor for Content */}
        <div>
          <label htmlFor="content" className="block text-lg font-medium mb-2">
            Content:
          </label>
          <Controller
            name="content"
            control={control}
            rules={{ required: "Content is required" }}
            render={({ field }) => (
              <RichTextEditor
                content={field.value}
                setContent={field.onChange}
              />
            )}
          />
          {errors.content && (
            <p className="text-red-400 text-sm mt-1">
              {errors.content.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="author" className="block text-lg font-medium mb-2">
            Author:
          </label>
          <input
            id="author"
            {...register("author")}
            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-lg font-medium mb-2">
            Category:
          </label>
          <Controller
            name="category"
            control={control}
            rules={{ required: "Category is required" }}
            render={({ field }) => (
              <Select<ICategoryOption>
                {...field}
                options={PREMIUM_CATEGORIES}
                className="text-gray-900"
                classNamePrefix="react-select"
                placeholder="Select Category"
                isClearable
                styles={{
                  control: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: "#4B5563", // bg-gray-700
                    borderColor: "#4A5568", // border-gray-600
                    color: "#FFFFFF", // text-white
                  }),
                  singleValue: (baseStyles) => ({
                    ...baseStyles,
                    color: "#FFFFFF", // text-white
                  }),
                  input: (baseStyles) => ({
                    ...baseStyles,
                    color: "#FFFFFF", // text-white
                  }),
                  placeholder: (baseStyles) => ({
                    ...baseStyles,
                    color: "#D1D5DB", // text-gray-400
                  }),
                  menu: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: "#4B5563", // bg-gray-700
                  }),
                  option: (baseStyles, { isFocused, isSelected }) => ({
                    ...baseStyles,
                    backgroundColor: isSelected
                      ? "#FBBF24" // yellow-400
                      : isFocused
                      ? "#6B7280" // gray-600
                      : "#4B5563", // gray-700
                    color: isSelected ? "#1F2937" : "#FFFFFF", // text-gray-900 or text-white
                    "&:active": {
                      backgroundColor: "#FBBF24",
                    },
                  }),
                }}
              />
            )}
          />
          {errors.category && (
            <p className="text-red-400 text-sm mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Images Section with Cropping */}
        <div>
          <label className="block text-lg font-medium mb-2">Images:</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 cursor-pointer"
          />
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {existingImages.map((image, index) => (
              <div key={`existing-${index}`} className="relative group">
                <img
                  src={image}
                  alt={`Existing ${index}`}
                  className="w-full h-32 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(image)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove existing image (will be removed on save if not re-uploaded)"
                >
                  X
                </button>
              </div>
            ))}
            {selectedImages.map((file, index) => (
              <div key={`new-${index}`} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index}`}
                  className="w-full h-32 object-cover rounded"
                />
                <div className="absolute top-1 right-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => startCropping(index)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Crop image"
                  >
                    Crop
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSelectedImage(index)}
                    className="bg-red-600 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove new image"
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Image Cropping Modal */}
          {currentImageSrc && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-2xl">
                <h3 className="text-xl font-semibold mb-4 text-yellow-400">Crop Image</h3>
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={onCropComplete}
                  aspect={1 / 1} // Enforce a square aspect ratio
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
                    onClick={cancelCropping}
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

        <div className="flex items-center space-x-4">
          <label htmlFor="isHome" className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="isHome"
              {...register("isHome")}
              className="form-checkbox h-5 w-5 text-yellow-500 rounded border-gray-600 focus:ring-yellow-500"
            />
            <span className="ml-2 text-lg">Display on Home Page</span>
          </label>

          {/* <label
            htmlFor="isRecent"
            className="flex items-center cursor-pointer"
          >
            <input
              type="checkbox"
              id="isRecent"
              {...register("isRecent")}
              className="form-checkbox h-5 w-5 text-yellow-500 rounded border-gray-600 focus:ring-yellow-500"
            />
            <span className="ml-2 text-lg">Display as Recent Post</span>
          </label> */}
        </div>

        <div>
          <label
            htmlFor="visibility"
            className="block text-lg font-medium mb-2"
          >
            Visibility:
          </label>
          <Controller
            name="visibility"
            control={control}
            render={({ field }) => (
              <Select<
                { value: "subscribers"; label: string }
              >
                {...field}
                value={{ value: "subscribers", label: "Subscribers Only" }}
                onChange={(option) => field.onChange(option ? option.value : null)}
                options={[
                  { value: "subscribers", label: "Subscribers Only" },
                ]}
                className="text-gray-900"
                classNamePrefix="react-select"
                placeholder="Select Visibility"
                styles={{
                  control: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: "#4B5563",
                    borderColor: "#4A5568",
                    color: "#FFFFFF",
                  }),
                  singleValue: (baseStyles) => ({
                    ...baseStyles,
                    color: "#FFFFFF",
                  }),
                  input: (baseStyles) => ({
                    ...baseStyles,
                    color: "#FFFFFF",
                  }),
                  placeholder: (baseStyles) => ({
                    ...baseStyles,
                    color: "#D1D5DB",
                  }),
                  menu: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: "#4B5563",
                  }),
                  option: (baseStyles, { isFocused, isSelected }) => ({
                    ...baseStyles,
                    backgroundColor: isSelected
                      ? "#FBBF24"
                      : isFocused
                      ? "#6B7280"
                      : "#4B5563",
                    color: isSelected ? "#1F2937" : "#FFFFFF",
                    "&:active": {
                      backgroundColor: "#FBBF24",
                    },
                  }),
                }}
              />
            )}
          />
        </div>

        {/* This section now always shows freeViewLimit */}
        <div>
          <label htmlFor="freeViewLimit" className="block text-lg font-medium mb-2">
            Free View Limit:
          </label>
          <input
            id="freeViewLimit"
            type="number"
            {...register("freeViewLimit", { valueAsNumber: true, min: 0, required: "Free view limit is required." })}
            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500"
            min="0"
          />
          {errors.freeViewLimit && (
            <p className="text-red-400 text-sm mt-1">
              {errors.freeViewLimit.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="date" className="block text-lg font-medium mb-2">
            Publish Date:
          </label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date: Date | null) => field.onChange(date)}
                dateFormat="yyyy/MM/dd"
                className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500 text-white"
              />
            )}
          />
          {errors.date && (
            <p className="text-red-400 text-sm mt-1">{errors.date.message}</p>
          )}
        </div>

        <div className="text-center pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isLoadingFullPage} // Disable button if form is submitting OR full page is loading
            className={`bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 ${
              isSubmitting || isLoadingFullPage ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update Article"
              : "Create Article"}
          </button>
        </div>
      </form>

      {/* Full-Page Loader */}
      {isLoadingFullPage && (
        <div className="fixed inset-0  bg-opacity-75 flex items-center justify-center z-[100]"> {/* Increased z-index */}
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-700"></div>
            <p className="mt-4 text-xl text-white">
              {isSubmitting ? (isEditing ? "Updating article..." : "Creating article...") : "Loading data..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
