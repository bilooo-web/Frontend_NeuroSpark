import { useState } from "react";
import Header from "../components/common/Header/Header";
import AvatarPreview from "../components/Customization/AvatarPreview";
import CategoryTabs from "../components/Customization/CategoryTabs";
import ItemsGrid from "../components/Customization/ItemsGrid";
import { items } from "../data/customizationData"; 
import "./Customization.css";
import Footer from "../components/common/Footer/Footer";

const Customization = () => {
  const [activeCategory, setActiveCategory] = useState("hats");
  
  // Initialize selected items with proper structure for different clothing types
  const [selected, setSelected] = useState({
    hat: null,
    shirt: null,
    pants: null,
    glasses: null,
    scarf: null,
    jacket: null,
    bag: null,
    shoes: null
  });

  const handleSelect = (item) => {
  // Simple mapping
  const categoryMapping = {
    'hats': 'hat',
    'shirts': 'shirt', 
    'pants': 'pants',
    'glasses': 'glasses',
    'scarves': 'scarf',
    'jackets': 'jacket',
    'bags': 'bag',
    'shoes': 'shoes'
  };
  
  const selectedKey = categoryMapping[activeCategory] || activeCategory;
  
  setSelected(prev => ({
    ...prev,
    [selectedKey]: item.image
  }));
};

  // Get items for the active category
  const getItems = () => {
    if (activeCategory === "all") {
      return items.all();
    }
    if (activeCategory === "favorites") {
      return items.favorites;
    }
    return items[activeCategory] || [];
  };

// (removed unused selectedCategoryItem state)

// Add this function to clear a specific clothing type
const clearItem = (category) => {
  setSelected(prev => ({
    ...prev,
    [category]: null
  }));
};

// Update the JSX to include clear buttons
return (
  <>
    <Header />

    <main className="customization-page">
      <AvatarPreview selected={selected} />
      
      {/* Add Clear buttons section */}
      <div className="clear-buttons">
        {Object.keys(selected).map(category => (
          selected[category] && (
            <button 
              key={category}
              className="clear-button"
              onClick={() => clearItem(category)}
              title={`Remove ${category}`}
            >
              Remove {category}
            </button>
          )
        ))}
      </div>
      
      <CategoryTabs 
        active={activeCategory} 
        onChange={setActiveCategory} 
      />
      <ItemsGrid 
        items={getItems()} 
        onSelect={handleSelect} 
      />
    </main>

    <Footer/>
  </>
);
};

export default Customization;