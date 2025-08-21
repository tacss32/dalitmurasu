import { useEffect } from "react";
import Header from "./Header";

const contactDetails = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6 text-highlight-1"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
        />
      </svg>
    ),
    value: "+91 XXXXX XXXXX",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6 text-highlight-1"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
        />
      </svg>
    ),
    value: "contact@news.in",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6 text-highlight-1"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        />
      </svg>
    ),
    value: "123 Anna Salai, Chennai, Tamil Nadu, India",
  },
];

export default function Contact() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div>
      <Header />
      <div className="max-w-4xl mx-auto p-6 space-y-10">
        {/* Contact Info */}
        <div className="bg-white p-6 rounded-lg space-y-3">
          <h1 className="text-3xl font-bold">Contact Us</h1>
          <p className="text-gray-700">
            We'd love to hear from you! Reach out to us using the info below or
            the contact form.
          </p>
          <div className="space-y-3">
            {contactDetails.map(({ icon, value }, index) => (
              <div key={index} className="flex items-center gap-2">
                {icon}
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <form className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex flex-col">
            <label htmlFor="name" className="font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              className="border p-2 rounded mt-1"
              placeholder="Your Name"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="email" className="font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="border p-2 rounded mt-1"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="message" className="font-medium">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              className="border p-2 rounded mt-1"
              placeholder="Write your message..."
              required
            />
          </div>

          <button
            type="submit"
            className="bg-highlight-1 text-white px-4 py-2 rounded"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
