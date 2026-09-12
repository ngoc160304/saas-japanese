import BrandLogo from './BrandLogo';
import SideBarItem from './SideBarItem';

export interface ISidebarItem {
  icon: React.ReactNode;
  title: string;
  href: string;
}

interface IProp {
  role: string;
  title: string;
  sidebarItems: ISidebarItem[];
}

const SideBar = (props: IProp) => {
  const { sidebarItems, role, title } = props;
  return (
    <aside
      id="sidebar"
      className="w-full xl:w-64 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 p-5 xl:min-h-screen z-30 transition-all duration-300"
    >
      <div>
        <BrandLogo role={role} title={title} />

        <div className="px-3 mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {props.title}
          </span>
        </div>

        <nav id="navMenu" className="space-y-1.5">
          {sidebarItems.map((item: ISidebarItem, index: number) => {
            return <SideBarItem href={item.href} title={item.title} icon={item.icon} key={index} />;
          })}
        </nav>
      </div>
    </aside>
  );
};

export default SideBar;
