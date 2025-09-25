import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Interface for a Book fetched from the API
interface Book {
  _id: string;
  name: string;
  author: string;
  actualPrice: number;
  sellingPrice: number;
  imageUrl: string;
  category: string;
  description: string;
}

// Base URL for your backend API
const API_BASE_URL = import.meta.env.VITE_API;

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [addingToCartStates, setAddingToCartStates] = useState<
    Map<string, boolean>
  >(new Map());

  // NEW: State for the description popup
  const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // 👇 NEW: State for temporary notifications
  const [notification, setNotification] = useState<{
    message: string;
    visible: boolean;
  }>({
    message: "",
    visible: false,
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.warn("User not logged in. Add to cart functionality will be limited.");
    }
  }, []);

  useEffect(() => {
    axios
      .get<Book[]>(`${API_BASE_URL}api/books`)
      .then((res) => setBooks(res.data))
      .catch((err) => console.error("Failed to fetch books:", err))
      .finally(() => setLoadingBooks(false));
  }, []);

  const addToCart = async (bookToAdd: Book) => {
    if (!userId) {
      alert("Please log in to add items to the cart.");
      navigate("/login");
      return;
    }

    setAddingToCartStates((prev) => new Map(prev).set(bookToAdd._id, true));

    try {
      const response = await axios.post(`${API_BASE_URL}api/cart/add`, {
        userId: userId,
        bookId: bookToAdd._id,
        quantity: 1,
      });
      console.log("Add to cart response:", response.data);

      // 👇 NEW: Display a temporary success notification
      setNotification({
        message: `${bookToAdd.name} added to cart!`,
        visible: true,
      });
      setTimeout(() => {
        setNotification({ message: "", visible: false });
      }, 3000); // Hide after 3 seconds
    } catch (err: any) {
      console.error("Failed to add to cart:", err);
      // 👇 NEW: Display a temporary error notification
      setNotification({
        message: err.response?.data?.error || "Failed to add item to cart.",
        visible: true,
      });
      setTimeout(() => {
        setNotification({ message: "", visible: false });
      }, 3000);
    } finally {
      setAddingToCartStates((prev) => {
        const newState = new Map(prev);
        newState.delete(bookToAdd._id);
        return newState;
      });
    }
  };

  // NEW: Handler to show the description popup
  const handleShowDescription = (book: Book) => {
    setSelectedBook(book);
    setShowDescriptionPopup(true);
  };

  // NEW: Handler to close the popup
  const handleClosePopup = () => {
    setShowDescriptionPopup(false);
    setSelectedBook(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans">
      {/* 👇 NEW: Temporary Notification Component */}
      {notification.visible && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-highlight-1 text-white font-bold py-3 px-6 rounded-lg shadow-xl z-50 transition-opacity duration-500 ease-in-out">
          {notification.message}
        </div>
      )}

      <h1 className="text-4xl font-extrabold mb-8 text-gray-800 text-center">
        Our Books Collection
      </h1>

      {loadingBooks ? (
        <p className="text-center text-lg text-gray-600">Loading books...</p>
      ) : books.length === 0 ? (
        <p className="text-center text-lg text-gray-600">
          No books available at the moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {books.map((book) => (
            <div
              key={book._id}
              className="border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col cursor-pointer"
              onClick={() => handleShowDescription(book)}
            >
              <div className="flex-grow flex flex-col">
                <img
                  src={book.imageUrl}
                  alt={book.name}
                  className="w-auto h-auto object-contain mb-5 rounded-lg border border-gray-100"
                  onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/400x300/E0E0E0/333333?text=No+Image`;
                  }}
                />
                <h2 className="text-sm md:text-lg font-bold text-gray-900 mb-2">
                  {book.name}
                </h2>
              <p className="text-xs sm:text-sm md:text-sm mb-1 text-gray-600 ">
                  by {book.author}
                </p>
                {/* <p className="text-gray-600 text-sm mb-3">Category: {book.category}</p> */}
              </div>

              {/* THIS IS THE MOVED CODE BLOCK */}
              <div className="flex items-baseline mb-4">
                <span className="text-red-500 line-through text-sm lg:text-lg mr-2">
                  ₹{book.actualPrice.toFixed(2)}
                </span>
                <span className="text-green-700 font-extrabold  text-sm lg:text-lg mr-2">
                  ₹{book.sellingPrice.toFixed(2)}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(book);
                }}
                className="bg-red-600 hover:bg-black text-white font-bold py-2 px-3 md:py-2 md:px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 mt-auto md:w-60"
                disabled={addingToCartStates.has(book._id)}
              >
                {addingToCartStates.has(book._id) ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* NEW: Description Popup Modal */}
      {showDescriptionPopup && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
          <div className="bg-background-to rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col relative">

            {/* The close button container. It is absolutely positioned */}
            <div className="flex justify-end sticky top-0 bg-background-to z-20">
              <button
                onClick={handleClosePopup}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* The main content area that will scroll */}
            <div className="flex-grow flex flex-col md:flex-row gap-8 overflow-y-auto">
              {/* Left column for the image */}
              <div className="w-full md:w-1/2 flex justify-center items-start p-4 rounded-lg">
                <img
                  src={selectedBook.imageUrl}
                  alt={selectedBook.name}
                  className="max-h-96 w-auto object-contain rounded-lg shadow-md"
                  onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/400x600/E0E0E0/333333?text=No+Image`;
                  }}
                />
              </div>
              {/* Right column for text content */}
              <div className="w-full md:w-1/2 flex flex-col">
                <h2 className="text-3xl md:text-3xl font-bold text-gray-900 mb-2">
                  {selectedBook.name}
                </h2>
                <p className="text-gray-600 mb-4 text-sm md:text-base">
                  by{" "}
                  <span className="font-semibold">{selectedBook.author}</span>
                </p>
                <div className="flex items-baseline mb-4">
                  <span className="text-red-500 line-through text-base md:text-lg mr-2">
                    ₹{selectedBook.actualPrice.toFixed(2)}
                  </span>
                  <span className="text-green-700 font-extrabold text-xl md:text-2xl">
                    ₹{selectedBook.sellingPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex-grow pr-2 mb-4">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedBook.description}
                  </p>
                </div>
                <button
                  onClick={() => {
                    addToCart(selectedBook);
                    handleClosePopup();
                  }}
                  className="w-full bg-red-600 hover:bg-black text-white font-bold py-3 px-6 mt-auto rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                  disabled={addingToCartStates.has(selectedBook._id)}
                >
                  {addingToCartStates.has(selectedBook._id)
                    ? "Adding..."
                    : "Add to Cart"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}