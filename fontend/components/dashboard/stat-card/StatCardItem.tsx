import { StatusBadge } from '../status-badge/StatusBadge';

export interface IStatCardProp {
  quantity: number;
}

const StatCardItem = (props: IStatCardProp) => {
  const { quantity } = props;
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft shadow-hover">
      <p className="text-xs font-semibold text-slate-400">Total Courses</p>
      <p id="statTotalCourses" className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1">
        {quantity}
      </p>
      <StatusBadge status="active" label="Course catalogue" />
    </div>
  );
};

export default StatCardItem;
