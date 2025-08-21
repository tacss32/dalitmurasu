import axios from "axios"; // Import axios
import { useState, type ChangeEvent, type FormEvent } from "react"; // Added ChangeEvent

// Your backend API base URL - ensure this matches your backend server
const API_BASE = "https://dalit-murasu.vercel.app";

export default function BannerCreateForm() {
  const [tag, setTag] = useState("");
  // const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [url, setUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false); // To change message color

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setPhotoFile(file);
    // Optional: Clear message when a new file is selected
    if (message && !file) {
      setMessage("Please select a photo.");
      setIsSuccess(false);
    } else if (message) {
      setMessage(""); // Clear message if user selects a file after an error
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages
    setIsSuccess(false);

    if (!photoFile) {
      setMessage("Please select a photo.");
      return;
    }

    const formData = new FormData();
    formData.append("tag", tag);
    // formData.append("title", title);
    // formData.append("author", author);
    formData.append("url", url);
    formData.append("photo", photoFile);
    formData.append("duration", "5000"); // Optional: explicitly send duration

    try {
      // Use axios for consistency and better error handling
      const response = await axios.post(`${API_BASE}/api/banners`, formData, {
        headers: {
          "Content-Type": "multipart/form-data", // axios sets this automatically for FormData, but good to remember
        },
      });

      if (response.status === 201) {
        // 201 Created is typical for successful POST
        setMessage("Banner created successfully!");
        setIsSuccess(true);
        // Reset form
        setTag("");
        // setTitle("");
        setAuthor("");
        setUrl("");
        setPhotoFile(null);
        // Clear the file input visually
        const fileInput = document.getElementById(
          "bannerPhotoInput"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        // This block might be hit for non-2xx but non-error responses
        setMessage(
          `Error: ${response.status} - ${
            response.statusText || "Unknown error"
          }`
        );
        setIsSuccess(false);
      }
    } catch (error: any) {
      // Catch axios errors
      console.error("Failed to create banner:", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setMessage(
          `Error: ${
            error.response.data.error ||
            error.response.statusText ||
            "Something went wrong"
          }`
        );
      } else if (error.request) {
        // The request was made but no response was received
        setMessage(
          "Network error: No response from server. Check if backend is running."
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        setMessage("An unexpected error occurred.");
      }
      setIsSuccess(false);
    }
  };

  return (
    <div className="p-6 ml-64">
      {" "}
      {/* Retaining ml-64 for your layout */}
      <h2 className="text-2xl font-bold mb-4">Create New Banner</h2>
      {message && (
        <p className={`mb-4 ${isSuccess ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <input
          type="text"
          placeholder="Tag (e.g., main-banner)"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="border p-2 rounded"
          required
        />
        {/* <input
          type="text"
          placeholder="Title (e.g., Summer Sale)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
          required
        /> */}
        <input
          type="text"
          placeholder="Author (e.g., Admin)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="URL (e.g., /products/new-arrivals)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <label
          htmlFor="bannerPhotoInput"
          className="block text-sm font-medium text-gray-700 mt-2"
        >
          Upload Banner Image:
        </label>
        <input
          type="file"
          id="bannerPhotoInput" // Added an ID for clearing input
          name="photo" // Crucial for multer to pick it up
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
                     file:py-2 file:px-4 file:rounded-full file:border-0
                     file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Create Banner
        </button>
      </form>
    </div>
  );
}
