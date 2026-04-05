"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Job {
  _id: string;
  title: string;
  description: string;
  location: string[];
  team: string;
  vacancies: number;
  workingHours: string;
  requirements: string[];
  status: "active" | "closed";
  createdAt: string;
}

const emptyJob = {
  title: "",
  description: "",
  location: ["Karachi"],
  team: "",
  vacancies: 1,
  workingHours: "8 hours",
  requirements: [""],
  status: "active" as const,
};

export default function ManageJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyJob);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [locationInput, setLocationInput] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { window.location.href = "/login"; return; }
    const user = JSON.parse(stored);
    if (user.role !== "hr") { window.location.href = "/"; return; }
    setAuthorized(true);
    fetchJobs();
  }, []);

  const fetchJobs = () => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => { setJobs(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyJob);
    setLocationInput("");
    setShowForm(true);
  };

  const openEdit = (job: Job) => {
    setEditingId(job._id);
    setForm({
      title: job.title,
      description: job.description,
      location: job.location,
      team: job.team,
      vacancies: job.vacancies,
      workingHours: job.workingHours,
      requirements: job.requirements.length > 0 ? job.requirements : [""],
      status: job.status,
    });
    setLocationInput("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.team) return alert("Title and Team are required");
    setSaving(true);

    const body = {
      ...form,
      requirements: form.requirements.filter((r) => r.trim() !== ""),
    };

    if (editingId) {
      await fetch(`/api/jobs/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setSaving(false);
    setShowForm(false);
    fetchJobs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job? All applications for it will remain.")) return;
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    fetchJobs();
  };

  const addRequirement = () => setForm({ ...form, requirements: [...form.requirements, ""] });
  const removeRequirement = (i: number) => setForm({ ...form, requirements: form.requirements.filter((_, idx) => idx !== i) });
  const updateRequirement = (i: number, val: string) => {
    const updated = [...form.requirements];
    updated[i] = val;
    setForm({ ...form, requirements: updated });
  };

  const addLocation = () => {
    if (locationInput.trim() && !form.location.includes(locationInput.trim())) {
      setForm({ ...form, location: [...form.location, locationInput.trim()] });
      setLocationInput("");
    }
  };
  const removeLocation = (loc: string) => setForm({ ...form, location: form.location.filter((l) => l !== loc) });

  if (!authorized) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Checking access...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-gray-200 mb-8">
          <Link href="/dashboard" className="pb-3 text-sm font-medium text-gray-400 hover:text-black transition-colors">
            Applications
          </Link>
          <span className="pb-3 text-sm font-medium text-black border-b-2 border-black">
            Manage Jobs
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Manage Jobs</h1>
            <p className="text-gray-400 mt-1 text-sm">{jobs.length} job{jobs.length !== 1 ? "s" : ""} posted</p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            + New Job
          </button>
        </div>

        {/* Jobs List */}
        <div className="mt-6 space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-1/3 mt-2" />
              </div>
            ))
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">No jobs posted yet</p>
              <button onClick={openCreate} className="mt-4 text-sm text-black font-medium hover:underline">
                Create your first job
              </button>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job._id} className="border border-gray-200 rounded-lg p-4 sm:p-5 hover:border-gray-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm sm:text-base">{job.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${job.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span>{job.location.join(", ")}</span>
                      <span>{job.vacancies} vacancies</span>
                      <span className="bg-black text-white px-2 py-0.5 rounded-full">{job.team}</span>
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(job)}
                      className="text-xs px-4 py-2 border border-black rounded-lg hover:bg-black hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job._id)}
                      className="text-xs px-4 py-2 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowForm(false)}>
            <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-5 sm:p-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{editingId ? "Edit Job" : "New Job"}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-black text-2xl">&times;</button>
              </div>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="text-sm text-gray-500">Job Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. MERN Stack Intern"
                    className="w-full mt-1 py-3 border-b border-gray-200 focus:border-black outline-none transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm text-gray-500">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={5}
                    placeholder="Job description..."
                    className="w-full mt-1 py-3 border border-gray-200 rounded-lg px-3 focus:border-black outline-none transition-colors text-sm resize-none"
                  />
                </div>

                {/* Team & Vacancies */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Team *</label>
                    <input
                      type="text"
                      value={form.team}
                      onChange={(e) => setForm({ ...form, team: e.target.value })}
                      placeholder="e.g. Engineering"
                      className="w-full mt-1 py-3 border-b border-gray-200 focus:border-black outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Vacancies</label>
                    <input
                      type="number"
                      min={1}
                      value={form.vacancies}
                      onChange={(e) => setForm({ ...form, vacancies: parseInt(e.target.value) || 1 })}
                      className="w-full mt-1 py-3 border-b border-gray-200 focus:border-black outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Working Hours & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Working Hours</label>
                    <input
                      type="text"
                      value={form.workingHours}
                      onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                      placeholder="e.g. 8 hours"
                      className="w-full mt-1 py-3 border-b border-gray-200 focus:border-black outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "closed" })}
                      className="w-full mt-1 py-3 border-b border-gray-200 focus:border-black outline-none bg-transparent cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <label className="text-sm text-gray-500">Locations</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.location.map((loc) => (
                      <span key={loc} className="flex items-center gap-1 text-xs bg-gray-100 px-3 py-1.5 rounded-full">
                        {loc}
                        <button onClick={() => removeLocation(loc)} className="text-gray-400 hover:text-black ml-1">&times;</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
                      placeholder="Add city..."
                      className="flex-1 py-2 border-b border-gray-200 focus:border-black outline-none text-sm"
                    />
                    <button onClick={addLocation} className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Add</button>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="text-sm text-gray-500">Requirements</label>
                  <div className="space-y-2 mt-2">
                    {form.requirements.map((req, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={req}
                          onChange={(e) => updateRequirement(i, e.target.value)}
                          placeholder={`Requirement ${i + 1}`}
                          className="flex-1 py-2 border-b border-gray-200 focus:border-black outline-none text-sm"
                        />
                        {form.requirements.length > 1 && (
                          <button onClick={() => removeRequirement(i)} className="text-gray-300 hover:text-red-500 text-lg">&times;</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addRequirement} className="text-xs text-gray-400 hover:text-black mt-2">+ Add requirement</button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingId ? "Update Job" : "Create Job"}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
