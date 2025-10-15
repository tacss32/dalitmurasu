

// Define the social media icons and links outside the component
export const socialLinks = [
  {
    href: "https://www.facebook.com/dalitmurasuadmin?rdid=O3FlEPCoVVrE3uAm&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F19DuFLdYay%2F#",
    Icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-facebook">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3" />
      </svg>
    ),
    key: "facebook"
  },
  {
    href: "https://x.com/DalitMurasu?t=xF15mBqW1rLbOYfOnMd_0Q&s=08",
    Icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-x">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
      </svg>
    ),
    key: "twitter"
  },
  // {
  //   href: "http://googleusercontent.com/maps.google.com/3",
  //   Icon: () => (
  //     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-instagram">
  //       <path stroke="none" d="M0 0h24v24H0z" fill="none" />
  //       <path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
  //       <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
  //       <path d="M16.5 7.5v.01" />
  //     </svg>
  //   ),
  //   key: "instagram"
  // },
  {
    href: "https://wa.me/919444452877",
    Icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-whatsapp">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
        <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
      </svg>
    ),
    key: "whatsapp"
  },
];

// Define the address lines
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
    navigator.clipboard.writeText(email).then(() => {
      alert("Email copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy email");
    });
  };

  // Define SVG components for re-use
  const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-mail">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
      <path d="M3 7l9 6l9 -6" />
    </svg>
  );

  const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-phone">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
    </svg>
  );

  return (
    <footer className="w-full mt-10 py-4 text-sm text-red-500 dark:text-red-300 border-t-2 border-red-500">
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
              {/* **Optimization: Map for Address Lines** */}
              {addressLines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </a>
          </div>

          {/* Column 2: Copyright & Social Media */}
          <div className="flex flex-col items-center mb-4 md:mb-0 text-black">
            <p className="mb-2">
              ©{new Date().getFullYear()} {("தலித் முரசு")}. All rights reserved.
            </p>
            <div className="flex space-x-4 text-2xl">
              {/* **Optimization: Map for Social Links** */}
              {socialLinks.map(({ href, Icon, key }) => (
                <a 
                  key={key}
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-red-700 dark:hover:text-red-100"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
          
          {/* Column 3: Phone Number & Email */}
          <div className="flex flex-col items-center md:items-end text-black">
            <p 
              onClick={handleCopyEmail} 
              className="cursor-pointer hover:text-red-700 dark:hover:text-black-100 flex items-center gap-1"
            >
              {email} <MailIcon />
            </p>
            <p className=" text-black flex gap-1 items-center">
              {phoneNumber} <PhoneIcon />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}