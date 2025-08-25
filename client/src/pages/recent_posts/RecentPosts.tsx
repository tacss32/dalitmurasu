import { useEffect, useState } from "react";
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
      const categoriesRes = await axios.get<Category[]>(`${SERVER_URL}api/categories?available=true`);
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
    return category?.name.ta || englishCategoryName; // Fallback to English if not found
  };

  return (
    <>
      <Header text="அண்மைப் பதிவுகள்" urlPath="recent posts" />

      <div className="flex flex-col gap-5 p-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 w-full mx-auto gap-6">
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
      </div>
    </>
  );
}