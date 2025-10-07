


import { socialLinks } from './Footer';
export default function SocialMediaScroller() {


  return (
    <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50 flex flex-col space-y-4">
      {socialLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg transition-transform transform hover:scale-110 hover:bg-red-500"
        >
          <link.Icon /> 
        </a>
      ))}
    </div>
  );
}