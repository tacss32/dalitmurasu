import React, { useEffect, useState, useMemo } from "react";
import Header from "../../components/Header";
import axios from "axios";
import { MdClose } from 'react-icons/md';
import { Link } from "react-router-dom"; // Import Link for the Subscribe button

// Import necessary modules from @react-pdf-viewer
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

// Import styles for the viewer and default layout
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// ---------------- Types ----------------
export interface PdfEntry {
    _id: string;
    title: string;
    subtitle?: string;
    date: string; // ISO publication date
    category: { en: string; ta: string };
    imageUrl?: string;
    pdfUrl: string; // Crucial for embedding
    createdAt: string; // ISO upload timestamp
}

// Unified Archive item (for chronological view)
type ArchiveItem = {
    _id: string;
    title: string;
    subtitle?: string;
    imageUrl?: string | undefined;
    dateISO: string; // unify date for sorting
    pdfUrl?: string; // pdfUrl is optional now since backend may not return it
    pdf: PdfEntry; // Keep original PDF for direct access if needed
};

// Minimal inline PDF Card (square-ish) for display
interface PdfCardProps {
    item: ArchiveItem;
    className?: string;
    onClick: (item: ArchiveItem) => void;
}
const SERVER_URL = import.meta.env.VITE_API;
const PdfCard: React.FC<PdfCardProps> = ({ item, className, onClick }) => {
    const d = new Date(item.dateISO);
    const dateStr = d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    return (
        <div
            onClick={() => onClick(item)}
            className={
                "border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white flex flex-col cursor-pointer transform hover:scale-105" +
                (className || "")
            }
        >
            <img
                src={SERVER_URL + item.imageUrl}
                alt={item.title}
                className="w-full h-auto object-contain mb-5 rounded-lg border border-gray-100"
                onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/400x300/E0E0E0/333333?text=No+Image`;
                }}
            />
            <h3
                className="text-2xl font-bold text-gray-900 mb-2 truncate"
            >
                {item.title}
            </h3>
            <p className="text-gray-600 text-md mb-1">
                {dateStr}
            </p>
        </div>
    );
};

// ---------------- Helpers ----------------
const getMonthName = (monthNumber: number, locale: string = "en-US") => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString(locale, { month: "long" });
};

// ---------------- Component ----------------
export default function Archive() {
    const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for managing the currently selected year and month
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

    const [activePdf, setActivePdf] = useState<PdfEntry | null>(null);
    const [viewMessage, setViewMessage] = useState<string | null>(null);
    const [loadingPdf, setLoadingPdf] = useState(false);
    // New state for the subscription popup
    const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);

    // const SERVER_URL = import.meta.env.VITE_API;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        fetchArchivePdfs();
    }, []);

    useEffect(() => {
        if (activePdf || showSubscriptionPopup) { // Add showSubscriptionPopup to modal-open check
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
    }, [activePdf, showSubscriptionPopup]);

    const fetchArchivePdfs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${SERVER_URL}api/pdf-uploads`);
            if (res.data) {
                const archiveOnly: PdfEntry[] = res.data.filter(
                    (p: PdfEntry) => p.category?.en === "Archive"
                );
                setPdfs(archiveOnly);
            } else {
                setError("Failed to load Archive PDFs.");
            }
        } catch (err: any) {
            console.error("Fetch Archive PDFs error:", err);
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unexpected error loading Archive PDFs."
            );
        } finally {
            setLoading(false);
        }
    };

    // Build map: year -> month -> Archive items (pdfs)
    const archiveMap = useMemo(() => {
        const map: Record<number, Record<number, ArchiveItem[]>> = {};
        pdfs.forEach((pdf) => {
            const date = new Date(pdf.date || pdf.createdAt);
            const y = date.getFullYear();
            const mm = date.getMonth() + 1;
            map[y] = map[y] || {};
            map[y][mm] = map[y][mm] || [];
            map[y][mm].push({
                _id: pdf._id,
                title: pdf.title,
                subtitle: pdf.subtitle,
                imageUrl: pdf.imageUrl,
                dateISO: pdf.date || pdf.createdAt,
                pdfUrl: pdf.pdfUrl,
                pdf: pdf,
            });
        });
        Object.keys(map).forEach((yStr) => {
            const y = Number(yStr);
            Object.keys(map[y]).forEach((mStr) => {
                const m = Number(mStr);
                map[y][m].sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
            });
        });
        return map;
    }, [pdfs]);

    // Build year summary list with counts per month (for sidebar)
    const yearSummaries = useMemo(() => {
        const years = Object.keys(archiveMap)
            .map(Number)
            .sort((a, b) => b - a);
        return years.map((y) => {
            const months = Object.keys(archiveMap[y] || {})
                .map(Number)
                .sort((a, b) => b - a);
            return {
                year: y,
                months: months.map((m) => ({ month: m, count: archiveMap[y][m]?.length || 0 })),
            };
        });
    }, [archiveMap]);
    
    // Helper to get items for a specific month (used in month-detail view)
    const getItemsForMonth = (year: number, month: number) => {
        return archiveMap[year]?.[month] || [];
    };

    const handleCardClick = async (item: ArchiveItem) => {
        setLoadingPdf(true);
        setViewMessage(null);
        setActivePdf(null);
        setShowSubscriptionPopup(false); // Close any existing popup

        // IMPORTANT: Use 'clientToken' as stored by ClientLogin.tsx
        const token = localStorage.getItem('clientToken'); 
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        try {
            const res = await axios.get(`${SERVER_URL}api/pdf-uploads/access/${item._id}`, { headers });
            if (res.status === 200) {
                setActivePdf(res.data);
            }
        } catch (err: any) {
            console.error('Error fetching PDF with access:', err);
            if (err?.response) {
                if (err.response.status === 401) {
                    setViewMessage("Login required to view this PDF.");
                } else if (err.response.status === 403) {
                    // This is where we trigger the subscription popup
                    setShowSubscriptionPopup(true);
                } else {
                    setViewMessage("An error occurred while fetching the PDF.");
                }
            } else {
                setViewMessage("Network error. Please try again.");
            }
        } finally {
            setLoadingPdf(false);
        }
    };

    const handleClosePdfViewer = () => {
        setActivePdf(null);
    };

    const handleYearSelect = (y: number) => {
        setSelectedYear(y);
        setSelectedMonth(null); // Reset month selection when a new year is chosen
    };
    
    const handleMonthSelect = (m: number) => {
        setSelectedMonth(m);
    };

    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        renderToolbar: (_Toolbar) => <></>,
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen text-highlight-1">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-highlight-2"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-5">
                <Header text="தலித் முரசு களஞ்சியம் " urlPath="Archive" />
                <p className="p-4 text-red-600 text-center">{error}</p>
            </div>
        );
    }

    // Check if there are no archive PDFs at all
    if (pdfs.length === 0) {
        return (
            <div className="flex flex-col gap-5">
                <Header text="தலித் முரசு களஞ்சியம் (PDFs)" urlPath="Archive" />
                <p className="p-4 text-center text-gray-600">No Archive PDFs found.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <Header text="தலித் முரசு களஞ்சியம் " urlPath="Archive" />

            <div className="flex px-4 mt-2 gap-4">
                {/* Left Sidebar - Year & Month Navigation */}
                <aside className="flex flex-row gap-4 shrink-0">
                    {/* Years Column */}
                    <div className="w-24">
                        <h3 className="font-bold mb-2">Years</h3>
                        {yearSummaries.length > 0 ? (
                            <ul className="mb-4">
                                {yearSummaries.map((y) => (
                                    <li
                                        key={y.year}
                                        onClick={() => handleYearSelect(y.year)}
                                        className={`cursor-pointer font-medium transition-colors duration-150 py-1 ${
                                            selectedYear === y.year
                                                ? "text-blue-600 underline"
                                                : "text-gray-800 hover:text-blue-500"
                                        }`}
                                    >
                                        {y.year}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No years found.</p>
                        )}
                    </div>
                    
                    {/* Months Column */}
                    <div className="flex-1 border-l pl-4">
                        <h3 className="font-bold mb-2">Months</h3>
                        {selectedYear && archiveMap[selectedYear] ? (
                            <ul>
                                {Object.keys(archiveMap[selectedYear])
                                    .map(Number)
                                    .sort((a, b) => b - a)
                                    .map((m) => (
                                        <li
                                            key={m}
                                            onClick={() => handleMonthSelect(m)}
                                            className={`cursor-pointer py-1 border-b hover:text-blue-600 ${
                                                selectedMonth === m ? "text-blue-600 font-semibold underline" : ""
                                            }`}
                                        >
                                            {getMonthName(m)} <span className="ml-1 text-sm text-gray-500">({archiveMap[selectedYear][m]?.length || 0})</span>
                                        </li>
                                    ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">Select a year.</p>
                        )}
                    </div>
                </aside>

                {/* Main content area for selected month's PDFs */}
                <main className="flex-1 pl-4 border-l border-gray-200">
                    {selectedYear && selectedMonth ? (
                        <>
                            <h2 className="text-2xl font-bold mb-4">
                                {getMonthName(selectedMonth)} {selectedYear} Archives
                            </h2>

                            {getItemsForMonth(selectedYear, selectedMonth).length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {getItemsForMonth(selectedYear, selectedMonth).map((item) => (
                                        <PdfCard key={item._id} item={item} onClick={handleCardClick} className="aspect-[2/3]" />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-600">
                                    No Archive PDFs found for {getMonthName(selectedMonth)} {selectedYear}.
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="p-4 text-center text-gray-600">Please select a year and a month from the sidebar to view archives.</p>
                    )}
                </main>
            </div>

            {/* Conditional loading and error messages */}
            {loadingPdf && (
                <div className="flex justify-center items-center min-h-screen text-highlight-1">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-highlight-2"></div>
                </div>
            )}

            {viewMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
                    <div className="relative p-6 bg-white rounded-lg shadow-xl text-center">
                        <p className="text-lg font-semibold text-gray-800 mb-4">{viewMessage}</p>
                        <button
                            onClick={() => setViewMessage(null)}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
                            aria-label="Close message"
                        >
                            <MdClose className="text-2xl" />
                        </button>
                    </div>
                </div>
            )}

            {/* PDF Viewer Modal */}
            {activePdf && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
                    <div className="relative w-full max-w-5xl h-screen bg-white rounded-none shadow-xl overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 rounded-t-lg">
                            <h2 className="text-xl font-semibold text-gray-800 truncate">
                                {activePdf.title || "PDF Viewer"}
                            </h2>
                            <button
                                onClick={handleClosePdfViewer}
                                className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
                                aria-label="Close PDF viewer"
                            >
                                <MdClose className="text-2xl" />
                            </button>
                        </div>
                        <div className="flex-grow w-full overflow-auto">
                            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                                {activePdf.pdfUrl ? (
                                    <Viewer
                                        fileUrl={SERVER_URL + activePdf.pdfUrl}
                                        plugins={[defaultLayoutPluginInstance]}
                                    />
                                ) : (
                                    <div className="text-center p-6 text-red-600">
                                        PDF file not available or corrupted.
                                    </div>
                                )}
                            </Worker>
                        </div>
                    </div>
                </div>
            )}

            {/* Free View Limit Exceeded Subscription Popup */}
            {showSubscriptionPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
                    <div className="w-11/12 max-w-md p-6 bg-white rounded-lg shadow-xl md:w-3/4">
                    
                        <h2 className="text-2xl font-bold text-gray-900">Free View Limit Exceeded</h2>
                        <p className="mt-4 text-gray-700">
                            You've read your free preview of this PDF. To continue reading and unlock unlimited access to all PDF, please subscribe.
                        </p>
                        <div className="flex flex-col gap-4 mt-6 sm:flex-row sm:justify-end">
                            <button
                                onClick={() => setShowSubscriptionPopup(false)}
                                className="px-6 py-2 font-semibold text-gray-700 transition duration-200 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Close
                            </button>
                            <Link
                                to="/subscriptions"
                                className="px-6 py-2 text-center font-bold text-white transition duration-200 bg-red-600 rounded-lg hover:bg-red-700"
                                onClick={() => setShowSubscriptionPopup(false)}
                            >
                                Subscribe
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}