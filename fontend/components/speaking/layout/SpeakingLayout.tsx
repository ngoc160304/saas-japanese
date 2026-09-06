interface SpeakingLayoutProps {
  children: React.ReactNode;
}

export default function SpeakingLayout({ children }: SpeakingLayoutProps) {
  return (
    <main className="min-h-screen bg-[#F4F6F9] p-4 md:p-6">
      <div
        className="
          mx-auto
          max-w-7xl
          rounded-[16px]
          border
          border-[#E2E8F0]
          bg-white
          p-4
          shadow-[0px_4px_20px_rgba(0,0,0,0.03)]
          md:p-5
        "
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#1E293B]">HỘI THOẠI VỚI AI</h1>

            <p className="mt-1 text-xs text-[#64748B]">Luyện nói tiếng Nhật với AI</p>
          </div>

          <span className="text-xl font-semibold text-[#2B4C7E]">THEO CHỦ ĐỀ</span>
        </div>

        {/* Content */}
        <div
          className="
            rounded-[16px]
            border
            border-[#E2E8F0]
            bg-white
            p-4
            md:p-6
          "
        >
          {children}
        </div>
      </div>
    </main>
  );
}
