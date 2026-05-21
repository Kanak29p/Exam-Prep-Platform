import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../lib/api";

export function SectionQuestionsPage() {
  type Question = {
    QUESTIONID: number;
    QUESTION_TEXT: string;
    TITLE?: string;
  };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const { module, section } = useParams();

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${API_BASE_URL}/api/questions?category=${module}&subCategory=${decodeURIComponent(section)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.reload();
          return;
        }

        if (!res.ok) {
          console.error("API failed:", res.status);
          setQuestions([]);
          return;
        }

        const data = await res.json();

        setQuestions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (module && section) {
      fetchQuestions();
    }
  }, [module, section]);

  return (
    <div className="min-h-screen pt-20 px-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white capitalize">
        {module} → {decodeURIComponent(section || "").replace(/-/g, " ")}
      </h1>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/40 shadow-sm"
            >
              <div className="h-5 w-48 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q: any, index: number) => (
            <Link
              to={`/practice/${module}/${section}/${q.QUESTIONID}`}
              key={q.QUESTIONID}
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                Q{index + 1}{q.TITLE ? ` - ${q.TITLE}` : ""}
              </div>
              <div className="text-gray-700 dark:text-gray-300 line-clamp-2 text-sm">
                {q.QUESTION_TEXT}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
