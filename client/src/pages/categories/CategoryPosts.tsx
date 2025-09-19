
import { useParams, Link } from "react-router-dom";
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
  createdAt?: string;
}

const categoryTranslations: { [key: string]: string } = {
  // Add your category translations here, for example:
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
};

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
        <>
          {/* Desktop/Tablet Grid View */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 w-full mx-auto gap-3">
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

          {/* Mobile List View */}
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
          <h2 className="text-lg font-bold">
            {post.title}
          </h2>
          <p className="text-sm text-gray-500">
            {new Date(post.date ).toLocaleDateString()}   {categoryTranslations[post.category] || post.category}
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
  );
}