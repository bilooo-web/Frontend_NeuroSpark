import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { stories } from "../data/storiesData";
import useSpeechRecognition from "../components/hooks/useSpeechRecognition";
import GingerIntroSlide from "../components/StoryReader/slides/Ginger/GingerIntroSlide";
import Ginger2Slide from "../components/StoryReader/slides/Ginger/Ginger2Slide";
import Ginger3Slide from "../components/StoryReader/slides/Ginger/Ginger3Slide";
import Ginger4Slide from "../components/StoryReader/slides/Ginger/Ginger4Slide";
import voiceService from "../services/voiceService";
import AuthModal from '../components/Auth/AuthModal';
import Header from "../components/common/Header/Header";
import api from "../services/api";
import { useApp } from "../context/AppContext";
import micIcon from "../assets/mic.png";
import noMicIcon from "../assets/no-mic.png";
import "./StoryBook.css";

const StoryBook = () => {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const { id } = useParams();
  const [headerTotalCoins, setHeaderTotalCoins] = useState(0);

  // Handle coins-updated event (like in games)
  useEffect(() => {
    const handleCoinsUpdated = (e) => {
      if (e.detail?.totalCoins != null) {
        setHeaderTotalCoins(e.detail.totalCoins);
      }
    };
    window.addEventListener('coins-updated', handleCoinsUpdated);
    return () => window.removeEventListener('coins-updated', handleCoinsUpdated);
  }, []);

  const navigate = useNavigate();
  const story = stories[id];
  const { user } = useApp();

  const [pageIndex, setPageIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pageSummaries, setPageSummaries] = useState([]);
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  // Add state for coin animation
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const maxRewardCoinsRef = useRef(50); // default, updated from backend
  const startTimeRef = useRef(0);
  // Track pause/idle time: time when mic is off between listening sessions
  const pauseStartRef = useRef(null);
  const totalPauseDurationRef = useRef(0);
  useEffect(() => {
    startTimeRef.current = Date.now();
    totalPauseDurationRef.current = 0;
    pauseStartRef.current = null;
  }, []);

  // Fetch the voice instruction's reward_coins from backend
  useEffect(() => {
    if (!story?.slug) return;
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (token && storedUser.role === 'child') {
      api.get(`/child/stories/${story.slug}/progress`)
        .then(res => {
          // We don't need progress here, but we could extend the endpoint
          // For now the reward_coins comes from the voice instruction
        })
        .catch(() => {});

      // Fetch voice instructions to get reward_coins for this story
      api.get('/child/voice-instructions')
        .then(res => {
          const instructions = Array.isArray(res) ? res : (res.data || []);
          const match = instructions.find(i => i.story_slug === story.slug);
          if (match?.reward_coins) {
            maxRewardCoinsRef.current = match.reward_coins;
          }
        })
        .catch(() => {});
    }
  }, [story?.slug]);

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

  // Submit voice attempt to backend
  const submitVoiceAttempt = async (sessionData) => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

    // Only submit for authenticated child users
    if (!token || storedUser.role !== 'child') {
      console.warn('⚠️ Not a logged-in child — skipping voice attempt submission');
      return;
    }

    setSubmitStatus('loading');
    setSubmitError(null);

    try {
      const storySlug = story?.slug;
      if (!storySlug) {
        console.warn('⚠️ Story slug not found — skipping voice attempt submission');
        setSubmitStatus(null);
        return;
      }

      const totalTime = sessionData.totalTime || 0;
      const totalWords = sessionData.totalWords || 0;

      // accuracy_score = correct words / total expected words (includes missing as wrong)
      const accuracyScore = Math.round((sessionData.overallScore ?? 0) * 100);

      // pronunciation_score = correct words / total words actually spoken (excludes missing)
      // This measures how well the child pronounced the words they DID attempt
      const spokenWords = totalWords - (sessionData.missingCount || 0);
      const correctWords = totalWords - (sessionData.incorrectCount || 0) - (sessionData.missingCount || 0);
      const pronunciationScore = spokenWords > 0
        ? Math.round((correctWords / spokenWords) * 100)
        : 0;

      const voiceData = {
        story_slug: storySlug,
        accuracy_score: accuracyScore,
        pronunciation_score: pronunciationScore,
        speech_rate: totalWords && totalTime
          ? parseFloat((totalWords / Math.max(totalTime / 60, 0.01)).toFixed(2))
          : 0,
        total_words: totalWords,
        incorrect_words: sessionData.incorrectCount || 0,
        duration: totalTime,
        pause_duration: sessionData.pauseDuration || 0,
        coins_earned: sessionData.coinsEarned || 0,
        speaker_clicks: sessionData.totalSpeakerClicks || 0,
        word_clicks: sessionData.totalWordClicks || 0,
        page_summaries: sessionData.pageSummaries || null,
      };

      console.log('📤 Submitting voice attempt:', voiceData);
      const result = await voiceService.submitVoiceAttempt(voiceData);

      // Sync coins from server response
      if (result?.total_coins !== undefined) {
        localStorage.setItem('totalCoins', String(result.total_coins));
      }

      setSubmitStatus('success');
      console.log('✅ Voice attempt saved successfully');

      setTimeout(() => setSubmitStatus(null), 2000);
    } catch (error) {
      console.error('❌ Failed to submit voice attempt:', error);
      setSubmitError(error.message || 'Failed to save voice attempt');
      setSubmitStatus('error');

      setTimeout(() => {
        setSubmitStatus(null);
        setSubmitError(null);
      }, 3000);
    }
  };

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

  const isSubmittingRef = useRef(false);

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
      // Guard against double-submit (React StrictMode or rapid clicks)
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      // Compute final stats synchronously using the ref-based summaries
      // instead of inside a state updater (which React StrictMode calls twice)
      const allSummaries = [...pageSummaries];
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

      // Update state for UI
      setPageSummaries(allSummaries);

      // Calculate coins earned
      const maxCoins = maxRewardCoinsRef.current;
      const coinsEarned = totalWords > 0
        ? Math.round(maxCoins * (allCorrect.length / totalWords))
        : 0;

      // Set coin reward for animation
      setCoinsEarned(coinsEarned);
      setShowCoinReward(true);
      setTimeout(() => setShowCoinReward(false), 3000);

      // Finalize pause tracking — if mic is still paused, count it
      if (pauseStartRef.current) {
        totalPauseDurationRef.current += Math.round((Date.now() - pauseStartRef.current) / 1000);
        pauseStartRef.current = null;
      }

      const submissionData = {
        overallScore,
        totalWords,
        incorrectCount: allIncorrect.length,
        missingCount: allMissing.length,
        totalTime,
        pauseDuration: totalPauseDurationRef.current,
        coinsEarned,
        totalSpeakerClicks,
        totalWordClicks,
        pageSummaries: allSummaries.map(p => ({
          pageNumber: p?.pageNumber,
          score: p?.score,
          totalWords: p?.totalWords,
          correctWords: p?.correctWords,
          incorrectWords: p?.incorrectWords,
          missingWords: p?.missingWords,
          speakerClicks: p?.speakerClicks || 0,
          wordClicks: p?.wordClicks || 0,
          clickedWords: p?.clickedWords || [],
        })),
      };

      // Submit first, THEN navigate after completion (success or failure)
      submitVoiceAttempt(submissionData).finally(() => {
        isSubmittingRef.current = false;
        navigate(`/story/${idRef.current}/intro`);
      });
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
      <Header totalCoins={headerTotalCoins} />
      <div className="storybook-container">
        {renderCurrentSlide()}
      </div>


      {showFeedback && (
        <div className="feedback-overlay correct">
          ⭐ Great job!{" "}
          {isLastPage ? "Finishing story... 🎉" : "Moving to next page..."}
        </div>
      )}

      {showCoinReward && (
        <div className="coin-reward-overlay">
          <span className="coin-emoji">🪙</span>
          <span className="coin-amount">+{coinsEarned} coins!</span>
        </div>
      )}

      {/* ── Leave / Back confirmation modal ── */}
      {showLeaveModal && (
        <div className="sb-leave-backdrop" onClick={() => setShowLeaveModal(false)}>
          <div className="sb-leave-modal" onClick={e => e.stopPropagation()}>
            <div className="sb-leave-icon">⚠️</div>
            <h2 className="sb-leave-title">Leave Story?</h2>
            <p className="sb-leave-body">
              Your reading progress will be lost and this session will be abandoned.<br />
              Are you sure?
            </p>
            <div className="sb-leave-actions">
              <button className="sb-leave-btn sb-leave-stay" onClick={() => setShowLeaveModal(false)}>
                No, Stay
              </button>
              <button className="sb-leave-btn sb-leave-go" onClick={() => navigate(-1)}>
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}

       <button
        className="si-back-btn"
        onClick={() => setShowLeaveModal(true)}
        aria-label="Back to reading page"
      >
        ← Back
      </button>


      {error && <div className="error-overlay">⚠️ {error}</div>}

      {submitStatus && (
        <div className={`voice-submit-status ${submitStatus}`}>
          {submitStatus === 'loading' && '⏳ Saving your reading...'}
          {submitStatus === 'success' && '✅ Reading saved!'}
          {submitStatus === 'error' && `❌ ${submitError}`}
        </div>
      )}

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