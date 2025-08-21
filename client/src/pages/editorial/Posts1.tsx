import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/Header";
import Card from "../../components/Card";
import axios from "axios";

type PostType2 = {
  _id: string;
  title: string;
  subtitle?: string;
  content?: string;
  images?: string[];
  date: string;
  createdAt: string;
  author: string;
  category: string;
};

interface PdfEntry2 {
  _id: string;
  title: string;
  subtitle?: string;
  date: string;
  category: { en: string; ta: string };
  imageUrl?: string;
  pdfUrl: string;
  createdAt: string;
}

interface CategoryPosts2 {
  category: string;
  posts: PostType2[];
}
interface MonthBlock2 {
  month: number;
  categories: CategoryPosts2[];
}
interface ChronYear2 {
  year: number;
  data: { months: MonthBlock2[] };
}

interface ChronResp2 {
  success: boolean;
  data: ChronYear2[];
}

const isEditorialCat2 = (cat: string) => {
  const norm = (cat || "").trim().toLowerCase();
  return norm === "editorial" || norm === "தலையங்கம்" || norm === "thalaiyangam";
};

const getMonthName2 = (monthNumber: number, locale: string = "en-US") => {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString(locale, { month: "long" });
};

// local PdfCard (same style as in Editorial)
interface PdfCard2Props {
  item: PdfEntry2;
  className?: string;
}
const PdfCard2: React.FC<PdfCard2Props> = ({ item, className }) => (
  <a
    key={item._id}
    href={`https://docs.google.com/viewer?url=${encodeURIComponent(item.pdfUrl)}\u0026embedded=true`}
    target="_blank"
    rel="noopener noreferrer"
    className={
      "block rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out bg-white relative " +
      (className || "")
    }
  >
    {item.imageUrl && (
      <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
    )}
    <div className="p-3">
      <h3 className="text-sm font-semibold line-clamp-2">{item.title}</h3>
      <p className="text-xs text-gray-500 mt-1">PDF</p>
    </div>
  </a>
);

export default function Posts1() {
  const { year, month } = useParams<{ year: string; month: string }>();
  const SERVER_URL = import.meta.env.VITE_API;

  const [articles, setArticles] = useState<PostType2[]>([]);
  const [editorialPdfs, setEditorialPdfs] = useState<PdfEntry2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedYear = year ? parseInt(year, 10) : NaN;
  const selectedMonth = month ? parseInt(month, 10) : NaN;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!isNaN(selectedYear) && !isNaN(selectedMonth)) {
      fetchData(selectedYear, selectedMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const fetchData = async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const [chronRes, pdfRes] = await Promise.all([
        fetch(`${SERVER_URL}api/chronological`).then((r) => r.json() as Promise<ChronResp2>),
        axios.get(`${SERVER_URL}api/pdf-uploads`),
      ]);

      // Articles for this month/year in Editorial category
      let monthArticles: PostType2[] = [];
      if (chronRes.success && Array.isArray(chronRes.data)) {
        const yearData = chronRes.data.find((d) => d.year === y);
        if (yearData) {
          const monthData = yearData.data.months.find((mm) => mm.month === m);
          if (monthData) {
            const editorialCat = monthData.categories.find((c) => isEditorialCat2(c.category));
            if (editorialCat) {
              monthArticles = editorialCat.posts;
            }
          }
        }
      }

      // Editorial PDFs for this month/year
      let monthPdfs: PdfEntry2[] = [];
      if (pdfRes.data?.success) {
        const allPdfs: PdfEntry2[] = pdfRes.data.data;
        monthPdfs = allPdfs.filter((pdf: PdfEntry2) => {
          if (!isEditorialCat2(pdf.category?.en)) return false;
          const d = new Date(pdf.date);
          return d.getFullYear() === y && d.getMonth() + 1 === m;
        });
      }

      setArticles(monthArticles);
      setEditorialPdfs(monthPdfs);
    } catch (err: any) {
      console.error("Error fetching Editorial month data", err);
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const displayMonthName = getMonthName2(selectedMonth);

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <Header text={`தலையங்கம் ${displayMonthName} ${selectedYear}`} />
        <p className="p-4">Loading...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col gap-5">
        <Header text={`தலையங்கம் ${displayMonthName} ${selectedYear}`} />
        <p className="p-4 text-red-600">{error}</p>
      </div>
    );
  }

  const totalItems = articles.length + editorialPdfs.length;

  return (
    <div className="flex flex-col gap-5">
      <Header text={`தலையங்கம் ${displayMonthName} ${selectedYear}`} />
      <div className="container mx-auto p-4">
        {totalItems === 0 ? (
          <p className="text-center text-gray-600">
            {displayMonthName} {selectedYear} க்கான உள்ளடக்கங்கள் எதுவும் இல்லை.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {articles.map((post) => (
              <Card
                key={post._id}
                id={post._id}
                title={post.title}
                subtitle={post.subtitle}
                author={post.author}
                category={post.category}
                date={post.date}
                image={post.images?.[0]}
              />
            ))}
            {editorialPdfs.map((pdf) => (
              <PdfCard2 key={pdf._id} item={pdf} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
