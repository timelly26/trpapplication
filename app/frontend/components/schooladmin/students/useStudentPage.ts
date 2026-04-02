"use client";

import { useEffect, useMemo, useState } from "react";
import { useStudents } from "../../../hooks/useStudents";
import { addStudent, assignStudentsToClass, updateStudent, deleteStudent as deleteStudentApi } from "../../../services/student.service";
import { toast } from "../../../services/toast.service";
import {
  ClassItem,
  SelectOption,
  StudentFormErrors,
  StudentFormState,
  StudentRow,
} from "./types";
import { toStudentForm } from "./utils";

type Props = {
  classes?: ClassItem[];
  reload?: () => void;
};

type ClassesListResponse = {
  classes: ClassItem[];
};

type StudentsListResponse = {
  students: StudentRow[];
};

let classesCache: ClassItem[] | null = null;
let classesPromise: Promise<ClassItem[] | null> | null = null;

const preloadClasses = () => {
  if (classesCache) return Promise.resolve(classesCache);
  if (classesPromise) return classesPromise;

  classesPromise = fetch("/api/class/list", { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return null;
      const data: ClassesListResponse = await res.json();
      classesCache = data.classes || [];
      return classesCache;
    })
    .catch(() => null)
    .finally(() => {
      classesPromise = null;
    });

  return classesPromise;
};

void preloadClasses();

const DEFAULT_FORM: StudentFormState = {
  name: "",
  rollNo: "",
  gender: "",
  dob: "",
  classId: "",
  section: "",
  status: "Active",
  fatherName: "",
  motherName: "",
  occupation: "",
  officeAddress: "",
  phoneNo: "",
  email: "",
  address: "",
  aadhaarNo: "",
  parentWhatsapp: "",
  bankAccountNo: "",
  totalFee: "",
  discountPercent: "",
  applicationFee: "",
  admissionFee: "",
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
};

const validateForm = (
  form: StudentFormState,
  options: { requireFees: boolean; requireAadhaar: boolean; requirePhone: boolean }
): StudentFormErrors => {
  const newErrors: StudentFormErrors = {};

  if (!form.name.trim() || form.name.length < 2) {
    newErrors.name = "Student name must be at least 2 characters";
  }

  if (!form.fatherName.trim() || form.fatherName.length < 2) {
    newErrors.fatherName = "Parent name must be at least 2 characters";
  }

  if (options.requireAadhaar && !/^\d{12}$/.test(form.aadhaarNo)) {
    newErrors.aadhaarNo = "Aadhaar number must be exactly 12 digits";
  }

  if (options.requirePhone && !/^\d{10}$/.test(form.phoneNo)) {
    newErrors.phoneNo = "Phone number must be exactly 10 digits";
  }

  if (!form.dob || new Date(form.dob) >= new Date()) {
    newErrors.dob = "Please enter a valid date of birth";
  }

  if (options.requireFees) {
    if (!form.totalFee || Number(form.totalFee) <= 0) {
      newErrors.totalFee = "Total fee must be a positive number";
    }

    if (
      form.discountPercent &&
      (Number(form.discountPercent) < 0 || Number(form.discountPercent) > 100)
    ) {
      newErrors.discountPercent = "Discount must be between 0 and 100";
    }
  }

  if (form.address && form.address.length < 5) {
    newErrors.address = "Address must be at least 5 characters";
  }

  return newErrors;
};

export default function useStudentPage({ classes = [], reload }: Props) {
  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>(
    classes.length ? classes : classesCache ?? []
  );
  const [classesLoading, setClassesLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<StudentFormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<StudentFormErrors>({});
  const [saving, setSaving] = useState(false);

  const selectedClassIdForFetch = useMemo(() => {
    if (!selectedClass || !selectedSection) return "";
    const match = availableClasses.find(
      (item) => item.name === selectedClass && item.section === selectedSection
    );
    return match?.id ?? "";
  }, [availableClasses, selectedClass, selectedSection]);

  const { students, loading, refresh } = useStudents(selectedClassIdForFetch);
  const [allStudents, setAllStudents] = useState<StudentRow[]>([]);
  const [allLoading, setAllLoading] = useState(false);

  const [viewStudent, setViewStudent] = useState<StudentRow | null>(null);
  const [editStudent, setEditStudent] = useState<StudentRow | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<StudentRow | null>(null);
  const [editForm, setEditForm] = useState<StudentFormState>(DEFAULT_FORM);
  const [editErrors, setEditErrors] = useState<StudentFormErrors>({});
  const [editSaving, setEditSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (classes && classes.length) {
      setAvailableClasses(classes);
    }
  }, [classes]);

  useEffect(() => {
    if (classes && classes.length) return;

    if (classesCache?.length) {
      setAvailableClasses(classesCache);
      return;
    }

    let active = true;
    setClassesLoading(true);
    preloadClasses()
      .then((data) => {
        if (!active || !data) return;
        setAvailableClasses(data);
      })
      .finally(() => {
        if (active) setClassesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [classes]);

  useEffect(() => {
    if (!form.classId && selectedClassIdForFetch) {
      setForm((prev) => ({ ...prev, classId: selectedClassIdForFetch }));
    }
  }, [selectedClassIdForFetch, form.classId]);

  useEffect(() => {
    if (!selectedSection) return;
    const sectionExists = availableClasses.some(
      (item) =>
        item.section === selectedSection &&
        (!selectedClass || item.name === selectedClass)
    );
    if (!sectionExists) {
      setSelectedSection("");
    }
  }, [availableClasses, selectedClass, selectedSection]);

  const fetchAllStudents = async () => {
    setAllLoading(true);
    try {
      const res = await fetch("/api/student/list");
      const data: StudentsListResponse = await res.json();
      if (!res.ok) return;
      setAllStudents(data.students || []);
    } catch {
      // ignore
    } finally {
      setAllLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedClassIdForFetch) {
      fetchAllStudents();
    }
  }, [selectedClassIdForFetch]);

  const filterClassOptions = useMemo<SelectOption[]>(() => {
    const uniqueNames = Array.from(
      new Set(availableClasses.map((item) => item.name).filter(Boolean))
    ) as string[];
    return [
      { label: "All Classes", value: "" },
      ...uniqueNames.map((name) => ({ label: name, value: name })),
    ];
  }, [availableClasses]);

  const filterSectionOptions = useMemo<SelectOption[]>(() => {
    const sections = Array.from(
      new Set(
        availableClasses
          .filter((item) => !selectedClass || item.name === selectedClass)
          .map((item) => item.section)
          .filter(Boolean)
      )
    ) as string[];
    return [
      { label: "All Sections", value: "" },
      ...sections.map((section) => ({ label: section, value: section })),
    ];
  }, [availableClasses, selectedClass]);

  const formClassOptions = useMemo<SelectOption[]>(() => {
    if (classesLoading) {
      return [{ label: "Loading classes...", value: "" }];
    }
    if (!availableClasses.length) {
      return [{ label: "No classes found", value: "" }];
    }
    return [
      { label: "Select Class", value: "" },
      ...availableClasses.map((item) => ({
        label: `${item.name}${item.section ? ` - ${item.section}` : ""}`,
        value: item.id,
      })),
    ];
  }, [availableClasses, classesLoading]);

  const formSectionOptions = useMemo<SelectOption[]>(() => {
    const sections = Array.from(
      new Set(availableClasses.map((item) => item.section).filter(Boolean))
    ) as string[];
    if (classesLoading) {
      return [{ label: "Loading sections...", value: "" }];
    }
    if (!sections.length) {
      return [{ label: "No sections found", value: "" }];
    }
    return [
      { label: "Select Section", value: "" },
      ...sections.map((section) => ({ label: section, value: section })),
    ];
  }, [availableClasses, classesLoading]);

  const filteredStudents = useMemo<StudentRow[]>(() => {
    let list: StudentRow[] = selectedClassIdForFetch ? students : allStudents;
    if (selectedClass) {
      list = list.filter((student) => student.class?.name === selectedClass);
    }
    if (selectedSection) {
      list = list.filter((student) => student.class?.section === selectedSection);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter((student) => {
        const name = student.user?.name || student.name || "";
        const email = student.user?.email || student.email || "";
        const roll = student.rollNo || "";
        const phone = student.phoneNo || "";
        return (
          name.toLowerCase().includes(query) ||
          email.toLowerCase().includes(query) ||
          roll.toLowerCase().includes(query) ||
          phone.toLowerCase().includes(query)
        );
      });
    }
    return list;
  }, [
    allStudents,
    searchQuery,
    selectedClass,
    selectedSection,
    selectedClassIdForFetch,
    students,
  ]);

  const selectedClassObj = availableClasses.find(
    (item) =>
      item.name === selectedClass &&
      (!selectedSection || item.section === selectedSection)
  );

  const handleFormChange = (key: keyof StudentFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };


  const handleEditChange = (key: keyof StudentFormState, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
    setEditErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSaveStudent = async () => {
    const nextErrors = validateForm(form, {
      requireFees: true,
      requireAadhaar: true,
      requirePhone: true,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!form.classId) {
      toast.error("Please select a class for this student");
      return;
    }

    try {
      setSaving(true);
      const res: Response = await addStudent({
        name: form.name,
        fatherName: form.fatherName,
        motherName: form.motherName,
        occupation: form.occupation,
        aadhaarNo: form.aadhaarNo,
        phoneNo: form.phoneNo,
        dob: form.dob,
        classId: form.classId,
        address: form.address?.trim() || undefined,
        totalFee: Number(form.totalFee),
        discountPercent: form.discountPercent
          ? Number(form.discountPercent)
          : 0,
        applicationFee: form.applicationFee.trim()
          ? Number(form.applicationFee)
          : null,
        admissionFee: form.admissionFee.trim() ? Number(form.admissionFee) : null,
        rollNo: form.rollNo?.trim() || undefined,
        gender: form.gender?.trim() || undefined,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to add student");
        return;
      }

      // Student is already created with classId in the create API, so no need for separate assignment
      toast.success("Student added successfully");
      setShowSuccess(true);
      setForm({ ...DEFAULT_FORM, classId: form.classId });
      setShowAddForm(false);
      refresh();
      if (!selectedClass) {
        fetchAllStudents();
      }
      reload?.();
    } catch (e) {
      // api() already shows toast with server message on 4xx/5xx; only show generic on network/unknown errors
      if (!(e instanceof Error) || !e.message) {
        toast.error("Something went wrong while adding student");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    setForm({ ...DEFAULT_FORM });
    setErrors({});
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      const message = "Please select an Excel file";
      toast.error(message);
      throw new Error(message);
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", uploadFile);

      const uploadRes = await fetch("/api/student/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        const message = uploadData.message || "Upload failed";
        toast.error(message);
        throw new Error(message);
      }

      toast.success(
        `${uploadData.createdCount || 0} students added successfully`
      );
      setUploadFile(null);
      refresh();
      if (!selectedClass) {
        fetchAllStudents();
      }
      reload?.();
      return {
        createdCount: uploadData.createdCount || 0,
        failedCount: uploadData.failedCount || 0,
      };
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }
      throw new Error("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const openView = (student: StudentRow) => setViewStudent(student);

  const openEdit = (student: StudentRow) => {
    setShowAddForm(false);
    setShowUploadPanel(false);
    setEditStudent(student);
    setEditForm(toStudentForm(student));
    setEditErrors({});
  };

  const openDelete = (student: StudentRow) => setDeleteStudent(student);

  const closeView = () => setViewStudent(null);
  const closeEdit = () => setEditStudent(null);
  const closeDelete = () => setDeleteStudent(null);

  const handleEditSave = async () => {
    if (!editStudent) return;
    const nextErrors = validateForm(editForm, {
      requireFees: false,
      requireAadhaar: false,
      requirePhone: false,
    });
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setEditSaving(true);
    try {
      const res = await updateStudent(editStudent.id, {
        name: editForm.name.trim(),
        fatherName: editForm.fatherName.trim(),
        motherName: editForm.motherName.trim() || undefined,
        occupation: editForm.occupation.trim() || undefined,
        classId: editForm.classId || undefined,
        rollNo: editForm.rollNo.trim() || undefined,
        phoneNo: editForm.phoneNo.trim() || undefined,
        address: editForm.address.trim() || undefined,
        gender: editForm.gender.trim() || undefined,
        applicationFee: editForm.applicationFee.trim()
          ? Number(editForm.applicationFee)
          : null,
        admissionFee: editForm.admissionFee.trim() ? Number(editForm.admissionFee) : null,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to update student");
        return;
      }
      toast.success("Student updated successfully");
      closeEdit();
      refresh();
      if (!selectedClassIdForFetch) fetchAllStudents();
      reload?.();
    } catch {
      toast.error("Failed to update student");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteStudent) return;
    const student = deleteStudent;
    try {
      const res = await deleteStudentApi(student.id);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to delete student");
        return;
      }
      toast.success("Student deleted successfully");
      closeDelete();
      refresh();
      if (!selectedClassIdForFetch) fetchAllStudents();
      reload?.();
    } catch {
      toast.error("Failed to delete student");
    }
  };

  const handleDownloadReport = () => {
    toast.info("Downloading report...");
  };

  return {
    filterClassOptions,
    filterSectionOptions,
    formClassOptions,
    formSectionOptions,
    classesLoading,
    selectedClass,
    setSelectedClass,
    selectedSection,
    setSelectedSection,
    searchQuery,
    setSearchQuery,
    showAddForm,
    setShowAddForm,
    showUploadPanel,
    setShowUploadPanel,
    uploadFile,
    setUploadFile,
    uploading,
    handleUpload,
    form,
    errors,
    saving,
    handleFormChange,
    handleResetForm,
    handleSaveStudent,
    filteredStudents,
    tableLoading: selectedClass ? loading : allLoading,
    selectedClassObj,
    viewStudent,
    editStudent,
    deleteStudent,
    editForm,
    editErrors,
    editSaving,
    handleEditChange,
    openView,
    openEdit,
    openDelete,
    closeView,
    closeEdit,
    closeDelete,
    handleEditSave,
    handleDelete,
    handleDownloadReport,
    showSuccess,
    setShowSuccess,
  };
}
