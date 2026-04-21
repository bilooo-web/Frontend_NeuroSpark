import React, { useEffect, useState } from 'react';
import ModernLegoBuilder from '../components/customization/ModernLegoBuilder';
import CategorySelector from '../components/customization/CategorySelector';
import Header from "../components/common/Header/Header";
import Footer from "../components/common/Footer/Footer";
import './Customization.css';

import game1_lego from '../assets/lego_game1.png';
import game2_lego from '../assets/lego_game2.png';
import game3_lego from '../assets/lego_game3.png';
import game4_lego from '../assets/lego_game4.png';
import game5_lego from '../assets/lego_game5.png';
import game6_lego from '../assets/lego_game6.png';

// ⭐ Stitch Model (game1_lego)
const stitchModel = {
  id: 'stitch',
  name: 'Stitch',
  icon: '🐚',
  image: game1_lego,
  description: 'Build the adorable Stitch from Lilo & Stitch!',
  totalSteps: 6,
  gridSize: [12, 10],
  steps: [
    { step: 1, description: "Build the base platform", pieces: [] },
    { step: 2, description: "Build Stitch's legs", pieces: [{ type: "brick", color: "blue", x: 4, z: 3 }, { type: "brick", color: "blue", x: 6, z: 3 }] },
    { step: 3, description: "Build the body", pieces: [{ type: "brick", color: "blue", x: 4, z: 5 }, { type: "brick", color: "blue", x: 5, z: 5 }, { type: "brick", color: "blue", x: 6, z: 5 }] },
    { step: 4, description: "Add the head", pieces: [{ type: "brick", color: "blue", x: 5, z: 7 }] },
    { step: 5, description: "Add the ears", pieces: [{ type: "ear", color: "blue", x: 4, z: 8 }, { type: "ear", color: "blue", x: 6, z: 8 }] },
    { step: 6, description: "Add the eyes", pieces: [{ type: "eye", color: "black", x: 4, z: 7 }, { type: "eye", color: "black", x: 6, z: 7 }] },
  ],
};

// ⭐ Simba Model (game2_lego)
const simbaModel = {
  id: 'simba',
  name: 'Young Simba',
  icon: '🦁',
  image: game2_lego,
  description: 'Build Young Simba from The Lion King!',
  totalSteps: 6,
  gridSize: [12, 10],
  steps: [
    { step: 1, description: "Build the base platform", pieces: [] },
    { step: 2, description: "Build Simba's legs", pieces: [{ type: "brick", color: "orange", x: 4, z: 3 }, { type: "brick", color: "orange", x: 6, z: 3 }] },
    { step: 3, description: "Build the body", pieces: [{ type: "brick", color: "orange", x: 4, z: 5 }, { type: "brick", color: "orange", x: 5, z: 5 }, { type: "brick", color: "orange", x: 6, z: 5 }] },
    { step: 4, description: "Add the head", pieces: [{ type: "brick", color: "orange", x: 5, z: 7 }] },
    { step: 5, description: "Add the mane", pieces: [{ type: "brick", color: "brown", x: 3, z: 7 }, { type: "brick", color: "brown", x: 7, z: 7 }] },
    { step: 6, description: "Add the eyes", pieces: [{ type: "eye", color: "black", x: 4, z: 7 }, { type: "eye", color: "black", x: 6, z: 7 }] },
  ],
};

// ⭐ Friendship Flower Model (game3_lego)
const flowerModel = {
  id: 'flower',
  name: 'Friendship Flower',
  icon: '🌸',
  image: game3_lego,
  description: 'Create a beautiful colorful flower!',
  totalSteps: 6,
  gridSize: [8, 10],
  steps: [
    { step: 1, description: "Place the stem base", pieces: [{ type: "brick", color: "green", x: 3, z: 6 }, { type: "brick", color: "green", x: 4, z: 6 }] },
    { step: 2, description: "Extend the stem", pieces: [{ type: "brick", color: "green", x: 3, z: 4 }] },
    { step: 3, description: "Add leaves", pieces: [{ type: "brick", color: "green", x: 2, z: 5 }, { type: "brick", color: "green", x: 5, z: 5 }] },
    { step: 4, description: "Create flower center", pieces: [{ type: "brick", color: "yellow", x: 3, z: 2 }] },
    { step: 5, description: "Add pink petals", pieces: [{ type: "flower", color: "pink", x: 2, z: 1 }] },
    { step: 6, description: "Add more petals", pieces: [{ type: "flower", color: "pink", x: 4, z: 1 }] },
  ],
};

// ⭐ Wednesday's Dorm Model (game4_lego)
const wednesdayModel = {
  id: 'wednesday',
  name: "Wednesday's Dorm",
  icon: '🏴',
  image: game4_lego,
  description: "Build Wednesday's dorm from Netflix's Wednesday!",
  totalSteps: 6,
  gridSize: [12, 12],
  steps: [
    { step: 1, description: "Build the base foundation", pieces: [{ type: "brick", color: "gray", x: 5, z: 6 }] },
    { step: 2, description: "Build the walls", pieces: [{ type: "brick", color: "gray", x: 4, z: 6 }, { type: "brick", color: "gray", x: 6, z: 6 }] },
    { step: 3, description: "Add the door", pieces: [{ type: "door", color: "black", x: 5, z: 6 }] },
    { step: 4, description: "Add windows", pieces: [{ type: "window", color: "purple", x: 4, z: 5 }, { type: "window", color: "purple", x: 6, z: 5 }] },
    { step: 5, description: "Build the roof", pieces: [{ type: "roof", color: "black", x: 5, z: 4 }] },
    { step: 6, description: "Add decorations", pieces: [{ type: "decoration", color: "purple", x: 3, z: 6 }] },
  ],
};

// ⭐ Pikachu Model (game5_lego)
const pikachuModel = {
  id: 'pikachu',
  name: 'Pikachu',
  icon: '⚡',
  image: game5_lego,
  description: "Build Pikachu from Pokémon!",
  totalSteps: 6,
  gridSize: [10, 10],
  steps: [
    { step: 1, description: "Build the base", pieces: [{ type: "brick", color: "yellow", x: 4, z: 6 }, { type: "brick", color: "yellow", x: 5, z: 6 }] },
    { step: 2, description: "Build the body", pieces: [{ type: "brick", color: "yellow", x: 4, z: 5 }, { type: "brick", color: "yellow", x: 5, z: 5 }] },
    { step: 3, description: "Add the head", pieces: [{ type: "brick", color: "yellow", x: 4, z: 4 }, { type: "brick", color: "yellow", x: 5, z: 4 }] },
    { step: 4, description: "Add ears", pieces: [{ type: "ear", color: "yellow", x: 3, z: 3 }, { type: "ear", color: "yellow", x: 6, z: 3 }] },
    { step: 5, description: "Add cheeks", pieces: [{ type: "brick", color: "red", x: 3, z: 4 }, { type: "brick", color: "red", x: 6, z: 4 }] },
    { step: 6, description: "Add the tail", pieces: [{ type: "tail", color: "yellow", x: 6, z: 6 }] },
  ],
};

// ⭐ Sleeping Beauty Castle Model (game6_lego)
const castleModel = {
  id: 'castle',
  name: 'Sleeping Beauty',
  icon: '👑',
  image: game6_lego,
  description: "Build Sleeping Beauty's castle!",
  totalSteps: 6,
  gridSize: [14, 14],
  steps: [
    { step: 1, description: "Place the foundation", pieces: [{ type: "brick", color: "gray", x: 6, z: 6 }, { type: "brick", color: "gray", x: 7, z: 6 }] },
    { step: 2, description: "Build the walls", pieces: [{ type: "brick", color: "gray", x: 5, z: 6 }, { type: "brick", color: "gray", x: 8, z: 6 }] },
    { step: 3, description: "Add the towers", pieces: [{ type: "brick", color: "gray", x: 5, z: 5 }, { type: "brick", color: "gray", x: 8, z: 5 }] },
    { step: 4, description: "Build the gate", pieces: [{ type: "door", color: "gold", x: 6, z: 6 }, { type: "door", color: "gold", x: 7, z: 6 }] },
    { step: 5, description: "Add the roofs", pieces: [{ type: "roof", color: "red", x: 5, z: 4 }, { type: "roof", color: "red", x: 8, z: 4 }] },
    { step: 6, description: "Add the spires", pieces: [{ type: "brick", color: "gold", x: 6, z: 3 }, { type: "brick", color: "gold", x: 7, z: 3 }] },
  ],
};

// ⭐ Map game IDs to models (matching CategorySelector's gameData IDs)
const modelMap = {
  'stitch': stitchModel,
  'simba': simbaModel,
  'flower': flowerModel,
  'wednesday': wednesdayModel,
  'pikachu': pikachuModel,
  'castle': castleModel,
};

// ─── Customization page ───────────────────────────────────────────────────
const Customization = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const showBuilder = !!selectedCategory;

  // ✅ FIXED: Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // ⭐ Handle game selection from CategorySelector
  const handleSelectCategory = (game) => {
    const selectedModel = modelMap[game.id];
    if (selectedModel) {
      setSelectedCategory({
        ...game,
        model: selectedModel
      });
      // Scroll to top when opening a builder
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
    // Scroll to top when going back to category selector
    window.scrollTo(0, 0);
  };

  return (
    <div className="customization-page">
      <Header />
      {!showBuilder ? (
        <CategorySelector
          onSelectCategory={handleSelectCategory}
        />
      ) : (
        <ModernLegoBuilder
          model={selectedCategory?.model}
          onBack={handleBack}
        />
      )}
      <Footer />
    </div>
  );
};

export default Customization;