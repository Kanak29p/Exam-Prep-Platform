import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AudioRecorder } from "../components/AudioRecorder";

type Question = {
  QUESTIONID: number;
  QUESTION_TEXT: string;
  AUDIO_URL?: string;
  IMAGE_URL?: string;
  OPTIONS?: string;
  TITLE?: string;
  CATEGORY?: string;
  SUB_CATEGORY?: string;
  RECORDING_TIME?: string;
  AUDIO_WAITING_TIME?: string;
  RECORDING_WAITING_TIME?: string;
};

function parseTimeToSeconds(timeStr?: string, defaultSec = 40): number {
  if (!timeStr) return defaultSec;
  if (!timeStr.includes(":")) {
    const parsed = parseInt(timeStr, 10);
    return isNaN(parsed) ? defaultSec : parsed;
  }
  const parts = timeStr.split(":");
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
      return hours * 3600 + minutes * 60 + seconds;
    }
  } else if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      return minutes * 60 + seconds;
    }
  }
  return defaultSec;
}

export function QuestionPage() {
  const { module, section, questionId } = useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [instruction, setInstruction] = useState<string>("");
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);

  const [timerStage, setTimerStage] = useState<'idle' | 'audio-countdown' | 'audio-playing' | 'rec-countdown' | 'recording' | 'completed' | 'submitted'>('idle');
  const [countdownVal, setCountdownVal] = useState<number>(0);
  const [triggerRecord, setTriggerRecord] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  // Writing practice states
  const [writingAnswer, setWritingAnswer] = useState<string>("");
  const [writingTimeRemaining, setWritingTimeRemaining] = useState<number>(0);
  const [writingTimerActive, setWritingTimerActive] = useState<boolean>(false);
  const [writingWordCount, setWritingWordCount] = useState<number>(0);
  const [writingSubmitted, setWritingSubmitted] = useState<boolean>(false);
  const [writingAnalysis, setWritingAnalysis] = useState<any>(null);

  console.log("[DEBUG] QuestionPage render - timerStage:", timerStage, "triggerRecord:", triggerRecord);

  const handleWritingSubmit = (auto = false) => {
    setWritingSubmitted(true);
    setWritingTimerActive(false);
    
    // Analyze answer
    const words = writingAnswer.trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    
    const subCat = question?.SUB_CATEGORY?.toLowerCase() || "";
    let minWords = 200;
    let maxWords = 300;
    let categoryName = "Essay";
    
    if (subCat.includes("summarize") || subCat.includes("summary")) {
      minWords = 5;
      maxWords = 75;
      categoryName = "Summary";
    }

    const wordCountOk = count >= minWords && count <= maxWords;
    
    // Summarize Written Text requires exactly ONE sentence
    let sentenceCountOk = true;
    let sentenceMessage = "";
    if (categoryName === "Summary") {
      const sentences = writingAnswer.trim().split(/[.!?]+/).filter((s) => s.trim().length > 0);
      if (sentences.length !== 1) {
        sentenceCountOk = false;
        sentenceMessage = `Your summary should be exactly one sentence. Currently it contains approximately ${sentences.length} sentences.`;
      }
    }

    setWritingAnalysis({
      wordCount: count,
      minWords,
      maxWords,
      wordCountOk,
      sentenceCountOk,
      sentenceMessage,
      categoryName,
      auto
    });
  };

  const handleWritingChange = (val: string) => {
    setWritingAnswer(val);
    const words = val.trim().split(/\s+/).filter(Boolean);
    setWritingWordCount(words.length);
  };

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Writing timer countdown
  useEffect(() => {
    if (!writingTimerActive || writingTimeRemaining <= 0 || writingSubmitted) return;

    const intervalId = setInterval(() => {
      setWritingTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setWritingTimerActive(false);
          // Force submit on timeout
          setWritingSubmitted(true);
          const words = writingAnswer.trim().split(/\s+/).filter(Boolean);
          const count = words.length;
          const subCat = question?.SUB_CATEGORY?.toLowerCase() || "";
          let minW = 200;
          let maxW = 300;
          let catN = "Essay";
          if (subCat.includes("summarize") || subCat.includes("summary")) {
            minW = 5;
            maxW = 75;
            catN = "Summary";
          }
          let sentOk = true;
          let sentMsg = "";
          if (catN === "Summary") {
            const sentences = writingAnswer.trim().split(/[.!?]+/).filter((s) => s.trim().length > 0);
            if (sentences.length !== 1) {
              sentOk = false;
              sentMsg = `Your summary should be exactly one sentence. Currently it contains approximately ${sentences.length} sentences.`;
            }
          }
          setWritingAnalysis({
            wordCount: count,
            minWords: minW,
            maxWords: maxW,
            wordCountOk: count >= minW && count <= maxW,
            sentenceCountOk: sentOk,
            sentenceMessage: sentMsg,
            categoryName: catN,
            auto: true
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [writingTimerActive, writingTimeRemaining, writingSubmitted, writingAnswer, question]);

  // Initialize timer states when question changes
  useEffect(() => {
    console.log("[DEBUG] QuestionPage init useEffect - question:", question);
    if (question && question.CATEGORY?.toLowerCase() === "speaking") {
      const audioWait = parseTimeToSeconds(question.AUDIO_WAITING_TIME, 0);
      const recWait = parseTimeToSeconds(question.RECORDING_WAITING_TIME, 0);
      
      setTriggerRecord(false);

      if (question.AUDIO_URL && audioWait > 0) {
        setTimerStage("audio-countdown");
        setCountdownVal(audioWait);
      } else {
        setTimerStage("rec-countdown");
        setCountdownVal(recWait);
      }
    } else if (question && question.CATEGORY?.toLowerCase() === "writing") {
      setTimerStage("idle");
      // Decide time limit based on subcategory
      const subCat = question.SUB_CATEGORY?.toLowerCase() || "";
      let timeLimitSec = 1200; // 20 minutes default (Write Essay)
      if (subCat.includes("summarize") || subCat.includes("summary")) {
        timeLimitSec = 600; // 10 minutes default (Summarize Written Text)
      }
      setWritingTimeRemaining(timeLimitSec);
      setWritingTimerActive(true);
      setWritingAnswer("");
      setWritingWordCount(0);
      setWritingSubmitted(false);
      setWritingAnalysis(null);
    } else {
      setTimerStage("idle");
      setCountdownVal(0);
      setTriggerRecord(false);
    }
  }, [question]);

  // Run the active countdown timer stage
  useEffect(() => {
    if (!question || question.CATEGORY?.toLowerCase() !== "speaking") return;

    let intervalId: any = null;

    if (timerStage === "audio-countdown") {
      intervalId = setInterval(() => {
        setCountdownVal((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            // Play audio
            if (audioPlayer) {
              setTimerStage("audio-playing");
              audioPlayer.play().catch((err) => {
                console.error("Autoplay blocked or failed:", err);
                const recWait = parseTimeToSeconds(question.RECORDING_WAITING_TIME, 0);
                setTimerStage("rec-countdown");
                setCountdownVal(recWait);
              });
            } else {
              const recWait = parseTimeToSeconds(question.RECORDING_WAITING_TIME, 0);
              setTimerStage("rec-countdown");
              setCountdownVal(recWait);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerStage === "rec-countdown") {
      intervalId = setInterval(() => {
        setCountdownVal((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setTimerStage("recording");
            setTriggerRecord(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerStage, question, audioPlayer]);

  useEffect(() => {
    const fetchQuestionAndList = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch question detail
        const res = await fetch(
          `http://localhost:5000/api/questions/question/${questionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.reload();
          return;
        }

        const data = await res.json();
        setInstruction(data.instruction);
        setQuestion(data.question);

        // Fetch subcategory questions to find sequential order
        if (module && section) {
          const resList = await fetch(
            `http://localhost:5000/api/questions?category=${module}&subCategory=${decodeURIComponent(section)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );
          if (resList.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.reload();
            return;
          }

          if (resList.ok) {
            const listData = await resList.json();
            if (Array.isArray(listData)) {
              const idx = listData.findIndex((q: any) => q.QUESTIONID === Number(questionId));
              if (idx !== -1) {
                setDisplayNumber(idx + 1);
              }
            }
          }
        }
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (questionId) fetchQuestionAndList();
  }, [module, section, questionId]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-6 animate-pulse">
        {/* Header Title Skeleton */}
        <div className="h-8 w-72 bg-gray-300 dark:bg-gray-600 rounded mb-4" />

        {/* Instruction Banner Skeleton */}
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 rounded-lg space-y-2">
          <div className="h-4 w-24 bg-yellow-200 dark:bg-yellow-900/60 rounded" />
          <div className="h-4 w-full bg-yellow-100/80 dark:bg-yellow-900/40 rounded" />
          <div className="h-4 w-5/6 bg-yellow-100/80 dark:bg-yellow-900/40 rounded" />
        </div>

        {/* Question Text Skeleton */}
        <div className="space-y-3 mb-6">
          <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-5 w-11/12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-5 w-4/5 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Media (Audio/Image) Placeholder Skeleton */}
        <div className="h-16 w-full max-w-md bg-gray-200 dark:bg-gray-800 rounded mb-6" />

        {/* Option Cards Skeleton */}
        <div className="space-y-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center bg-gray-50/30 dark:bg-gray-800/20"
            >
              <div className="h-4 w-4 bg-gray-250 dark:bg-gray-700 rounded-full mr-3 shrink-0" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>

        {/* Speaking Recorder Skeleton */}
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
          <div className="p-6 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-4" />
            <div className="flex justify-between items-center mb-4">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-8 w-24 bg-gray-250 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
            <div className="flex gap-3 justify-center">
              <div className="h-10 w-28 bg-gray-300 dark:bg-gray-600 rounded-lg" />
              <div className="h-10 w-28 bg-gray-300 dark:bg-gray-600 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) return <div>No question found</div>;

  return (
    <div className="min-h-screen pt-20 px-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Question {displayNumber !== null ? displayNumber : question.QUESTIONID}{question.TITLE ? `: ${question.TITLE}` : ""}
      </h1>

      {instruction && (
        <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
          <h2 className="font-bold mb-1">Instruction</h2>
          <p>{instruction}</p>
        </div>
      )}

      <p className="mb-6 text-lg"> {question?.QUESTION_TEXT || "No question text available"}</p>

      {question.CATEGORY?.toLowerCase() === "speaking" && timerStage !== "idle" && (
        <div className={`mb-6 p-4 rounded-xl border transition-all duration-300 shadow-sm ${
          timerStage === "recording"
            ? "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30"
            : timerStage === "completed"
            ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900/30"
            : timerStage === "submitted"
            ? "bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/30"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  timerStage === "recording"
                    ? "bg-red-400"
                    : timerStage === "completed"
                    ? "bg-green-400"
                    : timerStage === "submitted"
                    ? "bg-blue-400"
                    : "bg-blue-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  timerStage === "recording"
                    ? "bg-red-500"
                    : timerStage === "completed"
                    ? "bg-green-500"
                    : timerStage === "submitted"
                    ? "bg-blue-500"
                    : "bg-blue-500"
                }`}></span>
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {timerStage === "audio-countdown" && "Preparing Audio..."}
                {timerStage === "audio-playing" && "Playing Question Audio..."}
                {timerStage === "rec-countdown" && "Preparation Time..."}
                {timerStage === "recording" && "Recording Active..."}
                {timerStage === "completed" && "Recording Complete"}
                {timerStage === "submitted" && "Answer Submitted!"}
              </span>
            </div>
            <div className="text-right">
              {(timerStage === "audio-countdown" || timerStage === "rec-countdown") && (
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {countdownVal}s
                </span>
              )}
              {timerStage === "audio-playing" && (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Listening
                </span>
              )}
              {timerStage === "recording" && (
                <span className="text-sm font-medium text-red-600 dark:text-red-400 animate-pulse font-semibold">
                  Speak Now
                </span>
              )}
              {timerStage === "completed" && (
                <span className="text-sm font-medium text-green-600 dark:text-green-400 font-semibold">
                  Ready to Submit
                </span>
              )}
              {timerStage === "submitted" && (
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 font-semibold">
                  Success
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {question.IMAGE_URL && (
        <img
          src={question.IMAGE_URL}
          onError={(e) => {
            console.log("Image failed to load, using fallback chart");
            e.currentTarget.onerror = null; // Prevent infinite loop if fallback fails
            e.currentTarget.src = `${import.meta.env.BASE_URL || "/"}statistical_chart.png`;
          }}
          className="mb-4 rounded-lg max-w-full h-auto object-contain max-h-[400px] shadow-md border dark:border-gray-700"
          alt="Describe Image Prompt"
        />
      )}

      {question.AUDIO_URL && (
        <audio
          ref={(el) => {
            if (el && audioPlayer !== el) {
              setAudioPlayer(el);
            }
          }}
          controls
          className="mb-4 w-full max-w-md"
          onEnded={() => {
            if (timerStage === "audio-playing") {
              const recWait = parseTimeToSeconds(question.RECORDING_WAITING_TIME, 0);
              setTimerStage("rec-countdown");
              setCountdownVal(recWait);
            }
          }}
        >
          <source src={question.AUDIO_URL} />
        </audio>
      )}
      {question.OPTIONS && (() => {
        let parsedOptions: any[] = [];
        try {
          const parsed = typeof question.OPTIONS === "string"
            ? JSON.parse(question.OPTIONS)
            : question.OPTIONS;
          if (Array.isArray(parsed)) {
            parsedOptions = parsed;
          } else if (parsed && typeof parsed === "object") {
            parsedOptions = [parsed];
          } else if (typeof question.OPTIONS === "string") {
            parsedOptions = question.OPTIONS.split(",").map((o: string) => o.trim());
          }
        } catch (e) {
          if (typeof question.OPTIONS === "string") {
            parsedOptions = question.OPTIONS.split(",").map((o: string) => o.trim());
          }
        }

        if (parsedOptions.length === 0) {
          return null;
        }

        return (
          <div className="space-y-2">
            {parsedOptions.map((opt: any, i: number) => (
              <div
                key={i}
                className="p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {typeof opt === "object" && opt !== null ? (
                  opt.label ? (
                    <div>
                      <span className="font-bold mr-2">{opt.label}.</span>
                      {opt.text}
                    </div>
                  ) : opt.blank ? (
                    <div>
                      <span className="font-bold mr-2">Blank {opt.blank}:</span>
                      {Array.isArray(opt.options) ? opt.options.join(", ") : JSON.stringify(opt)}
                    </div>
                  ) : (
                    JSON.stringify(opt)
                  )
                ) : (
                  String(opt)
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {question.CATEGORY?.toLowerCase() === "speaking" && (
        <div className="mt-8 border-t pt-6">
          <AudioRecorder
            maxTimeSeconds={parseTimeToSeconds(question.RECORDING_TIME)}
            autoStartRecording={triggerRecord}
            onRecordingStart={() => {
              console.log("[DEBUG] onRecordingStart callback called");
              setTimerStage("recording");
              setTriggerRecord(false);
            }}
            onRecordingComplete={() => {
              console.log("[DEBUG] onRecordingComplete callback called");
              setTimerStage("completed");
            }}
            onUploadSuccess={() => {
              console.log("[DEBUG] onUploadSuccess callback called");
              setTimerStage("submitted");
            }}
          />
        </div>
      )}

      {question.CATEGORY?.toLowerCase() === "writing" && (
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
          {/* Header row with Timer and Word Count */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  writingSubmitted ? "bg-green-400" : "bg-blue-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  writingSubmitted ? "bg-green-500" : "bg-blue-500"
                }`}></span>
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {writingSubmitted ? "Answer Submitted" : "Writing Session Active"}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Word Count:</span>
                <span className="font-bold text-gray-800 dark:text-white font-mono">
                  {writingWordCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Time Remaining:</span>
                <span className={`text-xl font-bold font-mono ${
                  writingTimeRemaining < 60 && !writingSubmitted ? "text-red-500 animate-pulse" : "text-blue-600 dark:text-blue-400"
                }`}>
                  {formatTime(writingTimeRemaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              className="w-full min-h-[300px] p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:text-gray-500 dark:disabled:text-gray-400 font-sans"
              placeholder="Type your answer here..."
              value={writingAnswer}
              onChange={(e) => handleWritingChange(e.target.value)}
              disabled={writingSubmitted}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {!writingSubmitted ? (
              <button
                onClick={() => handleWritingSubmit(false)}
                disabled={writingWordCount === 0}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-350 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={() => {
                  // Reset states for rewriting
                  const subCat = question.SUB_CATEGORY?.toLowerCase() || "";
                  let timeLimitSec = 1200;
                  if (subCat.includes("summarize") || subCat.includes("summary")) {
                    timeLimitSec = 600;
                  }
                  setWritingTimeRemaining(timeLimitSec);
                  setWritingTimerActive(true);
                  setWritingAnswer("");
                  setWritingWordCount(0);
                  setWritingSubmitted(false);
                  setWritingAnalysis(null);
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Retry / Re-write
              </button>
            )}
          </div>

          {/* Analysis Dashboard */}
          {writingSubmitted && writingAnalysis && (
            <div className="p-6 bg-green-50/50 dark:bg-green-950/10 border border-green-200 dark:border-green-900/30 rounded-xl space-y-4">
              <h3 className="text-lg font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submission Review
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Word Count Metric */}
                <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Word Count Criteria</span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {writingAnalysis.wordCount} words (Target: {writingAnalysis.minWords}-{writingAnalysis.maxWords})
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      writingAnalysis.wordCountOk 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}>
                      {writingAnalysis.wordCountOk ? "Passed" : "Failed"}
                    </span>
                  </div>
                </div>

                {/* Summary Sentence Metric */}
                {writingAnalysis.categoryName === "Summary" && (
                  <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Sentence Count Criteria</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {writingAnalysis.sentenceCountOk ? "Single sentence check" : "Multiple sentences detected"}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        writingAnalysis.sentenceCountOk 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}>
                        {writingAnalysis.sentenceCountOk ? "Passed" : "Failed"}
                      </span>
                    </div>
                    {writingAnalysis.sentenceMessage && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-semibold">
                        {writingAnalysis.sentenceMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {writingAnalysis.auto && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  * This response was auto-submitted because the time limit was reached.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
