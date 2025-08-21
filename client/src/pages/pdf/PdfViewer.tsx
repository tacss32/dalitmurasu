import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import axios from "axios";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PdfViewer() {
  const { id } = useParams<{ id: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API}api/pdf-uploads/${id}`);
        if (res.data.success) {
          setPdfUrl(res.data.data.pdfUrl);
        }
      } catch (err) {
        console.error("Failed to fetch PDF:", err);
      }
    };
    fetchPdf();
  }, [id]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  if (!pdfUrl) return <p className="text-center mt-10">Loading PDF...</p>;

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold my-4">PDF Viewer</h1>
      <div className="border shadow-md p-4 bg-gray-100">
        <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from({ length: numPages }, (_, i) => (
            <Page key={i + 1} pageNumber={i + 1} width={800} />
          ))}
        </Document>
      </div>
    </div>
  );
}
