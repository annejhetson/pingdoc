'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { auth, db, storage } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { uploadFile } from '@/lib/utils/uploadFile';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { PdfViewer } from '@/components/PdfViewer';

interface Document {
  id: string;
  originalPath: string;
  recipientEmail: string;
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'DECLINED' | 'EXPIRED';
  sentAt: Date | null;
  signedAt: Date | null;
}

export default function Dashboard() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Create a query for the user's documents
    const q = query(
      collection(db, 'requests'),
      where('senderUid', '==', user.uid),
      orderBy('sentAt', 'desc')
    );

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          sentAt: doc.data().sentAt?.toDate() || null,
          signedAt: doc.data().signedAt?.toDate() || null,
        })) as Document[];
        setDocuments(docs);
      },
      (error) => {
        console.error('Error fetching documents:', error);
        setError('Failed to load documents. Please try again.');
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const loadPreview = async () => {
      if (!selectedDocument) {
        setPreviewUrl(null);
        return;
      }

      try {
        const storageRef = ref(storage, selectedDocument.originalPath);
        const url = await getDownloadURL(storageRef);
        setPreviewUrl(url);
      } catch (err) {
        console.error('Error getting download URL:', err);
        setError('Failed to load document preview. Please try again.');
      }
    };

    loadPreview();
  }, [selectedDocument]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setError('No file selected');
      return;
    }

    if (!user) {
      setError('You must be logged in to upload files');
      return;
    }

    const file = files[0];

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setError(null);
      setIsUploading(true);
      const downloadURL = await uploadFile(file, user.uid);
      console.log('File uploaded successfully:', downloadURL);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#fafafa] p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-light">Dashboard</h1>
            <button
              onClick={() => auth.signOut()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
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
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Document List */}
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mb-8 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <p className="text-sm text-gray-500">
                  {isUploading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    'Drag and drop a PDF file here'
                  )}
                </p>
              </div>

              {documents.length === 0 ? (
                <p className="text-center text-sm text-gray-500">No documents yet</p>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocument(doc)}
                      className={`cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50 ${
                        selectedDocument?.id === doc.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {doc.originalPath.split('/').pop()?.replace(/^\d+-/, '')}
                          </p>
                          <p className="text-sm text-gray-500">
                            Status:{' '}
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1).toLowerCase()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(doc.sentAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PDF Preview */}
            <div className="h-[800px] rounded-lg border border-gray-200 bg-white p-4">
              {selectedDocument && previewUrl ? (
                <PdfViewer url={previewUrl} width={600} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-gray-500">Select a document to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
