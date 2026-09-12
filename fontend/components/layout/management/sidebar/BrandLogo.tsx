const BrandLogo = (props: { role: string; title: string }) => {
  const { role, title } = props;
  return (
    <div className="flex items-center justify-between xl:justify-start gap-3 px-2 py-2 mb-7">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 text-white">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
            {title}{' '}
            <span className="text-indigo-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 uppercase tracking-wider border border-indigo-100">
              {role}
            </span>
          </span>
        </div>
      </div>

      <button
        id="mobileMenuBtn"
        className="xl:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        aria-label="Toggle menu"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};
export default BrandLogo;
