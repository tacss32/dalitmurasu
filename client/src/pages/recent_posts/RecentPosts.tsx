
import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Import Link
import Card from "../../components/Card";
import Header from "../../components/Header";
import axios from "axios";

type RecentPostType = {
  _id: string;
  title: string;
  subtitle: string;
  content?: string;
  images?: [string];
  createdAt: string;
  date: string;
  author: string;
  category: string;
};

// Interface for a Category, from AddUniversalPost.tsx
type Category = {
  _id: string;
  name: {
    ta: string;
    en: string;
  };
};

const SERVER_URL = import.meta.env.VITE_API;

export default function RecentPosts() {
  const [posts, setPosts] = useState<RecentPostType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchPosts = async () => {
    const res = await fetch(`${SERVER_URL}api/universal-posts/recent`);
    const data = await res.json();
    setPosts(data);
  };

  const fetchCategories = async () => {
    try {
      const categoriesRes = await axios.get<Category[]>(
        `${SERVER_URL}api/categories?available=true`
      );
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchPosts();
    fetchCategories();
  }, []);

  const getTamilCategoryName = (englishCategoryName: string) => {
    const category = categories.find(
      (cat) => cat.name.en === englishCategoryName
    );
    return category?.name.ta || englishCategoryName;
  };

  return (
    <>
      <Header text="அண்மைப் பதிவுகள்" urlPath="recent posts" />

      <div className="flex flex-col gap-5 p-6 md:px-8 lg:px-12">
        {/* Desktop/Tablet Grid View */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 w-full mx-auto gap-6">
          {posts.map((post) => (
            <Card
              key={post._id}
              title={post.title}
              subtitle={post.subtitle}
              image={post.images?.[0]}
              date={post.date}
              author={post.author}
              category={getTamilCategoryName(post.category)}
              id={post._id}
            />
          ))}
        </div>

        {/* Mobile List View */}
        <div className="block md:hidden  flex-col gap-3">
          {posts.map((post) => (
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
                  <h2 className="text-lg font-bold">{post.title}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(post.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getTamilCategoryName(post.category)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}