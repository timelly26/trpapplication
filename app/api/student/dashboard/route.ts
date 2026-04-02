import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";
import { purgeExpiredNewsFeeds } from "@/lib/newsfeedRetention";

function getAcademicYearRange(seed = new Date()) {
  const year = seed.getFullYear();
  const month = seed.getMonth();
  const startYear = month >= 3 ? year : year - 1; // Apr -> Mar
  return {
    start: new Date(startYear, 3, 1),
    end: new Date(startYear + 1, 2, 31),
  };
}

function gradeFromAverage(avg: number) {
  if (avg >= 90) return "A+";
  if (avg >= 80) return "A";
  if (avg >= 70) return "B+";
  if (avg >= 60) return "B";
  return "C";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.studentId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { id: session.user.studentId },
      select: {
        id: true,
        classId: true,
        schoolId: true,
        user: { select: { name: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    await purgeExpiredNewsFeeds();

    const { start, end } = getAcademicYearRange();

    const [attendance, marks, fee, circulars, events, feeds, homeworks] = await prisma.$transaction([
      prisma.attendance.findMany({
        where: { studentId: student.id, date: { gte: start, lte: end } },
        select: { date: true, status: true },
      }),
      prisma.mark.findMany({
        where: { studentId: student.id },
        select: { marks: true, totalMarks: true },
      }),
      prisma.studentFee.findUnique({
        where: { studentId: student.id },
        select: { remainingFee: true },
      }),
      prisma.circular.findMany({
        where: { schoolId: student.schoolId, publishStatus: "PUBLISHED" },
        include: { issuedBy: { select: { id: true, name: true } } },
        orderBy: { date: "desc" },
        take: 12,
      }),
      prisma.event.findMany({
        where: {
          schoolId: student.schoolId,
          OR: student.classId ? [{ classId: student.classId }, { classId: null }] : [{ classId: null }],
        },
        select: { id: true, title: true, type: true, eventDate: true },
        orderBy: { eventDate: "asc" },
        take: 10,
      }),
      prisma.newsFeed.findMany({
        where: { schoolId: student.schoolId },
        include: {
          createdBy: { select: { name: true, photoUrl: true } },
          likedBy: {
            where: { userId: session.user.id },
            select: { id: true },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.homework.findMany({
        where: { schoolId: student.schoolId, ...(student.classId ? { classId: student.classId } : {}) },
        include: {
          submissions: {
            where: { studentId: student.id },
            select: { id: true },
            take: 1,
          },
        },
      }),
    ]);

    const presentDays = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const totalAttendanceDays = attendance.filter((a) => a.status !== "HOLIDAY").length;
    const attendancePct = totalAttendanceDays ? (presentDays / totalAttendanceDays) * 100 : 0;

    const homeworkTotal = homeworks.length;
    const homeworkSubmitted = homeworks.filter((h) => h.submissions.length > 0).length;

    const markPercentages = marks
      .map((m) => (m.totalMarks > 0 ? (m.marks / m.totalMarks) * 100 : 0))
      .filter((v) => Number.isFinite(v));
    const averageMarksPct = markPercentages.length
      ? markPercentages.reduce((a, b) => a + b, 0) / markPercentages.length
      : 0;

    return NextResponse.json(
      {
        studentName: student.user?.name || "Student",
        attendancePct,
        presentDays,
        totalAttendanceDays,
        homeworkSubmitted,
        homeworkTotal,
        averageMarksPct,
        gradeLabel: gradeFromAverage(averageMarksPct),
        feePendingAmount: fee?.remainingFee ?? 0,
        circulars: circulars.map((c) => ({
          id: c.id,
          referenceNumber: c.referenceNumber,
          subject: c.subject,
          content: c.content,
          publishStatus: c.publishStatus,
          date: c.date.toISOString(),
          importanceLevel: c.importanceLevel,
          attachments: c.attachments ?? [],
          issuedBy: c.issuedBy ? { id: c.issuedBy.id, name: c.issuedBy.name } : null,
        })),
        events: events.map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          eventDate: e.eventDate?.toISOString() ?? null,
        })),
        feeds: feeds.map((f) => ({
          id: f.id,
          title: f.title,
          description: f.description,
          photo: f.photo,
          likes: f.likes,
          likedByMe: f.likedBy.length > 0,
          createdAt: f.createdAt.toISOString(),
          createdBy: { name: f.createdBy?.name ?? null, photoUrl: f.createdBy?.photoUrl ?? null },
        })),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Parent home dashboard error:", error);
    
    // Handle database connection errors
    const err = error as { code?: string; message?: string; name?: string };
    if (err?.code === "P1001" || err?.message?.includes("Can't reach database server") || err?.name === "PrismaClientInitializationError") {
      return NextResponse.json(
        { message: "Database connection failed. Please check your database configuration." },
        { status: 503 }
      );
    }
    
    if (err?.message?.includes("statement timeout") || err?.message?.includes("Connection terminated")) {
      return NextResponse.json(
        { message: "Database request timed out. Please try again." },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
