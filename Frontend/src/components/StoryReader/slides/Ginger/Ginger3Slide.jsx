import "./Ginger3Slide.css";
import "../../ReadingStyles.css";
import { useState, useEffect, useRef } from "react";
import micOn from "../../../../assets/mic.png";
import micOff from "../../../../assets/no-mic.png";
import useSpeechRecognition from "../../../../hooks/useSpeechRecognition";
import { prepareSentence, getReadingProgress } from "../../../../utils/textProcessor";

// Use public URLs for images
const giraffe_monkey = "/images/ginger/giraffe_andmonkey.png";
const giraffeportrait2 = "/images/ginger/giraffe-portrait.png";

const Ginger3Slide = ({
  text,
  onProgressUpdate,
  pageIndex,
  totalPages,
  isPageComplete
}) => {
  const { isListening, transcript, error, toggleListening } = useSpeechRecognition();
  const [progress, setProgress] = useState(-1);
  const [targetWords, setTargetWords] = useState([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const prevTranscriptRef = useRef('');

  // Reset progress when page changes
  useEffect(() => {
    console.log("Ginger3Slide - Page changed to index:", pageIndex);
    setTargetWords(prepareSentence(text));
    setProgress(-1);
    setShowCompletion(false);
    prevTranscriptRef.current = '';
  }, [text, pageIndex]);

  // Update progress when transcript changes
  useEffect(() => {
    if (transcript && transcript !== prevTranscriptRef.current && targetWords.length > 0) {
      console.log("Ginger3Slide - Transcript changed:", transcript);
      console.log("Ginger3Slide - Target words:", targetWords);
      
      const newProgress = getReadingProgress(targetWords, transcript, progress);
      console.log("Ginger3Slide - New progress:", newProgress);
      
      if (newProgress !== progress) {
        setProgress(newProgress);
        
        if (onProgressUpdate) {
          onProgressUpdate(newProgress);
        }

        // Show completion message when all words are read
        if (newProgress === targetWords.length - 1 && targetWords.length > 0 && !showCompletion && !isPageComplete) {
          console.log("Ginger3Slide - All words read! Showing completion message");
          setShowCompletion(true);
        }
      }
      
      prevTranscriptRef.current = transcript;
    }
  }, [transcript, targetWords, progress, onProgressUpdate, showCompletion, isPageComplete]);

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
    <div className="ginger-scene3">
      <div className="stars-bg" />

      <img src={giraffe_monkey} className="giraffe-monkey" alt="giraffe and monkey" />
      <img src={giraffeportrait2} className="giraffe-portrait2" alt="giraffe portrait" />

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
        {(showCompletion || isPageComplete) && (
          <div className="completion-message">
            ⭐ Great job! {pageIndex < totalPages - 1 ? 'Moving to next page...' : 'You finished the story! 🎉'}
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

export default Ginger3Slide;