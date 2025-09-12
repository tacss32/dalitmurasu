import { useState } from "react";


export default function AddRecentPosts() {
  // const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null);
  const [middleImageFile, setMiddleImageFile] = useState<File | null>(null);
  const [isHome, setIsHome] = useState(false);
  const [isRecent, setIsRecent] = useState(false);

  const SERVER_URL = "https://dalit-murasu.vercel.app";
  const navContext = [
    { label: "home" },
    { label: "recent_posts" },
    { label: "premium_articles" },
    { label: "book_review" },
    { label: "editorials" },
    { label: "interviews" },
    { label: "series" },
    { label: "poems" },
    { label: "babasaheb_speaks" },
    { label: "periyar_speaks" },
    { label: "marketplace_books_more" },
    { label: "dalit_murasu_archive" },
    { label: "blue_thoughts" },
    { label: "contact" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subTitle", subTitle);
    formData.append("content", content);
    formData.append("author", author);
    formData.append("category", category);
    if (headerImageFile && middleImageFile) {
      formData.append("headerImage", headerImageFile);
      formData.append("middleImage", middleImageFile);
    }

    const res = await fetch(`${SERVER_URL}/api/recent_posts`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setTitle("");
      setContent("");
      setAuthor("");
      setCategory("");
      setHeaderImageFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl backdrop-blur-lg bg-white/70 border border-gray-200 shadow-xl rounded-2xl p-8 space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          Add New Post
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl border border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Sub Title
            </label>
            <input
              type="text"
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl border border-gray-300 shadow-sm"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl border border-gray-300 shadow-sm"
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              {navContext.map((item) => (
                <option key={item.label} value={item.label}>
                  {(item.label)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Header Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setHeaderImageFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-700"
            />
            {headerImageFile && (
              <img
                src={URL.createObjectURL(headerImageFile)}
                alt="Header Preview"
                className="mt-2 rounded-xl h-32 w-full object-cover"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Middle Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setMiddleImageFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-700"
            />
            {middleImageFile && (
              <img
                src={URL.createObjectURL(middleImageFile)}
                alt="Middle Preview"
                className="mt-2 rounded-xl h-32 w-full object-cover"
              />
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <label className="inline-flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-indigo-600"
              checked={isHome}
              onChange={(e) => setIsHome(e.target.checked)}
            />
            <span className="ml-2">Home</span>
          </label>

          <label className="inline-flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-indigo-600"
              checked={isRecent}
              onChange={(e) => setIsRecent(e.target.checked)}
            />
            <span className="ml-2">Recent</span>
          </label>
        </div>
        <div className="text-center pt-4">
          <button
            type="submit"
            className=" bg-indigo-500 hover:from-indigo-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300"
          >
            Add Post
          </button>
        </div>
      </form>
    </div>
  );
}
