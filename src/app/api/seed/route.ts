import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Job from "@/models/Job";
import Application from "@/models/Application";

// Seed jobs and clear old data
export async function POST() {
  await dbConnect();

  const jobs = [
    {
      title: "MERN Stack Intern — Onsite | Paid Internship",
      description:
        "We're looking for passionate and motivated MERN Stack Interns to join our team and gain hands-on experience on real-world projects.\n\nInternship Details:\n- Type: Onsite (Paid)\n- Stipend: PKR 15,000/month\n- Location: Sindh Muslim (SMCHS), Karachi\n\nWhat You'll Work On:\n- Real-time frontend & backend development\n- Building web and mobile applications\n- Industry-standard tools and workflows\n- Collaboration with experienced developers\n\nTech Stack: MongoDB, Express.js, React.js, Node.js\n\nAvailable Shifts:\n- Morning: 11:00 AM – 7:00 PM\n- Evening: 6:00 PM – 2:00 AM\n\nInterview Process: Online via Google Meet (camera-on is compulsory)",
      location: ["Karachi"],
      team: "Engineering",
      vacancies: 5,
      workingHours: "8 hours",
      requirements: [
        "Basic knowledge of MongoDB, Express.js, React.js, Node.js",
        "Willingness to learn and work on real projects",
        "Good communication skills",
        "Available for onsite work in SMCHS, Karachi",
      ],
    },
  ];

  // Clear all old data
  await Job.deleteMany({});
  await Application.deleteMany({});

  const created = await Job.insertMany(jobs);

  return NextResponse.json({
    message: `Seeded ${created.length} job(s). All old applications cleared.`,
    jobs: created,
  });
}
