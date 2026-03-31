import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";
import { assertCanManageAdmissions, getSessionSchoolId } from "../_utils";
import * as XLSX from "xlsx";
import { emailLocalPartFromFullName, normalizeEmailDomain, schoolDomainFromName } from "@/lib/schoolEmail";

function formatDate(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function formatGrade(value: string) {
  return value.replace(/^GRADE_/i, "Grade ").replace(/_/g, " ");
}

function formatBoardingType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    assertCanManageAdmissions(session.user.role);

    const schoolId = await getSessionSchoolId(session);
    if (!schoolId) return NextResponse.json({ message: "School not found in session" }, { status: 400 });

    const [school, settings] = await Promise.all([
      prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
      prisma.schoolSettings.findUnique({ where: { schoolId }, select: { emailDomain: true } }),
    ]);
    const emailDomain =
      normalizeEmailDomain(settings?.emailDomain) ?? schoolDomainFromName(school?.name ?? "school");

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") ?? "").trim();
    const gradeSought = (searchParams.get("gradeSought") ?? "").trim();
    const boardingType = (searchParams.get("boardingType") ?? "").trim();
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    const where: any = { schoolId };
    if (gradeSought) where.gradeSought = gradeSought;
    if (boardingType) where.boardingType = boardingType;
    if (fromDate && !Number.isNaN(fromDate.getTime())) {
      where.createdAt = { ...(where.createdAt ?? {}), gte: fromDate };
    }
    if (toDate && !Number.isNaN(toDate.getTime())) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...(where.createdAt ?? {}), lte: end };
    }

    if (search) {
      where.OR = [
        { applicationNo: { contains: search, mode: "insensitive" } },
        { admissionNo: { contains: search, mode: "insensitive" } },
        { fedenaNo: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { parentName: { contains: search, mode: "insensitive" } },
        { parentPhone: { contains: search, mode: "insensitive" } },
        { aadharNo: { contains: search, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.studentApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        applicationNo: true,
        fedenaNo: true,
        admissionNo: true,
        gradeSought: true,
        boardingType: true,
        rollNo: true,
        firstName: true,
        middleName: true,
        lastName: true,
        aadharNo: true,
        gender: true,
        dateOfBirth: true,
        firstLanguage: true,
        previousSchoolName: true,
        previousSchoolAddress: true,
        className: true,
        section: true,
        class: { select: { name: true, section: true } },
        totalFee: true,
        discountPercent: true,
        nationality: true,
        languagesAtHome: true,
        caste: true,
        religion: true,
        parentName: true,
        parentOccupation: true,
        officeAddress: true,
        parentPhone: true,
        parentEmail: true,
        parentAadharNo: true,
        parentWhatsapp: true,
        bankAccountNo: true,
        emergencyFatherNo: true,
        emergencyMotherNo: true,
        emergencyGuardianNo: true,
        houseNo: true,
        street: true,
        city: true,
        town: true,
        state: true,
        pinCode: true,
        createdAt: true,
      },
    });

    const data = rows.map((r) => ({
      // Full admission export fields
      "Application No": r.applicationNo,
      "Fedena No": r.fedenaNo ?? "",
      "Admission No": r.admissionNo ?? "",
      "Grade Sought": formatGrade(r.gradeSought),
      "Boarding Type": formatBoardingType(r.boardingType),
      Class: r.class?.name ?? r.className ?? "",
      Section: r.class?.section ?? r.section ?? "",
      "First Name": r.firstName,
      "Middle Name": r.middleName ?? "",
      "Last Name": r.lastName,
      Gender: r.gender === "MALE" ? "Male" : "Female",
      "Date of Birth": formatDate(r.dateOfBirth),
      "Aadhar No": r.aadharNo,
      "First Language": r.firstLanguage,
      "Total Fee": r.totalFee ?? "",
      "Discount %": r.discountPercent ?? 0,
      Nationality: r.nationality,
      "Languages at Home": r.languagesAtHome,
      Caste: r.caste ?? "",
      Religion: r.religion ?? "",
      "House No": r.houseNo,
      Street: r.street,
      City: r.city,
      Town: r.town ?? "",
      State: r.state,
      "Pin Code": r.pinCode,
      "Parent Name": r.parentName,
      Occupation: r.parentOccupation,
      "Office Address": r.officeAddress,
      "Parent Phone": r.parentPhone,
      "Parent Email": r.parentEmail,
      "Parent Aadhar No": r.parentAadharNo,
      WhatsApp: r.parentWhatsapp,
      "Bank Account No": r.bankAccountNo,
      "Previous School Name": r.previousSchoolName,
      "Previous School Address": r.previousSchoolAddress,
      "Father No": r.emergencyFatherNo,
      "Mother No": r.emergencyMotherNo,
      "Guardian No": r.emergencyGuardianNo,
      // Keep compatibility columns so this export can still be used in student bulk upload
      name: `${r.firstName} ${r.middleName ? `${r.middleName} ` : ""}${r.lastName}`.trim(),
      fatherName: r.parentName,
      rollNo: r.rollNo ?? "",
      aadhaarNo: r.aadharNo,
      gender: r.gender === "MALE" ? "Male" : "Female",
      dob: formatDate(r.dateOfBirth),
      previousSchool: r.previousSchoolName,
      class: r.class?.name ?? r.className ?? "",
      section: r.class?.section ?? r.section ?? "",
      totalFee: r.totalFee ?? "",
      discountPercent: r.discountPercent ?? 0,
      phoneNo: r.parentPhone,
      email: `${emailLocalPartFromFullName(
        `${r.firstName} ${r.middleName ? `${r.middleName} ` : ""}${r.lastName}`.trim()
      )}@${emailDomain}`,
      password: formatDate(r.dateOfBirth).replace(/-/g, ""),
      address: `${r.houseNo}, ${r.street}, ${r.town ? `${r.town}, ` : ""}${r.city}, ${r.state} - ${r.pinCode}`,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Admissions");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const body = new Uint8Array(buf);

    const filename = `admissions-${Date.now()}.xlsx`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: unknown) {
    const err = e as { message?: string; statusCode?: number };
    return NextResponse.json(
      { message: err?.message ?? "Internal server error" },
      { status: err?.statusCode ?? 500 }
    );
  }
}

