// src/hooks/useSpeechRecognition.jsx
import { useState, useCallback, useEffect, useRef } from 'react';

// ── Levenshtein distance between two strings ──────────────────────────────────
const levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
};

// Normalised similarity: 1.0 = perfect match, 0.0 = completely different
const levenshteinSimilarity = (expected, spoken) => {
  if (!expected && !spoken) return 1;
  if (!expected || !spoken) return 0;
  const a = expected.toLowerCase().trim();
  const b = spoken.toLowerCase().trim();
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
};

// Threshold — tune this between 0.0 and 1.0
// 0.75 is forgiving enough for kids mispronouncing a word or two
const LEVENSHTEIN_THRESHOLD = 0.60;

// ─────────────────────────────────────────────────────────────────────────────

export default function useSpeechRecognition() {
  const [isListening, setIsListening]                     = useState(false);
  const [transcript, setTranscript]                       = useState('');
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  const [error, setError]       = useState(null);
  const [score, setScore]       = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  const recognitionRef     = useRef(null);
  const currentExpectedRef = useRef('');
  const shouldRestartRef   = useRef(false);

  // Always-current isCorrect readable inside closures
  const isCorrectRef = useRef(false);
  useEffect(() => { isCorrectRef.current = isCorrect; }, [isCorrect]);

  // Accumulate finalised transcript without relying on async setState
  const accumulatedRef = useRef('');

  // Never-stale evaluate function
  const evaluateRef = useRef(null);
  evaluateRef.current = (spokenText) => {
    if (!currentExpectedRef.current) return;
    const expected = currentExpectedRef.current.toLowerCase().trim();
    const spoken   = spokenText.toLowerCase().trim();
    if (!expected || !spoken) return;

    const finalScore = levenshteinSimilarity(expected, spoken);
    setScore(finalScore);

    if (finalScore >= LEVENSHTEIN_THRESHOLD) {
      setFeedback('Great job! 🎉');
      setIsCorrect(true);
      isCorrectRef.current     = true;
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    } else {
      // Give the child a hint about how far they got
      const expectedWords = expected.split(' ');
      const spokenWords   = spoken.split(' ');
      const missingWords  = expectedWords.filter(w => !spokenWords.includes(w));

      let feedbackMsg = '';
      if (spokenWords.length === 0 || spoken.length === 0) {
        feedbackMsg = 'Keep reading!';
      } else if (missingWords.length === expectedWords.length) {
        feedbackMsg = 'Keep reading!';
      } else if (missingWords.length > 0) {
        feedbackMsg = `Keep going! Missing: ${missingWords.join(', ')}`;
      } else {
        feedbackMsg = 'Good progress! Keep reading!';
      }

      setFeedback(feedbackMsg);
      setIsCorrect(false);
    }
  };

  const startListening = useCallback((expectedText = '') => {
    try {
      currentExpectedRef.current = expectedText;
      shouldRestartRef.current   = true;

      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech recognition not supported in this browser');
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang            = 'en-US';
      recognition.continuous      = true;
      recognition.interimResults  = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript   = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t + ' ';
          } else {
            interimTranscript += t;
          }
        }

        // Show live text in overlay
        setTranscript((finalTranscript + interimTranscript).trim());

        // Evaluate against accumulated finalised speech
        if (finalTranscript) {
          const newAccumulated = (accumulatedRef.current + ' ' + finalTranscript).trim();
          accumulatedRef.current = newAccumulated;
          setAccumulatedTranscript(newAccumulated);
          evaluateRef.current(newAccumulated);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied');
        } else if (event.error === 'no-speech' || event.error === 'aborted') {
          // not-speech: browser paused — onend will restart
          // aborted: intentional stop — ignore silently
        } else {
          setError(`Recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (shouldRestartRef.current && !isCorrectRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.log('Restart failed:', e);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    shouldRestartRef.current   = false;
    isCorrectRef.current       = false;
    accumulatedRef.current     = '';
    currentExpectedRef.current = '';
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setTranscript('');
    setAccumulatedTranscript('');
    setError(null);
    setScore(null);
    setFeedback('');
    setIsCorrect(false);
  }, []);

  const setExpectedText = useCallback((text) => {
    currentExpectedRef.current = text;
  }, []);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    accumulatedTranscript,
    error,
    score,
    feedback,
    isCorrect,
    startListening,
    stopListening,
    reset,
    setExpectedText,
  };
}