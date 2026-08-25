'use client';
// import Image from "next/image";

import { useState } from 'react';

export default function Home() {
  const [test, setTest] = useState<number>(10);
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500">
          <span className="text-xl font-bold text-white">N</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">
          Tailwind is working! {test}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Đây là component Next.js sử dụng Tailwind CSS để styling.
        </p>

        <button
          type="button"
          className="mt-6 w-full rounded-xl bg-pink-500 px-4 py-3 font-medium text-white transition hover:bg-pink-600 active:scale-[0.98]"
        >
          Test Tailwind
        </button>
      </div>
    </main>
  );
}
