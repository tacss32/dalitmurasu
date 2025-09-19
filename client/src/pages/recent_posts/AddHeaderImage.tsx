import { useState, useCallback, useRef, useEffect } from "react";
import type { FormEvent, ChangeEvent } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
  convertToPixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

// This function draws the cropped portion of an image onto a canvas.
function drawCroppedImage(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Set the canvas size to the REAL pixel size of the crop from the original image.
  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);

  // Draw the high-resolution source image slice onto the now correctly-sized canvas.
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );
}

export default function AddHeaderImage() {
  const SERVER_URL = import.meta.env.VITE_API;

  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // State for Desktop Image
  const [desktopImageUrl, setDesktopImageUrl] = useState("");
  const [desktopCrop, setDesktopCrop] = useState<Crop>();
  const [completedDesktopCrop, setCompletedDesktopCrop] = useState<PixelCrop | null>(null);
  const desktopImageRef = useRef<HTMLImageElement | null>(null);
  const desktopCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // State for Mobile Image
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [mobileCrop, setMobileCrop] = useState<Crop>();
  const [completedMobileCrop, setCompletedMobileCrop] = useState<PixelCrop | null>(null);
  const mobileImageRef = useRef<HTMLImageElement | null>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch available categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${SERVER_URL}api/categories?header=true`);
        const data = await res.json();
        setCategories(data);
      } catch {
        setMessage("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, [SERVER_URL]);

  // Handle image file selection for either desktop or mobile
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>, type: "desktop" | "mobile") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "desktop") {
      if (desktopImageUrl) URL.revokeObjectURL(desktopImageUrl);
      setDesktopImageUrl(URL.createObjectURL(file));
      setDesktopCrop(undefined);
      setCompletedDesktopCrop(null);
    } else {
      if (mobileImageUrl) URL.revokeObjectURL(mobileImageUrl);
      setMobileImageUrl(URL.createObjectURL(file));
      setMobileCrop(undefined);
      setCompletedMobileCrop(null);
    }
    setMessage("");
  };

  // Image load -> set initial crop
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>, aspect: number, setCropState: Function, setCompletedCropState: Function, imageRef: React.MutableRefObject<HTMLImageElement | null>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      const initialPercentCrop = centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
        width,
        height
      );
      setCropState(initialPercentCrop);

      if (imageRef.current) {
        const initialPixelCrop = convertToPixelCrop(
          initialPercentCrop,
          imageRef.current.naturalWidth,
          imageRef.current.naturalHeight
        );
        setCompletedCropState(initialPixelCrop);
      }
    },
    []
  );

  // Draw cropped desktop preview whenever crop changes
  useEffect(() => {
    if (
      completedDesktopCrop?.width &&
      completedDesktopCrop?.height &&
      desktopImageRef.current &&
      desktopCanvasRef.current
    ) {
      drawCroppedImage(
        desktopImageRef.current,
        desktopCanvasRef.current,
        completedDesktopCrop
      );
    }
  }, [completedDesktopCrop]);

  // Draw cropped mobile preview whenever crop changes
  useEffect(() => {
    if (
      completedMobileCrop?.width &&
      completedMobileCrop?.height &&
      mobileImageRef.current &&
      mobileCanvasRef.current
    ) {
      drawCroppedImage(
        mobileImageRef.current,
        mobileCanvasRef.current,
        completedMobileCrop
      );
    }
  }, [completedMobileCrop]);

  // Submit and upload cropped images
  const handleAddBanner = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsUploading(true);

    if (!selectedCategory || (!completedDesktopCrop && !completedMobileCrop)) {
      setMessage("Please select a category and upload at least one valid image.");
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("category", selectedCategory);

      // Handle desktop image
      if (completedDesktopCrop && desktopImageRef.current && desktopCanvasRef.current) {
        drawCroppedImage(desktopImageRef.current, desktopCanvasRef.current, completedDesktopCrop);
        const desktopBlob = await new Promise<Blob | null>((resolve) =>
          desktopCanvasRef.current!.toBlob(resolve, "image/jpeg", 0.95)
        );
        if (desktopBlob) {
          formData.append("desktop-image", desktopBlob, "desktop.jpg");
        }
      }

      // Handle mobile image
      if (completedMobileCrop && mobileImageRef.current && mobileCanvasRef.current) {
        drawCroppedImage(mobileImageRef.current, mobileCanvasRef.current, completedMobileCrop);
        const mobileBlob = await new Promise<Blob | null>((resolve) =>
          mobileCanvasRef.current!.toBlob(resolve, "image/jpeg", 0.95)
        );
        if (mobileBlob) {
          formData.append("mobile-image", mobileBlob, "mobile.jpg");
        }
      }
      
      const res = await fetch(`${SERVER_URL}api/post_header`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Banner uploaded successfully!");
        setDesktopImageUrl("");
        setMobileImageUrl("");
        setDesktopCrop(undefined);
        setCompletedDesktopCrop(null);
        setMobileCrop(undefined);
        setCompletedMobileCrop(null);
      } else {
        setMessage(data.error || "Failed to upload banner");
      }
    } catch (err) {
      setMessage("Error uploading banner");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (desktopImageUrl) URL.revokeObjectURL(desktopImageUrl);
      if (mobileImageUrl) URL.revokeObjectURL(mobileImageUrl);
    };
  }, [desktopImageUrl, mobileImageUrl]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-5xl bg-white border shadow-xl rounded-2xl p-8 space-y-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          Upload Header Images
        </h2>

        {message && (
          <div
            className={`p-3 rounded-md text-center ${
              message.includes("success")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleAddBanner} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              required
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name.en}>
                  {cat.name.ta}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Image Section */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Desktop Header Image</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, "desktop")}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="mt-2 text-sm text-gray-500">
                Recommended aspect ratio: 4:1
              </p>
            </div>

            {desktopImageUrl && (
              <div className="space-y-4 mt-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <ReactCrop
                    crop={desktopCrop}
                    onChange={(_, percentCrop) => setDesktopCrop(percentCrop)}
                    onComplete={(pixelCrop) => setCompletedDesktopCrop(pixelCrop)}
                    aspect={4 / 1}
                    minWidth={100}
                    minHeight={40}
                    keepSelection
                  >
                    <img
                      ref={desktopImageRef}
                      src={desktopImageUrl}
                      onLoad={(e) => onImageLoad(e, 4 / 1, setDesktopCrop, setCompletedDesktopCrop, desktopImageRef)}
                      alt="Desktop banner to crop"
                      className="max-h-[400px] object-contain w-full"
                    />
                  </ReactCrop>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Image Section */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Mobile Header Image (Optional)</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, "mobile")}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="mt-2 text-sm text-gray-500">
                Recommended aspect ratio: 1:1 (or vertical)
              </p>
            </div>

            {mobileImageUrl && (
              <div className="space-y-4 mt-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <ReactCrop
                    crop={mobileCrop}
                    onChange={(_, percentCrop) => setMobileCrop(percentCrop)}
                    onComplete={(pixelCrop) => setCompletedMobileCrop(pixelCrop)}
                    aspect={4 / 2}
                    minWidth={100}
                    minHeight={100}
                    keepSelection
                  >
                    <img
                      ref={mobileImageRef}
                      src={mobileImageUrl}
                      onLoad={(e) => onImageLoad(e, 4 / 2, setMobileCrop, setCompletedMobileCrop, mobileImageRef)}
                      alt="Mobile banner to crop"
                      className="max-h-[400px] object-contain w-full"
                    />
                  </ReactCrop>
                </div>
              </div>
            )}
          </div>

          <div className="text-center pt-4">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-full shadow disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                !selectedCategory ||
                (!completedDesktopCrop && !completedMobileCrop) ||
                isUploading
              }
            >
              {isUploading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Uploading...
                </span>
              ) : (
                "Upload Cropped Header"
              )}
            </button>
          </div>
        </form>

        <canvas ref={desktopCanvasRef} style={{ display: "none" }} />
        <canvas ref={mobileCanvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
