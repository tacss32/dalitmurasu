import axios from "axios";
import { useState } from "react";

const API_URL = "http://127.0.0.1:3030api/premium-articles";

export default function PremiumArticleForm({
  initialData = {},
  isEdit = false,
  onSuccess,
}: any) {
  const [title, setTitle] = useState(initialData.title || "");
  const [content, setContent] = useState(initialData.content || "");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (mainImage) formData.append("mainImage", mainImage);
    if (image1) formData.append("image1", image1);
    if (image2) formData.append("image2", image2);

    try {
      if (isEdit && initialData._id) {
        await axios.put(`${API_URL}/${initialData._id}`, { title, content });
      } else {
        await axios.post(API_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSuccess();
    } catch (err) {
      console.error("Error submitting article", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border"
        required
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border"
        required
      />
      {!isEdit && (
        <>
          <input
            type="file"
            onChange={(e) => setMainImage(e.target.files?.[0] || null)}
            required
          />
          <input
            type="file"
            onChange={(e) => setImage1(e.target.files?.[0] || null)}
          />
          <input
            type="file"
            onChange={(e) => setImage2(e.target.files?.[0] || null)}
          />
        </>
      )}
      <button type="submit" className="bg-blue-500 text-white px-4 py-2">
        {isEdit ? "Update" : "Create"}
      </button>
    </form>
  );
}
