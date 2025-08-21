import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

// Import for Image Cropping
import {
  centerCrop,
  makeAspectCrop,
  type PixelCrop,
} from "react-image-crop";
import getCroppedImg from "../../components/getCroppedImg";

// UPDATED: Removed coupon, added deliveryFee and description
interface Book {
  _id: string;
  name: string;
  author: string;
  actualPrice: number;
  sellingPrice: number;
  inStock: boolean;
  imageUrl: string;
  category: string;
  showOnHome: boolean;
  description: string; // New field
  deliveryFee: number; // New field
}

export default function ManageBooks() {
  const API_BASE_URL = import.meta.env.VITE_API;
  const location = useLocation();
  const [showForm, setShowForm] = useState(location.pathname === "/admin/books/create");
  // NEW: State for full page loader
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // UPDATED: Removed coupon from initial formData state, added deliveryFee and description
  const [formData, setFormData] = useState({
    name: "",
    author: "",
    actualPrice: "",
    sellingPrice: "",
    inStock: true,
    showOnHome: false,
    image: null as File | null,
    category: "shop",
    description: "", // Initialize new field
    deliveryFee: "", // Initialize new field
  });

  const [editBookId, setEditBookId] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Image cropping states ---
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  // -----------------------------

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get<Book[]>(`${API_BASE_URL}api/books`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBooks(response.data);
    } catch (err: any) {
      console.error("Failed to fetch books:", err.response?.data || err.message);
      setError("Failed to load books. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const formRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (showForm && editBookId && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [showForm, editBookId]);

  useEffect(() => {
    if (location.pathname === "/admin/books/create") {
      setShowForm(true);
      setEditBookId(null);
      // UPDATED: Reset formData with new fields when navigating to create form
      setFormData({
        name: "",
        author: "",
        actualPrice: "",
        sellingPrice: "",
        inStock: true,
        showOnHome: false,
        image: null,
        category: "shop",
        description: "",
        deliveryFee: "",
      });
      setCroppedFile(null);
      setCroppedImageUrl(null);
    } else if (location.pathname === "/admin/books") {
      setShowForm(false);
      setEditBookId(null);
      // UPDATED: Reset formData with new fields when navigating to general books list
      setFormData({
        name: "",
        author: "",
        actualPrice: "",
        sellingPrice: "",
        inStock: true,
        showOnHome: false,
        image: null,
        category: "shop",
        description: "",
        deliveryFee: "",
      });
      setCroppedFile(null);
      setCroppedImageUrl(null);
    }
  }, [location.pathname]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === "file") {
      const target = e.target as HTMLInputElement;
      const file = target.files ? target.files[0] : null;
      setFormData({ ...formData, image: file });
      if (file) {
        autoCropAndPreview(file);
      } else {
        setCroppedFile(null);
        setCroppedImageUrl(null);
      }
    } else if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: target.checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // --- Automated Image Cropping Logic ---
  const autoCropAndPreview = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const { width, height } = img;
        const aspect = 130 / 201;
        const initialCrop = centerCrop(
          makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
          width,
          height
        );
        const croppedPixelCrop: PixelCrop = {
          x: (initialCrop.x / 100) * width,
          y: (initialCrop.y / 100) * height,
          width: (initialCrop.width / 100) * width,
          height: (initialCrop.height / 100) * height,
          unit: "px",
        };
        const croppedImage = await getCroppedImg(img, croppedPixelCrop, `cropped_${file.name}`);
        setCroppedFile(croppedImage as File);
        setCroppedImageUrl(URL.createObjectURL(croppedImage as Blob));
      };
      img.src = reader.result?.toString() || "";
    };
    reader.readAsDataURL(file);
  }, []);
  // -----------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true); // START THE LOADER
    try {
      const token = localStorage.getItem("token");
      const payload = new FormData();

      // Ensure croppedFile is available for submission
      if (!croppedFile && !editBookId) {
        setError("Please select an image.");
        setLoadingSubmit(false);
        return;
      }

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "image" && croppedFile) { // Use cropped file if available
          payload.append("image", croppedFile);
        } else {
          if (key === "inStock" || key === "showOnHome") {
            payload.append(key, String(value));
          } else if (value !== null && value !== "") { // Exclude null/empty image field if not present
            payload.append(key, value as string);
          }
        }
      });

      if (editBookId) {
        await axios.put(`${API_BASE_URL}api/books/${editBookId}`, payload, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.post(`${API_BASE_URL}api/books`, payload, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // UPDATED: Reset formData with new fields
      setFormData({
        name: "",
        author: "",
        actualPrice: "",
        sellingPrice: "",
        inStock: true,
        showOnHome: false,
        image: null,
        category: "shop",
        description: "",
        deliveryFee: "",
      });
      setCroppedFile(null);
      setCroppedImageUrl(null);
      setEditBookId(null);
      if (location.pathname !== "/admin/books/create") {
        setShowForm(false);
      }
      fetchBooks();
    } catch (err: any) {
      console.error("Book submission failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Book submission failed.");
    } finally {
      setLoadingSubmit(false); // STOP THE LOADER
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}api/books/${bookId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchBooks();
    } catch (err: any) {
      console.error("Book deletion failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Book deletion failed.");
    }
  };

  const handleEdit = (bookId: string) => {
    const bookToEdit = books.find((book) => book._id === bookId);

    if (!bookToEdit) return;

    // UPDATED: Populate new fields when editing
    setFormData({
      name: bookToEdit.name,
      author: bookToEdit.author,
      actualPrice: bookToEdit.actualPrice.toString(),
      sellingPrice: bookToEdit.sellingPrice.toString(),
      inStock: bookToEdit.inStock,
      showOnHome: bookToEdit.showOnHome,
      image: null,
      category: bookToEdit.category || "shop",
      description: bookToEdit.description,
      deliveryFee: bookToEdit.deliveryFee.toString(),
    });
    setCroppedFile(null);
    setCroppedImageUrl(null);
    setEditBookId(bookId);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditBookId(null);
    // UPDATED: Reset formData with new fields when cancelling edit
    setFormData({
      name: "",
      author: "",
      actualPrice: "",
      sellingPrice: "",
      inStock: true,
      showOnHome: false,
      image: null,
      category: "shop",
      description: "",
      deliveryFee: "",
    });
    setCroppedFile(null);
    setCroppedImageUrl(null);
    if (location.pathname !== "/admin/books/create") {
      setShowForm(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 p-6 bg-white rounded shadow">
      {/* NEW: Full page loader */}
      {loadingSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-current border-t-transparent text-white"></div>
            <p className="mt-4 text-white">Submitting...</p>
          </div>
        </div>
      )}
      <h2 className="text-3xl font-bold mb-6 text-center">Manage Books</h2>

      {location.pathname !== "/admin/books/create" && (
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            {showForm ? "Hide Add/Edit Form" : "Show Add/Edit Form"}
          </button>
        </div>
      )}

      {showForm && (
        <div
          ref={formRef}
          className="mb-10 p-6 border rounded-lg bg-gray-50"
        >
          <h3 className="text-2xl font-semibold mb-4">
            {editBookId ? "Edit Book" : "Add New Book"}
          </h3>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Book Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="author"
              placeholder="Author"
              value={formData.author}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="number"
              name="actualPrice"
              placeholder="Actual Price"
              value={formData.actualPrice}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="number"
              name="sellingPrice"
              placeholder="Selling Price"
              value={formData.sellingPrice}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="inStock"
                checked={formData.inStock}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
              />
              <label className="text-gray-700">In Stock</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="showOnHome"
                checked={formData.showOnHome}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-purple-600 rounded"
              />
              <label className="text-gray-700">Show on Home Page</label>
            </div>

            <div className="flex flex-col">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category:
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="shop">Shop</option>
              </select>
            </div>

            <textarea
              name="description"
              placeholder="Book Description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={4}
            />

            <input
              type="number"
              name="deliveryFee"
              placeholder="Delivery Fee"
              value={formData.deliveryFee}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <label className="block text-sm font-medium text-gray-700">Book Image:</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required={!editBookId && !formData.image}
            />

            {croppedImageUrl && (
              <div className="mt-4">
                <h4 className="text-md font-medium text-gray-700">Cropped Image Preview:</h4>
                <img
                  src={croppedImageUrl}
                  alt="Cropped preview"
                  className="w-32 h-32 object-cover rounded-md mt-2"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loadingSubmit} // Disable button while submitting
              className={`w-full ${
                editBookId ? "bg-yellow-600 hover:bg-yellow-700" : "bg-blue-600 hover:bg-blue-700"
              } text-white p-3 rounded transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingSubmit ? (editBookId ? "Updating..." : "Adding...") : (editBookId ? "Update Book" : "Add Book")}
            </button>

            {(editBookId || location.pathname === "/admin/books/create") && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full mt-2 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded transition duration-200"
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      )}
      <div className="mt-10">
        <h3 className="text-2xl font-semibold mb-4">Existing Books</h3>
        {loading && <p className="text-center text-gray-600">Loading books...</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {!loading && books.length === 0 && (
          <p className="text-center text-gray-600">No books found. {location.pathname !== "/admin/books/create" && "Click 'Show Add/Edit Form' to add one!"}</p>
        )}
        {!loading && books.length > 0 && (
          <div className="overflow-x-scroll">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6">Image</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Author</th>
                  <th className="py-3 px-6">Actual Price</th>
                  <th className="py-3 px-6">Selling Price</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">In Stock</th>
                  <th className="py-3 px-6">Show on Home</th>
                  {/* <th className="py-3 px-6">Description</th> */}
                  <th className="py-3 px-6">Delivery Fee</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm font-light">
                {books.map((book) => (
                  <tr key={book._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6">
                      {book.imageUrl && (
                        <img
                          src={book.imageUrl}
                          alt={book.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}
                    </td>
                    <td className="py-3 px-6">{book.name}</td>
                    <td className="py-3 px-6">{book.author}</td>
                    <td className="py-3 px-6">₹{book.actualPrice !== undefined ? book.actualPrice.toFixed(2) : 'N/A'}</td>
                    <td className="py-3 px-6">₹{book.sellingPrice !== undefined ? book.sellingPrice.toFixed(2) : 'N/A'}</td>
                    <td className="py-3 px-6">{book.category}</td>
                    <td className="py-3 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          book.inStock ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                        }`}
                      >
                        {book.inStock ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          book.showOnHome ? "bg-purple-200 text-purple-800" : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {book.showOnHome ? "Yes" : "No"}
                      </span>
                    </td>
                    {/* <td className="py-3 px-6 whitespace-normal max-w-xs">{book.description || 'N/A'}</td> */}
                    <td className="py-3 px-6">₹{book.deliveryFee !== undefined ? book.deliveryFee.toFixed(2) : 'N/A'}</td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(book._id)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(book._id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-xs"
                        >
                          Delete
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
    </div>
  );
}