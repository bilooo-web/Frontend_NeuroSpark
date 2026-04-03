import { useCallback, useEffect, useRef, useState } from "react";

const getSpeechRecognitionConstructor = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function useSpeechRecognition(options = {}) {
  const { lang = "en-US", continuous = true, interimResults = true } = options;

  const recognitionRef = useRef(null);
  const shouldBeListeningRef = useRef(false);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [expectedText, setExpectedTextState] = useState("");
  const expectedTextRef = useRef("");

  useEffect(() => {
    expectedTextRef.current = expectedText;
  }, [expectedText]);

  const setExpectedText = useCallback((text) => {
    setExpectedTextState(text || "");
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
    setFeedback(null);
    setIsCorrect(false);
  }, []);

  const startListening = useCallback((maybeExpectedText) => {
    if (typeof maybeExpectedText === "string") {
      setExpectedTextState(maybeExpectedText);
    }

    const recognition = recognitionRef.current;
    if (!recognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    setError(null);
    setFeedback(null);
    shouldBeListeningRef.current = true;

    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      // `start()` throws if already started; keep state consistent.
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch (e) {}
    setIsListening(false);
  }, []);

  useEffect(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const chunk = event.results[i]?.[0]?.transcript || "";
        combined += chunk;
      }
      const next = combined.trim();
      setTranscript(next);

      const expected = normalize(expectedTextRef.current);
      const spoken = normalize(next);
      if (!expected) {
        setIsCorrect(false);
      } else {
        setIsCorrect(spoken === expected || spoken.includes(expected));
      }
    };

    recognition.onerror = (event) => {
      const code = event?.error;
      if (code === "not-allowed" || code === "service-not-allowed") {
        setError("Microphone permission was denied.");
      } else if (code === "no-speech") {
        setFeedback("No speech detected.");
      } else if (code === "audio-capture") {
        setError("No microphone was found.");
      } else {
        setError(code ? `Speech recognition error: ${code}` : "Speech recognition error.");
      }
      setIsListening(false);
      shouldBeListeningRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);
      if (shouldBeListeningRef.current) {
        try {
          recognition.start();
          setIsListening(true);
        } catch (e) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListeningRef.current = false;
      try {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop();
      } catch (e) {}
      recognitionRef.current = null;
    };
  }, [continuous, interimResults, lang]);

  return {
    isListening,
    transcript,
    error,
    feedback,
    isCorrect,
    startListening,
    stopListening,
    reset,
    setExpectedText,
  };
}
