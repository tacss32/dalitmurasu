import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function BannerCreate() {
  // const [title, setTitle] = useState("");
  // const [tag, setTag] = useState("");
  const [author, setAuthor] = useState("Admin");
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState(5000);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!photo) {
      setError("Please upload an image");
      return;
    }
    setError("");

    const formData = new FormData();
    // formData.append("title", title);
    // formData.append("tag", tag);
    formData.append("author", author);
    formData.append("url", url);
    formData.append("duration", duration.toString());
    formData.append("photo", photo);

    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to create banner");
      navigate("/banner");
    } catch (err: any) {
      setError(err.message || "Error creating banner");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add New Banner</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <label>
          Title:
          {/* <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded p-2"
          />
        </label>
        <label>
          Tag:
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            required
            className="w-full border border-gray-300 rounded p-2"
          /> */}
        </label>
        <label>
          Author:
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
          />
        </label>
        <label>
          URL:
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Optional"
          />
        </label>
        <label>
          Duration (ms):
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full border border-gray-300 rounded p-2"
            min={1000}
          />
        </label>
        <label>
          Image:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setPhoto(e.target.files[0]);
              }
            }}
            required
            className="w-full"
          />
        </label>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Create Banner
        </button>
      </form>
    </div>
  );
}
