import { useEffect, useRef } from "react";
import Phaser from "phaser";
import PathChangeScene from "./PathChangeScene";

const GameCanvas = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 400,
      height: 600,
      parent: gameRef.current,
      transparent: true,
      scene: PathChangeScene,
      physics: { default: "arcade" }
    });

    return () => game.destroy(true);
  }, []);

  return <div ref={gameRef} className="canvas-layer" />;
};

export default GameCanvas;
