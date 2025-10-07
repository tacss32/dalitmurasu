import React from "react";

interface Book {
  _id: string;
  name: string;
  author: string;
  actualPrice: number;
  sellingPrice: number;
  imageUrl: string;
  category: string;
}

interface CartItem {
  _id: string;
  userId: string;
  quantity: number;
  bookId: Book;
}

interface CartDisplayProps {
  cartItems: CartItem[];
  loadingCart: boolean;
  cartError: string | null;
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  isUpdatingCart: boolean;
}

const CartDisplay: React.FC<CartDisplayProps> = ({
  cartItems,
  loadingCart,
  cartError,
  onUpdateQuantity,
  onRemoveItem,
  isUpdatingCart,
}) => {
  const total = cartItems.reduce(
    (sum, item) => sum + item.bookId.sellingPrice * item.quantity,
    0
  );

  if (loadingCart) return <p className="text-center text-gray-600">Loading cart...</p>;
  if (cartError) return <p className="text-center text-red-600">{cartError}</p>;
  if (!cartItems.length)
    return <p className="text-center text-gray-600">Your cart is empty.</p>;

  return (
    <div className="space-y-6">
      {cartItems.map((item) => (
        <div
          key={item._id}
          className="flex flex-col sm:flex-row items-center bg-white/30 p-4 rounded-lg shadow-sm border"
        >
          <img
            src={item.bookId.imageUrl}
            alt={`Cropped image of ${item.bookId.name}`}
            onError={(e) =>
              (e.currentTarget.src = "https://placehold.co/100x100?text=No+Image")
            }
            className="w-24 h-24 object-cover rounded mb-2 sm:mb-0 sm:mr-4"
          />
          <div className="flex-grow text-center sm:text-left">
            <h3 className="text-lg font-semibold">{item.bookId.name}</h3>
            <p className="text-sm text-gray-600">by {item.bookId.author}</p>
            <p className="text-sm text-gray-600">Category: {item.bookId.category}</p>
            <p className="font-bold text-green-700 mt-1">
              ₹{(item.bookId.sellingPrice * item.quantity).toFixed(2)}
            </p>
          </div>
          <div className="flex items-center mt-2 sm:mt-0 sm:ml-auto">
            <button
              onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdatingCart}
              className="px-3 py-1 hover:bg-highlight-1/70 hover:text-white rounded-l border-highlight-1/70 border"
            >
              -
            </button>
            <span className="px-4 py-1 bg-highlight-1/60 border-highlight-1/70 border-y">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
              disabled={isUpdatingCart}
              className="px-3 py-1 hover:bg-highlight-1/70 hover:text-white rounded-r border-highlight-1/70 border"
            >
              +
            </button>
            <button
              onClick={() => onRemoveItem(item._id)}
              disabled={isUpdatingCart}
              className="ml-3 px-3 py-1 bg-highlight-1 hover:bg-red-600 text-white rounded"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {/* ✅ Checkout Section */}
      <div className="text-right pt-4 border-t border-gray-200">
        <p className="text-xl font-bold text-gray-800">
          Total: ₹{total.toFixed(2)}
        </p>
        
      </div>
    </div>
  );
};

export default CartDisplay;
