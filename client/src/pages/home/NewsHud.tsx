import NewsLetter from "../../components/NewsLetter";
import { useEffect, useState } from "react";
import Card from "../../components/Card";
import MainBanner from "../../components/MainBanner";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import aboutImage from "/about.png";

// Interface for a News Post, updated to include a 'source' field
type PostType = {
  _id: string;
  title: string;
  subtitle: string;
  content?: string;
  images?: [string];
  createdAt: string;
  date: string;
  author: string;
  category: string;
  source?: string;
};

// Interface for a Book fetched from the home endpoint
interface BookType {
  _id: string;
  name: string;
  author: string;
  imageUrl: string;
  actualPrice: number;
  sellingPrice: number;
  category: string;
  description: string;
}
// Removed from here
// const translatedCategory = categoryTranslations[post.category] || post.category;

export default function NewsHud() {
  const [pinnedPosts, setPinnedPosts] = useState<PostType[]>([]);
  const [universalPosts, setUniversalPosts] = useState<PostType[]>([]);
  const [homeBooks, setHomeBooks] = useState<BookType[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);

  const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);

  const [addingToCartStates, setAddingToCartStates] = useState<
    Map<string, boolean>
  >(new Map());

  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API;

  const categoryTranslations: { [key: string]: string } = {
    'Premium Articles': 'முதன்மைக் கட்டுரைகள்',
    'Other Articles': 'பிற கட்டுரைகள்',
    'Interviews': 'பேட்டிகள்',
    'Periyar speaks': 'பெரியார் பேசுகிறார்',
    'New': 'புத்துயிர்',
    'Dalit Network': 'தலித் பின்னகம்',
    'Babasaheb speaks':'பாபாசாகேப் பேசுகிறார்',
    'Guidance':'வழிகாட்டல்',
    'Book Review': 'நூல் திறனாய்வு',
    'Series': 'தொடர்',
    'Editorial': 'தலையங்கம்'
    // Add more translations as needed
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.warn(
        "User not logged in. Add to cart functionality will require login."
      );
    }
  }, []);

  const fetchHomeData = async () => {
    setLoadingPosts(true);
    try {
      const [pinnedRes, universalRes] = await Promise.all([
        axios.get<PostType[]>(`${API_BASE_URL}api/combined-posts/pinned`),
        axios.get<PostType[]>(`${API_BASE_URL}api/universal-posts/home`),
        axios.get<PostType[]>(`${API_BASE_URL}api/premium-posts/home`),
      ]);

      const limitedPinnedPosts = pinnedRes.data.slice(0, 3);
      setPinnedPosts(limitedPinnedPosts);

      const pinnedIds = new Set(limitedPinnedPosts.map((post) => post._id));
      const filteredUniversalPosts = universalRes.data.filter(
        (post) => !pinnedIds.has(post._id)
      );

      setUniversalPosts(filteredUniversalPosts);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoadingPosts(false);
    }

    setLoadingBooks(true);
    try {
      const booksRes = await axios.get<BookType[]>(
        `${API_BASE_URL}api/books/home`
      );
      setHomeBooks(booksRes.data);
    } catch (err) {
      console.error("Failed to fetch featured books:", err);
    } finally {
      setLoadingBooks(false);
    }
  };
  const fetchCategories = async () => {
    try {
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchHomeData();
    fetchCategories();
  }, []);

  const addToCart = async (bookToAdd: BookType) => {
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
      alert(`${bookToAdd.name} added to cart!`);
    } catch (err: any) {
      console.error("Failed to add to cart:", err);
      alert(err.response?.data?.error || "Failed to add item to cart.");
    } finally {
      setAddingToCartStates((prev) => {
        const newState = new Map(prev);
        newState.delete(bookToAdd._id);
        return newState;
      });
    }
  };

  const handleShowDescription = (book: BookType) => {
    setSelectedBook(book);
    setShowDescriptionPopup(true);
  };

  const handleClosePopup = () => {
    setShowDescriptionPopup(false);
    setSelectedBook(null);
  };

  const combinedPosts = [
    ...pinnedPosts,
    ...universalPosts.slice(0, 15 - pinnedPosts.length),
  ];

  const postsToShow = combinedPosts.slice(0, 15);

  const firstSectionPosts = postsToShow.slice(0, 6);
  console.log(firstSectionPosts)
  const remainingSectionPosts = postsToShow.slice(6);

  return (
    <div className="flex flex-col items-center gap-5">
      <MainBanner />

      <div className="container flex flex-col gap-5">
        <NewsLetter />

        {/* Section 1: Top 6 posts */}
        {loadingPosts ? (
          <div className="flex justify-center items-center min-h-screen text-highlight-1">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-highlight-2"></div>
          </div>
        ) : firstSectionPosts.length > 0 && (
          <>
            <h2 className="text-3xl font-bold mb-4 text-gray-800 text-center"></h2>
            {/* Desktop/Tablet view */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 w-full mx-auto gap-10">
              {firstSectionPosts.map((post) => (
                <Card
                  key={post._id}
                  title={post.title}
                  subtitle={post.subtitle}
                  image={post?.images?.[0]}
                  date={post.date || post.createdAt}
                  author={post.author}
                  id={post._id}
                  category={post.category}
                  source={
                    post.source === "UniversalPost"
                      ? "universal"
                      : post.source === "PremiumPost"
                      ? "premium-articles"
                      : "posts"
                  }

                />
              ))}
            </div>
            {/* Mobile/Tablet List view */}
           <div className=" md:hidden flex flex-col gap-3">
  {firstSectionPosts.map((post) => (
    <Link 
      key={post._id}
      to={`/${post.source === "UniversalPost"
        ? "universal"
        : post.source === "PremiumPost"
        ? "premium-articles"
        : "posts"}/${post._id}`}
    >
      <div className="w-full flex flex-col gap-2 justify-between bg-white/80 hover:bg-white/50 duration-150 transition-colors ease-in-out p-2 rounded shadow-lg">
        <h2 className="text-xl font-bold">
          {post.title}
        </h2>
        <p className="text-sm text-gray-500">
          {new Date(post.date || post.createdAt).toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-500">
          {categoryTranslations[post.category] || post.category}
        </p>
      </div>
    </Link>
  ))}
</div>
          </>
        )}
      
        {/* About Us section */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <center>
            <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">
              About us
            </h2>
          </center>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-full md:w-1/2">
              <img
                src={aboutImage}
                alt="About"
                className="rounded-lg shadow-lg w-full object-cover"
              />
            </div>
            <div className="w-full md:w-2/2 text-justify">
              <p className="text-gray-700 font-semibold leading-relaxed mb-6">
                சாதிக்கு எதிரான உரையாடல்கள் வெகு மக்கள் படிக்கும் வணிக ஏடுகளில்
                இடம் பெறாததால் அத்தகைய உரையாடல்களை நிகழ்த்துகின்றவர்களுக்கு -
                சாதி சார்பற்ற, கட்சி மற்றும் அமைப்பு சார்பற்ற ஓர் இதழைத் தொடங்க
                வேண்டும் என்ற விழைவின் உந்துதலால் உருவாக்கப்பட்டதே ‘தலித் முரசு’
                (பிப்ரவரி 13,1997) இதழ். <br /> <br />
                டாக்டர் அம்பேத்கர், பெரியார் கொள்கைகள் குறித்து தனித்தனியாக
                விவாதிக்கப்பட்டு வந்த காலகட்டத்தில், அவ்விரு சிந்தனைகளையும்
                இணைத்து விவாதிக்க வேண்டும் என்கிற முதல் முயற்சியை ‘தலித் முரசு’
                முன்னெடுத்தது. அம்முயற்சிக்கு எதிரான கண்டனங்களையும்
                அவதூறுகளையும் எருவாக்கி, இன்று 28 ஆம் ஆண்டில் ‘தலித் முரசு’ இணைய
                இதழாகப் பரிணாமம் பெற்றிருக்கிறது.
              </p>
              <center>
                {" "}
                <button
                  onClick={() => navigate("/about")}
                  className="bg-red-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                >
                  Read More
                </button>{" "}
              </center>
            </div>
          </div>
        </div>

        {/* Section 3: Featured Books */}
        <h2 className="text-3xl font-bold mt-10 mb-4 text-gray-800 text-center">
          Our Book Collection
        </h2>
        {loadingBooks ? (
          <div className="flex justify-center items-center min-h-screen text-highlight-1">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-highlight-2"></div>
          </div>
        ) : homeBooks.length === 0 ? (
          <p className="text-center text-lg text-gray-600">
            No featured books available at the moment.
          </p>
        ) : (
          <div className="flex overflow-x-auto lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 no-scrollbar">
            {homeBooks.slice(0, 4).map((book) => (
              <div
                key={book._id}
                className="w-64 md:w-full flex-shrink-0 border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col cursor-pointer"
                onClick={() => handleShowDescription(book)}
              >
                <img
                  src={book.imageUrl}
                  alt={book.name}
                  className="w-full h-auto object-contain mb-5 rounded-lg border border-gray-100"
                  onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/400x300/E0E0E0/333333?text=No+Image`;
                  }}
                />
                <h2 className="text-2xl font-bold text-gray-900 mb-2 truncate">
                  {book.name}
                </h2>
                <div className="flex items-baseline mb-4">
                  <span className="text-red-500 line-through text-lg mr-2">
                    ₹{book.actualPrice.toFixed(2)}
                  </span>
                  <span className="text-green-700 font-extrabold text-xl">
                    ₹{book.sellingPrice.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(book);
                  }}
                  className="w-full bg-red-600 hover:bg-black text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                  disabled={addingToCartStates.has(book._id)}
                >
                  {addingToCartStates.has(book._id) ? "Adding..." : "Add to Cart"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Section 4: Remaining Universal Posts */}
        <h2 className="text-3xl font-bold mb-4 text-gray-800 text-center"></h2>
        {loadingPosts ? (
          <div className="flex justify-center items-center min-h-screen text-highlight-1">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-highlight-2"></div>
          </div>
        ) : remainingSectionPosts.length === 0 ? (
          <p className="text-center text-lg text-gray-600">
            No more news available at the moment.
          </p>
        ) : (
          <>
            {/* Desktop/Tablet view */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 w-full mx-auto gap-10">
              {remainingSectionPosts.map((post) => (
                <Card
                  key={post._id}
                  title={post.title}
                  image={post?.images?.[0]}
                  date={post.createdAt}
                  author={post.author}
                  subtitle={post.subtitle}
                  id={post._id}
                  category={post.category}
                />
              ))}
            </div>
            {/* Mobile/Tablet List view */}
            <div className="block md:hidden  flex-col gap-3">
              {remainingSectionPosts.map((post) => (
                <Link to={`/posts/${post._id}`} key={post._id}>
                  <div className="w-full flex flex-col gap-2 justify-between bg-white/80 hover:bg-white/50 duration-150 transition-colors ease-in-out p-2 rounded shadow-lg">
                    <h2 className="text-xl font-bold">
                      {post.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {new Date(post.date || post.createdAt).toLocaleDateString()}
                    </p>
<p className="text-sm text-gray-500">
          {categoryTranslations[post.category] || post.category}
        </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Description Popup Modal */}
      {showDescriptionPopup && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
          <div className="bg-background-to rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end items-center mb-4">
              <button
                onClick={handleClosePopup}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2 flex justify-center items-start p-4  rounded-lg">
                <img
                  src={selectedBook.imageUrl}
                  alt={selectedBook.name}
                  className="max-h-96 w-auto object-contain rounded-lg shadow-md"
                  onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/400x600/E0E0E0/333333?text=No+Image`;
                  }}
                />
              </div>
              <div className="w-full md:w-1/2 flex flex-col">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedBook.name}
                </h2>
                <p className="text-gray-600 mb-4">
                  by{" "}
                  <span className="font-semibold">{selectedBook.author}</span>
                </p>
                <div className="flex items-baseline mb-4">
                  <span className="text-red-500 line-through text-lg mr-2">
                    ₹{selectedBook.actualPrice.toFixed(2)}
                  </span>
                  <span className="text-green-700 font-extrabold text-2xl">
                    ₹{selectedBook.sellingPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 mb-4">
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