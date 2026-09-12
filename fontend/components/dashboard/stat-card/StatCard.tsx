import StatCardItem, { IStatCardProp } from './StatCardItem';

interface IProp {
  statCardItem: IStatCardProp[];
}

const StatCard = (props: IProp) => {
  const { statCardItem } = props;
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCardItem.map((item, index) => (
        <StatCardItem key={index} quantity={item.quantity} staus={item.staus} title={item.title} />
      ))}
    </section>
  );
};

export default StatCard;
