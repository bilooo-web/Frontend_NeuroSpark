import "./ItemsGrid.css";

const ItemsGrid = ({ items, onSelect }) => {
  if (!items || items.length === 0) {
    return (
      <div className="items-grid-empty">
        <p>No items available in this category.</p>
      </div>
    );
  }

  return (
    <div className="items-grid">
      {items.map((item) => (
        <button
          key={item.id}
          className="item-card"
          onClick={() => onSelect(item)}
        >
          <div className="item-image-container">
            <img 
              src={item.image} 
              alt={`Item ${item.id}`} 
              className="item-image"
            />
          </div>
        </button>
      ))}
    </div>
  );
};

export default ItemsGrid;