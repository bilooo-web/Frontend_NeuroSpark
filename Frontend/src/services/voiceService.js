// Service to handle communication with your backend API
class VoiceService {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
  }

  // Send recorded audio to backend for processing
  async processAudio(audioBlob, storyId, pageIndex, expectedText) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('storyId', storyId);
    formData.append('pageIndex', pageIndex);
    formData.append('expectedText', expectedText);

    try {
      const response = await fetch(`${this.baseURL}/speech/process`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending audio to backend:', error);
      throw error;
    }
  }

  // Alternative: Stream audio in real-time via WebSocket
  createWebSocketConnection(storyId, pageIndex, onTranscript, onError) {
    const ws = new WebSocket(`ws://localhost:5000/speech/stream`);
    
    ws.onopen = () => {
      // Send metadata first
      ws.send(JSON.stringify({
        type: 'config',
        storyId,
        pageIndex,
        expectedText: 'The target sentence for comparison'
      }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'transcript') {
        onTranscript(data);
      }
    };
    
    ws.onerror = (error) => {
      if (onError) onError(error);
    };
    
    return ws;
  }
}

export default new VoiceService();