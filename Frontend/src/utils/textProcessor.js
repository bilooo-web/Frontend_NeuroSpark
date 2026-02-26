/**
 * TEXT PROCESSOR FOR READ ALONG APP
 * Features:
 * - Word-by-word comparison
 * - Fuzzy matching for mispronunciations
 * - No ghost readings
 * - Sequential progress tracking
 */

/**
 * Prepare sentence for comparison:
 * - Lowercase
 * - Remove punctuation
 * - Split into words
 */
export const prepareSentence = (text) => {
  if (!text) return [];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter(word => word.length > 0); // Remove empty strings
};

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

/**
 * Common word variations for children's pronunciation
 */
const WORD_VARIATIONS = {
  'giraffe': ['giraff', 'jiraffe', 'girafe', 'giraf'],
  'ginger': ['ginga', 'jinger', 'ginja'],
  'savannah': ['savana', 'savanna', 'safana'],
  'africa': ['afrika', 'afric'],
  'kenya': ['kenia', 'kena'],
  'monkey': ['monky', 'munkey', 'monki'],
  'zebra': ['zeebra', 'zebra'],
  'elephant': ['elefant', 'elphante', 'lephant'],
  'the': ['da', 'de', 'dah'],
  'and': ['an', 'en', 'n'],
  'was': ['wuz', 'waz', 'vos'],
  'said': ['sed', 'sez'],
  'help': ['hepp', 'hep']
};

/**
 * Check if two words are similar (forgiving but not too forgiving)
 * Uses multiple strategies for matching
 */
const isWordSimilar = (word1, word2) => {
  if (!word1 || !word2) return false;
  
  const w1 = word1.toLowerCase().trim();
  const w2 = word2.toLowerCase().trim();
  
  // 1. Exact match
  if (w1 === w2) {
    console.log(`   Exact match: "${w1}"`);
    return true;
  }
  
  // 2. Check common variations
  for (const [key, variations] of Object.entries(WORD_VARIATIONS)) {
    if ((key === w1 && variations.includes(w2)) || (key === w2 && variations.includes(w1))) {
      console.log(`   Variation match: "${w1}" ≈ "${w2}"`);
      return true;
    }
  }
  
  // 3. One contains the other (for longer words)
  if (w1.length > 3 && w2.length > 3) {
    if (w1.includes(w2) || w2.includes(w1)) {
      console.log(`   Contains match: "${w1}" contains "${w2}"`);
      return true;
    }
  }
  
  // 4. Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(w1, w2);
  const maxLength = Math.max(w1.length, w2.length);
  const similarity = 1 - distance / maxLength;
  
  console.log(`   Similarity: ${(similarity * 100).toFixed(0)}%`);
  
  // Threshold: 70% similarity
  return similarity >= 0.7;
};

/**
 * Get reading progress - NO GHOST READINGS
 * Words are ONLY marked as read when they are ACTUALLY spoken in sequence
 */
export const getReadingProgress = (targetWords, spokenTranscript, previousProgress = -1) => {
  // If no transcript, return previous progress
  if (!spokenTranscript || !targetWords.length) {
    return previousProgress;
  }
  
  const spokenWords = prepareSentence(spokenTranscript);
  
  // If no spoken words, return previous progress
  if (spokenWords.length === 0) {
    return previousProgress;
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📖 READING PROGRESS UPDATE");
  console.log("=".repeat(60));
  console.log("Target words:", targetWords);
  console.log("Spoken words:", spokenWords);
  console.log("Previous progress:", previousProgress);
  
  // Start from where we left off
  let currentProgress = previousProgress;
  let spokenIndex = 0;
  
  // Find where we are in the spoken words based on previous progress
  if (previousProgress >= 0) {
    const lastTargetWord = targetWords[previousProgress];
    console.log(`Looking for last matched word: "${lastTargetWord}"`);
    
    for (let i = 0; i < spokenWords.length; i++) {
      if (isWordSimilar(spokenWords[i], lastTargetWord)) {
        spokenIndex = i + 1;
        console.log(`Found at spoken index ${i}, continuing from ${spokenIndex}`);
        break;
      }
    }
  }
  
  // Now process new spoken words in sequence
  for (let i = spokenIndex; i < spokenWords.length; i++) {
    const nextTargetIndex = currentProgress + 1;
    
    // If we've read all target words, stop
    if (nextTargetIndex >= targetWords.length) {
      console.log("📌 All target words processed");
      break;
    }
    
    const targetWord = targetWords[nextTargetIndex];
    const spokenWord = spokenWords[i];
    
    console.log(`\n🔍 Word ${nextTargetIndex + 1}: "${targetWord}" vs "${spokenWord}"`);
    
    if (isWordSimilar(targetWord, spokenWord)) {
      console.log(`✅ MATCH! Progress: ${currentProgress} → ${nextTargetIndex}`);
      currentProgress = nextTargetIndex;
    } else {
      console.log(`❌ NO MATCH - Stopping at word ${nextTargetIndex + 1}`);
      // Stop processing further words - this prevents ghost readings
      break;
    }
  }
  
  console.log("\n" + "-".repeat(40));
  console.log(`Final progress: ${currentProgress} (${currentProgress + 1}/${targetWords.length} words)`);
  console.log("=".repeat(60));
  
  return currentProgress;
};