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

function drawCroppedImage(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // --- START OF FIX ---

  // 1. Set the canvas size to the REAL pixel size of the crop from the original image.
  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);

  // 2. Draw the high-resolution source image slice onto the now correctly-sized canvas.
  // The destination width/height (last two arguments) should match the canvas size.
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width, // Use the new, correct width
    canvas.height // Use the new, correct height
  );
  
  // --- END OF FIX ---
}
export default function AddHeaderImage() {
  const SERVER_URL = import.meta.env.VITE_API;

  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Handle image file selection
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imageUrl) URL.revokeObjectURL(imageUrl);

    setImageUrl(URL.createObjectURL(file));
    setMessage("");
    setCrop(undefined);
    setCompletedCrop(null);
  };

  // Image load -> set initial crop
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      const aspect = 5 / 2;
      const initialPercentCrop = centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
        width,
        height
      );
      setCrop(initialPercentCrop);

      if (imageRef.current) {
        const initialPixelCrop = convertToPixelCrop(
          initialPercentCrop,
          imageRef.current.naturalWidth,
          imageRef.current.naturalHeight
        );
        setCompletedCrop(initialPixelCrop);
      }
    },
    []
  );

  // Draw cropped preview whenever crop changes
  useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imageRef.current &&
      previewCanvasRef.current
    ) {
      drawCroppedImage(
        imageRef.current,
        previewCanvasRef.current,
        completedCrop
      );
    }
  }, [completedCrop]);

  // Submit and upload cropped image
  const handleAddBanner = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsUploading(true);

    if (
      !selectedCategory ||
      !completedCrop ||
      !previewCanvasRef.current ||
      !imageRef.current
    ) {
      setMessage("Please select category and valid crop area");
      setIsUploading(false);
      return;
    }

    drawCroppedImage(imageRef.current, previewCanvasRef.current, completedCrop);

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        previewCanvasRef.current!.toBlob(resolve, "image/jpeg", 0.95)
      );

      if (!blob) throw new Error("Image blob creation failed");

      const formData = new FormData();
      formData.append("banner-image", blob, "cropped.jpg");
      formData.append("category", selectedCategory);

      const res = await fetch(`${SERVER_URL}api/post_header`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Banner uploaded successfully!");
        setImageUrl("");
        setCrop(undefined);
        setCompletedCrop(null);
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

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-5xl bg-white border shadow-xl rounded-2xl p-8 space-y-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          Upload Banner
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
                  {cat.name.en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Banner Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
             <p className="mt-2 text-sm text-gray-500">
              Tip: Upload an image with a 5:2 ratio for the best results.
            </p>
          </div>

          {imageUrl && (
            <div className="space-y-4">
              <div className="text-sm bg-blue-50 text-gray-600 p-3 rounded-md">
                <strong>Tip:</strong> Adjust crop area. Aspect ratio is fixed at
                5:2.
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                  aspect={5 / 2}
                  minWidth={100}
                  minHeight={40}
                  keepSelection
                >
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    onLoad={onImageLoad}
                    alt="To crop"
                    className="max-h-[400px] object-contain w-full"
                  />
                </ReactCrop>
              </div>

              {completedCrop?.width && completedCrop?.height && (
                <p className="text-center text-sm text-gray-700">
                  Crop Size: {Math.round(completedCrop.width)} ×{" "}
                  {Math.round(completedCrop.height)} px
                </p>
              )}
            </div>
          )}

          <div className="text-center pt-4">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-full shadow disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                !imageUrl ||
                !completedCrop?.width ||
                !selectedCategory ||
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
                "Upload Cropped Banner"
              )}
            </button>
          </div>
        </form>

        <canvas ref={previewCanvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
