import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
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

// ---------------- Component ----------------
export default function Editorial() {
    const SERVER_URL = import.meta.env.VITE_API;
    const navigate = useNavigate();

    const [chronological, setChronological] = useState<ChronologicalYear[]>([]);
    const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // New state for mobile
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
        // On mobile, navigate to the specific month's page
        if (selectedYear) {
            navigate(`/editorial/${selectedYear}/${m}`);
        }
    };

    const handleDesktopMonthNav = (y: number, m: number) => {
        navigate(`/editorial/${y}/${m}`);
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

    return (
        <div className="flex flex-col gap-5">
            <Header text="தலையங்கம்" urlPath="Editorial" />

            <div className="flex px-4 mt-2 gap-4 flex-col md:flex-row">
                {/* Desktop Sidebar (hidden on mobile/tablet) */}
                <aside className="hidden md:flex flex-row gap-4 w-1/4 xl:w-1/5 shrink-0">
                    <div className="w-24 border-r pr-3">
                        <h3 className="font-bold mb-2 text-lg">Years</h3>
                        {yearSummaries.length > 0 ? (
                            <ul className="mb-4 text-2xl">
                                {yearSummaries.map((y) => (
                                    <li
                                        key={y.year}
                                        onClick={() => handleYearSelect(y.year)}
                                        className={`cursor-pointer mb-2 font-medium transition-colors duration-150 py-1 text-gray-800 hover:text-blue-500`}
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
                                    <li key={m.month} className="mb-2">
                                        <button
                                            onClick={() => handleDesktopMonthNav(selectedYearSummary.year, m.month)}
                                            className="w-full text-left border-b pb-1 hover:text-blue-600"
                                        >
                                            {getMonthName(m.month)}{" "}
                                            <span className="ml-1 text-sm text-gray-500">
                                                ({m.count})
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (<p className="text-sm text-gray-500">Select a year.</p>)}
                    </div>
                </aside>

                {/* Mobile/Tablet View (hidden on desktop) */}
                <aside className="md:hidden flex flex-col gap-4 w-full">
                    <div className="flex flex-row justify-between items-center mb-4 border-b pb-4">
                        <h3 className="font-bold text-lg">
                            {selectedYear ? (
                                <span onClick={() => handleYearSelect(null)} className="cursor-pointer text-gray-800">
                                    {selectedYear}
                                    {selectedMonth && (
                                        <>
                                            <span className="text-gray-400 font-normal"> / </span>
                                            <span onClick={() => setSelectedMonth(null)} className="cursor-pointer text-gray-800">
                                                {getMonthName(selectedMonth)}
                                            </span>
                                        </>
                                    )}
                                </span>
                            ) : (
                                "Years"
                            )}
                        </h3>
                    </div>

                    {!selectedYear && (
                        <div className="flex flex-row flex-wrap gap-2 text-center text-sm">
                            {yearSummaries.length > 0 ? (
                                yearSummaries.map((y) => (
                                    <button
                                        key={y.year}
                                        onClick={() => handleYearSelect(y.year)}
                                        className="px-4 py-2 border rounded-full transition-colors duration-150 bg-background-to hover:bg-gray-200 text-gray-800"
                                    >
                                        {y.year}
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 w-full">No years found.</p>
                            )}
                        </div>
                    )}

                    {selectedYear && !selectedMonth && (
                        <div className="flex flex-row flex-wrap gap-2 text-center text-sm">
                            {selectedYearSummary ? (
                                selectedYearSummary.months.map((m) => (
                                    <button
                                        key={m.month}
                                        onClick={() => handleMonthSelect(m.month)}
                                        className="px-4 py-2 border rounded-full transition-colors duration-150 bg-background-to hover:bg-gray-200 text-gray-800"
                                    >
                                        {getMonthName(m.month)}
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 w-full">No months found for this year.</p>
                            )}
                        </div>
                    )}
                </aside>

                <main className="flex-1 pl-4 md:pl-0">
                    <h2 className="text-2xl font-bold mb-4 hidden md:block">
                        {/* {selectedYear ? `${selectedYear} Editorials` : "Select a Year"} */}
                    </h2>
                    {selectedYear && selectedYearSummary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* The logic to display items for the selected month will go here.
                                The current logic redirects, so this block is a placeholder.
                            */}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}