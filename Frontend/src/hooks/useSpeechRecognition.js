import { useState, useEffect, useRef, useCallback } from 'react';

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Request microphone with optimal settings
  const requestMicrophone = async () => {
    try {
      // If there's an existing stream, close it first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      });
      streamRef.current = stream;
      return true;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
      return false;
    }
  };

  // Function to release microphone
  const releaseMicrophone = useCallback(() => {
    if (streamRef.current) {
      console.log('Releasing microphone');
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.kind} stopped`);
      });
      streamRef.current = null;
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser. Please use Chrome.');
      return;
    }

    // Use the appropriate constructor
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    // Configure for better accuracy and continuous listening
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 3;

    // Set up event handlers
    recognitionRef.current.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      switch(event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('No microphone found. Please check your microphone.');
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone access.');
          break;
        default:
          setError(`Error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      let newFinalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscriptRef.current += transcriptText + ' ';
          newFinalTranscript += transcriptText + ' ';
        } else {
          interimTranscript += transcriptText;
        }
      }

      setTranscript(finalTranscriptRef.current + interimTranscript);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      releaseMicrophone();
    };
  }, [releaseMicrophone]);

  const startListening = useCallback(async () => {
    if (recognitionRef.current && !isListening) {
      try {
        // Request microphone access before starting
        const micAvailable = await requestMicrophone();
        if (!micAvailable) {
          setError('Could not access microphone');
          return;
        }
        
        finalTranscriptRef.current = '';
        setTranscript('');
        recognitionRef.current.start();
        console.log('Starting speech recognition');
      } catch (err) {
        console.error('Failed to start recognition:', err);
        setError('Failed to start recognition');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        console.log('Stopping speech recognition');
        // Release the microphone after stopping
        releaseMicrophone();
      } catch (err) {
        console.error('Failed to stop recognition:', err);
      }
    }
  }, [isListening, releaseMicrophone]);

  const toggleListening = useCallback(() => {
    console.log('Toggle listening, current state:', isListening);
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript
  };
};

export default useSpeechRecognition;