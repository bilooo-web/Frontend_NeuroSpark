import hat1 from "../assets/hats/hat1.png";
import hat2 from "../assets/hats/hat2.png";
import shirt1 from "../assets/shirts/shirt1.png";
import shirt2 from "../assets/shirts/shirt2.png";
import shirt3 from "../assets/shirts/shirt3.png";
import shirt4 from "../assets/shirts/shirt4.png";
import pants1 from "../assets/pants/pants1.png";
import glasses1 from "../assets/glasses/glasses1.png";
import scarf1 from "../assets/scarves/scarf1.png";
import jacket1 from "../assets/jackets/jacket1.png";
import jacket2 from "../assets/jackets/jacket2.png";
import bag1 from "../assets/bags/bag1.png";
import shoes1 from "../assets/shoes/shoes1.png";
import shoes2 from "../assets/shoes/shoes2.png";

export const items = {
  hats: [
    { id: 1, image: hat1, category: "hats" },
    { id: 2, image: hat2, category: "hats" }
  ],
  shirts: [
    { id: 3, image: shirt1, category: "shirts" },
    { id: 4, image: shirt2, category: "shirts" },
    { id: 5, image: shirt3, category: "shirts" },
    { id: 6, image: shirt4, category: "shirts" }
  ],
  pants: [
    { id: 7, image: pants1, category: "pants" }
  ],
  glasses: [
    { id: 8, image: glasses1, category: "glasses" }
  ],
  scarves: [
    { id: 9, image: scarf1, category: "scarves" }
  ],
  jackets: [
    { id: 10, image: jacket1, category: "jackets" },
    { id: 11, image: jacket2, category: "jackets" }
  ],
  bags: [
    { id: 12, image: bag1, category: "bags" }
  ],
  shoes: [
    { id: 13, image: shoes1, category: "shoes" },
    { id: 14, image: shoes2, category: "shoes" }
  ],
  
  all: function() {
    return [
      ...this.hats,
      ...this.shirts,
      ...this.pants,
      ...this.glasses,
      ...this.scarves,
      ...this.jackets,
      ...this.bags,
      ...this.shoes
    ];
  },
  
  favorites: [
    { id: 1, image: hat1, category: "hats" },
    { id: 3, image: shirt1, category: "shirts" },
    { id: 7, image: pants1, category: "pants" },
    { id: 13, image: shoes1, category: "shoes" },
  ]
};