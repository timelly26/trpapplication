import { IStudent } from "../../../interfaces/student";

export type ClassItem = {
  id: string;
  name: string;
  section?: string | null;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type StudentFormState = {
  name: string;
  rollNo: string;
  gender: string;
  dob: string;
  previousSchool: string;
  previousSchoolAddress: string;
  classId: string;
  section: string;
  status: string;
  fatherName: string;
  motherName: string;
  occupation: string;
  officeAddress: string;
  phoneNo: string;
  email: string;
  aadhaarNo: string;
  parentAadharNo: string;
  parentWhatsapp: string;
  bankAccountNo: string;
  totalFee: string;
  discountPercent: string;
  address: string;
  houseNo: string;
  street: string;
  city: string;
  town: string;
  state: string;
  pinCode: string;
  firstLanguage: string;
  nationality: string;
  languagesAtHome: string;
  caste: string;
  religion: string;
  emergencyFatherNo: string;
  emergencyMotherNo: string;
  emergencyGuardianNo: string;
};

export type StudentFormErrors = Partial<Record<keyof StudentFormState, string>>;

export type StudentRow = IStudent;
