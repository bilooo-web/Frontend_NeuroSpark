import "./CategoryTabs.css";

// Import your icon images - commented out missing files
// import heartIcon from "../../assets/heart.png";
// import gridIcon from "../../assets/grid.png";
// import tshirtIcon from "../../assets/tshirt.png";
// import pantIcon from "../../assets/pant.png";
// import hatIcon from "../../assets/hat.png";
// import glassesIcon from "../../assets/glasses.png";
// import scarfIcon from "../../assets/scarf.png";
// import jacketIcon from "../../assets/jacket.png";
// import bagIcon from "../../assets/bag.png";
// import shoesIcon from "../../assets/shoes.png";

const categories = [
  { id: "favorites", icon: null },
  { id: "all", icon: null },
  { id: "shirts", icon: null },
  { id: "pants", icon: null },
  { id: "hats", icon: null },
  { id: "glasses", icon: null },
  { id: "scarves", icon: null },
  { id: "jackets", icon: null },
  { id: "bags", icon: null },
  { id: "shoes", icon: null }
];

const CategoryTabs = ({ active, onChange }) => {
  return (
    <div className="category-tabs">
      {categories.map(cat => {
        const isActive = active === cat.id;
        
        return (
          <button
            key={cat.id}
            className={isActive ? 'active' : ''}
            onClick={() => onChange(cat.id)}
            title={cat.id.charAt(0).toUpperCase() + cat.id.slice(1)}
          >
            <img src={cat.icon} alt={cat.id} className="category-icon" />
          </button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;