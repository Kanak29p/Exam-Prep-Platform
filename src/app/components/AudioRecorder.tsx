import { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabase";
import { toast } from "sonner";
import { Mic, Square, RotateCcw, UploadCloud, CheckCircle2, Loader2 } from "lucide-react";

type AudioRecorderProps = {
  maxTimeSeconds?: number;
  onUploadSuccess?: (url: string) => void;
  autoStartRecording?: boolean;
  onRecordingStart?: () => void;
  onRecordingComplete?: () => void;
};

export function AudioRecorder({
  maxTimeSeconds = 40,
  onUploadSuccess,
  autoStartRecording,
  onRecordingStart,
  onRecordingComplete,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Clean up interval and stream on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Monitor elapsed time to auto-stop
  useEffect(() => {
    if (isRecording && elapsedSeconds >= maxTimeSeconds) {
      stopRecording();
      toast.info("Recording limit reached. Auto-stopped.");
    }
  }, [elapsedSeconds, isRecording, maxTimeSeconds]);

  // Trigger auto-start if requested
  useEffect(() => {
    console.log("[DEBUG] AudioRecorder autoStart useEffect - autoStartRecording:", autoStartRecording, "isRecording:", isRecording, "audioUrl:", audioUrl);
    if (autoStartRecording && !isRecording && !audioUrl && !isUploading) {
      startRecording();
    }
  }, [autoStartRecording]);

  // Start recording
  const startRecording = async () => {
    console.log("[DEBUG] AudioRecorder startRecording called");
    try {
      setAudioUrl("");
      setAudioBlob(null);
      setElapsedSeconds(0);
      setIsUploaded(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log("[DEBUG] AudioRecorder recorder.onstop event fired");
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      recorder.start();
      setIsRecording(true);
      if (onRecordingStart) {
        console.log("[DEBUG] calling onRecordingStart callback");
        onRecordingStart();
      }

      // Start elapsed timer
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Recording failed", error);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    console.log("[DEBUG] AudioRecorder stopRecording called");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    if (onRecordingComplete) {
      console.log("[DEBUG] calling onRecordingComplete callback");
      onRecordingComplete();
    }
  };

  // Upload to Supabase
  const uploadAudio = async () => {
    console.log("[DEBUG] AudioRecorder uploadAudio called");
    if (!audioBlob) {
      toast.error("No recorded audio found. Please record first.");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}.mp3`;

      const { error } = await supabase.storage
        .from("audio-recordings")
        .upload(fileName, audioBlob, {
          contentType: "audio/mpeg",
          cacheControl: "3600"
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from("audio-recordings")
        .getPublicUrl(fileName);

      setIsUploaded(true);
      toast.success("Answer submitted successfully!");

      if (onUploadSuccess) {
        console.log("[DEBUG] calling onUploadSuccess callback");
        onUploadSuccess(publicUrlData.publicUrl);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload recording.");
    } finally {
      setIsUploading(false);
    }
  };

  const progressPercent = Math.min((elapsedSeconds / maxTimeSeconds) * 100, 100);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Mic className={`h-5 w-5 ${isRecording ? "text-red-500 animate-pulse" : "text-gray-500"}`} />
          Audio Recorder
        </h2>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
          Limit: {maxTimeSeconds}s
        </span>
      </div>

      {/* Progress & Stats */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1.5 font-medium">
          <span>{isRecording ? "Recording..." : audioUrl ? "Recording complete" : "Ready"}</span>
          <span>{elapsedSeconds}s / {maxTimeSeconds}s</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${isRecording ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          {!isRecording && !audioUrl && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <Mic className="h-4 w-4" /> Start Recording
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-gray-950 hover:bg-black text-white font-medium px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <Square className="h-4 w-4 fill-white" /> Stop Recording
            </button>
          )}

          {audioUrl && !isRecording && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium px-4 py-2.5 rounded-lg transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" /> Record Again
            </button>
          )}
        </div>

        {audioUrl && !isRecording && (
          <div className="w-full sm:w-auto">
            {!isUploaded ? (
              <button
                onClick={uploadAudio}
                disabled={isUploading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" /> Submit Answer
                  </>
                )}
              </button>
            ) : (
              <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold py-2">
                <CheckCircle2 className="h-5 w-5" /> Submitted!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Audio Playback */}
      {audioUrl && !isRecording && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Listen to your response:</p>
          <audio ref={audioPlayerRef} controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}