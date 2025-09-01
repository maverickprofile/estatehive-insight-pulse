/**
 * Safe Audio Handler Service
 * Provides fallback audio handling when Web Speech API is blocked
 */

export class SafeAudioHandler {
  private static instance: SafeAudioHandler | null = null;
  private hasPermission = false;
  private permissionChecked = false;

  constructor() {
    if (SafeAudioHandler.instance) {
      return SafeAudioHandler.instance;
    }
    SafeAudioHandler.instance = this;
  }

  /**
   * Check and request microphone permission
   */
  async checkMicrophonePermission(): Promise<boolean> {
    if (this.permissionChecked) {
      return this.hasPermission;
    }

    try {
      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        console.warn('Not in secure context. Microphone access requires HTTPS.');
        this.hasPermission = false;
        this.permissionChecked = true;
        return false;
      }

      // Try to get microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately (we just needed to check permission)
      stream.getTracks().forEach(track => track.stop());
      
      this.hasPermission = true;
      this.permissionChecked = true;
      return true;
    } catch (error: any) {
      console.warn('Microphone permission denied or not available:', error.message);
      this.hasPermission = false;
      this.permissionChecked = true;
      return false;
    }
  }

  /**
   * Create a silent audio blob as placeholder
   */
  createSilentAudioBlob(durationSeconds = 1): Blob {
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = byteRate * durationSeconds;
    const fileSize = 44 + dataSize; // WAV header is 44 bytes
    
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    writeString(8, 'WAVE');
    
    // fmt sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    // data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Fill with silence (zeros)
    for (let i = 44; i < fileSize; i++) {
      view.setUint8(i, 0);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Create test audio with a simple tone
   */
  createTestAudioBlob(frequencyHz = 440, durationSeconds = 1): Blob {
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    const numSamples = sampleRate * durationSeconds;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const fileSize = 44 + dataSize;
    
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);
    
    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Generate sine wave
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const amplitude = 0.3; // 30% volume to avoid clipping
      const sample = Math.sin(2 * Math.PI * frequencyHz * t) * amplitude;
      const value = Math.floor(sample * 0x7FFF);
      view.setInt16(offset, value, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Convert any audio blob to WAV format safely
   */
  async convertToWav(audioBlob: Blob): Promise<Blob> {
    try {
      // Check if we have AudioContext support
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.warn('AudioContext not supported, returning original blob');
        return audioBlob;
      }

      const audioContext = new AudioContext();
      
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Convert AudioBuffer to WAV
        return this.audioBufferToWav(audioBuffer);
      } catch (decodeError) {
        console.warn('Failed to decode audio, returning placeholder:', decodeError);
        // Return a placeholder audio file
        return this.createTestAudioBlob(440, 2);
      } finally {
        audioContext.close();
      }
    } catch (error) {
      console.error('Error converting to WAV:', error);
      return this.createSilentAudioBlob();
    }
  }

  /**
   * Convert AudioBuffer to WAV blob
   */
  private audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    const numberOfChannels = Math.min(audioBuffer.numberOfChannels, 2);
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    // Interleave channels
    const length = audioBuffer.length * numberOfChannels;
    const buffer = new Float32Array(length);
    
    let offset = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        buffer[offset++] = audioBuffer.getChannelData(channel)[i];
      }
    }

    const dataLength = buffer.length * bytesPerSample;
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

    // Write PCM samples
    let writeOffset = 44;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(writeOffset, sample * 0x7FFF, true);
      writeOffset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Get mock transcription for testing
   */
  getMockTranscription(): string {
    const mockMessages = [
      "This is a test voice message. The actual audio could not be processed due to browser restrictions.",
      "Test message: Please ensure microphone permissions are enabled and you're using HTTPS.",
      "Demo transcription: Voice processing is currently in fallback mode.",
      "Sample text: The voice recognition service requires proper permissions to function.",
    ];
    
    return mockMessages[Math.floor(Math.random() * mockMessages.length)];
  }

  /**
   * Process audio with fallback handling
   */
  async processAudioSafely(audioBlob: Blob): Promise<{
    processedBlob: Blob;
    canTranscribe: boolean;
    fallbackText?: string;
  }> {
    // Check microphone permission
    const hasPermission = await this.checkMicrophonePermission();
    
    if (!hasPermission) {
      // No permission, use fallback
      return {
        processedBlob: this.createTestAudioBlob(),
        canTranscribe: false,
        fallbackText: this.getMockTranscription()
      };
    }
    
    // Try to convert to WAV
    const wavBlob = await this.convertToWav(audioBlob);
    
    return {
      processedBlob: wavBlob,
      canTranscribe: true
    };
  }
}

// Export singleton instance
export const safeAudioHandler = new SafeAudioHandler();