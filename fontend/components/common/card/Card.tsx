import CardItem, { ICartItemProp } from './CardItem';

interface IProp {
  cardItems: ICartItemProp[];
}

const Card = (props: IProp) => {
  const { cardItems } = props;
  return (
    <div id="coursesCardGrid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {cardItems.map((item, index) => (
        <CardItem
          key={index}
          title={item.title}
          description={item.description}
          learnerCount={item.learnerCount}
          courseStats={item.courseStats}
          isPublished={item.isPublished}
          thumbnail={item.thumbnail}
        />
      ))}
    </div>
  );
};

export default Card;
