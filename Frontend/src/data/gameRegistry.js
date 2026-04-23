/**
 * GAME REGISTRY — Single source of truth
 *
 * When you add a new game component to the codebase:
 *  1. Add its slug + label here
 *  2. Add the component import + case in GameSwitcher.jsx
 *
 * The admin "Add Game" dropdown reads from this list automatically.
 * The frontend FocusChallenges page reads from the API + challengesData.
 */

const gameRegistry = [
  // { slug: "path-change",              label: "Path Change" },
  { slug: "padlocks",                 label: "Memory Padlocks" },
  { slug: "faces-and-names",          label: "Faces & Names" },
  { slug: "pair-of-cards",            label: "Pair of Cards" },
  // { slug: "puzzles",                  label: "Puzzles" },
  // { slug: "painting",                 label: "Painting" },
  // { slug: "colored-words",            label: "Colored Words" },
  // { slug: "word-search",              label: "Word Search" },
  // { slug: "cars-on-the-road",         label: "Cars on the Road" },
  // { slug: "handwriting-enhancement",  label: "Handwriting Enhancement" },
  // { slug: "one-line",                 label: "One Line" },
  // { slug: "find-the-ball",            label: "Find the Ball" },
  // { slug: "rearranging-blocks",       label: "Rearranging Blocks" },
];

export default gameRegistry;