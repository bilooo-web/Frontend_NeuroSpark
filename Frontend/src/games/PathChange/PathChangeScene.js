import Phaser from "phaser";
import { gameEvents } from "./events";

export default class PathChangeScene extends Phaser.Scene {
  constructor() {
    super("PathChangeScene");
  }

  create() {
    this.score = 0;
    this.lives = 3;

    this.player = this.add.circle(200, 500, 15, 0x4a90e2);

    this.input.on("pointerdown", () => {
      this.score += 10;

      // Send score update to React
      gameEvents.emit("score-update", this.score);

      // Fake progress example
      gameEvents.emit("progress-update", this.score % 100);
    });

    // Fake obstacle hit every 3 seconds
    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        this.lives -= 1;
        gameEvents.emit("life-lost", this.lives);

        if (this.lives <= 0) {
          gameEvents.emit("game-over");
          this.scene.pause();
        }
      }
    });
  }
}
