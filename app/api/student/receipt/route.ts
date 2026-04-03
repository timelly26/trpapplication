import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";
import { generateReceiptPDFServer } from "@/lib/receiptGeneratorServer";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.schoolId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const paymentId = searchParams.get("paymentId");
        const studentId = searchParams.get("studentId");
        const studentName = searchParams.get("studentName") || "Student";
        const admissionNumber = searchParams.get("admissionNumber") || "";
        const copyType = (searchParams.get("copyType") || "admin") as "admin" | "parent";

        if (!paymentId || !studentId) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        // Verify student belongs to school
        const student = await prisma.student.findFirst({
            where: { id: studentId, schoolId: session.user.schoolId },
            include: {
                user: true,
                class: true,
            },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        // Get payment details
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                studentId: studentId,
            },
        });

        if (!payment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        const pdfBytes = await generateReceiptPDFServer({
            payment,
            student,
            copyType,
            schoolName: "Timely School",
        });

        return new NextResponse(pdfBytes, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Receipt_${admissionNumber}_${copyType}_${new Date(payment.createdAt).toISOString().split("T")[0]}.pdf"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Receipt generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate receipt" },
            { status: 500 }
        );
    }
}
