import SideBar, { ISidebarItem } from '@/components/layout/management/sidebar/SideBar';

const sidebarItems: ISidebarItem[] = [
  {
    title: 'Student Portal',
    href: '/student/dashboard',
    icon: (
      <svg
        className="w-5 h-5 text-slate-400 group-hover:text-slate-700"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },

  {
    title: 'Categories (JLPT)',
    href: '/admin/categories-course',
    icon: (
      <svg
        className="w-5 h-5 text-slate-400 group-hover:text-slate-700"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    ),
  },

  {
    title: 'Courses',
    href: '/admin/courses',
    icon: (
      <svg
        className="w-5 h-5 text-slate-400 group-hover:text-slate-700"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    ),
  },

  {
    title: 'JLPT Exams',
    href: '/admin/exams',
    icon: (
      <svg
        className="w-5 h-5 text-slate-400 group-hover:text-slate-700"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
        />
      </svg>
    ),
  },

  {
    title: 'Users',
    href: '/admin/users',
    icon: (
      <svg
        className="w-5 h-5 text-slate-400 group-hover:text-slate-700"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen antialiased text-slate-800 bg-[#f3f6fa]">
      <div className="min-h-screen flex flex-col xl:flex-row bg-[#f3f6fa]">
        <SideBar role="Admin" title="Studify" sidebarItems={sidebarItems} />
        <main className="flex-1 p-4 md:p-6 lg:p-7 overflow-y-auto max-w-full">{children}</main>
      </div>
    </div>
  );
};
export default AdminLayout;
