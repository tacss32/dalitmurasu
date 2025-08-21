import { useEffect, useState } from "react";

type Banner = {
  _id: string;
  tag: string;
  title: string;
  author: string;
  url: string;
  photo: string;
};

export default function BannerList() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch("/api/banners");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setBanners(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchBanners();
  }, []);

  if (loading)
    return (
      <div className="ml-64 p-6 text-xl font-semibold">
        Loading banners...
      </div>
    );

  if (error)
    return (
      <div className="ml-64 p-6 text-red-600 font-semibold">
        Error: {error}
      </div>
    );

  if (banners.length === 0)
    return (
      <div className="ml-64 p-6 text-lg font-medium">
        No banners found.
      </div>
    );

  return (
    <div className="ml-64 p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Manage Banners</h1>
      <ul className="space-y-6">
        {banners.map(({ _id, tag, title, author, url, photo }) => (
          <li
            key={_id}
            className="border rounded p-4 shadow-sm flex items-center gap-6"
          >
            <img
  src={
    photo.startsWith("http")
        ? photo
        : `/uploads/${photo}`
  }
              alt={title}
              className="h-24 w-24 object-cover rounded"
              onError={(e) => {
                // fallback image on error
                (e.target as HTMLImageElement).src =
                  "/placeholder-image.png";
              }}
            />
            <div className="flex-grow">
              <p>
                <strong>Tag:</strong> {tag || "(none)"}
              </p>
              <p>
                <strong>Title:</strong> {title || "(none)"}
              </p>
              <p>
                <strong>Author:</strong> {author || "(none)"}
              </p>
              <p>
                <strong>URL:</strong>{" "}
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {url}
                  </a>
                ) : (
                  "(none)"
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
