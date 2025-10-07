import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

// ----------------------------------------------------------------------
// NEW: Define the structure for the Pincode Data
interface PincodeLocation {
    city: string;
    state: string;
    country: string;
}
// ----------------------------------------------------------------------

// --- INTERFACE UPDATES ---
// The Book interface now includes the deliveryFee for each book
interface Book {
  _id: string;
  name: string;
  author: string;
  actualPrice: number;
  sellingPrice: number;
  imageUrl: string;
  category: string;
  deliveryFee: number; // NEW: Delivery fee specific to each book
}

interface BackendCartItem {
  _id: string;
  userId: string;
  bookId: Book; // Populated book object, which now has a deliveryFee
  quantity: number;
}

interface ItemInOrder {
  productId: string;
  title: string;
  quantity: number;
  price: number;
  deliveryFee: number; // NEW: Added deliveryFee for each item
}

// Razorpay-related global interface and key are no longer needed
// declare global {
//    interface Window {
//      Razorpay: any;
//    }
// }

// const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

const API = import.meta.env.VITE_API;

const CreateOrderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const passedCartItems = location.state?.cartItems as BackendCartItem[] | undefined;

  const [cartItems, setCartItems] = useState<ItemInOrder[]>([]);
  
  // NEW: State for storing the loaded Pincode Map
  const [pincodeMap, setPincodeMap] = useState<Record<string, PincodeLocation> | null>(null);

  // UPDATED: Use separate state for each address field
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  });
  // NEW: State for the total calculated delivery fee
  const [totalDeliveryFee, setTotalDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("clientToken");

  // Calculate subtotal and totalAmount based on dynamic deliveryFee
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // UPDATED: totalAmount now uses the new totalDeliveryFee state
  const totalAmount = subtotal + totalDeliveryFee;

  // NEW: Effect to load the Pincode Data once from the public directory
  useEffect(() => {
    const loadPincodeData = async () => {
        try {
            // Fetch the JSON file created from the CSV
            const response = await fetch('/pincodeData.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: Record<string, PincodeLocation> = await response.json();
            setPincodeMap(data);
            console.log("Pincode data loaded successfully.");
        } catch (err) {
            console.error("Failed to load pincode data (Autofill feature disabled):", err);
            // Non-critical error, the page can still function for manual entry
        }
    };
    loadPincodeData();
  }, []); // Run only once on mount


  useEffect(() => {
    if (!token || !userId) {
      console.warn("User not authenticated. Redirecting to login.");
      navigate("/login");
      return;
    }

    // Razorpay script loading is no longer needed
    // const loadRazorpayScript = () => {
    //    return new Promise((resolve) => {
    //      const script = document.createElement('script');
    //      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    //      script.onload = () => resolve(true);
    //      script.onerror = () => resolve(false);
    //      document.body.appendChild(script);
    //    });
    // };

    const fetchAndSetCartItems = async () => {
      setLoading(true);
      setError(null);
      try {
        let itemsToProcess: BackendCartItem[] = [];

        if (passedCartItems && passedCartItems.length > 0) {
          console.log("Using cart items from navigation state.");
          itemsToProcess = passedCartItems;
        } else {
          console.warn("No cart items in navigation state. Fetching from backend...");
          const response = await axios.get<BackendCartItem[]>(`${API}api/cart/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          itemsToProcess = response.data;
        }

        const formattedItems: ItemInOrder[] = itemsToProcess
          .filter(item => item.bookId !== null && typeof item.bookId === 'object')
          .map(item => ({
            productId: item.bookId._id,
            title: item.bookId.name,
            quantity: item.quantity,
            price: item.bookId.sellingPrice,
            // NEW: Add the book's individual delivery fee
            deliveryFee: item.bookId.deliveryFee,
          }));

        // Calculate the total delivery fee by summing up fees for all items
        const calculatedTotalDeliveryFee = formattedItems.reduce((sum, item) =>
          sum + (item.deliveryFee * item.quantity), 0
        );

        setCartItems(formattedItems);
        // NEW: Set the calculated total delivery fee
        setTotalDeliveryFee(calculatedTotalDeliveryFee);
        
      } catch (err) {
        console.error("Error fetching cart items for checkout:", err);
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError("Session expired or unauthorized. Please log in again.");
          localStorage.removeItem("clientToken");
          localStorage.removeItem("userId");
          navigate("/login");
        } else {
          setError("Failed to load cart items for checkout. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetCartItems();
    // loadRazorpayScript(); // No longer needed
  }, [userId, token, navigate, location.state, passedCartItems]);


  // NEW: Logic to handle pincode change and autofill
  const handlePincodeAutofill = (pincode: string) => {
    if (!pincodeMap) return;

    if (pincode.length === 6) {
      const locationData = pincodeMap[pincode];
      if (locationData) {
        console.log(`Pincode ${pincode} found. Autofilling address.`);
        setFormData(prevData => ({
          ...prevData,
          city: locationData.city,
          state: locationData.state,
          country: locationData.country,
        }));
        setError(null);
      } else {
        console.warn(`Pincode ${pincode} not found in database.`);
        // Optionally, clear the fields if the pincode is invalid/not found
        // setFormData(prevData => ({
        //   ...prevData,
        //   city: "",
        //   state: "",
        //   country: "",
        // }));
      }
    } else if (pincode.length < 6) {
        // Clear fields when pincode is partially entered or being deleted
        setFormData(prevData => ({
          ...prevData,
          city: "",
          state: "",
          country: "",
        }));
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "phone" || name === "pincode") {
      const cleanedValue = value.replace(/\D/g, '');

      if (name === "phone" && cleanedValue.length <= 10) {
        setFormData(prevData => ({ ...prevData, [name]: cleanedValue }));
      } else if (name === "pincode" && cleanedValue.length <= 6) {
        setFormData(prevData => ({ ...prevData, [name]: cleanedValue }));
        // ⭐ Trigger autofill logic on pincode change
        handlePincodeAutofill(cleanedValue);
      }
    } else {
      setFormData(prevData => ({ ...prevData, [name]: value }));
    }
  };

  const validateInputs = () => {
    // UPDATED: Validate all new address fields
    if (!formData.name.trim() || !formData.phone.trim() || !formData.addressLine1.trim() || !formData.city.trim() || !formData.state.trim() || !formData.pincode.trim() || !formData.country.trim()) {
      setError("Please fill in all required fields (Name, Phone, Address Line 1, City, State, Pincode, and Country).");
      return false;
    }
    if (formData.phone.trim().length !== 10) {
      setError("Phone number must be exactly 10 digits long.");
      return false;
    }
    if (formData.pincode.trim().length !== 6) {
      setError("Pincode must be exactly 6 digits long.");
      return false;
    }
    if (cartItems.length === 0) {
      setError("Your cart is empty. Please add items to proceed to checkout.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleOrderSuccess = async () => {
    try {
      await axios.delete(`${API}api/cart/clear/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Cart cleared after successful order.");
      setShowConfirmationPopup(true);
      setTimeout(() => {
        setShowConfirmationPopup(false);
        navigate("/");
      }, 3000);
    } catch (cartClearError) {
      console.error("Error clearing cart:", cartClearError);
      setShowConfirmationPopup(true);
      setTimeout(() => {
        setShowConfirmationPopup(false);
        navigate("/");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCOD = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
        items: cartItems,
        totalAmount,
        deliveryFee: totalDeliveryFee, // UPDATED: Use totalDeliveryFee
        paymentMode: "cod",
      };

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.post(`${API}api/orders`, payload, config);
      console.log("Order created successfully via Cash on Delivery.");
      handleOrderSuccess();
    } catch (err: any) {
      console.error("COD Order Error", err);
      setError(err.response?.data?.message || "Failed to place COD order. Please try again.");
      setLoading(false);
    }
  };

  if (loading || !pincodeMap) {
    // Add pincodeMap to loading state to wait for autofill data
    return <div className="max-w-2xl mx-auto p-4 text-center">Loading checkout and address data...</div>;
  }

  if (error) {
    return <div className="max-w-2xl mx-auto p-4 text-center text-red-600">Error: {error}</div>;
  }

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <p className="text-lg text-gray-700 mb-4">Your cart is empty. Please add items to proceed to checkout.</p>
        <button onClick={() => navigate('/cart')} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300">Go to Cart</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white/20 shadow-lg rounded-lg my-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-highlight-1">Checkout</h2>

      {/* UPDATED: Address Form Inputs */}
      <div className="mb-4">
        <label htmlFor="name" className="block  text-sm font-bold mb-2">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Enter your name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-3 border  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="phone" className="block  text-sm font-bold mb-2">Phone:</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          placeholder="Enter your 10-digit phone number"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-3 border  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={10}
          pattern="[0-9]{10}"
          title="Phone number must be exactly 10 digits"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="addressLine1" className="block  text-sm font-bold mb-2">Address Line 1:</label>
        <input
          type="text"
          id="addressLine1"
          name="addressLine1"
          placeholder="House No., Street Name"
          value={formData.addressLine1}
          onChange={handleChange}
          className="w-full p-3 border  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="addressLine2" className="block  text-sm font-bold mb-2">Address Line 2 (Optional):</label>
        <input
          type="text"
          id="addressLine2"
          name="addressLine2"
          placeholder="Apartment, Landmark, etc."
          value={formData.addressLine2}
          onChange={handleChange}
          className="w-full p-3 border  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        
        {/* 1. Pincode (Top Left) */}
        <div>
          <label htmlFor="pincode" className="block  text-sm font-bold mb-2">Pincode:</label>
          <input
            type="text"
            id="pincode"
            name="pincode"
            placeholder="Pincode"
            value={formData.pincode}
            onChange={handleChange}
            className="w-full p-3 border  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={6}
            required
          />
        </div>

        {/* 2. City (Top Right) */}
        <div>
          <label htmlFor="city" className="block  text-sm font-bold mb-2">City (District):</label>
          <input
            type="text"
            id="city"
            name="city"
            placeholder="City/District (Autofilled)"
            value={formData.city}
            onChange={handleChange}
            className="w-full p-3 border  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* 3. State (Bottom Left) */}
        <div>
          <label htmlFor="state" className="block  text-sm font-bold mb-2">State:</label>
          <input
            type="text"
            id="state"
            name="state"
            placeholder="State (Autofilled)"
            value={formData.state}
            onChange={handleChange}
            className="w-full p-3 border  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* 4. Country (Bottom Right) */}
        <div>
          <label htmlFor="country" className="block  text-sm font-bold mb-2">Country:</label>
          <input
            type="text"
            id="country"
            name="country"
            placeholder="Country (Autofilled)"
            value={formData.country}
            onChange={handleChange}
            className="w-full p-3 border  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="border  p-4 rounded-lg  mb-6 ">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Order Summary</h3>
        {cartItems.length > 0 ? (
          <ul className="space-y-2 mb-3">
            {cartItems.map((item, index) => (
              <li key={index} className="flex justify-between items-center text-gray-700 text-base">
                <span>{item.title} x {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No items in cart for summary.</p>
        )}
        <div className="border-t border-gray-200 pt-3 mt-3">
          <p className="flex justify-between font-medium text-gray-800 text-lg">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </p>
          <p className="flex justify-between font-medium text-gray-800 text-lg">
            <span>Delivery Fee:</span>
            <span>₹{totalDeliveryFee.toFixed(2)}</span> {/* UPDATED: Display dynamic total delivery fee */}
          </p>
          <p className="flex justify-between font-bold text-2xl text-gray-900 mt-2">
            <span>Total Amount:</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleCOD}
          disabled={loading}
          className="flex-1 bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {loading ? 'Processing Order...' : 'Place Order (Cash on Delivery)'}
        </button>
      </div>

      {/* Order Confirmation Popup */}
      {showConfirmationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h3 className="text-2xl font-bold text-green-700 mb-4">Order Confirmed!</h3>
            <p className="text-gray-700">Thank you for your purchase. Order Received - We Will Contact You</p>
            <p className="text-gray-500 text-sm mt-2">Redirecting to home page...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrderPage;