
import { FaFacebook, FaTwitter, FaInstagram, FaWhatsapp } from 'react-icons/fa';

export default function Footer() {
 

  const handleCopyEmail = () => {
    const email = "dalitmurasu@gmail.com";
    navigator.clipboard.writeText(email).then(() => {
      alert("Email copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy email");
    });
  };

  const mapUrl = "https://maps.google.com/?q=13.066976,80.213829";
  
  return (
    <footer className="w-full mt-auto py-4 text-sm text-red-500 dark:text-red-300 border-t-2 border-red-500">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          
          {/* Column 1: Address */}
          <div className="mb-4 md:mb-0">
            <a 
              href={mapUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline cursor-pointer text-black"
            >
              <p>முகவரி:</p>
              <p> தலித் முரசு,</p>
              <p>D 11/21, சோழன் தெரு, முதல் மாடி, எம். எம். டி. ஏ. குடியிருப்பு,</p>
              <p>அரும்பாக்கம், சென்னை 600 106</p>
              <p></p>
            </a>
          </div>

          {/* Column 2: Copyright & Social Media (Now grouped together) */}
          <div className="flex flex-col items-center mb-4 md:mb-0 text-black">
            <p className="mb-2">
              ©{new Date().getFullYear()} {("தலித் முரசு")}. All rights reserved.
            </p>
            <div className="flex space-x-4 text-2xl">
              <a href="https://www.facebook.com/dalitmurasuadmin?rdid=O3FlEPCoVVrE3uAm&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F19DuFLdYay%2F#" target="_blank" rel="noopener noreferrer" className="hover:text-red-700 dark:hover:text-red-100">
                <FaFacebook />
              </a>
              <a href="https://x.com/DalitMurasu?t=xF15mBqW1rLbOYfOnMd_0Q&s=08" target="_blank" rel="noopener noreferrer" className="hover:text-red-700 dark:hover:text-red-100">
                <FaTwitter />
              </a>
              <a href="http://googleusercontent.com/maps.google.com/3" target="_blank" rel="noopener noreferrer" className="hover:text-red-700 dark:hover:text-red-100">
                <FaInstagram />
              </a>
              <a href="https://wa.me/919444452877" target="_blank" rel="noopener noreferrer" className="hover:text-red-700 dark:hover:text-red-100">
                <FaWhatsapp />
              </a>
            </div>
          </div>
          
          {/* Column 3: Phone Number & Email (Now grouped together) */}
          <div className="flex flex-col items-center md:items-end text-black">
            <p onClick={handleCopyEmail} className="cursor-pointer hover:text-red-700 dark:hover:text-black-100">
              📧 dalitmurasu@gmail.com
            </p>
            <p className="mb-2 text-black">
              Phone: 94444 52877
            </p>
            
          </div>
          
        </div>
      </div>
    </footer>
  );
}