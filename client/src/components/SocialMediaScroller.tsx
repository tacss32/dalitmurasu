

import { FaFacebook, FaTwitter, FaInstagram, FaWhatsapp } from 'react-icons/fa';

export default function SocialMediaScroller() {
  const socialLinks = [
    { href: "https://www.facebook.com/dalitmurasuadmin?rdid=EN2PG1ooIZ5hKH8W&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F19DuFLdYay%2F#", icon: <FaFacebook /> },
    { href: "https://x.com/DalitMurasu?t=xF15mBqW1rLbOYfOnMd_0Q&s=08", icon: <FaTwitter /> },
    { href: "https://www.instagram.com/your-username", icon: <FaInstagram /> },
    { href: "https://wa.me/919444452877", icon: <FaWhatsapp /> },
  ];

  return (
    <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50 flex flex-col space-y-4">
      {socialLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-800 text-white p-3 rounded-full shadow-lg transition-transform transform hover:scale-110 hover:bg-red-500"
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}