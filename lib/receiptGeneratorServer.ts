import jsPDF from "jspdf";

export async function generateReceiptPDFServer(data: any): Promise<ArrayBuffer> {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const copyType = data.copyType || "admin";

    // Set default font
    doc.setFont("helvetica");

    // Header - Color coding by copy type
    const headerColor = copyType === "admin" ? [34, 197, 94] : [59, 130, 246]; // Green for Admin, Blue for Parent
    doc.setFillColor(...headerColor);
    doc.rect(0, 0, pageWidth, 30, "F");

    // School Name in Header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("TIMELY", margin, 12);

    // Subtitle
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("School Management System", margin, 18);

    // Copy Type Badge
    const copyLabel = copyType === "admin" ? "ADMIN COPY" : "PARENT COPY";
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(copyLabel, pageWidth - margin - 50, 12);

    // FEE RECEIPT text
    doc.text("FEE RECEIPT", pageWidth - margin - 50, 21);

    // Reset text color
    doc.setTextColor(0, 0, 0);

    let yPosition = 42;

    // School Information Section
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 3, contentWidth, 12, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SCHOOL INFORMATION", margin + 2, yPosition + 4);

    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`School: ${data.schoolName || "Timely School"}`, margin + 2, yPosition);

    // Student Information Section
    yPosition += 12;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 3, contentWidth, 12, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("STUDENT INFORMATION", margin + 2, yPosition + 4);

    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const studentName = data.student?.user?.name || "Student";
    const admissionNumber = data.student?.admissionNumber || "N/A";
    const className = data.student?.class?.displayName || "N/A";

    const studentInfo = [
        [`Student Name:`, studentName],
        [`Admission #:`, admissionNumber],
        [`Class:`, className],
    ];

    studentInfo.forEach(([label, value]) => {
        doc.text(label, margin + 2, yPosition);
        doc.text(String(value), margin + 65, yPosition);
        yPosition += 7;
    });

    // Payment Information Section
    yPosition += 5;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 3, contentWidth, 12, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT INFORMATION", margin + 2, yPosition + 4);

    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const paymentDate = new Date(data.payment?.createdAt || new Date()).toLocaleDateString("en-IN");
    const transactionId = data.payment?.transactionId || "N/A";
    const paymentMethod = data.payment?.method || "Online";

    const paymentInfo = [
        [`Payment Date:`, paymentDate],
        [`Transaction ID:`, transactionId],
        [`Payment Method:`, paymentMethod],
    ];

    paymentInfo.forEach(([label, value]) => {
        doc.text(label, margin + 2, yPosition);
        doc.text(String(value), margin + 65, yPosition);
        yPosition += 7;
    });

    // Fees Summary Section
    yPosition += 8;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 3, contentWidth, 12, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("FEES SUMMARY", margin + 2, yPosition + 4);

    yPosition += 15;

    // Summary details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const amount = data.payment?.amount || 0;
    doc.text("Amount Paid:", margin + 2, yPosition);
    doc.text(`₹${Number(amount).toLocaleString("en-IN")}`, pageWidth - margin - 2, yPosition, {
        align: "right",
    });

    // Disclaimer/Footer
    yPosition = pageHeight - 35;

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    if (copyType === "admin") {
        doc.text(
            `This is an official record for school administration.`,
            pageWidth / 2,
            yPosition,
            { align: "center" }
        );
        yPosition += 5;
        doc.text(
            `Please retain for accounting and audit purposes.`,
            pageWidth / 2,
            yPosition,
            { align: "center" }
        );
    } else {
        doc.text(
            `This is your official receipt for fees paid.`,
            pageWidth / 2,
            yPosition,
            { align: "center" }
        );
        yPosition += 5;
        doc.text(
            `Please keep it safely for future reference.`,
            pageWidth / 2,
            yPosition,
            { align: "center" }
        );
    }

    yPosition += 8;
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.text(
        `Generated by Timely on ${new Date().toLocaleDateString("en-IN")}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
    );

    // Return as ArrayBuffer
    return doc.output("arraybuffer") as ArrayBuffer;
}
