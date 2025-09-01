/**
 * Web Speech API Transcription Service
 * FREE alternative to OpenAI Whisper using browser's built-in speech recognition
 */

export interface WebSpeechTranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  isFinal: boolean;
}

class WebSpeechTranscriptionService {
  private recognition: any = null;
  private isListening = false;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initializeRecognition();
  }

  /**
   * Initialize the Web Speech API
   */
  private initializeRecognition(): void {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || 
                            (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    
    // Configure recognition
    this.recognition.continuous = true; // Keep listening
    this.recognition.interimResults = true; // Get partial results
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'en-US'; // Default to English
  }

  /**
   * Check if Web Speech API is available
   */
  isAvailable(): boolean {
    return this.recognition !== null;
  }

  /**
   * Transcribe audio blob using Web Speech API
   */
  async transcribeAudioBlob(
    audioBlob: Blob,
    options: {
      language?: string;
      onProgress?: (text: string) => void;
    } = {}
  ): Promise<WebSpeechTranscriptionResult> {
    if (!this.isAvailable()) {
      throw new Error('Web Speech API is not available in this browser');
    }

    // Convert blob to audio and play it while recognizing
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let lastConfidence = 0;

      // Set language if specified
      if (options.language) {
        this.recognition.lang = this.mapLanguageCode(options.language);
      }

      // Handle recognition results
      this.recognition.onresult = (event: any) => {
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            lastConfidence = event.results[i][0].confidence || 0.95;
          } else {
            interimTranscript += transcript;
          }
        }

        // Call progress callback with current transcript
        if (options.onProgress) {
          options.onProgress(finalTranscript + interimTranscript);
        }
      };

      // Handle errors
      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Try to provide helpful error messages
        if (event.error === 'no-speech') {
          reject(new Error('No speech detected in the audio'));
        } else if (event.error === 'audio-capture') {
          reject(new Error('No microphone available'));
        } else if (event.error === 'not-allowed') {
          reject(new Error('Microphone access denied'));
        } else {
          reject(new Error(`Speech recognition error: ${event.error}`));
        }
      };

      // Handle end of recognition
      this.recognition.onend = () => {
        this.isListening = false;
        audio.pause();
        URL.revokeObjectURL(audioUrl);
        
        if (finalTranscript.trim()) {
          resolve({
            text: finalTranscript.trim(),
            confidence: lastConfidence || 0.9,
            language: this.recognition.lang,
            isFinal: true,
          });
        } else {
          reject(new Error('No transcription generated'));
        }
      };

      // Start recognition and play audio
      this.recognition.start();
      this.isListening = true;

      // Play the audio to feed it to the recognition
      // Note: This requires user interaction for autoplay policy
      audio.play().then(() => {
        // Audio is playing, recognition is listening
        console.log('Transcribing audio using Web Speech API...');
      }).catch((error) => {
        // If autoplay is blocked, we need to use a different approach
        console.warn('Autoplay blocked, using alternative method');
        this.transcribeUsingMicrophone(audioBlob, resolve, reject);
      });

      // Stop recognition when audio ends
      audio.onended = () => {
        if (this.isListening) {
          setTimeout(() => {
            this.recognition.stop();
          }, 1000); // Give it a second to catch final words
        }
      };
    });
  }

  /**
   * Alternative method using microphone capture
   * This method converts the audio to be played through speakers and captured by mic
   */
  private async transcribeUsingMicrophone(
    audioBlob: Blob,
    resolve: (result: WebSpeechTranscriptionResult) => void,
    reject: (error: Error) => void
  ): Promise<void> {
    try {
      // Initialize audio context
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Create a source node from the audio buffer
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Connect to destination (speakers)
      source.connect(this.audioContext.destination);

      // Start playback
      source.start(0);

      // The recognition is already listening from the previous setup
      console.log('Playing audio through speakers for recognition...');

    } catch (error) {
      console.error('Error in microphone transcription:', error);
      reject(new Error('Failed to process audio for transcription'));
    }
  }

  /**
   * Start real-time transcription from microphone
   */
  async startRealtimeTranscription(
    onResult: (result: WebSpeechTranscriptionResult) => void,
    options: {
      language?: string;
    } = {}
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Web Speech API is not available');
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    // Set language
    if (options.language) {
      this.recognition.lang = this.mapLanguageCode(options.language);
    }

    // Handle results
    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        onResult({
          text: result[0].transcript,
          confidence: result[0].confidence || 0.9,
          language: this.recognition.lang,
          isFinal: result.isFinal,
        });
      }
    };

    // Start recognition
    this.recognition.start();
    this.isListening = true;
  }

  /**
   * Stop real-time transcription
   */
  stopRealtimeTranscription(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Map language codes to Web Speech API format
   */
  private mapLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'ar': 'ar-SA',
    };

    return languageMap[language] || language || 'en-US';
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'en-US', 'en-GB', 'en-IN',
      'hi-IN',
      'es-ES', 'es-MX',
      'fr-FR',
      'de-DE',
      'zh-CN',
      'ja-JP',
      'ko-KR',
      'pt-BR',
      'ru-RU',
      'ar-SA',
    ];
  }

  /**
   * Convert OGG to WAV format for better compatibility
   */
  async convertOggToWav(oggBlob: Blob): Promise<Blob> {
    try {
      // Initialize audio context
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Convert blob to array buffer
      const arrayBuffer = await oggBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Convert to WAV
      const wavBuffer = this.audioBufferToWav(audioBuffer);
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error converting OGG to WAV:', error);
      // Return original blob if conversion fails
      return oggBlob;
    }
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const data = this.interleave(buffer);
    const dataLength = data.length * bytesPerSample;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Write PCM data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  }

  /**
   * Interleave audio channels
   */
  private interleave(buffer: AudioBuffer): Float32Array {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels;
    const result = new Float32Array(length);

    let offset = 0;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        result[offset++] = buffer.getChannelData(channel)[i];
      }
    }

    return result;
  }
}

// Export singleton instance
export const webSpeechTranscription = new WebSpeechTranscriptionService();