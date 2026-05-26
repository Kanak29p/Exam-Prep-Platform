import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AudioRecorder } from "../components/organisms/AudioRecorder";
import { API_BASE_URL } from "../lib/api";
import { toast } from "sonner";

type Question = {
  QUESTIONID: number;
  QUESTION_TEXT: string;
  AUDIO_URL?: string;
  IMAGE_URL?: string;
  OPTIONS?: string;
  TITLE?: string;
  CATEGORY?: string;
  SUB_CATEGORY?: string;
  RECORDING_TIME?: string | number;
  AUDIO_WAITING_TIME?: string | number;
  RECORDING_WAITING_TIME?: string | number;
};

function parseTimeToSeconds(timeStr?: string | number, defaultSec = 40): number {
  if (timeStr === undefined || timeStr === null) return defaultSec;
  if (typeof timeStr === "number") return timeStr;
  const str = String(timeStr).trim();
  if (!str) return defaultSec;
  if (!str.includes(":")) {
    const parsed = parseInt(str, 10);
    return isNaN(parsed) ? defaultSec : parsed;
  }
  const parts = str.split(":");
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

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string | undefined | null, search: string) {
  const safeText = text || "";
  const query = search.trim();
  if (!query) return <span>{safeText}</span>;

  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  const parts = safeText.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/80 text-gray-900 dark:text-white rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function QuestionPage() {
  const { module, section, questionId } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
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

  // Refs mirror the latest values so the timer effect doesn't restart on every keystroke
  const writingAnswerRef = useRef(writingAnswer);
  const questionRef = useRef(question);
  useEffect(() => {
    writingAnswerRef.current = writingAnswer;
  }, [writingAnswer]);
  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  // Reading & Listening interactive states
  const [rlSubmitted, setRlSubmitted] = useState<boolean>(false);
  const [rlAnalysis, setRlAnalysis] = useState<any>(null);
  const [selectedSingle, setSelectedSingle] = useState<string>("");
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([]);
  const [selectedReorder, setSelectedReorder] = useState<string[]>([]);
  const [selectedBlanks, setSelectedBlanks] = useState<string[]>([]);
  const [selectedIncorrectWord, setSelectedIncorrectWord] = useState<string>("");
  const [typedAnswer, setTypedAnswer] = useState<string>("");
  const [clickedWord, setClickedWord] = useState<string>("");

  const [speakingAnalysis, setSpeakingAnalysis] = useState<any>(null);

  const handleAnswerSubmit = async (audioUrl: string | null, answerText: string | null) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/questions/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: questionId,
          audioUrl,
          answerText,
          score: 0,
          feedback: ""
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit answer to database");
      }
      const data = await res.json();
      if (question?.CATEGORY?.toLowerCase() === "speaking") {
        setSpeakingAnalysis(data);
      }
      toast.success("Answer stored in database!");
    } catch (err) {
      console.error("Error submitting answer:", err);
      toast.error("Failed to store answer in database.");
    }
  };

  const handleReadingOrListeningSubmit = async () => {
    if (!question) return;

    const subCat = (question.SUB_CATEGORY || "").toLowerCase();
    let answerText = "";
    
    const isMcqSingle = subCat.includes("single") || subCat.includes("summary") || subCat.includes("missing word");
    const isMcqMultiple = subCat.includes("multiple") && !subCat.includes("single");
    const isReorder = subCat.includes("reorder");
    const isIncorrectWord = subCat.includes("incorrect word");
    const isDictation = subCat.includes("dictation");
    const isSpokenSummary = subCat.includes("summarize spoken") || subCat.includes("summarize discussion");
    const isFitb = subCat.includes("fill in");

    if (isMcqSingle) {
      answerText = selectedSingle;
    } else if (isMcqMultiple) {
      answerText = selectedMultiple.join(", ");
    } else if (isReorder) {
      const letters = selectedReorder.map(opt => opt.trim().substring(0, 1));
      answerText = letters.join(" → ");
    } else if (isIncorrectWord) {
      answerText = selectedIncorrectWord;
    } else if (isFitb) {
      answerText = selectedBlanks.join(", ");
    } else if (isDictation || isSpokenSummary) {
      answerText = typedAnswer;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/questions/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: questionId,
          audioUrl: null,
          answerText: answerText,
          score: 0,
          feedback: ""
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit answer");
      }
      const data = await res.json();
      setRlAnalysis({
        score: data.score,
        accuracy: data.accuracy,
        feedback: data.feedback,
        userResponse: answerText
      });
      setRlSubmitted(true);
      toast.success("Answer submitted and graded!");
    } catch (err) {
      console.error("Error submitting answer:", err);
      toast.error("Failed to submit answer.");
    }
  };

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

    handleAnswerSubmit(null, writingAnswer);
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

  // Writing timer countdown — only restarts when active flag flips, not on every keystroke
  useEffect(() => {
    if (!writingTimerActive || writingSubmitted) return;

    const intervalId = setInterval(() => {
      setWritingTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setWritingTimerActive(false);
          setWritingSubmitted(true);
          const latestAnswer = writingAnswerRef.current;
          const latestQuestion = questionRef.current;
          const words = latestAnswer.trim().split(/\s+/).filter(Boolean);
          const count = words.length;
          const subCat = latestQuestion?.SUB_CATEGORY?.toLowerCase() || "";
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
            const sentences = latestAnswer.trim().split(/[.!?]+/).filter((s) => s.trim().length > 0);
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
          handleAnswerSubmit(null, latestAnswer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [writingTimerActive, writingSubmitted]);

  // Initialize timer states when question changes
  useEffect(() => {
    setSpeakingAnalysis(null);
    if (question && question.CATEGORY?.toLowerCase() === "speaking") {
      const audioWait = parseTimeToSeconds(question.AUDIO_WAITING_TIME, 0);
      const recWait = parseTimeToSeconds(question.RECORDING_WAITING_TIME, 0);
      
      setTriggerRecord(false);

      if (question.AUDIO_URL) {
        if (audioWait > 0) {
          setTimerStage("audio-countdown");
          setCountdownVal(audioWait);
        } else {
          setTimerStage("audio-playing");
          setCountdownVal(0);
        }
      } else {
        if (recWait > 0) {
          setTimerStage("rec-countdown");
          setCountdownVal(recWait);
        } else {
          setTimerStage("recording");
          setTriggerRecord(true);
          setCountdownVal(0);
        }
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

    // Reset Reading & Listening interactive states
    setRlSubmitted(false);
    setRlAnalysis(null);
    setSelectedSingle("");
    setSelectedMultiple([]);
    setSelectedReorder([]);
    setSelectedIncorrectWord("");
    setTypedAnswer("");
    setClickedWord("");

    if (question && (question.CATEGORY?.toLowerCase() === "reading" || question.CATEGORY?.toLowerCase() === "listening")) {
      const subCat = (question.SUB_CATEGORY || "").toLowerCase();
      if (subCat.includes("fill in")) {
        let passage = question.QUESTION_TEXT;
        const quoteMatch = question.QUESTION_TEXT.match(/"([^"]+)"/);
        if (quoteMatch) {
          passage = quoteMatch[1];
        } else {
          passage = question.QUESTION_TEXT.replace(/^.*(?:options|Options):[^\n:]+:\s*/i, "");
        }
        const segments = passage.split(/_{2,}/);
        const blankCount = segments.length - 1;
        setSelectedBlanks(Array(blankCount).fill(""));
      } else {
        setSelectedBlanks([]);
      }
    } else {
      setSelectedBlanks([]);
    }
  }, [question]);

  // Handle playing audio automatically when stage is audio-playing
  useEffect(() => {
    if (timerStage === "audio-playing" && audioPlayer) {
      audioPlayer.play().catch((err) => {
        console.error("Autoplay blocked or failed:", err);
        const recWait = parseTimeToSeconds(question?.RECORDING_WAITING_TIME, 0);
        if (recWait > 0) {
          setTimerStage("rec-countdown");
          setCountdownVal(recWait);
        } else {
          setTimerStage("recording");
          setTriggerRecord(true);
          setCountdownVal(0);
        }
      });
    }
  }, [timerStage, audioPlayer, question]);

  // Run the active countdown timer stage
  useEffect(() => {
    if (!question || question.CATEGORY?.toLowerCase() !== "speaking") return;

    let intervalId: any = null;

    if (timerStage === "audio-countdown") {
      intervalId = setInterval(() => {
        setCountdownVal((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setTimerStage("audio-playing");
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
  }, [timerStage, question]);

  useEffect(() => {
    const fetchQuestionAndList = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch question detail
        const res = await fetch(
          `${API_BASE_URL}/api/questions/question/${questionId}`,
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
            `${API_BASE_URL}/api/questions?category=${module}&subCategory=${encodeURIComponent(section)}`,
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
        Question {displayNumber !== null ? displayNumber : question.QUESTIONID}
        {question.TITLE ? (
          <>
            : {highlightText(question.TITLE, searchQuery)}
          </>
        ) : ""}
      </h1>

      {instruction && (
        <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
          <h2 className="font-bold mb-1">Instruction</h2>
          <p>{highlightText(instruction, searchQuery)}</p>
        </div>
      )}

      {(() => {
        const cat = question.CATEGORY?.toLowerCase() || "";
        const subCat = (question.SUB_CATEGORY || "").toLowerCase();
        const isFitb = (cat === "reading" || cat === "listening") && subCat.includes("fill in");
        const isIncorrectWord = (cat === "reading" || cat === "listening") && subCat.includes("incorrect word");

        if (isFitb) {
          let passage = question.QUESTION_TEXT;
          let options: string[] = [];
          
          const optMatch = question.QUESTION_TEXT.match(/(?:options|Options):\s*([^:\n)]+)/i);
          if (optMatch) {
            options = optMatch[1].split(",").map(o => o.trim().replace(/[")&]/g, ""));
          }
          
          const quoteMatch = question.QUESTION_TEXT.match(/"([^"]+)"/);
          if (quoteMatch) {
            passage = quoteMatch[1];
          } else {
            passage = question.QUESTION_TEXT.replace(/^.*(?:options|Options):[^\n:]+:\s*/i, "");
          }

          const segments = passage.split(/_{2,}/);
          const isDragAndDropFitb = cat === "reading" && subCat === "reading fill in the blanks";
          const isDropdownFitb = cat === "reading" && !isDragAndDropFitb;

          return (
            <div className="mb-6 space-y-4">
              <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-800/10 shadow-sm leading-relaxed text-lg text-gray-800 dark:text-gray-200">
                {segments.map((segment, index) => (
                  <span key={index}>
                    {segment}
                    {index < segments.length - 1 && (
                      isDragAndDropFitb ? (
                        <span
                          onDragOver={(e) => {
                            if (!rlSubmitted) e.preventDefault();
                          }}
                          onDrop={(e) => {
                            if (!rlSubmitted) {
                              e.preventDefault();
                              const word = e.dataTransfer.getData("text/plain");
                              if (word && options.includes(word)) {
                                const newBlanks = [...selectedBlanks];
                                newBlanks[index] = word;
                                setSelectedBlanks(newBlanks);
                              }
                            }
                          }}
                          onClick={() => {
                            if (!rlSubmitted) {
                              if (clickedWord) {
                                const newBlanks = [...selectedBlanks];
                                newBlanks[index] = clickedWord;
                                setSelectedBlanks(newBlanks);
                                setClickedWord("");
                              } else if (selectedBlanks[index]) {
                                const newBlanks = [...selectedBlanks];
                                newBlanks[index] = "";
                                setSelectedBlanks(newBlanks);
                              }
                            }
                          }}
                          className={`mx-2 inline-block min-w-[120px] h-[32px] align-middle border-2 rounded-lg text-center leading-7 px-3 text-sm font-semibold transition-all cursor-pointer select-none ${
                            selectedBlanks[index]
                              ? "bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-950/20 dark:border-blue-500 dark:text-blue-300"
                              : "border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 bg-white/50 dark:bg-gray-900/50"
                          }`}
                        >
                          {selectedBlanks[index] || ""}
                        </span>
                      ) : isDropdownFitb ? (
                        <select
                          value={selectedBlanks[index] || ""}
                          onChange={(e) => {
                            const newBlanks = [...selectedBlanks];
                            newBlanks[index] = e.target.value;
                            setSelectedBlanks(newBlanks);
                          }}
                          disabled={rlSubmitted}
                          className="mx-2 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-sm font-medium inline-block"
                        >
                          <option value="">--Select--</option>
                          {options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={selectedBlanks[index] || ""}
                          onChange={(e) => {
                            const newBlanks = [...selectedBlanks];
                            newBlanks[index] = e.target.value;
                            setSelectedBlanks(newBlanks);
                          }}
                          disabled={rlSubmitted}
                          className="mx-2 px-3 py-1 w-32 text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-sm font-medium inline-block"
                          placeholder={`Blank ${index + 1}`}
                        />
                      )
                    )}
                  </span>
                ))}
              </div>

              {isDragAndDropFitb && options.length > 0 && (
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3">Drag words to fill the blanks, or click a word then click a blank:</p>
                  <div className="flex flex-wrap gap-2">
                    {options.map((opt) => {
                      const isPlaced = selectedBlanks.includes(opt);
                      const isSelected = clickedWord === opt;
                      return (
                        <button
                          key={opt}
                          draggable={!isPlaced && !rlSubmitted}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", opt);
                          }}
                          onClick={() => {
                            if (!rlSubmitted && !isPlaced) {
                              setClickedWord(isSelected ? "" : opt);
                            }
                          }}
                          disabled={rlSubmitted || isPlaced}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all select-none ${
                            isPlaced
                              ? "bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-750 dark:text-gray-600 cursor-not-allowed opacity-50"
                              : isSelected
                              ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105"
                              : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 cursor-pointer"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (isIncorrectWord) {
          const textMatch = question.QUESTION_TEXT.match(/Text:\s*"([^"]+)"/i);
          let transcript = "";
          if (textMatch) {
            transcript = textMatch[1];
          } else {
            transcript = question.QUESTION_TEXT.replace(/^Audio:[^Text]+Text:\s*/i, "").replace(/Which word is incorrect\??/i, "").replace(/"/g, "").trim();
          }

          const words = transcript.split(/\s+/);

          return (
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 font-medium">Click on the word that differs from the audio:</p>
              <div className="flex flex-wrap gap-x-2 gap-y-3 leading-relaxed text-lg p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-800/10 shadow-sm text-gray-800 dark:text-gray-200">
                {words.map((word, idx) => {
                  const cleanW = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
                  const isSelected = selectedIncorrectWord === cleanW;
                  return (
                    <span
                      key={idx}
                      onClick={() => {
                        if (!rlSubmitted) setSelectedIncorrectWord(cleanW);
                      }}
                      className={`cursor-pointer px-2 py-0.5 rounded transition-all font-medium select-none ${
                        isSelected
                          ? "bg-yellow-200 text-gray-900 dark:bg-yellow-800 dark:text-white shadow-sm ring-1 ring-yellow-400"
                          : "hover:bg-gray-200/50 dark:hover:bg-gray-750"
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <p className="mb-6 text-lg">
            {highlightText(question?.QUESTION_TEXT || "No question text available", searchQuery)}
          </p>
        );
      })()}

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
              if (recWait > 0) {
                setTimerStage("rec-countdown");
                setCountdownVal(recWait);
              } else {
                setTimerStage("recording");
                setTriggerRecord(true);
                setCountdownVal(0);
              }
            }
          }}
        >
          <source src={question.AUDIO_URL} />
        </audio>
      )}
      {question.CATEGORY?.toLowerCase() !== "reading" && question.CATEGORY?.toLowerCase() !== "listening" && question.OPTIONS && (() => {
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
                      {highlightText(opt.text, searchQuery)}
                    </div>
                  ) : opt.blank ? (
                    <div>
                      <span className="font-bold mr-2">Blank {opt.blank}:</span>
                      {Array.isArray(opt.options) ? (
                        <>
                          {opt.options.map((option: string, optionIdx: number) => (
                            <span key={optionIdx}>
                              {highlightText(option, searchQuery)}
                              {optionIdx < opt.options.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </>
                      ) : (
                        highlightText(JSON.stringify(opt), searchQuery)
                      )}
                    </div>
                  ) : (
                    highlightText(JSON.stringify(opt), searchQuery)
                  )
                ) : (
                  highlightText(String(opt), searchQuery)
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Interactive Inputs for Reading & Listening */}
      {(question.CATEGORY?.toLowerCase() === "reading" || question.CATEGORY?.toLowerCase() === "listening") && (() => {
        const cat = question.CATEGORY.toLowerCase();
        const subCat = (question.SUB_CATEGORY || "").toLowerCase();
        
        const isMcqSingle = subCat.includes("single") || subCat.includes("summary") || subCat.includes("missing word");
        const isMcqMultiple = subCat.includes("multiple") && !subCat.includes("single");
        const isReorder = subCat.includes("reorder");
        const isDictation = subCat.includes("dictation");
        const isSpokenSummary = subCat.includes("summarize spoken") || subCat.includes("summarize discussion");

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

        return (
          <div className="space-y-6 mt-6">
            {/* MCQ Single / Highlight Correct Summary / Select Missing Word */}
            {isMcqSingle && parsedOptions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Select the correct option:</p>
                <div className="space-y-2">
                  {parsedOptions.map((opt: any, i: number) => {
                    const optText = typeof opt === "object" ? (opt.text || opt.label || JSON.stringify(opt)) : String(opt);
                    const optValue = optText.trim();
                    const isSelected = selectedSingle === optValue;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (!rlSubmitted) setSelectedSingle(optValue);
                        }}
                        className={`p-4 border rounded-xl flex items-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/30 border-blue-500 dark:bg-blue-950/20 dark:border-blue-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center mr-3 shrink-0 ${
                          isSelected
                            ? "border-blue-500 dark:border-blue-400"
                            : "border-gray-300 dark:border-gray-600"
                        }`}>
                          {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-blue-500 dark:bg-blue-400" />}
                        </div>
                        <div className="text-gray-800 dark:text-gray-205">
                          {highlightText(optText, searchQuery)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MCQ Multiple */}
            {isMcqMultiple && parsedOptions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Select one or more correct options:</p>
                <div className="space-y-2">
                  {parsedOptions.map((opt: any, i: number) => {
                    const optText = typeof opt === "object" ? (opt.text || opt.label || JSON.stringify(opt)) : String(opt);
                    const optValue = optText.trim();
                    const isSelected = selectedMultiple.includes(optValue);
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (!rlSubmitted) {
                            if (isSelected) {
                              setSelectedMultiple(selectedMultiple.filter(item => item !== optValue));
                            } else {
                              setSelectedMultiple([...selectedMultiple, optValue]);
                            }
                          }
                        }}
                        className={`p-4 border rounded-xl flex items-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/30 border-blue-500 dark:bg-blue-950/20 dark:border-blue-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className={`h-5 w-5 rounded border flex items-center justify-center mr-3 shrink-0 ${
                          isSelected
                            ? "border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400"
                            : "border-gray-300 dark:border-gray-600"
                        }`}>
                          {isSelected && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="text-gray-800 dark:text-gray-205">
                          {highlightText(optText, searchQuery)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reorder Paragraph */}
            {isReorder && parsedOptions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/10 dark:bg-gray-850/10">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Scrambled Paragraphs (Click to add):</h4>
                  <div className="space-y-2">
                    {parsedOptions.filter(opt => !selectedReorder.includes(opt)).map((opt: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (!rlSubmitted) setSelectedReorder([...selectedReorder, opt]);
                        }}
                        disabled={rlSubmitted}
                        className="w-full text-left p-3 border rounded-xl bg-white hover:bg-blue-50/20 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-all cursor-pointer text-sm leading-relaxed"
                      >
                        {opt}
                      </button>
                    ))}
                    {parsedOptions.filter(opt => !selectedReorder.includes(opt)).length === 0 && (
                      <p className="text-xs text-gray-500 italic p-3 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-900/50">All sentences placed.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Your Ordered Sequence (Click to remove):</h4>
                  <div className="space-y-2">
                    {selectedReorder.map((opt, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400 font-mono w-6 text-center mt-2">{i + 1}.</span>
                        <button
                          onClick={() => {
                            if (!rlSubmitted) setSelectedReorder(selectedReorder.filter(item => item !== opt));
                          }}
                          disabled={rlSubmitted}
                          className="flex-1 text-left p-3 border rounded-xl bg-blue-50/10 border-blue-200 dark:bg-blue-950/10 dark:border-blue-900/30 hover:bg-red-50/20 hover:border-red-200 dark:hover:bg-red-950/10 transition-all cursor-pointer text-sm leading-relaxed"
                        >
                          {opt}
                        </button>
                      </div>
                    ))}
                    {selectedReorder.length === 0 && (
                      <p className="text-xs text-gray-500 italic p-3 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-900/50">Construct your paragraph order here.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Summarize Spoken Text / Write from Dictation */}
            {(isDictation || isSpokenSummary) && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Type your transcription below:</span>
                  {isSpokenSummary && (
                    <span className="font-mono">Word Count: <strong className="text-gray-750 dark:text-gray-200">{typedAnswer.trim().split(/\s+/).filter(Boolean).length}</strong> (Target: 50-70)</span>
                  )}
                </div>
                <textarea
                  className="w-full min-h-[150px] p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:text-gray-500 dark:disabled:text-gray-400 font-sans"
                  placeholder="Type your answer here..."
                  value={typedAnswer}
                  onChange={(e) => {
                    if (!rlSubmitted) setTypedAnswer(e.target.value);
                  }}
                  disabled={rlSubmitted}
                />
              </div>
            )}

            {/* Submission buttons */}
            <div className="flex gap-4 pt-4">
              {!rlSubmitted ? (
                <button
                  onClick={handleReadingOrListeningSubmit}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={() => {
                    setRlSubmitted(false);
                    setRlAnalysis(null);
                    setSelectedSingle("");
                    setSelectedMultiple([]);
                    setSelectedReorder([]);
                    setSelectedBlanks(Array(selectedBlanks.length).fill(""));
                    setSelectedIncorrectWord("");
                    setTypedAnswer("");
                  }}
                  className="px-6 py-3 bg-gray-650 hover:bg-gray-700 text-white font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Retry / Practice Again
                </button>
              )}
            </div>

            {/* Results Dashboard */}
            {rlSubmitted && rlAnalysis && (
              <div className="mt-8 p-6 bg-green-50/40 dark:bg-green-950/10 border border-green-200 dark:border-green-900/30 rounded-xl space-y-4 shadow-sm animate-fadeIn">
                <h3 className="text-lg font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Evaluation Summary
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-700 shadow-sm flex flex-col justify-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">PTE Score</span>
                    <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                      {rlAnalysis.score} / 90
                    </span>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-700 shadow-sm flex flex-col justify-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Accuracy</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                      {rlAnalysis.accuracy}%
                    </span>
                  </div>
                </div>
                
                {rlAnalysis.feedback && (
                  <div className="p-4 bg-white/40 dark:bg-gray-800/20 rounded-lg border dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Detailed Feedback</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {rlAnalysis.feedback}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-white/40 dark:bg-gray-800/20 rounded-lg border dark:border-gray-700 space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1 font-mono">Your Response:</span>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-250 leading-relaxed font-mono">
                      {rlAnalysis.userResponse || <span className="italic text-gray-400">No response submitted</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1 font-mono">Correct Answer:</span>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 leading-relaxed font-mono">
                      {question.CORRECT_ANSWER}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {question.CATEGORY?.toLowerCase() === "speaking" && (
        <div className="mt-8 border-t pt-6">
          <AudioRecorder
            maxTimeSeconds={parseTimeToSeconds(question.RECORDING_TIME)}
            autoStartRecording={triggerRecord}
            onRecordingStart={() => {
              setTimerStage("recording");
              setTriggerRecord(false);
            }}
            onRecordingComplete={() => {
              setTimerStage("completed");
            }}
            onUploadSuccess={(url: string, transcript: string) => {
              setTimerStage("submitted");
              handleAnswerSubmit(url, transcript);
            }}
          />

          {speakingAnalysis && (
            <div className="mt-6 p-6 bg-green-50/50 dark:bg-green-950/10 border border-green-200 dark:border-green-900/30 rounded-xl space-y-4 max-w-xl mx-auto shadow-sm">
              <h3 className="text-lg font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Speaking Score & Evaluation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PTE Score */}
                <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-700 shadow-sm flex flex-col justify-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">PTE Speaking Score</span>
                  <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                    {speakingAnalysis.score} / 90
                  </span>
                </div>
                
                {/* Word Accuracy */}
                <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-700 shadow-sm flex flex-col justify-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Pronunciation Accuracy</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {speakingAnalysis.accuracy}% matched
                  </span>
                </div>
              </div>
              
              {/* Text Feedback */}
              {speakingAnalysis.feedback && (
                <div className="p-4 bg-white/40 dark:bg-gray-800/20 rounded-lg border dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Detailed Feedback</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    {speakingAnalysis.feedback}
                  </p>
                </div>
              )}
              
              {/* Word Details */}
              {speakingAnalysis.matchedWords && speakingAnalysis.matchedWords.length > 0 && (
                <div className="space-y-3 p-4 bg-white/40 dark:bg-gray-800/20 rounded-lg border dark:border-gray-700">
                  <div>
                    <span className="text-xs text-green-600 dark:text-green-400 block font-semibold mb-1 font-mono">Matched Words ({speakingAnalysis.matchedWords.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {speakingAnalysis.matchedWords.map((w: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 rounded border border-green-200 dark:border-green-900/30">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                  {speakingAnalysis.missedWords && speakingAnalysis.missedWords.length > 0 && (
                    <div>
                      <span className="text-xs text-red-600 dark:text-red-400 block font-semibold mb-1 font-mono">Missed / Mispronounced Words ({speakingAnalysis.missedWords.length})</span>
                      <div className="flex flex-wrap gap-1.5">
                        {speakingAnalysis.missedWords.map((w: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 rounded border border-red-200 dark:border-red-900/30">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
