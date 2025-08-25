import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Card from "../../components/Card";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ---------------- Types ----------------
export type PostType = {
  _id: string;
  title: string;
  subtitle?: string;
  content?: string;
  images?: string[];
  date: string; // ISO
  author: string;
  category: string; // expecting 'Editorial', etc.
};

export interface PdfEntry {
  _id: string;
  title: string;
  subtitle?: string;
  date: string; // ISO
  category: { en: string; ta: string };
  imageUrl?: string;
  pdfUrl: string;
}

// Unified Editorial item (article or pdf)
type EditorialItem = {
  _id: string;
  title: string;
  subtitle?: string;
  image?: string | undefined;
  dateISO: string; // unify date for sorting
  isPdf: boolean;
  pdfUrl?: string;
  author?: string;
  // for article
  article?: PostType;
  // for pdf
  pdf?: PdfEntry;
};

// Chronological API response bits
interface CategoryPosts {
  category: string; // e.g., 'Editorial'
  posts: PostType[];
}
interface MonthBlock {
  month: number; // 1-12
  categories: CategoryPosts[];
}
interface ChronologicalYear {
  year: number;
  data: {
    months: MonthBlock[];
  };
}
interface ChronologicalResp {
  success: boolean;
  data: ChronologicalYear[];
}

// ---------------- Helpers ----------------
const isEditorialCat = (cat: string) => {
  // match common variants
  const norm = (cat || "").trim().toLowerCase();
  return (
    norm === "editorial" || norm === "தலையங்கம்" || norm === "thalaiyangam"
  );
};

const makeEditorialItemFromPost = (p: PostType): EditorialItem => ({
  _id: p._id,
  title: p.title,
  subtitle: p.subtitle,
  image: p.images?.[0],
  dateISO: p.date,
  isPdf: false,
  author: p.author,
  article: p,
});

const makeEditorialItemFromPdf = (pdf: PdfEntry): EditorialItem => ({
  _id: pdf._id,
  title: pdf.title,
  subtitle: pdf.subtitle,
  image: pdf.imageUrl,
  dateISO: pdf.date || pdf.date,
  isPdf: true,
  pdfUrl: pdf.pdfUrl,
  pdf,
});

const getMonthName = (monthNumber: number, locale: string = "en-US") => {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString(locale, { month: "long" });
};

// Minimal inline PDF Card (square-ish) for top row; you can replace w/ your own component
interface PdfCardProps {
  item: EditorialItem;
  className?: string;
}
const PdfCard: React.FC<PdfCardProps> = ({ item, className }) => {
  return (
    <a
      href={`https://docs.google.com/viewer?url=${encodeURIComponent(
        item.pdfUrl || ""
      )}\u0026embedded=true`}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "block rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out bg-white relative w-48 " +
        (className || "")
      }
    >
      {item.image && (
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-3">
        <h3 className="text-sm font-semibold line-clamp-2">{item.title}</h3>
        <p className="text-xs text-gray-500 mt-1">PDF</p>
      </div>
    </a>
  );
};

// ---------------- Component ----------------
export default function Editorial() {
  const SERVER_URL = import.meta.env.VITE_API;
  const navigate = useNavigate();

  const [chronological, setChronological] = useState<ChronologicalYear[]>([]);
  const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const safeParseDate = (d?: string): Date | null => {
    if (!d) return null;
    const t = Date.parse(d);
    return isNaN(t) ? null : new Date(t);
  };

  // Fetch data once
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [chronRes, pdfRes] = await Promise.all([
          fetch(`${SERVER_URL}api/chronological`).then(
            (r) => r.json() as Promise<ChronologicalResp>
          ),
          axios.get(`${SERVER_URL}api/pdf-uploads`),
        ]);

        if (mounted) {
          if (chronRes.success && Array.isArray(chronRes.data)) {
            // sort by year desc just to be sure
            const sorted = [...chronRes.data].sort((a, b) => b.year - a.year);
            setChronological(sorted);
            if (sorted.length > 0) setSelectedYear(sorted[0].year);
          } else {
            setError("Failed to load chronological data.");
          }

          if (pdfRes.data?.success) {
            setPdfs(pdfRes.data.data as PdfEntry[]);
          } else {
            console.warn("PDF upload fetch did not return success");
          }
        }
      } catch (err: any) {
        console.error("Error loading Editorial data", err);
        if (mounted) setError("Error loading data");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [SERVER_URL]);

  // Build map: year -> month -> Editorial items (articles + pdfs)
  const editorialMap = useMemo(() => {
    // structure: { [year: number]: { [month: number]: EditorialItem[] } }
    const map: Record<number, Record<number, EditorialItem[]>> = {};

    // from chronological (articles)
    chronological.forEach((yearData) => {
      yearData.data.months.forEach((m) => {
        const editorialCat = m.categories.find((c) =>
          isEditorialCat(c.category)
        );
        if (!editorialCat) return;
        editorialCat.posts.forEach((p) => {
          const date = new Date(p.date);
          const y = date.getFullYear();
          const mm = date.getMonth() + 1;
          map[y] = map[y] || {};
          map[y][mm] = map[y][mm] || [];
          map[y][mm].push(makeEditorialItemFromPost(p));
        });
      });
    });

    // from pdfs
    pdfs.forEach((pdf) => {
      if (!isEditorialCat(pdf.category?.en)) return;
      const dateObj = safeParseDate(pdf.date);
      if (!dateObj) return; // skip bad
      const y = dateObj.getFullYear();
      const mm = dateObj.getMonth() + 1;
      map[y] = map[y] || {};
      map[y][mm] = map[y][mm] || [];
      map[y][mm].push(makeEditorialItemFromPdf(pdf));
    });

    // sort each bucket desc by date
    Object.keys(map).forEach((yStr) => {
      const y = Number(yStr);
      Object.keys(map[y]).forEach((mStr) => {
        const m = Number(mStr);
        map[y][m].sort(
          (a, b) =>
            new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
        );
      });
    });

    return map;
  }, [chronological, pdfs]);

  // Determine latest year/month that actually has editorial items
  const latestEditorial = useMemo(() => {
    const years = Object.keys(editorialMap)
      .map(Number)
      .sort((a, b) => b - a);
    for (const y of years) {
      const months = Object.keys(editorialMap[y])
        .map(Number)
        .sort((a, b) => b - a);
      for (const m of months) {
        const items = editorialMap[y][m];
        if (items && items.length) {
          return { year: y, month: m, items };
        }
      }
    }
    return null;
  }, [editorialMap]);

  const recentItems = latestEditorial?.items?.slice(0, 4) || [];
  const recentCount = latestEditorial?.items?.length || 0;
  const recentMonthName = latestEditorial
    ? getMonthName(latestEditorial.month, "en-US")
    : "";

  // Build year summary list with counts per month (Editorial only)
  const yearSummaries = useMemo(() => {
    const years = Object.keys(editorialMap)
      .map(Number)
      .sort((a, b) => b - a);
    return years.map((y) => {
      const months = Object.keys(editorialMap[y])
        .map(Number)
        .sort((a, b) => b - a);
      return {
        year: y,
        months: months.map((m) => ({
          month: m,
          count: editorialMap[y][m].length,
        })),
      };
    });
  }, [editorialMap]);

  const selectedYearSummary =
    yearSummaries.find((y) => y.year === selectedYear) || null;

  const handleYearSelect = (y: number) => setSelectedYear(y);

  const handleMonthNav = (y: number, m: number) => {
    navigate(`/editorial/${y}/${m}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <Header text="தலையங்கம்" urlPath="Editorial" />
        <div className="flex justify-center items-center min-h-screen text-highlight-1">
          {" "}
          {/* Changed text-white to text-highlight-1 for consistency */}
          {/* Simple loading circle */}
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-highlight-2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5">
        <Header text="தலையங்கம்" urlPath="Editorial" />
        <p className="p-4 text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Header text="தலையங்கம்" urlPath="Editorial" />

      {/* Top Section - Recent Month */}
      {latestEditorial ? (
        <section className="px-4 mt-2">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
            <h2 className="text-xl font-bold">
              {recentMonthName} {latestEditorial.year}
            </h2>
            <span className="text-sm text-gray-600">
              Recently Uploaded ({recentCount})
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3">
            {recentItems.map((item) =>
              item.isPdf ? (
                <PdfCard key={item._id} item={item} />
              ) : (
                <div key={item._id} className="w-48 shrink-0">
                  <Card
                    id={item.article!._id}
                    title={item.article!.title}
                    subtitle={item.article!.subtitle}
                    author={item.article!.author}
                    category={item.article!.category}
                    date={item.article!.date}
                    image={item.article!.images?.[0]}
                  />
                </div>
              )
            )}
          </div>
          <button
            onClick={() =>
              handleMonthNav(latestEditorial.year, latestEditorial.month)
            }
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            More...
          </button>
        </section>
      ) : (
        <p className="px-4">No Editorial posts found.</p>
      )}

      {/* Bottom Section - Year list + Month list */}
      <section className="flex px-4 mt-8 gap-4">
        {/* Year List */}
        <aside className="w-24 border-r pr-3 shrink-0">
          {yearSummaries.map((y) => (
            <p
              key={y.year}
              onClick={() => handleYearSelect(y.year)}
              className={`cursor-pointer mb-2 font-medium transition-colors duration-150 ${
                selectedYear === y.year
                  ? "text-blue-600 underline"
                  : "text-gray-800 hover:text-blue-500"
              }`}
            >
              {y.year}
            </p>
          ))}
        </aside>

        {/* Month List for Selected Year */}
        <main className="flex-1 pl-4">
          {selectedYearSummary ? (
            selectedYearSummary.months.map((m) => (
              <div key={m.month} className="mb-4">
                <button
                  onClick={() =>
                    handleMonthNav(selectedYearSummary.year, m.month)
                  }
                  className="w-full text-left border-b pb-1 hover:text-blue-600"
                >
                  {getMonthName(m.month)}{" "}
                  <span className="ml-1 text-sm text-gray-500">
                    ({m.count})
                  </span>
                </button>
              </div>
            ))
          ) : (
            <p>No months found for this year.</p>
          )}
        </main>
      </section>
    </div>
  );
}
