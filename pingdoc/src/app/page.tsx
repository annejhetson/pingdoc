'use client';

import { Header } from './components/layout/Header';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebase';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If user is already signed in, redirect to documents
        router.push('/documents');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Successfully signed in:', result.user);
      router.push('/documents');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#fafafa] p-8">
      <Header />
      <div className="absolute right-8 bottom-8 max-w-[300px]">
        <p className="text-[13px] leading-tight font-light text-gray-500">
          Get your document signed in no time
        </p>
      </div>
      <button
        onClick={signInWithGoogle}
        className="cursor-pointer border-none bg-transparent p-0 text-[120px] leading-none font-normal tracking-tight text-black transition-colors hover:text-gray-800"
      >
        Sign In
      </button>
    </div>
  );
}
