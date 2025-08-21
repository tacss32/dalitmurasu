import { useEffect, useState } from "react";

interface Post {
  _id: string;
  title: string;
  content: string;
  headerImage?: string;
  middleImage?: string;
  createdAt: string;
  author: string;
  category: string;
}

export default function AdminRecentPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editHeaderImage, setEditHeaderImage] = useState<File | null>(null);
  const [editMiddleImage, setEditMiddleImage] = useState<File | null>(null);

  const SERVER_URL = "https://dalit-murasu.vercel.app";

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await fetch(`${SERVER_URL}/api/recent-posts`);
    const data = await res.json();
    setPosts(data);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`${SERVER_URL}/api/recent-posts/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchPosts();
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6 border-b pb-2">
        Manage Recent Posts
      </h2>

      {/* Form */}

      {/* Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => {
          const imageUrl = post.headerImage
            ? post.headerImage.startsWith("http")
              ? post.headerImage
              : `${SERVER_URL}/uploads/${post.headerImage}`
            : "https://via.placeholder.com/400x250?text=No+Image";

          return (
            <div
              key={post._id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition duration-300 p-4 flex flex-col"
            >
              <img
                src={imageUrl}
                alt={post.title}
                className="rounded-md h-48 object-cover mb-3"
              />
              <h3 className="text-lg font-semibold text-gray-800">
                {post.title}
              </h3>
              <p className="text-gray-500 text-sm">
                By {post.author} in {post.category}
              </p>
              <p className="text-gray-600 mt-2 text-sm line-clamp-3">
                {post.content}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setEditPost(post);
                    setShowModal(true);
                  }}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-sm self-start"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(post._id)}
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm self-start"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {showModal && editPost && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30 transition-opacity">
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 w-full max-w-xl shadow-xl relative">
            <h3 className="text-2xl font-bold text-indigo-600 mb-4 text-center">
              Edit Post
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const formData = new FormData();
                formData.append("title", editPost.title);
                formData.append("subtitle", editPost.middleImage ?? "");
                formData.append("content", editPost.content);
                formData.append("author", editPost.author);
                formData.append("category", editPost.category);

                if (editHeaderImage)
                  formData.append("headerImage", editHeaderImage);
                if (editMiddleImage)
                  formData.append("middleImage", editMiddleImage);

                const res = await fetch(
                  `${SERVER_URL}/api/recent-posts/${editPost._id}`,
                  {
                    method: "PUT",
                    body: formData,
                  }
                );

                if (res.ok) {
                  setShowModal(false);
                  setEditPost(null);
                  setEditHeaderImage(null);
                  setEditMiddleImage(null);
                  fetchPosts();
                }
              }}
              className="grid gap-4"
            >
              <input
                type="text"
                value={editPost.title}
                onChange={(e) =>
                  setEditPost({ ...editPost, title: e.target.value })
                }
                className="p-3 rounded-xl border border-gray-300 shadow-sm"
                placeholder="Title"
              />

              <textarea
                value={editPost.content}
                onChange={(e) =>
                  setEditPost({ ...editPost, content: e.target.value })
                }
                className="p-3 rounded-xl border border-gray-300 shadow-sm h-32 resize-none"
                placeholder="Content"
              />

              <input
                type="text"
                value={editPost.author}
                onChange={(e) =>
                  setEditPost({ ...editPost, author: e.target.value })
                }
                className="p-3 rounded-xl border border-gray-300 shadow-sm"
                placeholder="Author"
              />

              <input
                type="text"
                value={editPost.category}
                onChange={(e) =>
                  setEditPost({ ...editPost, category: e.target.value })
                }
                className="p-3 rounded-xl border border-gray-300 shadow-sm"
                placeholder="Category"
              />

              <div>
                <label className="block mb-1 font-medium">Header Image</label>
                <input
                  type="file"
                  onChange={(e) =>
                    setEditHeaderImage(e.target.files?.[0] || null)
                  }
                  className="w-full p-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Middle Image</label>
                <input
                  type="file"
                  onChange={(e) =>
                    setEditMiddleImage(e.target.files?.[0] || null)
                  }
                  className="w-full p-2 border border-gray-300 rounded-xl bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
