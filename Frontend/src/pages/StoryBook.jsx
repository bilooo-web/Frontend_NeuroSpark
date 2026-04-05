import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { stories } from "../data/storiesData";
import useSpeechRecognition from "../components/hooks/useSpeechRecognition";
import GingerIntroSlide from "../components/StoryReader/slides/Ginger/GingerIntroSlide";
import Ginger2Slide from "../components/StoryReader/slides/Ginger/Ginger2Slide";
import Ginger3Slide from "../components/StoryReader/slides/Ginger/Ginger3Slide";
import Ginger4Slide from "../components/StoryReader/slides/Ginger/Ginger4Slide";
import micIcon from "../assets/mic.png";
import noMicIcon from "../assets/no-mic.png";
import "./StoryBook.css";

const StoryBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const story = stories[id];

  const [pageIndex, setPageIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pageSummaries, setPageSummaries] = useState([]); 
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false); 
  const startTimeRef = useRef(0);
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const {
    isListening,
    transcript,
    error,
    feedback: speechFeedback,
    isCorrect,
    startListening,
    stopListening,
    reset,
    setExpectedText,
  } = useSpeechRecognition();

  const resetRef = useRef(reset);
  const setExpectedTextRef = useRef(setExpectedText);
  useEffect(() => {
    resetRef.current = reset;
    setExpectedTextRef.current = setExpectedText;
  }, [reset, setExpectedText]);

  const currentPageRef = useRef("");
  const isPageFreshRef = useRef(true);
  const hasAdvancedRef = useRef(false);
  const pageTranscriptRef = useRef("");
  const sessionBaseRef = useRef("");
  const transcriptRef = useRef(""); 
  const idRef = useRef(id);
  useEffect(() => { idRef.current = id; }, [id]);
  const pageStatsRef = useRef({}); 
  const goToNextPageRef = useRef(null);
  const currentPage = story?.pages?.[pageIndex];
  const isLastPage = story ? pageIndex === story.pages.length - 1 : false;

  const currentPageRef2 = useRef(currentPage);
  const isLastPageRef = useRef(isLastPage);
  const pageIndexRef = useRef(pageIndex);
  useEffect(() => { currentPageRef2.current = currentPage; }, [currentPage]);
  useEffect(() => { isLastPageRef.current = isLastPage; }, [isLastPage]);
  useEffect(() => { pageIndexRef.current = pageIndex; }, [pageIndex]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);


  useEffect(() => {
    if (isListening) {
      isPageFreshRef.current = false;
      sessionBaseRef.current = pageTranscriptRef.current;
    } else {
      const latest = transcriptRef.current;
      if (latest) {
        const base = sessionBaseRef.current;
        pageTranscriptRef.current = base ? base + " " + latest : latest;
      }
    }
  }, [isListening]);

  const checkAllWordsSequential = (sourceText) => {
    if (!sourceText || !currentPageRef2.current || hasAdvancedRef.current) return false;
    const targetWords = currentPageRef2.current.text
      .split(' ').filter(w => w.length > 0)
      .map(w => w.toLowerCase().replace(/[.,!?;:]/g, ''));
    const spokenWords = sourceText.toLowerCase().split(' ').filter(w => w.length > 0);
    let t = 0, s = 0;
    while (t < targetWords.length && s < spokenWords.length) {
      if (spokenWords[s] === targetWords[t]) { t++; s++; }
      else {
        let found = false;
        for (let look = s + 1; look < Math.min(s + 4, spokenWords.length); look++) {
          if (spokenWords[look] === targetWords[t]) { s = look; found = true; break; }
        }
        if (!found) {
          let skip = false;
          for (let look = t + 1; look < Math.min(t + 4, targetWords.length); look++) {
            if (spokenWords[s] === targetWords[look]) { t = look; skip = true; break; }
          }
          if (!skip) { t++; s++; }
        }
      }
    }
    return t >= targetWords.length;
  };

  const advanceIfComplete = (sourceText) => {
    if (isPageFreshRef.current || hasAdvancedRef.current) return;
    if (checkAllWordsSequential(sourceText)) {
      hasAdvancedRef.current = true;
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
        goToNextPageRef.current?.();
      }, 1500);
    }
  };

  useEffect(() => {
    if (!isListening || !transcript || isPageFreshRef.current) return;
    const liveText = [sessionBaseRef.current, transcript].filter(Boolean).join(' ');
    advanceIfComplete(liveText);
  }, [transcript]);

  useEffect(() => {
    if (isListening) return; 
    if (isPageFreshRef.current || hasAdvancedRef.current) return;
    const committed = pageTranscriptRef.current;
    if (committed) advanceIfComplete(committed);
  }, [isListening]);

  useEffect(() => {
    if (currentPage) {
      const cleanText = currentPage.text.replace(/[.,!?;:]/g, "").toLowerCase();
      currentPageRef.current = cleanText;
      setExpectedTextRef.current(cleanText);
    }
    pageTranscriptRef.current = ""; 
    sessionBaseRef.current = "";
    isPageFreshRef.current = true;  
    hasAdvancedRef.current = false;   
    resetRef.current();
    setShowFeedback(false);
  }, [pageIndex, currentPage]);

  const getWordStatuses = (pageOverride) => {
    const page = pageOverride || currentPage;
    if (!page) return [];

    if (isPageFreshRef.current) return [];

    const sourceText = isListening
      ? [sessionBaseRef.current, transcript].filter(Boolean).join(" ")
      : pageTranscriptRef.current;
    if (!sourceText) return [];

    const targetWords = page.text
      .split(" ")
      .filter((w) => w.length > 0)
      .map((w) => w.toLowerCase().replace(/[.,!?;:]/g, ""));

    const spokenWords = sourceText
      .toLowerCase()
      .split(" ")
      .filter((w) => w.length > 0);

    const statuses = new Array(targetWords.length).fill("pending");
    let t = 0;
    let s = 0;

    while (t < targetWords.length && s < spokenWords.length) {
      if (spokenWords[s] === targetWords[t]) {
        statuses[t] = "correct";
        t++;
        s++;
      } else {
        let foundAhead = false;
        for (let look = s + 1; look < Math.min(s + 4, spokenWords.length); look++) {
          if (spokenWords[look] === targetWords[t]) {
            statuses[t] = "incorrect";
            s = look;
            foundAhead = true;
            break;
          }
        }
        if (!foundAhead) {
          let foundTargetAhead = false;
          for (let look = t + 1; look < Math.min(t + 4, targetWords.length); look++) {
            if (spokenWords[s] === targetWords[look]) {
              t = look;
              foundTargetAhead = true;
              break;
            }
          }
          if (!foundTargetAhead) {
            statuses[t] = "incorrect";
            t++;
            s++;
          }
        }
      }
    }

    return statuses;
  };

  const getCurrentWordIndex = () => {
    const statuses = getWordStatuses();
    return statuses.findIndex((s) => s === "pending");
  };


  const buildPageSummary = () => {
    const page = currentPageRef2.current;
    if (!page) return null;

    const targetWords = page.text
      .split(" ").filter((w) => w.length > 0)
      .map((w) => w.toLowerCase().replace(/[.,!?;:]/g, ""));

    const sourceText = pageTranscriptRef.current || transcriptRef.current;
    const spokenWords = sourceText
      ? sourceText.toLowerCase().split(" ").filter((w) => w.length > 0)
      : [];

    const correctWords = [], incorrectWords = [], missingWords = [], extraWords = [];
    let t = 0, s = 0;

    while (t < targetWords.length && s < spokenWords.length) {
      if (spokenWords[s] === targetWords[t]) {
        correctWords.push(targetWords[t]); t++; s++;
      } else {
        let foundSpokenAhead = false;
        for (let look = s + 1; look < Math.min(s + 4, spokenWords.length); look++) {
          if (spokenWords[look] === targetWords[t]) {
            incorrectWords.push({ expected: targetWords[t], spoken: spokenWords[s] });
            for (let e = s + 1; e < look; e++) extraWords.push(spokenWords[e]);
            s = look; foundSpokenAhead = true; break;
          }
        }
        if (!foundSpokenAhead) {
          let foundTargetAhead = false;
          for (let look = t + 1; look < Math.min(t + 4, targetWords.length); look++) {
            if (spokenWords[s] === targetWords[look]) {
              for (let m = t; m < look; m++) missingWords.push(targetWords[m]);
              t = look; foundTargetAhead = true; break;
            }
          }
          if (!foundTargetAhead) {
            incorrectWords.push({ expected: targetWords[t], spoken: spokenWords[s] });
            t++; s++;
          }
        }
      }
    }
    while (t < targetWords.length) missingWords.push(targetWords[t++]);
    while (s < spokenWords.length) extraWords.push(spokenWords[s++]);

    const totalWords = targetWords.length;
    const score = totalWords > 0 ? correctWords.length / totalWords : 0;
    const stats = pageStatsRef.current[pageIndexRef.current] || { speakerClicks: 0, wordClicks: 0, clickedWords: [] };
    return {
      pageNumber: pageIndexRef.current + 1,
      pageText: page.text,
      correctWords,
      incorrectWords,
      missingWords,
      extraWords,
      score,
      totalWords,
      speakerClicks: stats.speakerClicks,   
      wordClicks:    stats.wordClicks,       
      clickedWords:  stats.clickedWords,     
    };
  };

  const goToNextPage = () => {
    const summary = buildPageSummary();
    if (summary) {
      setPageSummaries((currentSummaries) => {
        const updated = [...currentSummaries];
        updated[pageIndexRef.current] = summary;
        return updated;
      });
    }
    if (isLastPageRef.current) {
      try {
        setPageSummaries((allSummariesInput) => {
          const allSummaries = [...allSummariesInput];
          if (summary) allSummaries[pageIndexRef.current] = summary;

          const allCorrect  = allSummaries.flatMap(p => p?.correctWords  || []);
          const allIncorrect = allSummaries.flatMap(p => p?.incorrectWords || []);
          const allMissing  = allSummaries.flatMap(p => p?.missingWords   || []);
          const totalWords  = allSummaries.reduce((a, p) => a + (p?.totalWords || 0), 0);
          const totalSpeakerClicks = allSummaries.reduce((a, p) => a + (p?.speakerClicks || 0), 0);
          const totalWordClicks    = allSummaries.reduce((a, p) => a + (p?.wordClicks    || 0), 0);
          const allClickedWords    = allSummaries.flatMap(p => p?.clickedWords || []);
          const overallScore = totalWords > 0 ? allCorrect.length / totalWords : 0;
          const totalTime    = Math.round((Date.now() - startTimeRef.current) / 1000);

          const prevRaw  = localStorage.getItem(`story_progress_${idRef.current}`);
          const prev     = prevRaw ? JSON.parse(prevRaw) : {};
          const attempts = (prev.attempts || 0) + 1;

          localStorage.setItem(`story_progress_${idRef.current}`, JSON.stringify({
            overallScore,
            attempts,
            lastPlayed:   Date.now(),
            totalTime,
            totalWords,
            correctCount:  allCorrect.length,
            incorrectCount: allIncorrect.length,
            missingCount:  allMissing.length,
            totalSpeakerClicks,
            totalWordClicks,
            topClickedWords: Object.entries(
              allClickedWords.reduce((acc, w) => { acc[w] = (acc[w] || 0) + 1; return acc; }, {})
            ).sort((a, b) => b[1] - a[1]).slice(0, 8),
            pageSummaries: allSummaries,
          }));

          return allSummaries;
        });
      } catch (e) {}
      navigate(`/story/${idRef.current}/intro`);
    } else {
      setPageIndex((prev) => prev + 1);
    }
  };

  goToNextPageRef.current = goToNextPage;

  const goToPrevPage = () => {
    if (pageIndex === 0) return;
    window.speechSynthesis.cancel();
    setPageIndex((prev) => prev - 1);
  };

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening(currentPageRef.current);
    }
  }, [isListening, stopListening, startListening]);


  const renderCurrentSlide = () => {
    if (!currentPage) return <div>Page not found</div>;

    const slideProps = {
      text: currentPage.text,
      onPageComplete: goToNextPage,
      pageNumber: pageIndex + 1,
      totalPages: story.pages.length,
      isListening,
      transcript,
      error: error || speechFeedback,
      currentWordIndex: getCurrentWordIndex(),
      wordStatuses: getWordStatuses(),
      targetWords: currentPage.text.split(" ").filter((w) => w.length > 0),
      onSpeakingChange: setIsTTSSpeaking,
      onStatsUpdate: (stats) => { pageStatsRef.current[pageIndex] = stats; },
    };

    if (id === "1") {
      switch (pageIndex) {
        case 0: return <GingerIntroSlide key={pageIndex} {...slideProps} />;
        case 1: return <Ginger2Slide key={pageIndex} {...slideProps} />;
        case 2: return <Ginger3Slide key={pageIndex} {...slideProps} />;
        case 3: return <Ginger4Slide key={pageIndex} {...slideProps} />;
        default: return <div>Page not found</div>;
      }
    }
    return <div>Story not found</div>;
  };

  return (
    <>
      <div className="storybook-container">
        {renderCurrentSlide()}
      </div>

      {showFeedback && (
        <div className="feedback-overlay correct">
          ⭐ Great job!{" "}
          {isLastPage ? "Finishing story... 🎉" : "Moving to next page..."}
        </div>
      )}

      {error && <div className="error-overlay">⚠️ {error}</div>}
      <div className="global-mic-control">
        <button
          className={`global-mic-btn ${isListening ? "listening" : ""} ${isTTSSpeaking ? "disabled" : ""}`}
          onClick={isTTSSpeaking ? undefined : handleMicClick}
          disabled={isTTSSpeaking}
          aria-label={isTTSSpeaking ? "Reading aloud..." : isListening ? "Stop listening" : "Start listening"}
        >
          <img src={isListening ? micIcon :noMicIcon } className="mic-icon" alt={isListening ? "Stop" : "Speak"} />
        </button>
      </div>

    </>
  );
};

export default StoryBook;