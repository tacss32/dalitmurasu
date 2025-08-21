import { useEffect, useState } from "react";
import axios from "axios";
import CartDisplay from "../../pages/books/CartDisplay";
import { useNavigate } from "react-router-dom";

// Interface for Book
interface Book {
  _id: string;
  name: string;
  author: string;
  actualPrice: number;
  sellingPrice: number;
  imageUrl: string;
  category: string;
}

// Raw item from API can have null or ID string in bookId
interface RawCartItem {
  _id: string;
  userId: string;
  bookId: Book | string | null;
  quantity: number;
}

interface CleanCartItem {
  _id: string;
  userId: string;
  quantity: number;
  bookId: Book;
}

const API_BASE_URL = import.meta.env.VITE_API;

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CleanCartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const navigate = useNavigate();

  // State to hold the dynamic userId
  const [userId, setUserId] = useState<string | null>(null); // Initialize as null

  // Function to check if the user is authenticated (still relevant for checkout redirect)
  const isAuthenticated = () => {
    return localStorage.getItem("clientToken") !== null && localStorage.getItem("userId") !== null;
  };

  // Effect to get userId from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // If no userId in localStorage, it means the user is not logged in or session expired.
      // Redirect to login page or show a message.
      console.warn("No userId found in localStorage. Redirecting to login.");
      navigate("/login"); // Assuming your login route is "/login"
    }
  }, [navigate]); // Add navigate to dependency array

  const fetchCart = async () => {
    // Only proceed if userId is available
    if (!userId) {
      setLoadingCart(false); // Ensure loading state is false if we can't fetch
      return;
    }

    setLoadingCart(true);
    setCartError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}api/cart/${userId}`);
      const rawItems: RawCartItem[] = response.data;

      console.log("📦 Raw cart items:", rawItems);

      const validItems: CleanCartItem[] = rawItems.filter(
        (item): item is CleanCartItem =>
          item.bookId !== null && typeof item.bookId === "object"
      );

      console.log("✅ Valid cart items being set:", validItems);

      setCartItems(validItems);
    } catch (err) {
      console.error("❌ Error fetching cart:", err);
      // More specific error handling for 401 if backend changes to require token
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setCartError("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("clientToken");
        localStorage.removeItem("userId");
        navigate("/login");
      } else {
        setCartError("Failed to load cart. Please try again.");
      }
    } finally {
      setLoadingCart(false);
    }
  };

  // Effect to fetch cart whenever userId changes (after it's set from localStorage)
  useEffect(() => {
    if (userId) { // Only fetch if userId is not null
      fetchCart();
    }
  }, [userId]); // Dependency on userId

  const updateCartItemQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }

    // Ensure userId exists before attempting update
    if (!userId) {
      setCartError("User not logged in. Cannot update cart.");
      return;
    }

    setIsUpdatingCart(true);
    try {
      await axios.put(`${API_BASE_URL}api/cart/update/${cartItemId}`, {
        quantity: newQuantity,
      });
      await fetchCart(); // Re-fetch to get updated cart
    } catch (err: any) {
      console.error("❌ Error updating item:", err);
      setCartError(err.response?.data?.error || "Failed to update item.");
    } finally {
      setIsUpdatingCart(false);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    // Ensure userId exists before attempting removal
    if (!userId) {
      setCartError("User not logged in. Cannot remove item from cart.");
      return;
    }

    setIsUpdatingCart(true);
    try {
      await axios.delete(`${API_BASE_URL}api/cart/remove/${cartItemId}`);
      await fetchCart(); // Re-fetch to get updated cart
    } catch (err: any) {
      console.error("❌ Error removing item:", err);
      setCartError(err.response?.data?.error || "Failed to remove item.");
    } finally {
      setIsUpdatingCart(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (isAuthenticated()) {
      navigate("/checkout", { state: { cartItems: cartItems } });
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-800 text-center">
        Your Shopping Cart
      </h1>
      <CartDisplay
        cartItems={cartItems}
        loadingCart={loadingCart}
        cartError={cartError}
        onUpdateQuantity={updateCartItemQuantity}
        onRemoveItem={removeFromCart}
        isUpdatingCart={isUpdatingCart}
      />

      "Proceed to Checkout" button
      {cartItems.length > 0 && !loadingCart && !cartError && (
        <div className="flex justify-end mt-8">
          <button
            onClick={handleProceedToCheckout}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
            disabled={isUpdatingCart}
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}