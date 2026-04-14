import api from './api';

// Service to handle voice/story reading API calls
const voiceService = {
  // Submit completed story reading voice attempt to backend
  // Called by StoryBook.jsx when child finishes reading a story
  async submitVoiceAttempt(data) {
    return api.post('/child/voice-attempts/submit', data);
  },

  // Send recorded audio to backend for processing (future use)
  async processAudio(audioBlob, storyId, pageIndex, expectedText) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('storyId', storyId);
    formData.append('pageIndex', pageIndex);
    formData.append('expectedText', expectedText);

    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

    const response = await fetch(`${baseURL}/speech/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    return response.json();
  },
};

export default voiceService;