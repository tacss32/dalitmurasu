import React, { useCallback, useEffect, useRef, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API;

interface Category {
  _id: string;
  name: {
    en: string;
    ta: string;
  };
  isEditable: boolean;
  isAvailable: boolean;
  isInBanner: boolean;
  setHeader: boolean;
  order: number;
}

interface NotificationProps {
  message: string;
  type: "success" | "error";
}

const Notification: React.FC<NotificationProps & { onClose: () => void }> = ({
  message,
  type,
  onClose,
}) => {
  const color = type === "success" ? "bg-green-600" : "bg-red-600";
  return (
    <div
      className={`fixed bottom-5 right-5 p-4 rounded text-white shadow-lg ${color}`}
    >
      <span>{message}</span>
      <button className="ml-4 font-bold" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

export default function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    nameEn: "",
    nameTa: "",
    isEditable: true,
    isAvailable: false,
    isInBanner: false,
    setHeader: false,
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [notification, setNotification] = useState<NotificationProps | null>(
    null
  );

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}api/categories`);
      const data = await res.json();
      setCategories(data.sort((a: Category, b: Category) => a.order - b.order));
    } catch {
      showNotification("Failed to fetch categories", "error");
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      nameEn: "",
      nameTa: "",
      isEditable: true,
      isAvailable: false,
      isInBanner: false,
      setHeader: false,
    });
    setEditingCategory(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.nameEn || !formData.nameTa) {
      showNotification("Please fill all fields", "error");
      return;
    }

    const payload = {
      name: { en: formData.nameEn, ta: formData.nameTa },
      isEditable: formData.isEditable,
      isAvailable: formData.isAvailable,
      isInBanner: formData.isInBanner,
      setHeader: formData.setHeader,
    };

    const url = editingCategory
      ? `${API_BASE_URL}api/categories/${editingCategory._id}`
      : `${API_BASE_URL}api/categories`;

    const method = editingCategory ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      await fetchCategories();
      showNotification(
        `Category ${editingCategory ? "updated" : "created"} successfully`,
        "success"
      );
      resetForm();
    } catch {
      showNotification("Failed to save category", "error");
    }
  };

  const handleEdit = (cat: Category) => {
    if (!cat.isEditable) return;

    setFormData({
      nameEn: cat.name.en,
      nameTa: cat.name.ta,
      isEditable: cat.isEditable,
      isAvailable: cat.isAvailable,
      isInBanner: cat.isInBanner,
      setHeader: cat.setHeader,
    });

    setEditingCategory(cat);

    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (cat: Category) => {
    if (!cat.isEditable) return;
    if (!window.confirm("Delete this category?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}api/categories/${cat._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();
      await fetchCategories();
      showNotification("Category deleted", "success");
    } catch {
      showNotification("Delete failed", "error");
    }
  };

  const handleReorder = async (items: Category[]) => {
    const payload = items.map((cat, idx) => ({ _id: cat._id, order: idx + 1 }));

    try {
      await fetch(`${API_BASE_URL}api/categories/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reordered: payload }),
      });
      showNotification("Order updated", "success");
    } catch {
      showNotification("Failed to update order", "error");
    }
  };
  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    const items = [...categories];
    const dragged = items.splice(dragItem.current, 1)[0];
    items.splice(dragOverItem.current, 0, dragged);

    setCategories(items);
    handleReorder(items);

    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="ml-64 p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">
        {editingCategory ? "Edit" : "Create"} Category
      </h1>

      <div ref={formRef} className="bg-white p-4 rounded shadow mb-6 space-y-4">
        <input
          name="nameEn"
          placeholder="Name in English"
          className="w-full p-2 border rounded"
          value={formData.nameEn || ""}
          onChange={handleInputChange}
        />
        <input
          name="nameTa"
          placeholder="Name in Tamil"
          className="w-full p-2 border rounded"
          value={formData.nameTa || ""}
          onChange={handleInputChange}
        />
        {/* {!editingCategory && (
          <label className="flex items-center space-x-2">
            <input
              name="isEditable"
              type="checkbox"
              checked={!!formData.isEditable}
              onChange={handleInputChange}
            />
            <span>Editable</span>
          </label>
        )} */}
        <label className="flex items-center space-x-2">
          <input
            name="isAvailable"
            type="checkbox"
            checked={!!formData.isAvailable}
            onChange={handleInputChange}
          />
          <span>Universal post available</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            name="isInBanner"
            type="checkbox"
            checked={!!formData.isInBanner}
            onChange={handleInputChange}
          />
          <span>Set in Banner</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            name="setHeader"
            type="checkbox"
            checked={!!formData.setHeader}
            onChange={handleInputChange}
          />
          <span>Set a Header</span>
        </label>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {editingCategory ? "Update" : "Create"}
          </button>
          {editingCategory && (
            <button
              onClick={resetForm}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Categories</h2>
      <ul className="space-y-3">
        {categories.map((cat, idx) => (
          <li
            key={cat._id}
            draggable
            onDragStart={() => (dragItem.current = idx)}
            onDragEnter={() => (dragOverItem.current = idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="bg-white p-4 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="font-bold">
                {cat.name?.en} ({cat.name?.ta})
              </p>
              <p className="text-sm text-gray-600">
                Editable: {cat.isEditable ? "Yes" : "No"}
              </p>
              <p className="text-sm text-gray-600">
                Available: {cat.isAvailable ? "Yes" : "No"}
              </p>
              <p className="text-sm text-gray-600">
                In Banner: {cat.isInBanner ? "Yes" : "No"}
              </p>
              <p className="text-sm text-gray-600">
                Header: {cat.setHeader ? "Yes" : "No"}
              </p>
            </div>
            <div className="space-x-2">
              <button
                className={`${
                  cat.isEditable ? `bg-yellow-500` : `bg-gray-400`
                } text-white px-3 py-1 rounded`}
                onClick={() => handleEdit(cat)}
              >
                Edit
              </button>
              <button
                className={`${
                  cat.isEditable ? `bg-red-600` : `bg-gray-400`
                }  text-white px-3 py-1 rounded`}
                onClick={() => handleDelete(cat)}
              >
                Delete
              </button>
            </div>
          </li> 
        ))}
      </ul>

      {notification && (
        <Notification {...notification} onClose={() => setNotification(null)} />
      )}
    </div>
  );
}
