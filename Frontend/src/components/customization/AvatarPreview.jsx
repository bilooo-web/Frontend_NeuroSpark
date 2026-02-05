import baseAvatar from "../../assets/avatar/chick-base.png";
import "./AvatarPreview.css";

const AvatarPreview = ({ selected }) => {
  return (
    <div className="ap-wrapper">
      {/* Title - KEEP THIS */}
      <div className="ap-title">
        <h2>Customize Your Character</h2>
        <p>Mix and match items to create your unique avatar</p>
      </div>

      <div className="ap-content">
        {/* Avatar - KEEP BUT SIMPLIFY */}
        <div className="ap-center">
          <div className="ap-stage">
            {/* Base avatar */}
            <img src={baseAvatar} className="ap-layer base" alt="Base" />

            {/* Clothing layers in correct order */}
            {selected.pants && (
              <img src={selected.pants} className="ap-layer pants" alt="Pants" />
            )}
            
            {selected.shoes && (
              <img src={selected.shoes} className="ap-layer shoes" alt="Shoes" />
            )}
            
            {selected.shirt && (
              <img src={selected.shirt} className="ap-layer shirt" alt="Shirt" />
            )}
            
            {selected.jacket && (
              <img src={selected.jacket} className="ap-layer jacket" alt="Jacket" />
            )}
            
            {selected.glasses && (
              <img src={selected.glasses} className="ap-layer glasses" alt="Glasses" />
            )}
            
            {selected.scarf && (
              <img src={selected.scarf} className="ap-layer scarf" alt="Scarf" />
            )}
            
            {selected.hat && (
              <img src={selected.hat} className="ap-layer hat" alt="Hat" />
            )}
            
            {selected.bag && (
              <img src={selected.bag} className="ap-layer bag" alt="Bag" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarPreview;