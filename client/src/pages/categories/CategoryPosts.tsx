import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Card from "../../components/Card";

interface Post {
  _id: string;
  title: string;
  content: string;
  images: [string];
  subtitle: string;
  date: string;
  author: string;
  category: string;
}

export default function CategoryPosts() {
  const { categorySlug } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryPosts = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API
          }api/universal-posts/category/${categorySlug}`
        );
        if (!res.ok) throw new Error("Failed to load category posts");
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryPosts();
  }, [categorySlug]);

  if (!categorySlug) return <p>Invalid category.</p>;

  return (
    <div className="flex flex-col gap-5 p-6 md:px-8 lg:px-12">
      <Header />
      {loading ? (
        <p>Loading...</p>
      ) : posts.length === 0 ? (
        <p>No posts found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 w-full mx-auto gap-3">
          {posts.map((post) => (
            <Card
              key={post._id}
              title={post.title}
              image={post?.images?.[0]}
              subtitle={post.subtitle}
              date={new Date(post.date).toLocaleDateString()}
              author={post.author}
              id={post._id}
              category={post.category}
            />
          ))}
        </div>
      )}
    </div>
  );
}
