import { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  CreditCard,
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const statsData = [
  { month: "Jan", students: 120, revenue: 150000 },
  { month: "Feb", students: 185, revenue: 220000 },
  { month: "Mar", students: 240, revenue: 310000 },
  { month: "Apr", students: 320, revenue: 420000 },
  { month: "May", students: 410, revenue: 550000 },
];

export function AdminPanel() {
  interface Student {
    id: string;
    name: string;
    email: string;
    plan: string;
    score: number;
    status: string;
    joined: string;
  }
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token"); // your JWT

        const res = await fetch("http://localhost:5000/api/auth/students", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        setStudents(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const [activeTab, setActiveTab] = useState<
    "overview" | "students" | "questions" | "payments"
  >("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = students.filter(
  (student) =>
    (student.name?.toLowerCase() || "").includes(
      searchTerm.toLowerCase()
    ) ||
    (student.email?.toLowerCase() || "").includes(
      searchTerm.toLowerCase()
    )
);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your PTE platform
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
            <Users className="h-8 w-8 mb-3 opacity-80" />
            <div className="text-3xl font-bold mb-1">410</div>
            <div className="text-blue-100">Total Students</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
            <BookOpen className="h-8 w-8 mb-3 opacity-80" />
            <div className="text-3xl font-bold mb-1">1,240</div>
            <div className="text-green-100">Total Questions</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
            <CreditCard className="h-8 w-8 mb-3 opacity-80" />
            <div className="text-3xl font-bold mb-1">₹5.5L</div>
            <div className="text-purple-100">Monthly Revenue</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
            <BarChart3 className="h-8 w-8 mb-3 opacity-80" />
            <div className="text-3xl font-bold mb-1">87%</div>
            <div className="text-orange-100">Success Rate</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "students", label: "Students", icon: Users },
              { id: "questions", label: "Questions", icon: BookOpen },
              { id: "payments", label: "Payments", icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Student Growth</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={statsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "none",
                            borderRadius: "0.5rem",
                            color: "#fff",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="students"
                          stroke="#3b82f6"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-4">Revenue Growth</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "none",
                            borderRadius: "0.5rem",
                            color: "#fff",
                          }}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="#10b981"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold mb-1">245</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Active Students
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-2xl font-bold mb-1">1,450</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tests Completed
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl font-bold mb-1">4.8/5</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Average Rating
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === "students" && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search students..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                    />
                  </div>
                  <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Student
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredStudents.map((student) => (
                        <tr
                          key={student.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-semibold">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {student.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                student.plan === "Pro"
                                  ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600"
                                  : student.plan === "Premium"
                                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600"
                                    : student.plan === "Basic"
                                      ? "bg-green-100 dark:bg-green-900/20 text-green-600"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-600"
                              }`}
                            >
                              {student.plan}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold">
                              {student.score}/90
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                student.status === "active"
                                  ? "bg-green-100 dark:bg-green-900/20 text-green-600"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600"
                              }`}
                            >
                              {student.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {student.joined}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === "questions" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Question Bank</h3>
                  <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Question
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { module: "Speaking", count: 250, icon: "🎤" },
                    { module: "Writing", count: 180, icon: "✍️" },
                    { module: "Reading", count: 420, icon: "📖" },
                    { module: "Listening", count: 390, icon: "🎧" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="text-4xl mb-3">{item.icon}</div>
                      <div className="text-2xl font-bold mb-1">
                        {item.count}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {item.module}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Recent Transactions</h3>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: "TXN001",
                      student: "Priya Sharma",
                      amount: 1999,
                      plan: "Premium",
                      date: "2026-05-10",
                      status: "success",
                    },
                    {
                      id: "TXN002",
                      student: "Rahul Verma",
                      amount: 2999,
                      plan: "Pro",
                      date: "2026-05-09",
                      status: "success",
                    },
                    {
                      id: "TXN003",
                      student: "Anjali Patel",
                      amount: 999,
                      plan: "Basic",
                      date: "2026-05-08",
                      status: "pending",
                    },
                  ].map((payment, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                          <CreditCard className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{payment.student}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {payment.plan} Plan • {payment.date}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          ₹{payment.amount}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            payment.status === "success"
                              ? "bg-green-100 dark:bg-green-900/20 text-green-600"
                              : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
