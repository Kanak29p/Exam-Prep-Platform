import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight as ArrowChevron,
  Search,
  FileQuestion,
} from "lucide-react";
import { API_BASE_URL } from "../lib/api";

type Question = {
  QUESTIONID: number;
  QUESTION_TEXT: string;
  TITLE?: string;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

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
        regex.test(part) ? (
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

function buildPageList(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);
  if (left > 2) pages.push("ellipsis");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < totalPages - 1) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

export function SectionQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { module, section } = useParams();

  const sectionLabel = decodeURIComponent(section || "").replace(/-/g, " ");

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${API_BASE_URL}/api/questions?category=${module}&subCategory=${decodeURIComponent(section || "")}`,
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
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (module && section) {
      fetchQuestions();
    }
  }, [module, section]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(
      (item) =>
        item.QUESTION_TEXT?.toLowerCase().includes(q) ||
        item.TITLE?.toLowerCase().includes(q) ||
        String(item.QUESTIONID).includes(q),
    );
  }, [questions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visible = filtered.slice(pageStart, pageStart + pageSize);
  const pageList = buildPageList(safePage, totalPages);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize, questions.length]);

  const goToPage = (page: number) => {
    const next = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <Link to="/practice" className="hover:text-blue-600 transition-colors font-medium">
            Practice
          </Link>
          <span>/</span>
          {module && (
            <>
              <Link
                to={`/practice/${module}`}
                className="hover:text-blue-600 transition-colors capitalize font-medium"
              >
                {module}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="capitalize text-gray-900 dark:text-gray-200 font-semibold">
            {sectionLabel}
          </span>
        </nav>

        {/* Title + Count */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white capitalize tracking-tight">
              {sectionLabel}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 capitalize">
              {module} module
            </p>
          </div>
          {!loading && (
            <span className="inline-flex items-center self-start sm:self-auto px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-semibold">
              {filtered.length} {filtered.length === 1 ? "question" : "questions"}
              {search && filtered.length !== questions.length && (
                <span className="ml-1 opacity-70">/ {questions.length}</span>
              )}
            </span>
          )}
        </div>

        {/* Toolbar */}
        {!loading && questions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by question text, title, or ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Per page
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/40 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-1/3 bg-gray-300 dark:bg-gray-600 rounded" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/40">
            <FileQuestion className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
              {questions.length === 0 ? "No questions yet" : "No results"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              {questions.length === 0
                ? "Questions for this section haven't been added yet. Check back soon."
                : `No questions matched "${search}". Try a different search term.`}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((q, idx) => {
              const globalIndex = pageStart + idx + 1;
              return (
                <li key={q.QUESTIONID}>
                  <Link
                    to={`/practice/${module}/${section}/${q.QUESTIONID}${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`}
                    className="group flex items-start gap-4 p-5 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    {/* Number badge */}
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {globalIndex}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors capitalize">
                          {highlightText(q.TITLE || sectionLabel, search)}
                        </h3>
                        <span className="font-mono text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          #{highlightText(String(q.QUESTIONID), search)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {highlightText(q.QUESTION_TEXT, search)}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowChevron className="flex-shrink-0 h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all self-center" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {pageStart + 1}
              </span>
              –
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {Math.min(pageStart + pageSize, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {filtered.length}
              </span>
            </p>

            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button
                onClick={() => goToPage(1)}
                disabled={safePage === 1}
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {pageList.map((p, idx) =>
                p === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-gray-400 dark:text-gray-500 select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    aria-current={p === safePage ? "page" : undefined}
                    className={
                      p === safePage
                        ? "min-w-[2.25rem] h-9 px-2 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm shadow-sm"
                        : "min-w-[2.25rem] h-9 px-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
                    }
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={safePage === totalPages}
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
