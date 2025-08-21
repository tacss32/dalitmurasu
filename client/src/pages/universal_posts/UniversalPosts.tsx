import { useEffect, useState, useRef, useCallback } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// THE KEY CHANGE: Import the RichTextEditor component from its shared location.
import RichTextEditor from "../../components/RichTextEditor";
import getCroppedImg from "../../components/getCroppedImg";

interface Post {
  _id: string;
  title: string;
  subtitle: string;
  content: string;
  images?: string[];
  createdAt: string;
  author: string;
  category: string;
  isHome?: boolean;
  isRecent?: boolean;
  isPinned?: boolean;
  date?: string;
}

interface Category {
  _id: string;
  name: {
    ta: string;
    en: string;
  };
}

const SERVER_URL = import.meta.env.VITE_API;

const formatDate = (dateStr: string) => {
  if (!dateStr) return "Unknown date";
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function UniversalPosts() {
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editIsSubmitting, setEditIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editImageFiles, setEditImageFiles] = useState<(File | string)[]>([]);
  const [editCurrentImageSrc, setEditCurrentImageSrc] = useState<string | null>(
    null
  );
  const [editCurrentImageIndex, setEditCurrentImageIndex] = useState<number>(-1);
  const editImgRef = useRef<HTMLImageElement>(null);
  const [editCrop, setEditCrop] = useState<Crop>();
  const [editCompletedCrop, setEditCompletedCrop] = useState<PixelCrop>();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchFromDate, setSearchFromDate] = useState("");
  const [searchToDate, setSearchToDate] = useState("");
  const [showSearchForm, setShowSearchForm] = useState(false); // New state for search form visibility

  const toggleSearchForm = () => {
    setShowSearchForm(!showSearchForm);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchKeyword) queryParams.append('keyword', searchKeyword);
      if (searchCategory) queryParams.append('category', searchCategory);
      if (searchFromDate) queryParams.append('from', searchFromDate);
      if (searchToDate) queryParams.append('to', searchToDate);

      const url = `${SERVER_URL}api/search?${queryParams.toString()}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error("Failed to fetch posts");
      
      const data = await res.json();
      setAllPosts(data.universalPosts || []);
      
      setFilterType('all');
      
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      toast.error(`Error fetching posts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  useEffect(() => {
    let filtered = allPosts;
    if (filterType === 'home') {
        filtered = allPosts.filter(post => post.isHome);
    } else if (filterType === 'recent') {
        filtered = allPosts.filter(post => post.isRecent);
    }
    setDisplayedPosts(filtered);
  }, [filterType, allPosts]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${SERVER_URL}api/categories?available=true`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      toast.error(`Error fetching categories: ${err.message}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`${SERVER_URL}api/universal-posts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Post deleted successfully!");
        fetchPosts();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || res.statusText);
      }
    } catch (err: any) {
      console.error("Error deleting post:", err);
      toast.error(`Failed to delete post: ${err.message}`);
    }
  };

  const handleEditFileSelect = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setEditImageFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeEditImage = (index: number) => {
    setEditImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startEditCropping = (index: number) => {
    const fileOrUrl = editImageFiles[index];
    let srcToCrop: string | null = null;

    if (typeof fileOrUrl === "string") {
      srcToCrop = fileOrUrl.startsWith("http")
        ? fileOrUrl
        : `${SERVER_URL}uploads/${fileOrUrl}`;
    } else if (fileOrUrl instanceof File) {
      srcToCrop = URL.createObjectURL(fileOrUrl);
    }

    if (srcToCrop) {
      setEditCurrentImageSrc(srcToCrop);
      setEditCurrentImageIndex(index);
      setEditCrop(undefined);
      setEditCompletedCrop(undefined);
    }
  };

  const onEditImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      const aspect = 1 / 1;

      const initialCrop = centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
        width,
        height
      );

      setEditCrop(initialCrop);
    },
    []
  );

  const onEditCropComplete = useCallback(
    (crop: PixelCrop, _percentCrop: Crop) => {
      setEditCompletedCrop(crop);
    },
    []
  );

  const handleDoneEditCropping = async () => {
    const imgElement = editImgRef.current;
    const completedCropData = editCompletedCrop;

    if (imgElement && completedCropData && editCurrentImageIndex >= 0) {
      const originalFileOrUrl = editImageFiles[editCurrentImageIndex];
      let originalFileName: string = "cropped_image.jpeg";

      if (typeof originalFileOrUrl === "string") {
        originalFileName =
          originalFileOrUrl.split("/").pop() || "cropped_image.jpeg";
      } else if (originalFileOrUrl instanceof File) {
        originalFileName = originalFileOrUrl.name;
      }

      try {
        const croppedFile = await getCroppedImg(
          imgElement,
          completedCropData,
          `cropped_${originalFileName}`
        );

        setEditImageFiles((prev) =>
          prev.map((item, index) =>
            index === editCurrentImageIndex ? croppedFile : item
          )
        );

        setEditCurrentImageSrc(null);
        setEditCurrentImageIndex(-1);
        toast.success("Image cropped successfully!");
      } catch (e: any) {
        console.error("Error cropping image:", e);
        toast.error(`Failed to crop image: ${e.message}`);
      }
    } else {
      toast.error("Please select an image and define a crop area.");
    }
  };

  const cancelEditCropping = () => {
    setEditCurrentImageSrc(null);
    setEditCurrentImageIndex(-1);
    setEditCrop(undefined);
    setEditCompletedCrop(undefined);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPost) return;

    setEditIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", editPost.title);
    formData.append("subtitle", editPost.subtitle);
    formData.append("content", editPost.content);
    formData.append("author", editPost.author);
    formData.append("category", editPost.category);
    formData.append("isHome", String(editPost.isHome));
    formData.append("isRecent", String(editPost.isRecent));
    formData.append("isPinned", String(editPost.isPinned));
    formData.append(
      "date",
      editPost.date || new Date().toISOString().substring(0, 10)
    );

    const existingImageUrls: string[] = [];
    editImageFiles.forEach((fileOrUrl) => {
      if (fileOrUrl instanceof File) {
        formData.append("images", fileOrUrl);
      } else if (typeof fileOrUrl === "string") {
        existingImageUrls.push(fileOrUrl);
      }
    });

    formData.append("existingImages", JSON.stringify(existingImageUrls));

    try {
      const res = await fetch(
        `${SERVER_URL}api/universal-posts/${editPost._id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (res.ok) {
        toast.success("Post updated successfully!");
        setShowModal(false);
        setEditPost(null);
        setEditImageFiles([]);
        fetchPosts();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || res.statusText);
      }
    } catch (err: any) {
      console.error("Error updating post:", err);
      toast.error(`Failed to update post: ${err.message}`);
    } finally {
      setEditIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (category) =>
      !["home", "recentposts", "about", "archive"].includes(
        category.name?.en.toLowerCase().replace(/[\s\-\/]+/g, "")
      )
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">
        Universal Posts
      </h1>
      <div className="flex gap-4 mb-4 items-center flex-wrap">
        <button onClick={() => {
            setFilterType('all');
            setSearchKeyword('');
            setSearchCategory('');
            setSearchFromDate('');
            setSearchToDate('');
            fetchPosts();
        }}
            className={`px-4 py-2 rounded ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
            All Posts
        </button>
        <button onClick={() => setFilterType('home')}
            className={`px-4 py-2 rounded ${filterType === 'home' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
            Home Posts
        </button>
        <button onClick={() => setFilterType('recent')}
            className={`px-4 py-2 rounded ${filterType === 'recent' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
            Recent Posts
        </button>
        {/* New Search Icon Button */}
        <button
          onClick={toggleSearchForm}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </button>
      </div>

      {/* Conditional rendering of the search form */}
      {showSearchForm && (
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white rounded-lg shadow-md transition-all duration-300 ease-in-out">
          <input
              type="text"
              placeholder="Search by keyword..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="flex-1 p-2 border rounded-lg"
          />
          <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="flex-1 p-2 border rounded-lg"
          >
              <option value="">All Categories</option>
              {filteredCategories.map((cat) => (
                  <option key={cat._id} value={cat.name.en}>
                      {cat.name.ta}
                  </option>
              ))}
          </select>
          <input
              type="date"
              value={searchFromDate}
              onChange={(e) => setSearchFromDate(e.target.value)}
              className="flex-1 p-2 border rounded-lg"
          />
          <input
              type="date"
              value={searchToDate}
              onChange={(e) => setSearchToDate(e.target.value)}
              className="flex-1 p-2 border rounded-lg"
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              Search
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-center text-gray-500">Loading posts...</p>
      ) : displayedPosts.length === 0 ? (
        <p className="text-center text-gray-500">No posts found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPosts.map((post: any) => {
            const displayImageUrl = post.headerImage
              ? post.headerImage.startsWith("http")
                ? post.headerImage
                : `${SERVER_URL}uploads/${post.headerImage}`
              : post.images && post.images.length > 0
              ? post.images[0].startsWith("http")
                ? post.images[0]
                : `${SERVER_URL}uploads/${post.images[0]}`
              : "https://via.placeholder.com/400x250?text=No+Image";

            return (
              <div
                key={post._id}
                className="bg-white rounded-xl shadow-md p-4 flex flex-col"
              >
                <img
                  src={displayImageUrl}
                  alt={post.title}
                  className="rounded-lg h-48 object-cover mb-3 w-full"
                />
                <h2 className="text-lg font-semibold">{post.title}</h2>
                <p className="text-sm text-gray-500">
                  By {post.author || "Unknown"} in{" "}
                  {categories.find((c) => c._id === post.category)?.name.ta ||
                    "Unknown"}
                </p>
                <p className="text-xs text-gray-400 mb-1">
                  Posted on {formatDate(post.createdAt)}
                </p>
                <div
                  className="line-clamp-3 text-sm mt-1"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                ></div>
                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    onClick={() => {
                      const postWithDate = {
                        ...post,
                        date: post.date
                          ? new Date(post.date).toISOString().substring(0, 10)
                          : new Date(post.createdAt).toISOString().substring(0, 10),
                      };
                      setEditPost(postWithDate);
                      setEditImageFiles(post.images || []);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                    onClick={() => handleDelete(post._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && editPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 relative overflow-y-auto max-h-[95vh]">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-center mb-4 text-indigo-600">
              Edit Post
            </h2>
            <form onSubmit={handleEditSubmit} className="grid gap-4">
              <input
                type="text"
                value={editPost.title}
                onChange={(e) =>
                  setEditPost({ ...editPost, title: e.target.value })
                }
                className="p-3 rounded-xl border"
                placeholder="Title"
              />
              <input
                type="text"
                value={editPost.subtitle}
                onChange={(e) =>
                  setEditPost({ ...editPost, subtitle: e.target.value })
                }
                className="p-3 rounded-xl border"
                placeholder="Subtitle"
              />
              <RichTextEditor
                content={editPost.content}
                setContent={(html: any) =>
                  setEditPost({ ...editPost, content: html })
                }
              />
              <input
                type="text"
                value={editPost.author}
                onChange={(e) =>
                  setEditPost({ ...editPost, author: e.target.value })
                }
                className="p-3 rounded-xl border"
                placeholder="Author"
              />
              <input
                type="date"
                value={editPost.date || ""}
                onChange={(e) =>
                  setEditPost({ ...editPost, date: e.target.value })
                }
                className="p-3 rounded-xl border"
              />
              <select
                value={editPost.category}
                onChange={(e) =>
                  setEditPost({ ...editPost, category: e.target.value })
                }
                className="p-3 rounded-xl border"
                required
              >
                <option value="">Select Category</option>
                {filteredCategories.map((cat) => (
                  <option key={cat._id} value={cat.name.en}>
                    {cat.name.ta}
                  </option>
                ))}
              </select>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleEditFileSelect(e.target.files)}
                  className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />

                {editImageFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {editImageFiles.map((fileOrUrl, index) => {
                      const imageUrl =
                        typeof fileOrUrl === "string"
                          ? fileOrUrl.startsWith("http")
                            ? fileOrUrl
                            : `${SERVER_URL}uploads/${fileOrUrl}`
                          : URL.createObjectURL(fileOrUrl);
                      const fileName =
                        typeof fileOrUrl === "string"
                          ? fileOrUrl.split("/").pop()
                          : fileOrUrl.name;

                      return (
                        <div
                          key={index}
                          className="relative border border-gray-300 rounded-lg overflow-hidden"
                        >
                          <img
                            src={imageUrl}
                            alt={`Image ${index + 1}`}
                            className="w-full h-auto object-cover"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => startEditCropping(index)}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
                            >
                              Crop
                            </button>
                            <button
                              type="button"
                              onClick={() => removeEditImage(index)}
                              className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 p-2 truncate">
                            {fileName}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {editCurrentImageSrc && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
                      <h3 className="text-lg font-semibold mb-4">Crop Image</h3>
                      <ReactCrop
                        crop={editCrop}
                        onChange={(_, percentCrop) => setEditCrop(percentCrop)}
                        onComplete={onEditCropComplete}
                        aspect={1 / 1}
                        minWidth={100}
                        minHeight={100}
                        className="max-w-full h-auto"
                      >
                        <img
                          ref={editImgRef}
                          alt="Crop"
                          src={editCurrentImageSrc}
                          onLoad={onEditImageLoad}
                          className="max-w-full h-auto block"
                        />
                      </ReactCrop>
                      <div className="flex gap-4 mt-4 justify-end">
                        <button
                          type="button"
                          onClick={cancelEditCropping}
                          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDoneEditCropping}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-full"
                        >
                          Done Cropping
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editPost.isHome ?? false}
                    onChange={(e) =>
                      setEditPost({ ...editPost, isHome: e.target.checked })
                    }
                  />
                  <span className="text-sm">Show on Home</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editPost.isRecent ?? false}
                    onChange={(e) =>
                      setEditPost({ ...editPost, isRecent: e.target.checked })
                    }
                  />
                  <span className="text-sm">Show as Recent</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editPost.isPinned ?? false}
                    onChange={(e) =>
                      setEditPost({ ...editPost, isPinned: e.target.checked })
                    }
                  />
                  <span className="text-sm">Pinned Post</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-xl"
                  disabled={editIsSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl ${
                    editIsSubmitting
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                  disabled={editIsSubmitting}
                >
                  {editIsSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}