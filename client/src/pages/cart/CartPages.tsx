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
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const isAuthenticated = () => {
    return (
      localStorage.getItem("clientToken") !== null &&
      localStorage.getItem("userId") !== null
    );
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.warn("No userId found in localStorage. Redirecting to login.");
      navigate("/login");
    }
  }, [navigate]);

  const fetchCart = async () => {
    if (!userId) {
      setLoadingCart(false);
      return;
    }

    setLoadingCart(true);
    setCartError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}api/cart/${userId}`);
      const rawItems: RawCartItem[] = response.data;

      const validItems: CleanCartItem[] = rawItems.filter(
        (item): item is CleanCartItem =>
          item.bookId !== null && typeof item.bookId === "object"
      );

      setCartItems(validItems);
    } catch (err) {
      console.error("❌ Error fetching cart:", err);
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

  useEffect(() => {
    if (userId) {
      fetchCart();
    }
  }, [userId]);

  const updateCartItemQuantity = async (
    cartItemId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }

    if (!userId) {
      setCartError("User not logged in. Cannot update cart.");
      return;
    }

    setIsUpdatingCart(true);
    try {
      await axios.put(`${API_BASE_URL}api/cart/update/${cartItemId}`, {
        quantity: newQuantity,
      });
      await fetchCart();
    } catch (err: any) {
      console.error("❌ Error updating item:", err);
      setCartError(err.response?.data?.error || "Failed to update item.");
    } finally {
      setIsUpdatingCart(false);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!userId) {
      setCartError("User not logged in. Cannot remove item from cart.");
      return;
    }

    setIsUpdatingCart(true);
    try {
      await axios.delete(`${API_BASE_URL}api/cart/remove/${cartItemId}`);
      await fetchCart();
    } catch (err: any) {
      console.error("❌ Error removing item:", err);
      setCartError(err.response?.data?.error || "Failed to remove item.");
    } finally {
      setIsUpdatingCart(false);
    }
  };

  // ✅ Updated checkout handler with phone check
  const handleProceedToCheckout = async () => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("clientToken");
      const profileRes = await axios.get(`${API_BASE_URL}api/client-users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = profileRes.data?.data;

      if (!profile?.phone || profile.phone.trim() === "") {
        setModalMessage(
          "Please update your profile with a valid phone number before proceeding to checkout."
        );
        setIsModalOpen(true);
        return;
      }

      navigate("/checkout", { state: { cartItems: cartItems } });
    } catch (error) {
      console.error("❌ Error checking profile:", error);
      setModalMessage("Error fetching your profile. Please try again later.");
      setIsModalOpen(true);
    }
  };

  // ✅ Modal Component with “Go to Profile” button
  const Modal = ({ message }: { message: string }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border-t-4 border-highlight-1">
        <p className="text-lg text-gray-800 mb-6 text-center font-medium">
          {message}
        </p>
        <div className="flex justify-center space-x-4">
          {message.toLowerCase().includes("profile") ? (
            <button
              onClick={() => {
                setIsModalOpen(false);
                navigate("/profile");
              }}
              className="px-6 py-2 rounded-lg text-white font-semibold transition bg-highlight-1 hover:opacity-90"
            >
              Go to Profile
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 rounded-lg text-white font-semibold transition bg-highlight-1 hover:opacity-90"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans">
      <h1 className="text-4xl font-extrabold mb-8 text-highlight-1 text-center">
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

      {cartItems.length > 0 && !loadingCart && !cartError && (
        <div className="flex justify-end mt-8">
          <button
            onClick={handleProceedToCheckout}
            className="mt-4 bg-highlight-1 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
            disabled={isUpdatingCart}
          >
            Proceed to Checkout
          </button>
        </div>
      )}

      {isModalOpen && <Modal message={modalMessage} />}
    </div>
  );
}
