import "./CategoryTabs.css";

// Import your icon images
import heartIcon from "../../assets/heart.png";
import gridIcon from "../../assets/grid.png";
import tshirtIcon from "../../assets/tshirt.png";
import pantIcon from "../../assets/pant.png";
import hatIcon from "../../assets/hat.png";
import glassesIcon from "../../assets/glasses.png";
import scarfIcon from "../../assets/scarf.png";
import jacketIcon from "../../assets/jacket.png";
import bagIcon from "../../assets/bag.png";
import shoesIcon from "../../assets/shoes.png";

const categories = [
  { id: "favorites", icon: heartIcon },
  { id: "all", icon: gridIcon },
  { id: "shirts", icon: tshirtIcon },
  { id: "pants", icon: pantIcon },
  { id: "hats", icon: hatIcon },
  { id: "glasses", icon: glassesIcon },
  { id: "scarves", icon: scarfIcon },
  { id: "jackets", icon: jacketIcon },
  { id: "bags", icon: bagIcon },
  { id: "shoes", icon: shoesIcon }
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