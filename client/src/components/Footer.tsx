import { Link } from "react-router-dom";

// Define the social media icons and links
export const socialLinks = [
  {
    href: "https://www.facebook.com/dalitmurasuadmin?rdid=O3FlEPCoVVrE3uAm&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F19DuFLdYay%2F#",
    Icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="icon icon-tabler icons-tabler-outline icon-tabler-brand-facebook">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3" />
      </svg>
    ),
    key: "facebook"
  },
  {
    href: "https://x.com/DalitMurasu?t=xF15mBqW1rLbOYfOnMd_0Q&s=08",
    Icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="icon icon-tabler icons-tabler-outline icon-tabler-brand-x">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
      </svg>
    ),
    key: "twitter"
  },
  {
    href: "https://wa.me/919444452877",
    Icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="icon icon-tabler icons-tabler-outline icon-tabler-brand-whatsapp">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
        <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
      </svg>
    ),
    key: "whatsapp"
  },
];

const addressLines = [
  "முகவரி:",
  " தலித் முரசு,",
  "D 11/21, சோழன் தெரு, முதல் மாடி, எம். எம். டி. ஏ. குடியிருப்பு,",
  "அரும்பாக்கம், சென்னை 600 106",
];

export default function Footer() {
  const mapUrl = "https://maps.google.com/?q=13.066976,80.213829";
  const email = "dalitmurasu@gmail.com";
  const phoneNumber = "94444 52877";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email)
      .then(() => alert("Email copied to clipboard!"))
      .catch(() => alert("Failed to copy email"));
  };

  const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-mail">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
      <path d="M3 7l9 6l9 -6" />
    </svg>
  );

  const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-phone">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
    </svg>
  );

  const FeedbackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-message-circle font-bold">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 20l1.3 -3.9a8 8 0 1 1 2.7 2.7l-4 1.2" />
    </svg>
  );

  return (
    <footer className="w-full mt-10 py-4 text-sm text-red-500 border-t-2 border-red-500">
      <div className="container mx-auto px-4">

        {/* ---------- Desktop View ---------- */}
        <div className="hidden md:flex justify-between items-start text-black">
          {/* Address */}
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="hover:underline cursor-pointer">
            {addressLines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </a>

          <div className="flex flex-col items-center">
            {/* Feedback */}
            <Link
              to="/feedback"
              className="text-black py-1 rounded-full flex  gap-2 font-bold hover:text-red-700 transition"
            >
              Feedback
              <FeedbackIcon />
            </Link>
            {/* Copyright */}
            <p>©{new Date().getFullYear()} தலித் முரசு. All rights reserved.</p>
        </div>

          {/* Contact Info */}
          <div className="flex flex-col items-end">
            <p onClick={handleCopyEmail} className="cursor-pointer hover:text-red-700 flex items-center gap-1">
              {email} <MailIcon />
            </p>
            <p className="flex items-center gap-1">{phoneNumber} <PhoneIcon /></p>
          </div>
        </div>

        {/* ---------- Mobile View ---------- */}
        <div className="flex md:hidden flex-col items-center text-black text-center space-y-3">
          {/* Address */}
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="hover:underline cursor-pointer">
            {addressLines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </a>

          {/* Email & Phone */}
          <p onClick={handleCopyEmail} className="cursor-pointer hover:text-red-700 flex items-center justify-center gap-1">
            {email} <MailIcon />
          </p>
          <p className="flex items-center justify-center gap-1">
            {phoneNumber} <PhoneIcon />
          </p>

          {/* Feedback */}
          <Link
            to="/feedback"
            className="text-black py-1 rounded-full flex items-center gap-2 font-bold hover:text-red-700 transition"
          >
            Feedback
            <FeedbackIcon />
          </Link>

          {/* Social Media */}
          <div className="flex space-x-4 text-2xl">
            {socialLinks.map(({ href, Icon, key }) => (
              <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="hover:text-red-700">
                <Icon />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p>©{new Date().getFullYear()} தலித் முரசு. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
