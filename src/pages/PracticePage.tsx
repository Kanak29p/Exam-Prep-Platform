import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  Target,
  Clock,
  Play,
} from "lucide-react";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../lib/api";

const moduleOrder = ["Speaking", "Writing", "Reading", "Listening"];

export function PracticePage() {
  const { module: urlModule } = useParams();
  const [, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${API_BASE_URL}/api/questions/sections`,
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

        setSections(data);

        const grouped = data.reduce((acc: any, item: any) => {
          const category = item.CATEGORY;
          let subCategory = item.SUB_CATEGORY;

          // Normalize "Essay" -> "Write Essay" so old and new API data merge cleanly.
          // The dedup check below prevents this from creating duplicates.
          if (
            category &&
            category.toLowerCase() === "writing" &&
            subCategory &&
            subCategory.toLowerCase() === "essay"
          ) {
            subCategory = "Write Essay";
          }

          // CHECK IF CATEGORY ALREADY EXISTS
          let module = acc.find((m: any) => m.name === category);

          // IF NOT EXISTS → CREATE IT
          if (!module) {
            module = {
              name: category,
              sections: [],
            };

            acc.push(module);
          }

          // ADD SUBCATEGORY ONLY IF IT DOESN'T EXIST ALREADY
          const exists = module.sections.some((s: any) => s.name === subCategory);
          if (!exists) {
            module.sections.push({
              name: subCategory,
            });
          }

          return acc;
        }, []);

        grouped.sort(
          (a: any, b: any) =>
            moduleOrder.indexOf(a.name) - moduleOrder.indexOf(b.name),
        );

        let filteredGrouped = grouped;
        if (urlModule) {
          filteredGrouped = grouped.filter(
            (m: any) => m.name.toLowerCase() === urlModule.toLowerCase()
          );
        }

        setModules(filteredGrouped);
      } catch (error) {
        console.error("Failed to fetch sections:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [urlModule]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {urlModule && (
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <Link to="/practice" className="hover:text-blue-600 transition-colors">
                Practice Modules
              </Link>
              <span>/</span>
              <span className="capitalize">{urlModule}</span>
            </div>
          )}
          <h1 className="text-4xl font-bold mb-2 capitalize">
            {urlModule ? `${urlModule} Practice` : "Practice Modules"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {urlModule ? "Choose a question type to start practicing" : "Choose a module to start practicing"}
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                {/* Header Skeleton */}
                <div className="bg-gray-200 dark:bg-gray-700 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-300 dark:bg-gray-600 h-14 w-14 rounded-lg" />
                    <div className="space-y-2">
                      <div className="bg-gray-300 dark:bg-gray-600 h-6 w-32 rounded" />
                      <div className="bg-gray-300 dark:bg-gray-600 h-4 w-48 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="bg-gray-300 dark:bg-gray-600 h-8 w-12 rounded ml-auto" />
                    <div className="bg-gray-300 dark:bg-gray-600 h-4 w-24 rounded ml-auto" />
                  </div>
                </div>
                {/* Content Cards Skeleton */}
                <div className="p-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="p-4 border-2 border-gray-150 dark:border-gray-700 rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="bg-gray-250 dark:bg-gray-700 h-5 w-28 rounded" />
                          <div className="bg-gray-250 dark:bg-gray-700 h-5 w-5 rounded-full" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-200 dark:bg-gray-700 h-4 w-4 rounded" />
                            <div className="bg-gray-200 dark:bg-gray-700 h-4 w-24 rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-200 dark:bg-gray-700 h-4 w-4 rounded" />
                            <div className="bg-gray-200 dark:bg-gray-700 h-4 w-20 rounded" />
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                          <div className="flex justify-between">
                            <div className="bg-gray-200 dark:bg-gray-700 h-3 w-16 rounded" />
                            <div className="bg-gray-200 dark:bg-gray-700 h-3 w-8 rounded" />
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {modules.map((module, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className={`bg-blue-600 p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{module.name}</h2>
                      <p className="text-white/90">
                        Practice your {module.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      {module.sections.length}
                    </div>
                    <div className="text-white/90">Total Questions</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {module.sections.map((section, sectionIndex) => (
                    <Link
                      key={sectionIndex}
                      to={`/practice/${module.name.toLowerCase()}/${section.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                          {section.name}
                        </h3>
                        <Play className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>Practice section</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Timed practice</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Your Progress
                          </span>
                          <span className="text-blue-600 font-semibold">
                            {Math.floor(Math.random() * 100)}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-blue-600`}
                            style={{
                              width: `${Math.floor(Math.random() * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
     {/* <AudioRecorder /> */}
    </div>
    
  );
}
