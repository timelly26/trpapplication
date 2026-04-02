import { StudentFormState, StudentRow } from "./types";

export const getInitials = (name?: string | null) => {
  if (!name) return "ST";
  const parts = name.trim().split(" ").filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("");
};

export const getAge = (dob?: string | null) => {
  if (!dob) return "-";
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return "-";
  const diff = Date.now() - date.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
};

export const toStudentForm = (student: StudentRow): StudentFormState => ({
  name: student.user?.name || student.name || "",
  rollNo: student.rollNo || "",
  gender: student.gender || "",
  dob: student.dob || "",
  classId: student.class?.id || "",
  section: student.class?.section || "",
  status: student.status || "Active",
  fatherName: student.fatherName || "",
  motherName: (student as { motherName?: string }).motherName || "",
  occupation: (student as { occupation?: string }).occupation || "",
  officeAddress: "",
  phoneNo: student.phoneNo || "",
  email: student.user?.email || (student as { email?: string }).email || "",
  address: student.address || "",
  aadhaarNo: student.aadhaarNo || "",
  parentWhatsapp: "",
  bankAccountNo: "",
  totalFee: "",
  discountPercent: "",
  applicationFee:
    student.applicationFee != null && student.applicationFee !== undefined
      ? String(student.applicationFee)
      : "",
  admissionFee:
    student.admissionFee != null && student.admissionFee !== undefined
      ? String(student.admissionFee)
      : "",
  houseNo: "",
  street: "",
  city: "",
  town: "",
  state: "",
  pinCode: "",
  nationality: "Indian",
  languagesAtHome: "",
  caste: "",
  religion: "",
  emergencyFatherNo: "",
  emergencyMotherNo: "",
  emergencyGuardianNo: "",
});
