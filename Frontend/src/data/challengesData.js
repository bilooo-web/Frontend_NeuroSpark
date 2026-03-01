// Import character images (you need to create/obtain these)
import pathchangeCharacter from "../assets/pathchangeCharacter.png";
import f_nCharacter from "../assets/f&nCharacter.png";
import padlocksCharacter from "../assets/padlocksCharacter.png";
import puzzlesCharacter from "../assets/puzzlesCharacter.png";
import memoryMatchCharacter from "../assets/memoryMatchCharacter.png";
import coloredWordsCharacter from "../assets/coloredWordsCharacter.png";
import wordSearchCharacter from "../assets/wordSearchCharacter.png";
import carsOnTheRoadCharacter from "../assets/carsOnTheRoadCharacter.png";
import handwritingEnhancementCharacter from "../assets/handwritingEnhancementCharacter.png";
import oneLineCharacter from "../assets/oneLineCharacter.png";
import findTheBallCharacter from "../assets/findTheBallCharacter.png";
import rearrangingBlocksCharacter from "../assets/rearrangingBlocksCharacter.png";

export const challengesData = {
  "faces-and-names": {
    id: "faces-and-names",
    title: "Faces and Names",
    category: "Memory",
    lastScore: 0,
    bestScore: 0,
    instructions: "Memorize the names that correspond to each face",
    benefits: [
      "Working memory",
      "Cognitive flexibility",
      "Concentration",
      "Association"
    ],
    characterImage: f_nCharacter, 
  },

  "path-change": {
    id: "path-change",
    title: "Path Change",
    category: "Focus",
    lastScore: 0,
    bestScore: 0,
    instructions: "Guide the path to reach the goal",
    benefits: ["Planning", "Focus", "Problem solving"],
    characterImage: pathchangeCharacter, 
  },

  "padlocks": {
    id: "padlocks",
    title: "Padlocks",
    category: "Logic",
    lastScore: 0,
    bestScore: 0,
    instructions: "Unlock the correct sequence",
    benefits: ["Reasoning", "Memory", "Attention"],
    characterImage: padlocksCharacter, 
  },
  "pair-of-cards":{
    id: "pair-of-cards",
    title: "Pair of Cards",
    category: "Memory",
    lastScore: 0,
    bestScore: 0,
    instructions: "Memorize cards and select matching cards",
    benefits: ["Working memory", "Visual perception", "Concentration"],
    characterImage: puzzlesCharacter,
  },
  "painting": {
    id: "painting",
    title: "Painting",
    category: "Memory",
    lastScore: 0,
    bestScore: 0,
    instructions: "Remember and recreate the patterns",
    benefits: [
      "Visual memory",
      "Attention to detail",
      "Concentration"
    ],
    characterImage: memoryMatchCharacter,
  },
  "colored-words": {
    id: "colored-words",
    title: "Colored Words",
    category: "Focus",
    lastScore: 0,
    bestScore: 0,
    instructions: "Name the color of the word, not the word itself",
    benefits: [
      "Focus",
      "Cognitive flexibility",
      "Inhibition"
    ],
    characterImage: coloredWordsCharacter,
  },
  "word-search": {
    id: "word-search",
    title: "Word Search",
    category: "Attention",
    lastScore: 0,
    bestScore: 0,
    instructions: "Find all the hidden words in the grid",
    benefits: ["Visual scanning", "Attention to detail", "Vocabulary"],
    characterImage: wordSearchCharacter,
  },
  "cars-on-the-road": {
    id: "cars-on-the-road",
    title: "Cars on the Road",
    category: "Focus",
    lastScore: 0,
    bestScore: 0,
    instructions: "Identify the cars on the road",
    benefits: ["Visual attention", "Pattern recognition", "Focus"],
    characterImage: carsOnTheRoadCharacter,
  },
  "handwriting-enhancement": {
    id: "handwriting-enhancement",
    title: "Handwriting Enhancement",
    category: "Motor Skills",
    lastScore: 0,
    bestScore: 0,
    instructions: "Improve your handwriting through guided exercises",
    benefits: ["Fine motor skills", "Hand-eye coordination", "Concentration"],
    characterImage: handwritingEnhancementCharacter,
  },
  "one-line": {
    id: "one-line",
    title: "One Line",
    category: "Focus",
    lastScore: 0,
    bestScore: 0,
    instructions: "Identify the patterns in the sequences",
    benefits: ["Analytical thinking", "Attention to detail", "Problem solving"],
    characterImage: oneLineCharacter,
  },
  "find-the-ball": {
    id: "find-the-ball",
    title: "Find the Ball",
    category: "Attention",
    lastScore: 0,
    bestScore: 0,
    instructions: "Keep your eyes on the ball as it moves around",
    benefits: ["Sustained attention", "Visual tracking", "Concentration"],
    characterImage: findTheBallCharacter,
  },
  "rearranging-blocks": {
    id: "rearranging-blocks",
    title: "Rearranging Blocks",
    category: "Logic",
    lastScore: 0,
    bestScore: 0,
    instructions: "Rearrange the blocks to match the target pattern",
    benefits: ["Spatial reasoning", "Problem solving", "Attention to detail"],
    characterImage: rearrangingBlocksCharacter,
  }

};