import  { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link} from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef, // Import ColumnDef for typing columns
  type SortingState, // Import SortingState for sorting state
} from "@tanstack/react-table";
import { MdEdit, MdDelete, MdAdd } from "react-icons/md";

const API_BASE_URL = import.meta.env.VITE_API;

// --- Type Definitions ---

// This interface should match your PremiumPost model in the backend
interface IPremiumPost {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  author: string;
  category: string;
  images: string[]; // Array of image URLs
  isHome: boolean;
  isRecent: boolean;
  visibility: "public" | "subscribers";
  views: number;
  freeViewLimit: number;
  date: string; // Stored as string, convert to Date object for display
  createdAt: string;
  updatedAt: string;
}

export default function PremiumArticleList() {
  const [data, setData] = useState<IPremiumPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>(""); // For search filter

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await axios.get<IPremiumPost[]>(
        `${API_BASE_URL}api/premium-posts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setData(response.data);
    } catch (err) {
      console.error("Failed to fetch premium posts:", err);
      setError("Failed to load premium articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this premium post?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_BASE_URL}api/premium-posts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Premium post deleted successfully!");
        fetchPosts(); // Re-fetch posts after deletion
      } catch (err) {
        console.error("Failed to delete post:", err);
        setError("Failed to delete post.");
      }
    }
  };

  // Define columns with type ColumnDef<IPremiumPost>
  const columns = useMemo<ColumnDef<IPremiumPost>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: (info) => (
          <div className="flex items-center gap-2">
            {info.row.original.images && info.row.original.images.length > 0 && (
              <img
                src={info.row.original.images[0]}
                alt="Post"
                className="w-10 h-10 object-cover rounded"
              />
            )}
            <span>{info.getValue() as string}</span> {/* Cast to string */}
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
      },
      {
        accessorKey: "author",
        header: "Author",
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue() as string).toLocaleDateString()
            : "N/A",
      },
      {
        accessorKey: "visibility",
        header: "Visibility",
        cell: (info) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              info.getValue() === "public"
                ? "bg-green-500 text-white"
                : "bg-purple-500 text-white"
            }`}
          >
            {info.getValue() as string === "public" ? "Public" : "Subscribers"}
          </span>
        ),
      },
      {
        accessorKey: "isHome",
        header: "Home",
        cell: (info) => ((info.getValue() as boolean) ? "Yes" : "No"),
      },
      // {
      //   accessorKey: "isRecent",
      //   header: "Recent",
      //   cell: (info) => ((info.getValue() as boolean) ? "Yes" : "No"),
      // },
      {
        accessorKey: "views",
        header: "Views",
      },
      {
        id: "actions", // Unique ID for the actions column
        header: "Actions",
        cell: (info) => (
          <div className="flex space-x-2">
            <Link
              to={`/admin/premium-articles/edit/${info.row.original._id}`}
              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Edit"
            >
              <MdEdit />
            </Link>
            <button
              onClick={() => handleDelete(info.row.original._id)}
              className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              title="Delete"
            >
              <MdDelete />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return (
      <div className="text-center text-white text-xl p-8">Loading posts...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 text-xl p-8">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-800 text-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-yellow-400">Premium Articles</h2>
        <Link
          to="/admin/premium-articles/create"
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2 transition-colors"
        >
          <MdAdd /> New Article
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search all columns..."
          className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500"
        />
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-gray-900 border border-gray-700">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-gray-700">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="py-3 px-4 text-left text-sm font-semibold text-gray-300 uppercase cursor-pointer"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-700 hover:bg-gray-700">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-3 px-4 text-sm text-gray-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50"
          >
            {"<<"}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50"
          >
            {"<"}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50"
          >
            {">"}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50"
          >
            {">>"}
          </button>
        </div>
        <span className="flex items-center gap-1 text-gray-300">
          Page{" "}
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1 text-gray-300">
          | Go to page:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="w-16 p-1 rounded bg-gray-700 border border-gray-600 text-white"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          className="p-1 rounded bg-gray-700 border border-gray-600 text-white"
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}