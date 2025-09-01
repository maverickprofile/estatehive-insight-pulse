import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Upload } from 'lucide-react';
import { webSpeechTranscription } from '@/services/web-speech-transcription.service';
import { transcriptionService } from '@/services/transcription.service';

export default function TestTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState('Ready to transcribe');
  const [confidence, setConfidence] = useState(0);

  // Start real-time transcription from microphone
  const startRecording = async () => {
    try {
      setIsRecording(true);
      setStatus('Listening...');
      setTranscription('');

      await webSpeechTranscription.startRealtimeTranscription(
        (result) => {
          setTranscription(prev => {
            if (result.isFinal) {
              return prev + result.text + ' ';
            }
            return prev;
          });
          setConfidence(result.confidence);
        },
        { language: 'en' }
      );
    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus('Error: ' + (error as Error).message);
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    webSpeechTranscription.stopRealtimeTranscription();
    setIsRecording(false);
    setStatus('Recording stopped');
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setStatus('Processing audio file...');
      setTranscription('');

      // Test Web Speech API
      const result = await webSpeechTranscription.transcribeAudioBlob(file, {
        language: 'en',
        onProgress: (text) => {
          setTranscription(text);
        }
      });

      setTranscription(result.text);
      setConfidence(result.confidence);
      setStatus('Transcription complete');
    } catch (error) {
      console.error('Error transcribing file:', error);
      
      // Try with transcription service (includes fallback to OpenAI)
      try {
        setStatus('Trying alternative method...');
        const result = await transcriptionService.transcribeAudio(file);
        setTranscription(result.text);
        setConfidence(result.confidence || 0);
        setStatus('Transcription complete (alternative method)');
      } catch (fallbackError) {
        setStatus('Error: ' + (fallbackError as Error).message);
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Test FREE Speech-to-Text</h2>
        
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
            <p className="text-sm">Status: <span className="font-semibold">{status}</span></p>
            {confidence > 0 && (
              <p className="text-sm">Confidence: <span className="font-semibold">{(confidence * 100).toFixed(1)}%</span></p>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            {/* Microphone Recording */}
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Recording
                </>
              )}
            </Button>

            {/* File Upload */}
            <div>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="audio-upload"
              />
              <label htmlFor="audio-upload">
                <Button variant="outline" className="flex items-center gap-2" asChild>
                  <span>
                    <Upload className="w-4 h-4" />
                    Upload Audio File
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Transcription Result */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Transcription:</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded min-h-[100px] whitespace-pre-wrap">
              {transcription || 'No transcription yet...'}
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300">How it works:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-400 mt-2 space-y-1">
              <li>• Uses browser's built-in Web Speech API (100% FREE)</li>
              <li>• No API keys or external services required</li>
              <li>• Works with microphone or audio files</li>
              <li>• Supports multiple languages</li>
              <li>• Falls back to OpenAI if Web Speech fails (requires API key)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}