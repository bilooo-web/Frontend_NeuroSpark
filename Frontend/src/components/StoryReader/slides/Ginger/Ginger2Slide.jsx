import "./Ginger2Slide.css";
import "../../ReadingStyles.css";
import { useState, useEffect, useRef } from "react";
import micOn from "../../../../assets/mic.png";
import micOff from "../../../../assets/no-mic.png";
import useSpeechRecognition from "../../../../hooks/useSpeechRecognition";
import { prepareSentence, getReadingProgress } from "../../../../utils/textProcessor";

// Use public URLs for images
const giraffeBig = "/images/ginger/girafee-boots.png";
const giraffeportrait = "/images/ginger/giraffe-portrait.png";

const Ginger2Slide = ({
  text,
  onPageComplete,
  pageNumber,
  totalPages
}) => {
  const { isListening, transcript, error, toggleListening } = useSpeechRecognition();
  const [progress, setProgress] = useState(-1);
  const [targetWords, setTargetWords] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef(null);

  // Prepare target words when text changes
  useEffect(() => {
    console.log("Ginger2Slide - Page loaded with text:", text);
    const words = prepareSentence(text);
    setTargetWords(words);
    setProgress(-1);
    setIsComplete(false);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [text]);

  // Update progress when transcript changes
  useEffect(() => {
    if (transcript && targetWords.length > 0 && !isComplete) {
      const newProgress = getReadingProgress(targetWords, transcript, progress);
      
      if (newProgress > progress) {
        console.log(`Ginger2Slide - Progress updated: ${progress} -> ${newProgress}`);
        setProgress(newProgress);
        
        // Check if page is complete (all words read)
        if (newProgress === targetWords.length - 1) {
          console.log("🎉 GINGER2SLIDE PAGE COMPLETE! All words read!");
          setIsComplete(true);
          
          if (onPageComplete) {
            console.log("Ginger2Slide - Calling onPageComplete");
            onPageComplete();
          }
        }
      }
    }
  }, [transcript, targetWords, progress, isComplete, onPageComplete]);

  // Calculate progress percentage
  const progressPercentage = targetWords.length > 0 
    ? ((progress + 1) / targetWords.length) * 100 
    : 0;

  // Render text with highlighting
  const renderHighlightedText = () => {
    if (!text) return null;
    
    const words = text.split(' ');
    
    return words.map((word, index) => {
      let className = 'word-pending';
      if (index <= progress) {
        className = 'word-correct';
      } else if (index === progress + 1 && isListening) {
        className = 'word-current';
      }
      
      return (
        <span key={index} className={`reading-word ${className}`}>
          {word}{' '}
        </span>
      );
    });
  };

  return (
    <div className="ginger-scene2">
      <div className="stars-bg" />

      <img src={giraffeBig} className="giraffe-big2" alt="giraffe" />
      <img src={giraffeportrait} className="giraffe-portrait" alt="giraffe portrait" />

      <div className="story-text-container">
        <div className={`story-text-box ${isListening ? 'listening' : ''}`}>
          <p>{renderHighlightedText()}</p>
        </div>
        
        {/* Live transcript */}
        {isListening && transcript && (
          <div className="live-transcript-mini">
            <small>🎤 {transcript}</small>
          </div>
        )}
        
        {/* Completion message */}
        {isComplete && (
          <div className="completion-message">
            ⭐ Great job! {pageNumber < totalPages ? 'Moving to next page...' : 'You finished the story! 🎉'}
          </div>
        )}
        
        {/* Progress bar */}
        <div className="reading-progress">
          <div>Progress: {progress + 1} / {targetWords.length} words</div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
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

export default Ginger2Slide;