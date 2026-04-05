import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Application from "@/models/Application";
import Job from "@/models/Job";
import { extractTextFromPDF } from "@/lib/parseResume";
import { analyzeCV } from "@/lib/ai";

// GET all applications (for dashboard)
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const status = searchParams.get("status");
  const sortBy = searchParams.get("sortBy") || "aiScore";

  const filter: Record<string, string> = {};
  if (jobId) filter.jobId = jobId;
  if (status) filter.status = status;

  const applications = await Application.find(filter)
    .select("-resumeUrl -resumeText")
    .populate("jobId", "title team location")
    .sort(sortBy === "aiScore" ? { aiScore: -1 } : { createdAt: -1 });

  return NextResponse.json(applications);
}

// POST - submit application with CV
export async function POST(req: NextRequest) {
  await dbConnect();

  const formData = await req.formData();
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const location = formData.get("location") as string;
  const qualification = formData.get("qualification") as string;
  const experience = formData.get("experience") as string;
  const jobId = formData.get("jobId") as string;
  const resume = formData.get("resume") as File;

  if (!resume || !fullName || !email || !phone || !jobId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Get job details for AI analysis
  const job = await Job.findById(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Read PDF buffer
  const bytes = await resume.arrayBuffer();
  const buffer = Buffer.from(bytes);
  console.log("[APP] Resume file:", resume.name, "size:", buffer.length, "type:", resume.type);

  // Extract text from PDF
  let resumeText = "";
  try {
    resumeText = await extractTextFromPDF(buffer);
    console.log("[APP] Extracted text length:", resumeText.length, "preview:", resumeText.substring(0, 100));
  } catch (err) {
    console.error("[APP] PDF extraction failed:", err);
    resumeText = "Could not extract text from PDF";
  }

  // Save resume as base64 (for small files - production would use cloud storage)
  const resumeBase64 = buffer.toString("base64");

  // Create application first
  const application = await Application.create({
    jobId,
    fullName,
    email,
    phone,
    location,
    qualification,
    experience,
    resumeUrl: `data:application/pdf;base64,${resumeBase64}`,
    resumeText,
  });

  // AI Analysis (run async, don't block response)
  analyzeCV(resumeText, job.title, job.description)
    .then(async (analysis) => {
      await Application.findByIdAndUpdate(application._id, {
        aiScore: analysis.score,
        aiReason: analysis.reason,
        aiStrengths: analysis.strengths,
        aiWeaknesses: analysis.weaknesses,
        aiMatchPercent: analysis.matchPercent,
        aiInterviewQuestions: analysis.interviewQuestions,
        status: analysis.recommendation,
      });
    })
    .catch((err) => {
      console.error("AI analysis failed:", err);
    });

  return NextResponse.json(
    { message: "Application submitted successfully!", id: application._id },
    { status: 201 }
  );
}
