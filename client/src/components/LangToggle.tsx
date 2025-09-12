import { useState, type SetStateAction } from "react";

export default function LangToggle() {
  const [currentLanguage, setCurrentLanguage] = useState("en");

  const changeLanguage = (event: { target: { value: SetStateAction<string>; }; }) => {
    setCurrentLanguage(event.target.value);
    // You can add logic here to change the language of your application.
    // This could involve updating a context, a global state, or
    // making an API call to fetch content in the new language.
  };

  return (
    <select
      onChange={changeLanguage}
      value={currentLanguage}
      className="border-2 border-highlight-1 text-gray-700 w-fit py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight-1"
    >
      <option value="en">English</option>
      <option value="ta">தமிழ்</option>
    </select>
  );
} 