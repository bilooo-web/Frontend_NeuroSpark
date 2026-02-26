import "./GingerIntroSlide.css";
import "../../ReadingStyles.css";
import { useState, useEffect, useRef } from "react";
import micOn from "../../../../assets/mic.png";
import micOff from "../../../../assets/no-mic.png";
import useSpeechRecognition from "../../../../hooks/useSpeechRecognition";
import { prepareSentence, getReadingProgress } from "../../../../utils/textProcessor";

// Use public URLs for images
const giraffe = "../../../../assets/stories/ginger/giraffe-big.png";
const grass = "/images/ginger/grass.png";

const GingerIntroSlide = ({
  text,
  onPageComplete,
  pageNumber,
  totalPages
}) => {
  const { isListening, transcript, error, toggleListening, resetTranscript } = useSpeechRecognition();
  const [progress, setProgress] = useState(-1);
  const [targetWords, setTargetWords] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const timerRef = useRef(null);
  const lastTranscriptRef = useRef('');

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (isListening) {
        toggleListening();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isListening, toggleListening]);

  // Prepare target words when text changes
  useEffect(() => {
    console.log("📖 Page loaded with text:", text);
    const words = prepareSentence(text);
    setTargetWords(words);
    setProgress(-1);
    setIsComplete(false);
    setCurrentWordIndex(0);
    lastTranscriptRef.current = '';
    resetTranscript();
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [text, resetTranscript]);

  // Update progress when transcript changes - ONLY when actually speaking
  useEffect(() => {
    // Only process if transcript changed and we're listening
    if (transcript && transcript !== lastTranscriptRef.current && isListening && targetWords.length > 0 && !isComplete) {
      
      console.log("\n🎤 New transcript received:", transcript);
      
      const newProgress = getReadingProgress(targetWords, transcript, progress);
      
      if (newProgress > progress) {
        console.log(`✅ Progress increased: ${progress} -> ${newProgress}`);
        setProgress(newProgress);
        setCurrentWordIndex(newProgress + 1);
        
        // Check if page is complete
        if (newProgress === targetWords.length - 1) {
          console.log("🎉 PAGE COMPLETE! All words read!");
          setIsComplete(true);
          
          if (onPageComplete) {
            onPageComplete();
          }
        }
      } else {
        console.log(`⏸️ Progress unchanged at ${progress}`);
      }
      
      lastTranscriptRef.current = transcript;
    }
  }, [transcript, targetWords, progress, isListening, isComplete, onPageComplete]);

  // Calculate progress percentage
  const progressPercentage = targetWords.length > 0 
    ? ((progress + 1) / targetWords.length) * 100 
    : 0;

  // Render text with YELLOW HIGHLIGHTER effect
  const renderHighlightedText = () => {
    if (!text) return null;
    
    const words = text.split(' ');
    
    return words.map((word, index) => {
      // Determine which words get the yellow highlighter
      let highlightClass = '';
      
      if (index <= progress) {
        // Words that have been read get yellow background
        highlightClass = 'word-read';
      } else if (index === currentWordIndex && isListening) {
        // Current word to read gets brighter yellow and underline
        highlightClass = 'word-current';
      }
      
      return (
        <span key={index} className={`reading-word ${highlightClass}`}>
          {word}{' '}
        </span>
      );
    });
  };

  return (
    <div className="ginger-scene">
      <div className="stars-bg" />
      
      <img src={grass} className="grass" alt="grass" />
      <img src={giraffe} className="giraffe" alt="giraffe" />
      
      <div className="story-text-container">
        <div className={`story-text-box ${isListening ? 'listening' : ''}`}>
          <p>{renderHighlightedText()}</p>
        </div>
        
        {/* Progress indicator */}
        <div className="progress-indicator">
          📖 {progress + 1} of {targetWords.length} words read
        </div>
        
        {/* Progress bar */}
        <div className="reading-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Completion message */}
        {isComplete && (
          <div className="completion-message">
            ⭐ Great job! {pageNumber < totalPages ? 'Moving to next page...' : 'You finished the story! 🎉'}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="error-mini">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Mic button */}
      <div className="mic-control">
        <button 
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          aria-label={isListening ? "Stop listening" : "Start listening"}
        >
          <img 
            src={isListening ? micOn : micOff} 
            alt={isListening ? "Stop" : "Start"} 
          />
        </button>
      </div>
    </div>
  );
};

export default GingerIntroSlide;