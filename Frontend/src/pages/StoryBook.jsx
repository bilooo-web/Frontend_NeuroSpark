import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { stories } from "../data/storiesData";
import useSpeechRecognition from "../components/hooks/useSpeechRecognition";
import GingerIntroSlide from "../components/StoryReader/slides/Ginger/GingerIntroSlide";
import Ginger2Slide from "../components/StoryReader/slides/Ginger/Ginger2Slide";
import Ginger3Slide from "../components/StoryReader/slides/Ginger/Ginger3Slide";
import Ginger4Slide from "../components/StoryReader/slides/Ginger/Ginger4Slide";
import voiceService from "../services/voiceService";
import { useApp } from "../context/AppContext";
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
  const [submitStatus, setSubmitStatus] = useState(null); // 'loading', 'success', 'error'
  const [submitError, setSubmitError] = useState(null);
  const startTimeRef = useRef(0);
  // Track pause/idle time: time when mic is off between listening sessions
  const pauseStartRef = useRef(null);
  const totalPauseDurationRef = useRef(0);
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

  // Store hook functions in refs - batched update
  const resetRef = useRef(reset);
  const setExpectedTextRef = useRef(setExpectedText);
  useEffect(() => {
    resetRef.current = reset;
    setExpectedTextRef.current = setExpectedText;
  }, [reset, setExpectedText]);

  // Submit voice attempt to backend
  const submitVoiceAttempt = async (sessionData) => {
    if (!user?.child_id) {
      console.warn('⚠️ Child ID not available in user context');
      return;
    }

    setSubmitStatus('loading');
    setSubmitError(null);

    try {
      const voiceData = {
        voice_instruction_id: parseInt(id),
        child_id: user.child_id,
        accuracy_score: Math.round(sessionData.overallScore * 100),
        total_words: sessionData.totalWords,
        incorrect_words: sessionData.incorrectCount,
        duration: sessionData.totalTime,
        coins_earned: sessionData.coinsEarned || 0,
      };

      console.log('📤 Submitting voice attempt:', voiceData);
      await voiceService.submitVoiceAttempt(voiceData);

      setSubmitStatus('success');
      console.log('✅ Voice attempt saved successfully');

      // Clear status after 2 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 2000);
    } catch (error) {
      console.error('❌ Failed to submit voice attempt:', error);
      setSubmitError(error.message || 'Failed to save voice attempt');
      setSubmitStatus('error');

      // Clear error after 3 seconds
      setTimeout(() => {
        setSubmitStatus(null);
        setSubmitError(null);
      }, 3000);
    }
  };

  const currentPageRef = useRef("");
  // Blocks getWordStatuses from using stale transcript before mic is opened on new page
  const isPageFreshRef = useRef(true);
  // Prevents goToNextPage from firing more than once per page
  const hasAdvancedRef = useRef(false);
  // Accumulates ALL spoken text for this page across multiple mic sessions.
  // Never wiped on pause/resume — only cleared on page change.
  const pageTranscriptRef = useRef("");
  // Snapshot of pageTranscriptRef at the moment the mic was turned ON,
  // so we can compute: fullText = pageTranscriptRef + " " + currentTranscript
  const sessionBaseRef = useRef("");
  const transcriptRef = useRef(""); // always holds latest transcript value
  const idRef = useRef(id); // stable ref for id inside closures
  useEffect(() => { idRef.current = id; }, [id]);
  // Therapist stats — updated live as child interacts with each page
  const pageStatsRef = useRef({}); // { [pageIndex]: { speakerClicks, wordClicks, clickedWords } }
  const goToNextPageRef = useRef(null); // stable ref to goToNextPage for use inside effects
  // When mic turns ON: snapshot base so we can combine sessions
  // When mic turns OFF: commit final transcript for this session

  const currentPage = story?.pages?.[pageIndex];
  const isLastPage = story ? pageIndex === story.pages.length - 1 : false;

  // Keep refs in sync so closures inside useEffects always read latest values
  const currentPageRef2 = useRef(currentPage);
  const isLastPageRef = useRef(isLastPage);
  const pageIndexRef = useRef(pageIndex);
  useEffect(() => { currentPageRef2.current = currentPage; }, [currentPage]);
  useEffect(() => { isLastPageRef.current = isLastPage; }, [isLastPage]);
  useEffect(() => { pageIndexRef.current = pageIndex; }, [pageIndex]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);


  // Track mic sessions — accumulate transcript across pause/resume
  useEffect(() => {
    if (isListening) {
      isPageFreshRef.current = false;
      sessionBaseRef.current = pageTranscriptRef.current;
      // Mic turned on — end pause period
      if (pauseStartRef.current) {
        totalPauseDurationRef.current += Math.round((Date.now() - pauseStartRef.current) / 1000);
        pauseStartRef.current = null;
      }
    } else {
      const latest = transcriptRef.current;
      if (latest) {
        const base = sessionBaseRef.current;
        pageTranscriptRef.current = base ? base + " " + latest : latest;
      }
      // Mic turned off — start tracking pause
      if (!isPageFreshRef.current) {
        pauseStartRef.current = Date.now();
      }
    }
  }, [isListening]);

  // ── Sequential all-words check ──────────────────────────────────────────────
  // Checks if every word in the page was said in order.
  // Uses pageTranscriptRef (committed sessions) + live transcript.
  // Returns true only when t reaches the end of targetWords.
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

  // Check while mic is ON — on every live transcript update
  useEffect(() => {
    if (!isListening || !transcript || isPageFreshRef.current) return;
    const liveText = [sessionBaseRef.current, transcript].filter(Boolean).join(' ');
    advanceIfComplete(liveText);
  }, [transcript]);

  // Check when mic turns OFF — use the committed pageTranscriptRef
  useEffect(() => {
    if (isListening) return; // only fire on mic-off
    if (isPageFreshRef.current || hasAdvancedRef.current) return;
    const committed = pageTranscriptRef.current;
    if (committed) advanceIfComplete(committed);
  }, [isListening]);

  // Helper: check if all words are correct given a source text

  // Reset everything when page changes
  useEffect(() => {
    if (currentPage) {
      const cleanText = currentPage.text.replace(/[.,!?;:]/g, "").toLowerCase();
      currentPageRef.current = cleanText;
      setExpectedTextRef.current(cleanText);
    }
    pageTranscriptRef.current = ""; // clear all accumulated text for the new page
    sessionBaseRef.current = "";
    isPageFreshRef.current = true;  // block highlighting until mic is opened
    hasAdvancedRef.current = false;   // allow advancing on the new page
    resetRef.current();
    setShowFeedback(false);
  }, [pageIndex, currentPage]);

  // ─── Word status calculation ────────────────────────────────────────────────
  const getWordStatuses = (pageOverride) => {
    const page = pageOverride || currentPage;
    if (!page) return [];

    // Block highlighting if the user hasn't spoken on this page yet
    if (isPageFreshRef.current) return [];

    // Build the full text for this page:
    // - While listening: committed text from previous sessions + live transcript this session
    // - While paused:    committed text only (pageTranscriptRef)
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


  // ─── Build a summary for the current page ────────────────────────────────
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
      speakerClicks: stats.speakerClicks,   // how many times child pressed speaker
      wordClicks:    stats.wordClicks,       // how many words child tapped to hear
      clickedWords:  stats.clickedWords,     // which specific words were tapped
    };
  };

  const isSubmittingRef = useRef(false);

  // ─── Advance to next page or show summary ────────────────────────────────
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

          // Calculate coins earned (1 coin per correct word, min 5)
          const coinsEarned = Math.max(5, allCorrect.length);

          // Submit voice attempt to backend
          submitVoiceAttempt({
            overallScore,
            totalWords,
            incorrectCount: allIncorrect.length,
            totalTime,
            coinsEarned,
          });

          return allSummaries;
        });
      } catch (e) {}
      navigate(`/story/${idRef.current}/intro`);
    } else {
      setPageIndex((prev) => prev + 1);
    }
  };

  // Keep goToNextPageRef always pointing to the latest goToNextPage
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
      // No reset() here — we want to keep accumulated progress from previous sessions
      startListening(currentPageRef.current);
    }
  }, [isListening, stopListening, startListening]);


  // ─── Slide renderer ──────────────────────────────────────────────────────────
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

      {/* Success feedback */}
      {showFeedback && (
        <div className="feedback-overlay correct">
          ⭐ Great job!{" "}
          {isLastPage ? "Finishing story... 🎉" : "Moving to next page..."}
        </div>
      )}

      {/* Error message */}
      {error && <div className="error-overlay">⚠️ {error}</div>}
      {/* Global mic button */}
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