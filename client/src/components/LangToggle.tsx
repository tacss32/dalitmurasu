import { useTranslation } from "react-i18next";

export default function LangToggle() {
  const { i18n } = useTranslation();

  const changeLanguage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <select
      onChange={changeLanguage}
      value={i18n.language}
      className="border-2 border-highlight-1 text-gray-700 w-fit py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight-1"
    >
      <option value="en">English</option>
      <option value="ta">தமிழ்</option>
    </select>
  );
}
