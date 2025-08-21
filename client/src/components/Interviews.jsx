import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:3030api/interviews"; // change if different

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    category: "",
    photo: "",
    parts: [], // You can extend to add parts later
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch all interviews
  const fetchInterviews = async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    setInterviews(data);
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Create or update interview
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      // Update interview
      const res = await fetch(`${API_BASE}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("Interview updated");
        setEditingId(null);
        setFormData({
          title: "",
          date: "",
          category: "",
          photo: "",
          parts: [],
        });
        fetchInterviews();
      }
    } else {
      // Create new interview
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("Interview created");
        setFormData({
          title: "",
          date: "",
          category: "",
          photo: "",
          parts: [],
        });
        fetchInterviews();
      }
    }
  };

  // Edit interview (populate form)
  const handleEdit = (interview) => {
    setEditingId(interview._id);
    setFormData({
      title: interview.title,
      date: interview.date,
      category: interview.category,
      photo: interview.photo,
      parts: interview.parts || [],
    });
  };

  // Delete interview
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this interview?")) {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Interview deleted");
        fetchInterviews();
      }
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto" }}>
      <h2>Interviews</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: 10 }}
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: 10 }}
        />
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: 10 }}
        />
        <input
          type="text"
          name="photo"
          placeholder="Photo URL"
          value={formData.photo}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <button type="submit">
          {editingId ? "Update" : "Create"} Interview
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({
                title: "",
                date: "",
                category: "",
                photo: "",
                parts: [],
              });
            }}
            style={{ marginLeft: 10 }}
          >
            Cancel
          </button>
        )}
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {interviews.map((intv) => (
          <li
            key={intv._id}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              marginBottom: 10,
              borderRadius: 5,
            }}
          >
            <h3>{intv.title}</h3>
            <p>Date: {new Date(intv.date).toLocaleDateString()}</p>
            <p>Category: {intv.category}</p>
            {intv.photo && (
              <img src={intv.photo} alt={intv.title} style={{ width: 150 }} />
            )}
            <br />
            <button
              onClick={() => handleEdit(intv)}
              style={{ marginRight: 10 }}
            >
              Edit
            </button>
            <button onClick={() => handleDelete(intv._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
