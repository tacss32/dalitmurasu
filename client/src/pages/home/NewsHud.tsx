
import NewsLetter from "../../components/NewsLetter";
import { useEffect, useState } from "react";
import Card from "../../components/Card";
import MainBanner from "../../components/MainBanner";
import axios from "axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import aboutImage from "/about.webp";

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
  const [searchParams] = useSearchParams();

  const API_BASE_URL = import.meta.env.VITE_API;

  const categoryTranslations: { [key: string]: string } = {
    'Premium Articles': 'முதன்மைக் கட்டுரைகள்',
    'Other Articles': 'பிற கட்டுரைகள்',
    'Interviews': 'பேட்டிகள்',
    'Periyar speaks': 'பெரியார் பேசுகிறார்',
    'New': 'புத்துயிர்',
    'Dalit Network': 'தலித் பின்னகம்',
    'Babasaheb speaks': 'பாபாசாகேப் பேசுகிறார்',
    'Guidance': 'வழிகாட்டல்',
    'Book Review': 'நூல் திறனாய்வு',
    'Series': 'தொடர்',
    'Editorial': 'தலையங்கம்'
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
  // NEW: This useEffect handles opening the popup if a bookId is in the URL
  useEffect(() => {
    const bookIdFromUrl = searchParams.get("bookId");
    // Only proceed if books are loaded and a bookId is present
    if (bookIdFromUrl && homeBooks.length > 0) {
      const bookToOpen = homeBooks.find((book) => book._id === bookIdFromUrl);
      if (bookToOpen) {
        handleShowDescription(bookToOpen);
      }
    }
  }, [homeBooks, searchParams]);

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
  // UPDATED: handleShare now generates a URL with the book's ID
  const handleShare = async () => {
    if (!selectedBook) return;

    // Create a URL with the book's ID as a search parameter
    const shareUrl = `${window.location.origin}${window.location.pathname}?bookId=${selectedBook._id}`;

    const shareData = {
      title: selectedBook.name,
      text: `Check out this book: "${selectedBook.name}" by ${selectedBook.author}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log("Shared successfully");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: Copy the link to the clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert("Link copied to clipboard!");
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
    // Remove the 'bookId' query parameter from the URL
    navigate(window.location.pathname, { replace: true });
  };

  const combinedPosts = [
    ...pinnedPosts,
    ...universalPosts.slice(0, 15 - pinnedPosts.length),
  ];

  const postsToShow = combinedPosts.slice(0, 15);

  const firstSectionPosts = postsToShow.slice(0, 6);
  // console.log(firstSectionPosts)
  const remainingSectionPosts = postsToShow.slice(6);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-full min-h-[150px] md:min-h-[300px]"> <MainBanner /> </div>

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
            {/* Desktop view */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-3 w-full mx-auto gap-10">
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
            <div className="lg:hidden flex flex-col gap-3">
              {firstSectionPosts.map((post) => (
                <Link
                  key={post._id}
                  to={`/${post.source === "UniversalPost"
                    ? "posts"
                    : post.source === "PremiumPost"
                      ? "premium-articles"
                      : "posts"}/${post._id}`}
                >
                  <div className="w-full flex gap-4 p-2 rounded shadow-lg bg-background-to hover:bg-white/50 duration-150 transition-colors ease-in-out">
                    {/* Image Section */}
                    {post?.images?.[0] && (
                      <div className="flex-shrink-0 w-24 h-24">
                        <img
                          src={post.images[0]}
                          alt={post.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    {/* Text Section */}
                    <div className="flex flex-col justify-center">
                      <h2 className="text-lg font-bold">
                        {post.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {new Date(post.date || post.createdAt).toLocaleDateString()}  {categoryTranslations[post.category] || post.category}
                      </p>
                      <p className="text-sm text-gray-500">

                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* About Us section */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <style>
            {`
          @media (max-width: 767px) {
    .word-spacing-mobile {
        word-spacing: -0.2em;
    }
}
        `}
          </style>
          <center>
            <h2 className="text-3xl font-bold mb-10 text-center text-highlight-1">
              About us
            </h2>
          </center>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-full md:w-1/2">
              <img
                src={aboutImage}
                alt="About"
                className=" w-full object-cover min-h-[250px] md:min-h-[350px]"
              />
            </div>
            <div className="w-full md:w-2/2 text-justify">
              <p className="text-gray-700 font-semibold leading-relaxed mb-4 word-spacing-mobile" >
                சாதிக்கு எதிரான உரையாடல்கள் வெகு மக்கள் படிக்கும் வணிக ஏடுகளில் இடம் பெறாததால் அத்தகைய உரையாடல்களை நிகழ்த்துகின்றவர்களுக்கு - சாதி சார்பற்ற, கட்சி மற்றும் அமைப்பு சார்பற்ற ஓர் இதழைத் தொடங்க வேண்டும் என்ற விழைவின் உந்துதலால் உருவாக்கப்பட்டதே ‘தலித் முரசு’ (பிப்ரவரி 13,1997) இதழ்.
              </p>
              <p className="text-gray-700 font-semibold leading-relaxed mb-4 ">
                டாக்டர் அம்பேத்கர், பெரியார் கொள்கைகள் குறித்து தனித்தனியாக விவாதிக்கப்பட்டு வந்த காலகட்டத்தில், அவ்விரு சிந்தனைகளையும் இணைத்து விவாதிக்க வேண்டும் என்கிற முதல் முயற்சியை ‘தலித் முரசு’ முன்னெடுத்தது. அம்முயற்சிக்கு எதிரான கண்டனங்களையும் அவதூறுகளையும் எருவாக்கி, இன்று 28 ஆம் ஆண்டில் ‘தலித் முரசு’ இணைய இதழாகப் பரிணாமம் பெற்றிருக்கிறது.
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
        <h2 className="text-3xl font-bold mt-10 mb-4 text-highlight-1 text-center">
          Our Book Collection
        </h2>
        {loadingBooks ? (
          <div className="flex justify-center items-center min-h-screen text-highlight-1">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-highlight-2 "></div>
          </div>
        ) : homeBooks.length === 0 ? (
          <p className="text-center text-lg text-gray-600">
            No featured books available at the moment.
          </p>
        ) : (
          <div className="flex overflow-x-auto xl:grid xl:grid-cols-4 gap-4 md:gap-8 no-scrollbar ">
            {homeBooks.slice(0, 4).map((book) => (
              <div
                key={book._id}
                // Card width: w-40 (mobile), sm:w-40 (small), md:w-48 (tablet scroller), xl:w-full (desktop grid)
                className="w-40 sm:w-40 md:w-48 xl:w-full flex-shrink-0 border border-gray-200 rounded-xl p-3  shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col cursor-pointer mb-4 "
                onClick={() => handleShowDescription(book)}
              >
                
                  <div >
                    <img
                      src={book.imageUrl}
                      alt={book.name}
                      // Use w-full and h-full to fill the container
                    className="w-full h-full object-contain rounded-lg "
                      onError={(e) => {
                        e.currentTarget.src = `https://placehold.co/400x300/E0E0E0/333333?text=No+Image`;
                      }}
                    />
                  </div>
                  {/* Title: text-sm for mobile/tablet, xl:text-lg for desktop */}
                  <h2 className="text-sm xl:text-lg font-bold text-gray-900 my-2">
                    {book.name}
                  </h2>
    
              
                <div className="flex items-baseline mb-2">
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
                  // Button size: py-2 px-3 for mobile/tablet, xl:py-2 xl:px-6 for desktop
                  className="bg-red-600 hover:bg-black text-white font-bold py-2 px-3 xl:py-2 xl:px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 mt-auto w-7-"
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
            {/* Desktop view */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-3 w-full mx-auto gap-10">
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
            <div className="lg:hidden flex flex-col gap-3">
              {remainingSectionPosts.map((post) => (
                <Link to={`/posts/${post._id}`} key={post._id}>
                  <div className="w-full flex gap-4 p-2 rounded shadow-lg bg-background-to hover:bg-white/50 duration-150 transition-colors ease-in-out">
                    {/* Image Section */}
                    {post?.images?.[0] && (
                      <div className="flex-shrink-0 w-24 h-24">
                        <img
                          src={post.images[0]}
                          alt={post.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}

                    {/* Text Section */}
                    <div className="flex flex-col justify-center">
                      <h2 className="text-lg font-bold">
                        {post.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {new Date(post.date || post.createdAt).toLocaleDateString()} {categoryTranslations[post.category] || post.category}
                      </p>
                      <p className="text-sm text-gray-500">

                      </p>
                    </div>
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
                {/* ACTION BUTTONS (Share + Add to Cart) */}
                <div className="mt-auto flex flex-col md:flex-row gap-3">


                  <button
                    onClick={() => {
                      addToCart(selectedBook);
                      handleClosePopup();
                    }}
                    className="w-full md:w-auto bg-highlight-1 hover:bg-highlight-1/80 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                    disabled={addingToCartStates.has(selectedBook._id)}
                  >
                    {addingToCartStates.has(selectedBook._id)
                      ? "Adding..."
                      : "Add to Cart"}
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full md:w-auto bg-highlight-1 hover:bg-highlight-1/80 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}   </div>
  );
}