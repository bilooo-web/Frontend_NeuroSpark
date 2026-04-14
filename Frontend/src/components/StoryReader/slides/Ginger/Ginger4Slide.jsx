import "./Ginger4Slide.css";
import "../../ReadingStyles.css";
import { useState, useEffect, useRef } from "react";

import both        from "../../../../assets/stories/ginger/both.png";
import giraffePortrait from "../../../../assets/stories/ginger/giraffe-portrait.png";
import speakerOff     from "../../../../assets/giraffe-speaker-off.png";
import speakerOn      from "../../../../assets/giraffe-speaker-on.png";


const Ginger4Slide = ({
  text,
  onPageComplete,
  pageNumber,
  totalPages,
  isListening,
  transcript,
  error,
  currentWordIndex,
  wordStatuses,
  targetWords,
  onSpeakingChange,
  onStatsUpdate,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isPausedRef      = useRef(false);
  const utteranceRef     = useRef(null);
  const speakerClicksRef = useRef(0);
  const wordClicksRef    = useRef(0);
  const clickedWordsRef  = useRef([]);

  useEffect(() => {
    speakerClicksRef.current = 0;
    wordClicksRef.current    = 0;
    clickedWordsRef.current  = [];
    return () => {
      window.speechSynthesis.cancel();
      isPausedRef.current = false;
      setIsSpeaking(false);
    };
  }, [text]);

  useEffect(() => {
    const noop = () => {};
    window.speechSynthesis.addEventListener('voiceschanged', noop);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', noop);
  }, []);

  const getFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.lang === 'en-US' && /female|woman|girl|samantha|karen|victoria|zira|susan|lisa/i.test(v.name)) ||
      voices.find(v => v.lang === 'en-US' && !v.name.toLowerCase().includes('google us english')) ||
      voices.find(v => v.lang.startsWith('en'))
    );
  };

  const handleSpeakerClick = () => {
    if (isSpeaking) {
      window.speechSynthesis.pause();
      isPausedRef.current = true;
      setIsSpeaking(false);
      onSpeakingChange?.(false);
      return;
    }
    if (isPausedRef.current) {
      window.speechSynthesis.resume();
      isPausedRef.current = false;
      setIsSpeaking(true);
      onSpeakingChange?.(true);
      return;
    }
    speakerClicksRef.current += 1;
    onStatsUpdate?.({ speakerClicks: speakerClicksRef.current, wordClicks: wordClicksRef.current, clickedWords: [...clickedWordsRef.current] });
    window.speechSynthesis.cancel();
    const utterance   = new SpeechSynthesisUtterance(text);
    utterance.lang    = 'en-US';
    utterance.rate    = 0.85;
    utterance.pitch   = 1.4;
    const voice = getFemaleVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { setIsSpeaking(true);  onSpeakingChange?.(true);  };
    utterance.onend   = () => { isPausedRef.current = false; setIsSpeaking(false); onSpeakingChange?.(false); };
    utterance.onerror = () => { isPausedRef.current = false; setIsSpeaking(false); onSpeakingChange?.(false); };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleWordClick = (word) => {
    const clean = word.replace(/[.,!?;:"""''']/g, '').trim();
    if (!clean) return;
    wordClicksRef.current += 1;
    clickedWordsRef.current.push(clean.toLowerCase());
    onStatsUpdate?.({ speakerClicks: speakerClicksRef.current, wordClicks: wordClicksRef.current, clickedWords: [...clickedWordsRef.current] });
    window.speechSynthesis.cancel();
    isPausedRef.current = false;
    setIsSpeaking(false);
    onSpeakingChange?.(false);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang  = 'en-US';
    utterance.rate  = 0.8;
    utterance.pitch = 1.4;
    const voice = getFemaleVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const renderTextWithHighlighting = () => {
    if (!text) return null;
    const words = text.split(' ');
    return (
      <p>
        {words.map((word, index) => {
          let wordClass = 'reading-word';
          if (wordStatuses && wordStatuses[index]) {
            wordClass += ` word-${wordStatuses[index]}`;
          } else if (index === currentWordIndex && isListening) {
            wordClass += ' word-current';
          } else {
            wordClass += ' word-pending';
          }
          return (
            <span
              key={index}
              className={wordClass}
              onClick={() => handleWordClick(word)}
              style={{ cursor: 'pointer' }}
              title={`Click to hear "${word}"`}
            >
              {word}{' '}
            </span>
          );
        })}
      </p>
    );
  };

  const totalWords         = targetWords ? targetWords.length : 0;
  const correctCount       = wordStatuses ? wordStatuses.filter(s => s === 'correct').length : 0;
  const progressPercentage = totalWords > 0 ? (correctCount / totalWords) * 100 : 0;

  return (
    <div className="ginger-scene4">

      {/* Scene characters */}
      <img src={both}         className="both"     alt="giraffe" />
      <img src={giraffePortrait} className="giraffe-portrait" alt="giraffe portrait" />

      {/* Speaker button */}
      <div className="giraffe-speaker-wrapper1" onClick={handleSpeakerClick}>
        <img
          src={isSpeaking ? speakerOn : speakerOff}
          className="giraffe-speaker1"
          alt={isSpeaking ? "Stop reading" : "Read aloud"}
        />
        
      </div>

      <div className="story-text-container">
        <div className={`story-text-box ${isListening ? 'listening' : ''}`}>
          {renderTextWithHighlighting()}
          <div className="page-indicator">Page {pageNumber} of {totalPages}</div>
        </div>

        <div className="reading-progress">
          <div className="progress-header">
            <span className="progress-words-label">
              {correctCount} / {totalWords} words read
            </span>
          </div>
          <div className="progress-bar1">
            <div className="progress-fill1" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ginger4Slide;