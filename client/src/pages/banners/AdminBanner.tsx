import React, { useState, useCallback, useEffect, useRef } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import axios from "axios";

// API base URL
const API_BASE = import.meta.env.VITE_API;

// Interface for the Banner data
interface Banner {
  _id: string;
  mobileImage?: string;
  desktopImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interface for image crop state
interface ImageCropState {
  src: string;
  crop: Crop | undefined;
  completedCrop: PixelCrop | undefined;
  croppedFile: File | null;
  isProcessing: boolean;
}

export default function AdminBanner() {
  // State for managing existing banners
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for image cropping
  const [mobileImage, setMobileImage] = useState<ImageCropState>({
    src: "",
    crop: undefined,
    completedCrop: undefined,
    croppedFile: null,
    isProcessing: false,
  });

  const [desktopImage, setDesktopImage] = useState<ImageCropState>({
    src: "",
    crop: undefined,
    completedCrop: undefined,
    croppedFile: null,
    isProcessing: false,
  });

  // Refs for image elements
  const mobileImgRef = useRef<HTMLImageElement | null>(null);
  const desktopImgRef = useRef<HTMLImageElement | null>(null);

  // State for messages and modals
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // API Functions
  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}api/banners`);
      setBanners(response.data.banners || response.data);
      setMessage(null);
    } catch (error) {
      console.error("Error fetching banners:", error);
      setMessage("Failed to load banners.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBanner = async (formData: FormData) => {
    const response = await axios.post(`${API_BASE}api/banners`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  };

  const deleteBanner = async (id: string) => {
    const response = await axios.delete(`${API_BASE}api/banners/${id}`);
    return response.data;
  };

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Utility Functions
  const resetForm = () => {
    setMobileImage({
      src: "",
      crop: undefined,
      completedCrop: undefined,
      croppedFile: null,
      isProcessing: false,
    });
    setDesktopImage({
      src: "",
      crop: undefined,
      completedCrop: undefined,
      croppedFile: null,
      isProcessing: false,
    });
    setMessage(null);

    // Clear file inputs
    const mobileInput = document.getElementById(
      "mobileBannerInput"
    ) as HTMLInputElement;
    const desktopInput = document.getElementById(
      "desktopBannerInput"
    ) as HTMLInputElement;
    if (mobileInput) mobileInput.value = "";
    if (desktopInput) desktopInput.value = "";
  };

  const canvasToFile = (
    canvas: HTMLCanvasElement,
    filename: string
  ): Promise<File> => {
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], filename, { type: "image/jpeg" }));
          }
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const getCroppedImg = useCallback(
    async (
      image: HTMLImageElement,
      crop: PixelCrop,
      filename: string
    ): Promise<File> => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No 2d context");
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = crop.width;
      canvas.height = crop.height;

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

      return canvasToFile(canvas, filename);
    },
    []
  );

  // Image Handling Functions
  const handleImageFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    imageType: "mobile" | "desktop"
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const imageSrc = reader.result?.toString() || "";

        if (imageType === "mobile") {
          setMobileImage((prev) => ({
            ...prev,
            src: imageSrc,
            crop: undefined,
            completedCrop: undefined,
            croppedFile: null,
          }));
        } else {
          setDesktopImage((prev) => ({
            ...prev,
            src: imageSrc,
            crop: undefined,
            completedCrop: undefined,
            croppedFile: null,
          }));
        }
      });
      reader.readAsDataURL(e.target.files[0]);
    }
    setMessage(null);
    setIsSuccess(false);
  };

  const onImageLoad = useCallback(
    (
      e: React.SyntheticEvent<HTMLImageElement>,
      imageType: "mobile" | "desktop"
    ) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      const aspect = imageType === "mobile" ? 1 / 1 : 16 / 10;

      const crop = centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
        width,
        height
      );

      if (imageType === "mobile") {
        setMobileImage((prev) => ({ ...prev, crop }));
      } else {
        setDesktopImage((prev) => ({ ...prev, crop }));
      }
    },
    []
  );

  const handleCropComplete = async (imageType: "mobile" | "desktop") => {
    const imageState = imageType === "mobile" ? mobileImage : desktopImage;
    const imgRef = imageType === "mobile" ? mobileImgRef : desktopImgRef;
    const setImageState =
      imageType === "mobile" ? setMobileImage : setDesktopImage;

    if (imgRef.current && imageState.completedCrop) {
      setImageState((prev) => ({ ...prev, isProcessing: true }));

      try {
        const croppedFile = await getCroppedImg(
          imgRef.current,
          imageState.completedCrop,
          `${imageType}-banner.jpg`
        );

        setImageState((prev) => ({
          ...prev,
          croppedFile,
          isProcessing: false,
        }));

        setMessage(
          `${
            imageType.charAt(0).toUpperCase() + imageType.slice(1)
          } image cropped successfully!`
        );
        setIsSuccess(true);
      } catch (error) {
        console.error(`Error cropping ${imageType} image:`, error);
        setMessage(`Failed to crop ${imageType} image.`);
        setIsSuccess(false);
        setImageState((prev) => ({ ...prev, isProcessing: false }));
      }
    }
  };

  // Form Submission
  const handleSubmit = async () => {
    setMessage(null);
    setIsSuccess(false);
    setIsSubmitting(true);

    if (!mobileImage.croppedFile && !desktopImage.croppedFile) {
      setMessage(
        "Please select and crop at least one image (mobile or desktop) to create a banner."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();

      if (mobileImage.croppedFile) {
        formData.append("mobileImage", mobileImage.croppedFile);
      }
      if (desktopImage.croppedFile) {
        formData.append("desktopImage", desktopImage.croppedFile);
      }

      await createBanner(formData);

      setMessage("Banner created successfully!");
      setIsSuccess(true);
      resetForm();
      fetchBanners();
    } catch (error: any) {
      console.error("Failed to submit banner:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to create banner. Please try again.";
      setMessage(errorMessage);
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handlers
  const handleDeleteClick = (id: string) => {
    setBannerToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (bannerToDelete) {
      try {
        await deleteBanner(bannerToDelete);
        setBanners(banners.filter((b) => b._id !== bannerToDelete));
        setMessage("Banner deleted successfully.");
        setIsSuccess(true);
      } catch (error: any) {
        console.error("Delete failed:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to delete banner.";
        setMessage(errorMessage);
        setIsSuccess(false);
      } finally {
        setShowConfirmModal(false);
        setBannerToDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setBannerToDelete(null);
  };

  // Component Render Functions
  const renderImageCropSection = (
    imageType: "mobile" | "desktop",
    imageState: ImageCropState,
    imgRef: React.RefObject<HTMLImageElement | null>,
    aspectRatio: string
  ) => {
    const aspect = imageType === "mobile" ? 1/ 1 : 16 / 10;
    const setImageState =
      imageType === "mobile" ? setMobileImage : setDesktopImage;

    return (
      <div className="border border-gray-200 p-5 rounded-lg bg-gray-50">
        <label
          htmlFor={`${imageType}BannerInput`}
          className="block text-lg font-semibold text-gray-700 mb-3"
        >
          Upload{" "}
          <span className="text-blue-600">
            {imageType.charAt(0).toUpperCase() + imageType.slice(1)}
          </span>{" "}
          Banner Image ({aspectRatio} ratio)
        </label>

        <input
          type="file"
          id={`${imageType}BannerInput`}
          accept="image/*"
          onChange={(e) => handleImageFileChange(e, imageType)}
          className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100 cursor-pointer"
        />

        {imageState.src && !imageState.croppedFile && (
          <div className="mt-4 space-y-4">
            <div className="border border-dashed border-gray-300 rounded-md bg-white p-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">
                Crop {imageType.charAt(0).toUpperCase() + imageType.slice(1)}{" "}
                Image:
              </h4>
              <ReactCrop
                crop={imageState.crop}
                onChange={(c) =>
                  setImageState((prev) => ({ ...prev, crop: c }))
                }
                onComplete={(c) =>
                  setImageState((prev) => ({ ...prev, completedCrop: c }))
                }
                aspect={aspect}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  alt={`${imageType} Banner Crop`}
                  src={imageState.src}
                  onLoad={(e) => onImageLoad(e, imageType)}
                  className="max-w-full h-auto"
                />
              </ReactCrop>
              <button
                type="button"
                onClick={() => handleCropComplete(imageType)}
                disabled={!imageState.completedCrop || imageState.isProcessing}
                className="mt-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium px-4 py-2 rounded-md transition duration-200"
              >
                {imageState.isProcessing
                  ? "Processing..."
                  : `Apply ${
                      imageType.charAt(0).toUpperCase() + imageType.slice(1)
                    } Crop`}
              </button>
            </div>
          </div>
        )}

        {imageState.croppedFile && (
          <div className="mt-4 border border-green-300 rounded-md bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-green-700 font-medium">
                  ✓ {imageType.charAt(0).toUpperCase() + imageType.slice(1)}{" "}
                  image ready
                </p>
                <img
                  src={URL.createObjectURL(imageState.croppedFile)}
                  alt={`${imageType} Banner Preview`}
                  className={`h-16 w-auto rounded border ${
                    imageType === "mobile" ? "max-w-10" : "max-w-28"
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setImageState((prev) => ({
                    ...prev,
                    src: "",
                    crop: undefined,
                    completedCrop: undefined,
                    croppedFile: null,
                  }))
                }
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Banner Management
      </h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-center ${
            isSuccess
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* Banner Form Section */}
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-xl mb-10">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Add New Banner
        </h3>

        {/* Mobile Image Section */}
        {renderImageCropSection("mobile", mobileImage, mobileImgRef, "1:1")}

        {/* Desktop Image Section */}
        {renderImageCropSection(
          "desktop",
          desktopImage,
          desktopImgRef,
          "16:10"
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={
            (!mobileImage.croppedFile && !desktopImage.croppedFile) ||
            isSubmitting
          }
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition duration-200 ease-in-out"
        >
          {isSubmitting ? "Creating Banner..." : "Create Banner"}
        </button>
      </div>

      {/* Existing Banners Section */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Existing Banners
        </h3>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <p className="text-center text-gray-600 py-8">
            No banners found. Start by creating one above!
          </p>
        ) : (
          <ul className="space-y-6">
            {banners.map((banner) => (
              <li
                key={banner._id}
                className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-white p-6 rounded-lg shadow-lg border border-gray-100"
              >
                {/* Image Previews */}
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                  {/* Mobile Image */}
                  <div className="text-center">
                    {banner.mobileImage ? (
                      <img
                        src={banner.mobileImage}
                        alt="Mobile Banner"
                        className="w-24 h-40 object-cover rounded-md border border-gray-300 shadow-sm"
                      />
                    ) : (
                      <div className="w-24 h-40 bg-gray-200 rounded-md border border-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-500">
                          Mobile N/A
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Mobile</p>
                  </div>

                  {/* Desktop Image */}
                  <div className="text-center">
                    {banner.desktopImage ? (
                      <img
                        src={banner.desktopImage}
                        alt="Desktop Banner"
                        className="w-40 h-24 object-cover rounded-md border border-gray-300 shadow-sm"
                      />
                    ) : (
                      <div className="w-40 h-24 bg-gray-200 rounded-md border border-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-500">
                          Desktop N/A
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Desktop</p>
                  </div>
                </div>

                {/* Banner Info */}
                <div className="flex-1">
                  <p className="text-sm text-gray-600">ID: {banner._id}</p>
                  {banner.createdAt && (
                    <p className="text-xs text-gray-500">
                      Created: {new Date(banner.createdAt).toLocaleDateString('en-GB')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto justify-center md:justify-end">
                  <button
                    onClick={() => handleDeleteClick(banner._id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-md transition duration-200 ease-in-out shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Confirm Deletion
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this banner? This action cannot be
              undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-md transition duration-200"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-5 rounded-md transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
