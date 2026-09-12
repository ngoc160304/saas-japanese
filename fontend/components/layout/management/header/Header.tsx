interface IProp {
  title: string;
  description: string;
  children?: React.ReactNode;
}
const Header = (props: IProp) => {
  const { title, description, children } = props;
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
          <a href="admin_courses.html" className="hover:text-slate-600">
            Admin
          </a>
          <span>/</span>
          <span className="text-slate-800">Courses</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="text-slate-500 font-medium text-sm mt-0.5">{description}</p>
      </div>

      <div className="flex items-center gap-3">
        {children}

        <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 bg-white border border-slate-100 rounded-2xl shadow-soft">
          <img
            className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-100"
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXey54ntpUDXm4-90R7kTcAcKto9g6_geFoLNBeHymOA3iBMxH9AWkI8I&s=10"
            alt="Admin"
          />
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">Admin Sarah</p>
            <p className="text-[10px] text-slate-400 font-medium">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;
