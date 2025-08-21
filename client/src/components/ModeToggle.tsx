import { useTheme } from "./theme-context";

export default function ModeToggle() {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
        darkMode ? "bg-gray-700" : "bg-yellow-400"
      }`}
      aria-label="Toggle Theme"
    >
      <div
        className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
          darkMode ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {darkMode ? "🌙" : "☀️"}
      </div>
    </button>
  );
}
