import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Card from "../../components/Card";
import axios from "axios";
import { Link } from "react-router-dom"; // <-- Import Link

// ---------------- Types ----------------
export type PostType = {
    _id: string;
    title: string;
    subtitle?: string;
    content?: string;
    images?: string[];
    date: string; // ISO
    createdAt?: string;
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
    dateISO: pdf.date,
    isPdf: true,
    pdfUrl: pdf.pdfUrl,
    pdf,
});

const getMonthName = (monthNumber: number, locale: string = "en-US") => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString(locale, { month: "long" });
};

// Placeholder for category translations
const categoryTranslations: Record<string, string> = {
    // Add your translations here, e.g.:
    editorial: "தலையங்கம்",
    thalaiyangam: "தலையங்கம்",
    "special-reports": "சிறப்பு அறிக்கைகள்",
    // etc.
};

// ---------------- PDF Card Component (for displaying PDF items) ----------------
const SERVER_URL_STATIC = import.meta.env.VITE_API;

interface PdfItemCardProps {
    item: EditorialItem;
}
const PdfItemCard: React.FC<PdfItemCardProps> = ({ item }) => {
    const imageUrl = item.image ? `${SERVER_URL_STATIC}${item.image}` : `https://placehold.co/400x300/E0E0E0/333333?text=No+Image`;

    // Opens PDF in Google Viewer for better cross-device compatibility
    const viewerUrl = item.pdfUrl ? `https://docs.google.com/viewer?url=${encodeURIComponent(SERVER_URL_STATIC + item.pdfUrl)}&embedded=true` : '#';

    return (
        <a
            href={viewerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out bg-white group"
        >
            <div className="relative aspect-[4/3] overflow-hidden">
                <img src={imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="p-4">
                <h3 className="text-md font-bold text-gray-800 line-clamp-2">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{new Date(item.dateISO).toLocaleDateString('en-GB')}</p>
                <span className="text-xs font-semibold text-red-600 mt-2 inline-block">PDF</span>
            </div>
        </a>
    );
};

// ---------------- Main Component ----------------
export default function Editorial() {
    const SERVER_URL = import.meta.env.VITE_API;

    const [chronological, setChronological] = useState<ChronologicalYear[]>([]);
    const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
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
                        const sorted = [...chronRes.data].sort((a, b) => b.year - a.year);
                        setChronological(sorted);
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

    const editorialMap = useMemo(() => {
        const map: Record<number, Record<number, EditorialItem[]>> = {};

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

        pdfs.forEach((pdf) => {
            if (!isEditorialCat(pdf.category?.en)) return;
            const dateObj = safeParseDate(pdf.date);
            if (!dateObj) return;
            const y = dateObj.getFullYear();
            const mm = dateObj.getMonth() + 1;
            map[y] = map[y] || {};
            map[y][mm] = map[y][mm] || [];
            map[y][mm].push(makeEditorialItemFromPdf(pdf));
        });

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

    const handleYearSelect = (y: number | null) => {
        setSelectedYear(y);
        setSelectedMonth(null); // Reset month when year changes
    };

    const handleMonthSelect = (m: number) => {
        setSelectedMonth(m);
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-5">
                <Header text="தலையங்கம்" urlPath="Editorial" />
                <div className="flex justify-center items-center min-h-screen text-highlight-1">
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

    const itemsToDisplay = (selectedYear && selectedMonth && editorialMap[selectedYear]?.[selectedMonth]) || [];

    return (
        <div className="flex flex-col gap-5">
            <Header text="தலையங்கம்" urlPath="Editorial" />
            <div className="flex px-4 mt-2 gap-4 flex-col md:flex-row">
                
                {/* --- Desktop Sidebar --- */}
                <aside className="hidden md:flex flex-row gap-4 w-1/4 xl:w-1/5 shrink-0">
                    <div className="w-24 border-r pr-3">
                        <h3 className="font-bold mb-2 text-lg">Years</h3>
                        {yearSummaries.length > 0 ? (
                            <ul className="mb-4 text-2xl">
                                {yearSummaries.map((y) => (
                                    <li
                                        key={y.year}
                                        onClick={() => handleYearSelect(y.year)}
                                        className={`cursor-pointer mb-2 font-medium transition-colors duration-150 py-1 ${selectedYear === y.year ? "text-blue-600 underline" : "text-gray-800 hover:text-blue-500"}`}
                                    >
                                        {y.year}
                                    </li>
                                ))}
                            </ul>
                        ) : (<p className="text-sm text-gray-500">No years found.</p>)}
                    </div>
                    <div className="flex-1 pl-4">
                        <h3 className="font-bold mb-2 text-lg">Months</h3>
                        {selectedYearSummary ? (
                            <ul className="pl-0">
                                {selectedYearSummary.months.map((m) => (
                                    <li key={m.month}
                                        onClick={() => handleMonthSelect(m.month)}
                                        className={`cursor-pointer py-1 border-b hover:text-blue-600 ${selectedMonth === m.month ? "text-blue-600 font-semibold" : ""}`}
                                    >
                                        {getMonthName(m.month)}{" "}
                                        <span className="ml-1 text-sm text-gray-500">
                                            ({m.count})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (<p className="text-sm text-gray-500">Select a year.</p>)}
                    </div>
                </aside>

                {/* --- Mobile/Tablet View --- */}
                <aside className="md:hidden flex flex-col gap-4 w-full">
                    <div className="flex flex-row justify-between items-center mb-4 border-b pb-4">
                        <h3 className="font-bold text-lg">
                           {selectedYear ? (
                                <>
                                    <span onClick={() => handleYearSelect(null)} className="cursor-pointer text-blue-600">
                                        {selectedYear}
                                    </span>
                                    {selectedMonth && (
                                        <>
                                            <span className="text-gray-400 font-normal"> / </span>
                                            <span
                                                onClick={(e) => { e.stopPropagation(); setSelectedMonth(null); }}
                                                className="cursor-pointer text-blue-600"
                                            >
                                                {getMonthName(selectedMonth)}
                                            </span>
                                        </>
                                    )}
                                </>
                            ) : ("Years")}
                        </h3>
                    </div>
                    
                    {!selectedYear && (
                        <div className="flex flex-row flex-wrap gap-2 text-center text-sm">
                            {yearSummaries.map((y) => (
                                <button key={y.year} onClick={() => handleYearSelect(y.year)} className="px-4 py-2 border rounded-full transition-colors duration-150 bg-background-to hover:bg-gray-200 text-gray-800">
                                    {y.year}
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedYear && !selectedMonth && (
                        <div className="flex flex-row flex-wrap gap-2 text-center text-sm">
                            {selectedYearSummary?.months.map((m) => (
                                <button key={m.month} onClick={() => handleMonthSelect(m.month)} className="px-4 py-2 border rounded-full transition-colors duration-150 bg-background-to hover:bg-gray-200 text-gray-800">
                                    {getMonthName(m.month)}
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                {/* --- Main Content Area --- */}
                <main className="flex-1 md:pl-0">
                    {/* The existing code for desktop grid view */}
                    <div className="hidden md:block">
                        {selectedYear && selectedMonth ? (
                            <>
                                <h2 className="text-2xl font-bold mb-4">
                                    {getMonthName(selectedMonth)} {selectedYear}
                                </h2>
                                {itemsToDisplay.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {itemsToDisplay.map((item) =>
                                            item.isPdf ? (
                                                <PdfItemCard key={item._id} item={item} />
                                            ) : (
                                                item.article && <Card
                                                    key={item._id}
                                                    id={item.article._id}
                                                    title={item.article.title}
                                                    subtitle={item.article.subtitle}
                                                    author={item.article.author}
                                                    category={item.article.category}
                                                    date={item.article.date}
                                                    image={item.article.images?.[0]}
                                                />
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-600">No editorials found for {getMonthName(selectedMonth)} {selectedYear}.</p>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="p-4 text-center text-gray-500">Please select a month to view editorials.</p>
                            </div>
                        )}
                    </div>
                    
                    {/* --- Mobile/Tablet List view (New) --- */}
                    <div className="md:hidden flex flex-col gap-3">
                        {selectedYear && selectedMonth && itemsToDisplay.length > 0 ? (
                            itemsToDisplay.map((item) => (
                                <Link to={`/posts/${item.isPdf ? 'pdf' : item.article?._id}`} key={item._id}>
                                    <div className="w-full flex gap-4 p-2 rounded shadow-lg bg-background-to hover:bg-white/50 duration-150 transition-colors ease-in-out">
                                        {/* Image Section */}
                                        {(item.image || item.article?.images?.[0]) && (
                                            <div className="flex-shrink-0 w-24 h-24">
                                                <img
                                                    src={item.isPdf ? `${SERVER_URL_STATIC}${item.image}` : item.article?.images?.[0]}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover rounded"
                                                />
                                            </div>
                                        )}

                                        {/* Text Section */}
                                        <div className="flex flex-col justify-center">
                                            <h2 className="text-lg font-bold">
                                                {item.title}
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                {new Date(item.dateISO).toLocaleDateString('en-GB')}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {categoryTranslations[item.article?.category.toLowerCase() || ''] || item.article?.category || 'Editorial'}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-center text-gray-600 mt-4">
                                {selectedYear && selectedMonth
                                    ? `No editorials found for ${getMonthName(selectedMonth)} ${selectedYear}.`
                                    : 'Please select a year and month to view editorials.'}
                            </p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}