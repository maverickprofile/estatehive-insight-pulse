/**
 * Improved Web Speech API Transcription Service
 * FREE speech-to-text with better error handling and format support
 */

import { safeAudioHandler } from './safe-audio-handler.service';

export interface WebSpeechTranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  isFinal: boolean;
}

export interface AudioFormat {
  mimeType: string;
  extension: string;
  needsConversion: boolean;
}

class ImprovedWebSpeechService {
  private recognition: any = null;
  private isListening = false;
  private audioContext: AudioContext | null = null;
  private recognitionQueue: Array<() => void> = [];
  private isProcessingQueue = false;
  private recognitionTimeout: number | null = null;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.initializeRecognition();
  }

  /**
   * Initialize Web Speech API with better browser compatibility
   */
  private initializeRecognition(): void {
    // Check for various browser implementations
    const SpeechRecognition = 
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      
      // Configure for optimal transcription
      this.recognition.continuous = false; // Process one audio at a time
      this.recognition.interimResults = true; // Get partial results
      this.recognition.maxAlternatives = 3; // Get multiple alternatives
      this.recognition.lang = 'en-US'; // Default language
      
      // Add abort handler to properly cleanup
      this.recognition.onend = () => {
        this.isListening = false;
      };
      
      console.log('Web Speech API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Web Speech API:', error);
    }
  }

  /**
   * Check if Web Speech API is available
   */
  isAvailable(): boolean {
    return this.recognition !== null && typeof this.recognition !== 'undefined';
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): AudioFormat[] {
    return [
      { mimeType: 'audio/wav', extension: 'wav', needsConversion: false },
      { mimeType: 'audio/webm', extension: 'webm', needsConversion: false },
      { mimeType: 'audio/mp3', extension: 'mp3', needsConversion: false },
      { mimeType: 'audio/mpeg', extension: 'mp3', needsConversion: false },
      { mimeType: 'audio/ogg', extension: 'ogg', needsConversion: true },
      { mimeType: 'audio/opus', extension: 'opus', needsConversion: true },
      { mimeType: 'audio/m4a', extension: 'm4a', needsConversion: true },
    ];
  }

  /**
   * Detect audio format from blob
   */
  private detectAudioFormat(blob: Blob): AudioFormat {
    const formats = this.getSupportedFormats();
    const format = formats.find(f => f.mimeType === blob.type);
    
    if (format) {
      return format;
    }
    
    // Default to OGG if unknown
    return { mimeType: blob.type || 'audio/ogg', extension: 'ogg', needsConversion: true };
  }

  /**
   * Main transcription method with improved error handling
   */
  async transcribeAudioBlob(
    audioBlob: Blob,
    options: {
      language?: string;
      onProgress?: (text: string) => void;
      retries?: number;
    } = {}
  ): Promise<WebSpeechTranscriptionResult> {
    if (!this.isAvailable()) {
      // Use fallback with mock transcription
      const { fallbackText } = await safeAudioHandler.processAudioSafely(audioBlob);
      return {
        text: fallbackText || 'Web Speech API not available',
        confidence: 0.5,
        language: options.language || 'en-US',
        isFinal: true
      };
    }

    // Detect format and convert if necessary
    const format = this.detectAudioFormat(audioBlob);
    let processedBlob = audioBlob;
    
    if (format.needsConversion) {
      console.log(`Converting ${format.mimeType} to WAV for better compatibility`);
      try {
        processedBlob = await this.convertToWav(audioBlob);
      } catch (conversionError) {
        console.warn('Audio conversion failed, using safe handler:', conversionError);
        // Use safe audio handler for conversion
        const safeResult = await safeAudioHandler.processAudioSafely(audioBlob);
        processedBlob = safeResult.processedBlob;
      }
    }

    // Try multiple transcription methods
    const methods = [
      () => this.transcribeUsingAudioElement(processedBlob, options),
      () => this.transcribeUsingAudioContext(processedBlob, options),
      () => this.transcribeUsingMediaStream(processedBlob, options),
    ];

    let lastError: Error | null = null;
    
    for (const method of methods) {
      try {
        console.log('Attempting transcription method...');
        return await method();
      } catch (error: any) {
        console.warn('Transcription method failed:', error.message);
        lastError = error;
        // Try next method
      }
    }

    // All methods failed
    throw lastError || new Error('All transcription methods failed');
  }

  /**
   * Method 1: Transcribe using audio element playback
   */
  private async transcribeUsingAudioElement(
    audioBlob: Blob,
    options: any
  ): Promise<WebSpeechTranscriptionResult> {
    return new Promise((resolve, reject) => {
      // Ensure we're not already listening
      if (this.isListening) {
        this.recognition.stop();
        this.isListening = false;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.volume = 0.1; // Lower volume to avoid feedback
      
      let finalTranscript = '';
      let interimTranscript = '';
      let lastConfidence = 0.9;
      let hasResult = false;

      // Set language if specified
      if (options.language) {
        this.recognition.lang = this.mapLanguageCode(options.language);
      }

      // Set up timeout
      const timeoutDuration = 30000; // 30 seconds
      const timeout = setTimeout(() => {
        this.recognition.stop();
        audio.pause();
        URL.revokeObjectURL(audioUrl);
        
        if (hasResult && finalTranscript) {
          resolve({
            text: finalTranscript.trim(),
            confidence: lastConfidence,
            language: this.recognition.lang,
            isFinal: true,
          });
        } else {
          reject(new Error('Transcription timeout - no speech detected'));
        }
      }, timeoutDuration);

      // Handle recognition results
      this.recognition.onresult = (event: any) => {
        hasResult = true;
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
            lastConfidence = result[0].confidence || 0.9;
          } else {
            interimTranscript += transcript;
          }
        }

        // Call progress callback
        if (options.onProgress) {
          options.onProgress(finalTranscript + interimTranscript);
        }
      };

      // Handle errors
      this.recognition.onerror = (event: any) => {
        clearTimeout(timeout);
        audio.pause();
        URL.revokeObjectURL(audioUrl);
        
        // Handle specific errors
        if (event.error === 'no-speech') {
          if (finalTranscript) {
            resolve({
              text: finalTranscript.trim(),
              confidence: lastConfidence,
              language: this.recognition.lang,
              isFinal: true,
            });
          } else {
            reject(new Error('No speech detected in audio'));
          }
        } else if (event.error === 'aborted') {
          // Recognition was aborted, try to return what we have
          if (finalTranscript) {
            resolve({
              text: finalTranscript.trim(),
              confidence: lastConfidence,
              language: this.recognition.lang,
              isFinal: true,
            });
          } else {
            reject(new Error('Recognition aborted'));
          }
        } else {
          reject(new Error(`Speech recognition error: ${event.error}`));
        }
      };

      // Handle recognition end
      this.recognition.onend = () => {
        clearTimeout(timeout);
        this.isListening = false;
        audio.pause();
        URL.revokeObjectURL(audioUrl);
        
        if (finalTranscript.trim() || interimTranscript.trim()) {
          resolve({
            text: (finalTranscript + interimTranscript).trim(),
            confidence: lastConfidence,
            language: this.recognition.lang,
            isFinal: true,
          });
        } else if (!hasResult) {
          reject(new Error('No transcription generated'));
        }
      };

      // Start recognition (ensure we're not already listening)
      try {
        if (!this.isListening) {
          this.recognition.start();
          this.isListening = true;
        }

        // Play audio with user gesture handling
        audio.play().catch((playError) => {
          console.warn('Autoplay blocked, requesting user interaction');
          
          // Create a temporary button for user interaction
          const playButton = document.createElement('button');
          playButton.style.position = 'fixed';
          playButton.style.top = '50%';
          playButton.style.left = '50%';
          playButton.style.transform = 'translate(-50%, -50%)';
          playButton.style.padding = '10px 20px';
          playButton.style.zIndex = '9999';
          playButton.textContent = 'Click to transcribe audio';
          
          playButton.onclick = () => {
            audio.play();
            document.body.removeChild(playButton);
          };
          
          document.body.appendChild(playButton);
        });

        // Stop recognition when audio ends
        audio.onended = () => {
          setTimeout(() => {
            if (this.isListening) {
              this.recognition.stop();
            }
          }, 500);
        };
      } catch (startError) {
        clearTimeout(timeout);
        URL.revokeObjectURL(audioUrl);
        reject(startError);
      }
    });
  }

  /**
   * Method 2: Transcribe using AudioContext
   */
  private async transcribeUsingAudioContext(
    audioBlob: Blob,
    options: any
  ): Promise<WebSpeechTranscriptionResult> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Ensure context is running
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    return new Promise((resolve, reject) => {
      let finalTranscript = '';
      let lastConfidence = 0.9;

      // Set language
      if (options.language) {
        this.recognition.lang = this.mapLanguageCode(options.language);
      }

      // Set up recognition handlers
      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
            lastConfidence = result[0].confidence || 0.9;
          }
        }
        
        if (options.onProgress) {
          options.onProgress(finalTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (finalTranscript) {
          resolve({
            text: finalTranscript.trim(),
            confidence: lastConfidence,
            language: this.recognition.lang,
            isFinal: true,
          });
        } else {
          reject(new Error(`Recognition error: ${event.error}`));
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (finalTranscript) {
          resolve({
            text: finalTranscript.trim(),
            confidence: lastConfidence,
            language: this.recognition.lang,
            isFinal: true,
          });
        } else {
          reject(new Error('No transcription generated'));
        }
      };

      // Start recognition (ensure we're not already listening)
      if (!this.isListening) {
        this.recognition.start();
        this.isListening = true;
      }

      // Play audio through speakers
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create gain node to control volume
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.1; // Low volume
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      source.start(0);

      // Stop recognition after audio ends
      source.onended = () => {
        setTimeout(() => {
          this.recognition.stop();
        }, 1000);
      };
    });
  }

  /**
   * Method 3: Transcribe using MediaStream
   */
  private async transcribeUsingMediaStream(
    audioBlob: Blob,
    options: any
  ): Promise<WebSpeechTranscriptionResult> {
    // This method creates a media stream from the audio
    // Useful for certain browser implementations
    
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Create a media stream destination
    const destination = this.audioContext.createMediaStreamDestination();
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(destination);

    return new Promise((resolve, reject) => {
      let finalTranscript = '';
      let lastConfidence = 0.9;

      if (options.language) {
        this.recognition.lang = this.mapLanguageCode(options.language);
      }

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
            lastConfidence = result[0].confidence || 0.9;
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        reject(new Error(`Recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (finalTranscript) {
          resolve({
            text: finalTranscript.trim(),
            confidence: lastConfidence,
            language: this.recognition.lang,
            isFinal: true,
          });
        } else {
          reject(new Error('No transcription generated'));
        }
      };

      // Start recognition with media stream (ensure we're not already listening)
      if (!this.isListening) {
        this.recognition.start();
        this.isListening = true;
      }
      source.start(0);

      source.onended = () => {
        setTimeout(() => {
          this.recognition.stop();
        }, 1000);
      };
    });
  }

  /**
   * Convert audio to WAV format for better compatibility
   */
  async convertToWav(audioBlob: Blob): Promise<Blob> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to WAV
      const wavBuffer = this.audioBufferToWav(audioBuffer);
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error converting to WAV:', error);
      throw error;
    }
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numberOfChannels = Math.min(buffer.numberOfChannels, 2);
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const data = this.interleave(buffer, numberOfChannels);
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
    view.setUint32(16, 16, true);
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
  private interleave(buffer: AudioBuffer, numberOfChannels: number): Float32Array {
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

  /**
   * Map language codes to Web Speech API format
   */
  private mapLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'en-us': 'en-US',
      'en-gb': 'en-GB',
      'en-in': 'en-IN',
      'hi': 'hi-IN',
      'hi-in': 'hi-IN',
      'es': 'es-ES',
      'es-es': 'es-ES',
      'es-mx': 'es-MX',
      'fr': 'fr-FR',
      'fr-fr': 'fr-FR',
      'de': 'de-DE',
      'de-de': 'de-DE',
      'zh': 'zh-CN',
      'zh-cn': 'zh-CN',
      'ja': 'ja-JP',
      'ja-jp': 'ja-JP',
      'ko': 'ko-KR',
      'ko-kr': 'ko-KR',
      'pt': 'pt-BR',
      'pt-br': 'pt-BR',
      'ru': 'ru-RU',
      'ru-ru': 'ru-RU',
      'ar': 'ar-SA',
      'ar-sa': 'ar-SA',
      'it': 'it-IT',
      'it-it': 'it-IT',
    };

    const lowercaseLanguage = language.toLowerCase();
    return languageMap[lowercaseLanguage] || language || 'en-US';
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'en-US', 'en-GB', 'en-IN', 'en-AU', 'en-CA',
      'hi-IN',
      'es-ES', 'es-MX', 'es-AR',
      'fr-FR', 'fr-CA',
      'de-DE', 'de-CH',
      'zh-CN', 'zh-TW',
      'ja-JP',
      'ko-KR',
      'pt-BR', 'pt-PT',
      'ru-RU',
      'ar-SA',
      'it-IT',
      'nl-NL',
      'pl-PL',
      'tr-TR',
    ];
  }

  /**
   * Test if Web Speech API is working
   */
  async testRecognition(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    return new Promise((resolve) => {
      const testRecognition = new (window as any).webkitSpeechRecognition();
      
      testRecognition.onstart = () => {
        testRecognition.stop();
        resolve(true);
      };
      
      testRecognition.onerror = () => {
        resolve(false);
      };
      
      try {
        testRecognition.start();
      } catch {
        resolve(false);
      }
      
      // Timeout after 2 seconds
      setTimeout(() => {
        try {
          testRecognition.stop();
        } catch {}
        resolve(false);
      }, 2000);
    });
  }
}

// Export singleton instance
export const improvedWebSpeech = new ImprovedWebSpeechService();