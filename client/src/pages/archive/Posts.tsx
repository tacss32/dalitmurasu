import { useEffect, useState } from "react";
import { useParams} from "react-router-dom"; // Removed useSearchParams
import Header from "../../components/Header";
import Card from "../../components/Card";
import axios from "axios";
// import { MdClose } from 'react-icons/md'; // No longer needed for PDF viewer close button

// Article type
type PostType = {
  _id: string;
  title: string;
  subtitle?: string;
  content?: string;
  images?: [string];
  createdAt: string;
  author: string;
  category: string;
};

// PDF type (simplified, as actual viewing moved to Archive.tsx)
interface PdfEntry {
  _id: string;
  title: string;
  subtitle?: string;
  date: string;
  category: { en: string; ta: string };
  imageUrl?: string;
  pdfUrl: string;
  createdAt: string;
}

// Union type for articles and PDFs
type ContentItem = (PostType & { type: "article" }) | (PdfEntry & { type: "pdf" });

type CategorizedContent = {
  category: string;
  items: ContentItem[];
};

type ChronologicalData = {
  year: number;
  data: {
    months: {
      month: number;
      categories: {
        category: string;
        posts: PostType[];
      }[];
    }[];
  };
};

export default function Posts() {
  const { year, month } = useParams<{ year: string; month: string }>();
  // const navigate = useNavigate();
  // const [searchParams, setSearchParams] = useSearchParams(); // Removed useSearchParams
  const [categorizedContent, setCategorizedContent] = useState<CategorizedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const SERVER_URL = import.meta.env.VITE_API;

  // State for displaying a single PDF - REMOVED, as PDF viewing is now in Archive.tsx
  // const [activePdf, setActivePdf] = useState<PdfEntry | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // const pdfIdFromUrl = searchParams.get('pdfId'); // Removed

    // if (pdfIdFromUrl) { // Removed
    //   fetchPdfById(pdfIdFromUrl); // Removed
    // } else
    if (year && month) {
      // Always fetch and filter all monthly content (articles + PDFs)
      fetchAndFilterMonthlyContent(parseInt(year), parseInt(month));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]); // Simplified dependencies

  // fetchPdfById function - REMOVED
  // const fetchPdfById = async (pdfId: string) => { ... }

  const fetchAndFilterMonthlyContent = async (selectedYear: number, selectedMonth: number) => {
    setLoading(true);
    setError(null);
    // setActivePdf(null); // Clear active PDF if we're fetching monthly content - REMOVED

    try {
      const allContentMap = new Map<string, ContentItem[]>();

      // 1. Fetch chronological articles
      try {
        const res = await fetch(`${SERVER_URL}api/chronological`);
        const responseData: { success: boolean; data: ChronologicalData[] } = await res.json();

        if (responseData.success && responseData.data) {
          responseData.data.forEach((yearData) => {
            if (yearData.year === selectedYear) {
              yearData.data.months.forEach((monthData) => {
                if (monthData.month === selectedMonth) {
                  monthData.categories.forEach((catGroup) => {
                    const existingItems = allContentMap.get(catGroup.category) || [];
                    const articlesForCategory = catGroup.posts.map((post) => ({
                      ...post,
                      type: "article" as const,
                    }));
                    allContentMap.set(catGroup.category, [...existingItems, ...articlesForCategory]);
                  });
                }
              });
            }
          });
        } else {
          console.warn("Failed to fetch chronological posts or data is empty.");
        }
      } catch (err) {
        console.error("Error fetching chronological posts:", err);
      }

      // 2. Fetch PDFs
      // We still fetch PDFs here to list them as cards, but clicking will no longer trigger local PDF display
      try {
        const pdfsRes = await axios.get(`${SERVER_URL}api/pdf-uploads`);
        if (pdfsRes.data.success) {
          const allPdfs: PdfEntry[] = pdfsRes.data.data;
          const filteredPdfs = allPdfs.filter((pdf) => {
            const pdfDate = new Date(pdf.date);
            const pdfYear = pdfDate.getFullYear();
            const pdfMonth = pdfDate.getMonth() + 1;
            return pdf.category.en === "Archive" && pdfYear === selectedYear && pdfMonth === selectedMonth;
          });

          if (filteredPdfs.length > 0) {
            const existingArchiveItems = allContentMap.get("Archive") || [];
            const pdfsAsContentItems = filteredPdfs.map((pdf) => ({ ...pdf, type: "pdf" as const }));
            allContentMap.set("Archive", [...existingArchiveItems, ...pdfsAsContentItems]);
          }
        } else {
          console.warn("Failed to fetch PDFs:", pdfsRes.data.message);
        }
      } catch (err) {
        console.error("Error fetching PDFs:", err);
      }

      // Consolidate and sort
      const consolidatedContent: CategorizedContent[] = [];
      Array.from(allContentMap.entries()).forEach(([category, items]) => {
        if (category === "Archive" || category !== "Editorial") { // Exclude Editorial from general display if not needed
          items.sort((a, b) => {
            const dateA = new Date(a.type === "article" ? a.createdAt : a.date).getTime();
            const dateB = new Date(b.type === "article" ? b.createdAt : b.date).getTime();
            return dateB - dateA;
          });
          consolidatedContent.push({ category, items });
        }
      });

      // Sort categories (e.g., Editorial first, then Archive, then others)
      consolidatedContent.sort((a, b) => {
        if (a.category === "Editorial") return -1;
        if (b.category === "Editorial") return 1;
        if (a.category === "Archive" && b.category !== "Editorial") return -1;
        if (b.category === "Archive" && a.category !== "Editorial") return 1;
        return 0; // Maintain original order for other categories
      });

      setCategorizedContent(consolidatedContent);

      if (allContentMap.size === 0) { // Removed check for pdfId in URL
        setError("No content found for this month.");
      }
    } catch (finalErr) {
      console.error("Overall error during content fetch:", finalErr);
      setError("An error occurred while fetching content.");
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNumber: number) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString("en-US", { month: "long" });
  };

  const displayMonthName = getMonthName(parseInt(month || "1"));

  // handleClosePdfViewer - REMOVED
  // const handleClosePdfViewer = () => { ... }


  return (
    <div className="flex flex-col gap-5">
      <Header text={`தலித் முரசு களஞ்சியம் ${displayMonthName} ${year}`} />

      <div className="container mx-auto p-4">
        {loading ? (
          <p className="text-center text-gray-700">
            {/* Simplified loading message */}
            {`${displayMonthName} ${year} க்கான உள்ளடக்கங்கள் ஏற்றப்படுகிறது...`}
          </p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : (
          // Display categorized content (articles and other PDFs)
          categorizedContent.length > 0 ? (
            categorizedContent.map((categoryGroup) => (
              <div key={categoryGroup.category} className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 border-b-2 pb-2">
                  {categoryGroup.category === "Archive"
                    ? ""
                    : categoryGroup.category === "Editorial"
                    ? "தலையங்கம்"
                    : categoryGroup.category}
                </h2>
                {categoryGroup.items.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categoryGroup.items.map((item) =>
                      item.type === "article" ? (
                        <Card
                          key={item._id}
                          id={item._id}
                          title={item.title}
                          subtitle={item.subtitle}
                          author={item.author}
                          category={item.category}
                          date={item.createdAt}
                          image={item.images?.[0]}
                        />
                      ) : (
                        // PDF card - now this card does nothing on click, or you can choose to make it navigate back to the main archive page or open externally
                        <div
                          key={item._id}
                          // Removed onClick handler to prevent direct PDF opening from here
                          className="rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out block cursor-pointer relative"
                          style={{ background: "#FFFDF6" }}
                        >
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
                          )}
                          <div
                            className="absolute bottom-0 left-0 right-0 p-4 rounded-b-lg"
                            style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
                          >
                            <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                            <p className="text-gray-300 text-xs mt-2">
                              {new Date(item.date).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "numeric",
                                year: "numeric",
                              })}
                              <span className="mx-1">•</span>
                              {item.category.en}
                              <span className="mx-1">•</span> admin
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">இந்த வகைக்கு உள்ளடக்கங்கள் எதுவும் இல்லை.</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">
              {displayMonthName} {year} க்கான உள்ளடக்கங்கள் எதுவும் இல்லை.
            </p>
          )
        )}
      </div>
    </div>
  );
}