import LangToggle from "../../components/LangToggle";
import ModeToggle from "../../components/ModeToggle";

export default function Preferences() {
  return (
    <div className="flex flex-col gap-6 p-4 bg-white rounded shadow">
      {/* Theme Mode Toggle */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Appearance</label>
        <ModeToggle />
      </div>

      {/* Language Toggle */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Language</label>
        <LangToggle />
      </div>
    </div>
  );
}
