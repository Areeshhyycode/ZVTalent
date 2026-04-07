import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Job from "@/models/Job";

// GET all jobs
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const filter = all ? {} : { status: "active" };
  const jobs = await Job.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(jobs);
}

// POST create job
export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const job = await Job.create(body);
  return NextResponse.json(job, { status: 201 });
}
