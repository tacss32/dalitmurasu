import { NavLink, Outlet } from "react-router-dom";

export default function Settings() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-bold text-2xl text-black dark:text-white">
        Settings
      </h2>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="flex flex-col gap-2 w-52 h-fit rounded-lg bg-white p-3">
          <NavLink
            to="account"
            className={({ isActive }) =>
              `flex items-center gap-2 p-2 rounded text-left border ${
                isActive
                  ? "bg-primary text-white font-semibold"
                  : "hover:bg-gray-100"
              }`
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            Profile
          </NavLink>
          <NavLink
            to="preferences"
            className={({ isActive }) =>
              `flex items-center gap-2 p-2 rounded text-left border ${
                isActive
                  ? "bg-primary text-white font-semibold"
                  : "hover:bg-gray-100"
              }`
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5"
              />
            </svg>
            Preferences
          </NavLink>
        </div>

        {/* Content Area */}
        <section className="w-full">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
