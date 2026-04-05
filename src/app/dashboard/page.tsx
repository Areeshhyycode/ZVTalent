"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Application {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  qualification: string;
  experience: string;
  aiScore: number | null;
  aiReason: string | null;
  aiStrengths: string[];
  aiWeaknesses: string[];
  aiMatchPercent: number | null;
  aiInterviewQuestions: string[];
  status: "applied" | "shortlisted" | "rejected";
  createdAt: string;
  jobId: {
    _id: string;
    title: string;
    team: string;
    location: string[];
  } | null;
}

export default function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const fetchApplications = () => {
    fetch("/api/applications")
      .then((res) => res.json())
      .then((data) => {
        setApplications(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      window.location.href = "/login";
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== "hr") {
      window.location.href = "/";
      return;
    }
    setAuthorized(true);
    fetchApplications();
  }, []);

  // Auto-refresh when there are pending AI analyses
  useEffect(() => {
    const hasPending = applications.some((a) => a.aiScore === null);
    if (!hasPending) return;
    const interval = setInterval(fetchApplications, 5000);
    return () => clearInterval(interval);
  }, [applications]);

  if (!authorized) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
          Checking access...
        </div>
      </>
    );
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchApplications();
    if (selectedApp?._id === id) {
      setSelectedApp((prev) => (prev ? { ...prev, status: status as Application["status"] } : null));
    }
  };

  const filtered = applications.filter((app) => {
    const matchStatus =
      statusFilter === "all" || app.status === statusFilter;
    const matchSearch =
      app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: applications.length,
    shortlisted: applications.filter((a) => a.status === "shortlisted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    avgScore:
      applications.filter((a) => a.aiScore).length > 0
        ? (
            applications
              .filter((a) => a.aiScore)
              .reduce((sum, a) => sum + (a.aiScore || 0), 0) /
            applications.filter((a) => a.aiScore).length
          ).toFixed(1)
        : "—",
  };

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-gray-200 mb-8">
          <span className="pb-3 text-sm font-medium text-black border-b-2 border-black">
            Applications
          </span>
          <Link href="/dashboard/jobs" className="pb-3 text-sm font-medium text-gray-400 hover:text-black transition-colors">
            Manage Jobs
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">
          AI-powered candidate rankings and management
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
          {[
            { label: "Applications", value: stats.total },
            { label: "Shortlisted", value: stats.shortlisted },
            { label: "Rejected", value: stats.rejected },
            { label: "Avg Score", value: stats.avgScore },
          ].map((stat) => (
            <div
              key={stat.label}
              className="border border-gray-200 rounded-lg p-3 sm:p-5 min-w-0"
            >
              <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["all", "applied", "shortlisted", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  statusFilter === s
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Applications Table */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-12" />
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="h-6 bg-gray-100 rounded-full w-16" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-100 rounded w-16" />
                      <div className="h-6 bg-gray-100 rounded w-14" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No applications found
            </div>
          ) : (
            <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((app, i) => (
                <div
                  key={app._id}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-black transition-colors"
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        <span className="text-gray-400 mr-2">#{i + 1}</span>
                        {app.fullName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{app.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{app.jobId?.title || "Unknown"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {app.aiScore !== null ? (
                        <p className={`text-lg font-bold ${app.aiScore >= 7 ? "text-black" : app.aiScore >= 5 ? "text-gray-500" : "text-gray-300"}`}>
                          {app.aiScore}/10
                        </p>
                      ) : (
                        <p className="text-xs text-gray-300">Analyzing...</p>
                      )}
                      {app.aiMatchPercent !== null && (
                        <p className="text-xs text-gray-400">{app.aiMatchPercent}% match</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
                        app.status === "shortlisted"
                          ? "bg-black text-white"
                          : app.status === "rejected"
                          ? "bg-gray-200 text-gray-500"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {app.status}
                    </span>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => updateStatus(app._id, "shortlisted")}
                        className="text-xs px-3 py-1 border border-black rounded hover:bg-black hover:text-white transition-colors"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => updateStatus(app._id, "rejected")}
                        className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      Rank
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      Candidate
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      Job
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      AI Score
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      Match
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((app, i) => (
                    <tr
                      key={app._id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedApp(app)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-400">
                          #{i + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{app.fullName}</p>
                        <p className="text-xs text-gray-400">{app.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">
                          {app.jobId?.title || "Unknown"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {app.aiScore !== null ? (
                          <span
                            className={`text-lg font-bold ${
                              app.aiScore >= 7
                                ? "text-black"
                                : app.aiScore >= 5
                                ? "text-gray-500"
                                : "text-gray-300"
                            }`}
                          >
                            {app.aiScore}/10
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">
                            Analyzing...
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {app.aiMatchPercent !== null ? (
                          <span className="text-sm font-medium">
                            {app.aiMatchPercent}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full ${
                            app.status === "shortlisted"
                              ? "bg-black text-white"
                              : app.status === "rejected"
                              ? "bg-gray-200 text-gray-500"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              updateStatus(app._id, "shortlisted")
                            }
                            className="text-xs px-3 py-1 border border-black rounded hover:bg-black hover:text-white transition-colors"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => updateStatus(app._id, "rejected")}
                            className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        {/* Candidate Detail Modal */}
        {selectedApp && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex justify-end"
            onClick={() => setSelectedApp(null)}
          >
            <div
              className="w-full max-w-lg bg-white h-full overflow-y-auto p-5 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedApp.fullName}
                  </h2>
                  <p className="text-gray-400 mt-1">{selectedApp.email}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-400 hover:text-black text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Contact */}
              <div className="flex gap-2 sm:gap-3 mt-6">
                <a
                  href={`tel:${selectedApp.phone}`}
                  className="flex-1 text-center py-3 border border-black rounded-lg text-xs sm:text-sm font-medium hover:bg-black hover:text-white transition-colors"
                >
                  Call
                </a>
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(selectedApp.phone);
                    } else {
                      const t = document.createElement("textarea");
                      t.value = selectedApp.phone;
                      document.body.appendChild(t);
                      t.select();
                      document.execCommand("copy");
                      document.body.removeChild(t);
                    }
                    alert("Phone number copied!");
                  }}
                  className="flex-1 text-center py-3 border border-gray-200 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition-colors"
                >
                  Copy
                </button>
                <a
                  href={`mailto:${selectedApp.email}`}
                  className="flex-1 text-center py-3 border border-gray-200 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition-colors"
                >
                  Email
                </a>
              </div>

              {/* AI Analysis */}
              {selectedApp.aiScore !== null && (
                <div className="mt-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold">
                        {selectedApp.aiScore}
                      </p>
                      <p className="text-xs text-gray-400">AI Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold">
                        {selectedApp.aiMatchPercent}%
                      </p>
                      <p className="text-xs text-gray-400">Match</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase text-gray-400 mb-2">
                      AI Reason
                    </h3>
                    <p className="text-sm text-gray-600">{selectedApp.aiReason}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase text-gray-400 mb-2">
                      Strengths
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.aiStrengths.map((s, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-gray-100 rounded-full text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase text-gray-400 mb-2">
                      Weaknesses
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.aiWeaknesses.map((w, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-gray-50 border rounded-full text-xs text-gray-500"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase text-gray-400 mb-2">
                      Suggested Interview Questions
                    </h3>
                    <ul className="space-y-2">
                      {selectedApp.aiInterviewQuestions.map((q, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-2">
                          <span className="text-gray-300 shrink-0">
                            {i + 1}.
                          </span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedApp.aiScore === null && (
                <div className="mt-8 text-center py-10 text-gray-300">
                  <p className="text-lg">AI Analysis Pending...</p>
                  <p className="text-sm mt-2">
                    Resume is being analyzed. Refresh to check.
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="mt-8 border-t pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Location</span>
                  <span>{selectedApp.location}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Qualification</span>
                  <span>{selectedApp.qualification}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Experience</span>
                  <span>{selectedApp.experience}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Applied</span>
                  <span>
                    {new Date(selectedApp.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Status Actions */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => updateStatus(selectedApp._id, "shortlisted")}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedApp.status === "shortlisted"
                      ? "bg-black text-white"
                      : "border border-black hover:bg-black hover:text-white"
                  }`}
                >
                  Shortlist
                </button>
                <button
                  onClick={() => updateStatus(selectedApp._id, "rejected")}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedApp.status === "rejected"
                      ? "bg-gray-200 text-gray-500"
                      : "border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
