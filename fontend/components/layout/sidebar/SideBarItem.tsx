import Link from 'next/link';

const SideBarItem = (props: { icon: React.ReactNode; title: string; href: string }) => {
  return (
    <Link
      href={props.href}
      className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium text-sm transition-all group"
    >
      {props.icon}
      <span>{props.title}</span>
    </Link>
  );
};

export default SideBarItem;
