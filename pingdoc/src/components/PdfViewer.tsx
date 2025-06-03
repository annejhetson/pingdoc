'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface PdfViewerProps {
  url: string;
  width?: number;
}

export function PdfViewer({ url, width = 800 }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const renderTaskRef = useRef<{ promise: Promise<void>; cancel: () => void } | null>(null);
  const currentPageRef = useRef<PDFPageProxy | null>(null);

  // Load the PDF document
  useEffect(() => {
    let mounted = true;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cancel any existing render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        // Cleanup current page
        if (currentPageRef.current) {
          currentPageRef.current.cleanup();
          currentPageRef.current = null;
        }

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (mounted) {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (mounted) {
          setError('Failed to load PDF. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      mounted = false;
      // Cleanup on unmount
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (currentPageRef.current) {
        currentPageRef.current.cleanup();
      }
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [url]);

  // Render the current page
  useEffect(() => {
    let mounted = true;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        // Cancel any existing render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        // Cleanup current page
        if (currentPageRef.current) {
          currentPageRef.current.cleanup();
          currentPageRef.current = null;
        }

        const page = await pdfDoc.getPage(currentPage);
        currentPageRef.current = page;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Could not get canvas context');
        }

        const viewport = page.getViewport({
          scale: width / page.getViewport({ scale: 1.0 }).width,
        });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });

        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (!mounted) {
          // If component unmounted during render, cleanup
          page.cleanup();
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('cancelled')) {
          // Render was cancelled, ignore the error
          return;
        }
        console.error('Error rendering page:', err);
        if (mounted) {
          setError('Failed to render PDF page. Please try again.');
        }
      }
    };

    renderPage();

    return () => {
      mounted = false;
      // Cleanup on effect cleanup
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, currentPage, width]);

  if (loading) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center" role="status">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4" role="alert">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas
        ref={canvasRef}
        className="max-w-full rounded-lg shadow-lg"
        role="img"
        aria-label="PDF document viewer"
      />
      {numPages > 1 && (
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(numPages, prev + 1))}
            disabled={currentPage === numPages}
            className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
