"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Eye, Pencil, Trash2, Download, UserCheck,
  Coffee, Clock, XCircle, Search, Save, Calendar
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import PageHeader from "../common/PageHeader";
import StatCard from "../common/statCard";
import DataTable from "../common/TableLayout";
import TeacherStatCard from "./teachersTab/teacherStatCard";
import AppointTeacher from "./teachersTab/AppointTeacher";
import TeachersList, { TeacherRow } from "./teachersTab/TeachersList";
import EditTeacher from "./teachersTab/EditTeacher";
import Spinner from "../common/Spinner";

const DEFAULT_AVATAR = "https://randomuser.me/api/portraits/lego/1.jpg";
const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "ON_LEAVE"] as const;
type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

/* ================= Types ================= */

/* ================= Mobile Card Component ================= */

const MobileTeacherCard = ({ teacher, onEdit, onDelete }: {
  teacher: TeacherRow;
  onEdit: (t: TeacherRow) => void;
  onDelete: (id: string) => void;
}) => (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-5 space-y-4 shadow-xl">
    <div className="flex items-center gap-4">
      <img src={teacher.avatar} alt="" className="w-14 h-14 rounded-2xl border border-white/10 object-cover" />
      <div className="flex-1">
        <h4 className="font-bold text-gray-100 text-lg leading-tight">{teacher.name}</h4>
        <p className="text-xs text-gray-500 font-mono">{teacher.teacherId}</p>
        <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-[10px] font-bold border ${teacher.status === "Active" ? "bg-lime-400/10 text-lime-400 border-lime-400/20" : "bg-orange-400/10 text-orange-400 border-orange-400/20"
          }`}>
          {teacher.status.toUpperCase()}
        </span>
      </div>
    </div>

    <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Subject</p>
      <p className="text-gray-200 font-medium">{teacher.subject}</p>
    </div>

    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex justify-between items-center">
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Attendance</p>
        <p className="text-lime-400 font-bold">{teacher.attendance}% Present</p>
      </div>
      <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-lime-400" style={{ width: `${teacher.attendance}%` }} />
      </div>
    </div>

    <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Phone</p>
      <p className="text-gray-200 font-medium">{teacher.phone}</p>
    </div>


    <div className="flex gap-2 pt-2">
      <button className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-gray-300 transition-colors">
        <Eye size={18} /> View
      </button>
      <button
        onClick={() => onEdit(teacher)}
        className="flex-[1.5] bg-white/5 hover:bg-lime-400/10 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-lime-400 transition-colors border border-white/5"
      >
        <Pencil size={18} /> Edit
      </button>
      <button
        onClick={() => onDelete(teacher.id)}
        className="bg-red-500/10 hover:bg-red-500/20 p-3 rounded-xl text-red-400 transition-colors border border-red-500/20"
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>
);

/* ================= Main Component ================= */

const todayStr = () => new Date().toISOString().slice(0, 10);

const SchoolAdminTeacherTab = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(todayStr);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [saveAttendanceLoading, setSaveAttendanceLoading] = useState(false);

  const loadTeachers = useCallback(async () => {
    setTeachersLoading(true);
    try {
      const res = await fetch("/api/teacher/list", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) return;
      const list: TeacherRow[] = (data.teachers || []).map((t: { id: string; name: string | null; email: string | null; mobile: string | null; teacherId: string | null; subject: string | null; photoUrl: string | null }) => ({
        id: t.id,
        teacherId: t.teacherId || t.id.slice(0, 6).toUpperCase(),
        name: t.name || "Teacher",
        avatar: t.photoUrl || DEFAULT_AVATAR,
        subject: t.subject || "-",
        attendance: 0,
        phone: t.mobile || "-",
        status: "Active" as const,
      }));
      setTeachers(list);
    } finally {
      setTeachersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  const loadAttendanceForDate = useCallback(async () => {
    if (!attendanceDate) return;
    setAttendanceLoading(true);
    try {
      const r = await fetch(`/api/teacher/attendance?date=${attendanceDate}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await r.json();
      const map: Record<string, AttendanceStatus> = {};
      (data.attendances || []).forEach((a: { teacherId: string; status: string }) => {
        if (ATTENDANCE_STATUSES.includes(a.status as AttendanceStatus)) {
          map[a.teacherId] = a.status as AttendanceStatus;
        }
      });
      setAttendanceMap(map);
    } catch {
      setAttendanceMap({});
    } finally {
      setAttendanceLoading(false);
    }
  }, [attendanceDate]);

  useEffect(() => {
    void loadAttendanceForDate();
  }, [loadAttendanceForDate]);

  const teachersWithAttendance = useMemo(() => {
    return teachers.map((t) => {
      const status = attendanceMap[t.id] || "PRESENT";
      const isPresent = status === "PRESENT" || status === "LATE";
      return {
        ...t,
        attendance: isPresent ? 100 : status === "ON_LEAVE" ? 0 : 0,
        status: (status === "ON_LEAVE" ? "On Leave" : "Active") as "Active" | "On Leave",
      };
    });
  }, [teachers, attendanceMap]);

  const filteredTeachers = useMemo(() => {
    return teachersWithAttendance.filter((t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.teacherId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, teachersWithAttendance]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, teachersWithAttendance.length]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedTeachers = useMemo(
    () => filteredTeachers.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredTeachers, safePage]
  );

  const handleDelete = (id: string) => {
    if (confirm("Do you really want to remove this teacher from the list? Contact admin for permanent removal. This action cannot be undone.")) {
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleEditTeacher = (teacher: TeacherRow) => {
    setEditingTeacher(teacher);
  };

  const handleSaveTeacher = (updatedTeacher: TeacherRow) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === updatedTeacher.id ? { ...t, ...updatedTeacher } : t))
    );
  };

  const setTeacherAttendance = (teacherId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [teacherId]: status }));
  };

  const markAllPresent = () => {
    const next: Record<string, AttendanceStatus> = {};
    teachers.forEach((t) => { next[t.id] = "PRESENT"; });
    setAttendanceMap(next);
  };

  const saveAttendance = async () => {
    setSaveAttendanceLoading(true);
    try {
      const attendances = teachers.map((t) => ({
        teacherId: t.id,
        status: attendanceMap[t.id] || "PRESENT",
      }));
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date: attendanceDate, attendances }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      await loadAttendanceForDate();
      try {
        router.refresh();
      } catch {
        /* noop */
      }
      if (typeof window !== "undefined") window.alert("Attendance saved successfully.");
    } catch (e) {
      if (typeof window !== "undefined") window.alert(e instanceof Error ? e.message : "Failed to save attendance.");
    } finally {
      setSaveAttendanceLoading(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === "PRESENT" || s === "LATE").length;
  const onLeaveCount = Object.values(attendanceMap).filter((s) => s === "ON_LEAVE").length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === "LATE").length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === "ABSENT").length;
  const overallPct = teachers.length ? Math.round((presentCount / teachers.length) * 100) : 0;

  const [pdfLoading, setPdfLoading] = useState(false);

  const toLocalDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const downloadReportAsPdf = async () => {
    setPdfLoading(true);
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const dates: string[] = [];
      for (let d = new Date(startOfMonth); d.getTime() <= today.getTime(); d.setDate(d.getDate() + 1)) {
        dates.push(toLocalDateStr(d));
      }
      if (dates.length === 0) {
        dates.push(toLocalDateStr(today));
      }
      const periodStart = dates[0];
      const periodEnd = dates[dates.length - 1];

      const allAttendances = await Promise.all(
        dates.map((date) =>
          fetch(`/api/teacher/attendance?date=${date}`, { credentials: "include" }).then((r) => r.json())
        )
      );
      const byDate: Record<string, Record<string, string>> = {};
      dates.forEach((date, i) => {
        byDate[date] = {};
        (allAttendances[i]?.attendances || []).forEach((a: { teacherId: string; status: string }) => {
          byDate[date][a.teacherId] = a.status || "PRESENT";
        });
      });

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const isLandscape = dates.length > 14;
      const pageWidth = isLandscape ? 842 : 595;
      const pageHeight = isLandscape ? 595 : 842;
      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - 50;

      const drawText = (text: string, x: number, size: number, useBold: boolean) => {
        currentPage.drawText(text, {
          x,
          y,
          size,
          font: useBold ? boldFont : font,
          color: rgb(0.1, 0.1, 0.1),
        });
      };

      drawText("Teacher Attendance Report", 50, 18, true);
      y -= 22;
      drawText(`Period: ${periodStart} to ${periodEnd} (all days)`, 50, 11, false);
      y -= 28;

      const dayColWidth = dates.length > 20 ? 18 : 22;
      const colWidths = [52, 80, 50, 48, ...dates.map(() => dayColWidth)];
      const headers = ["ID", "Name", "Subject", "Phone", ...dates.map((d) => d.slice(8))];
      const rowHeight = 16;

      headers.forEach((h, i) => {
        const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        drawText(h.slice(0, 8), x, 8, true);
      });
      y -= rowHeight;

      for (const t of teachersWithAttendance) {
        if (y < 50) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - 40;
        }
        const dayStatuses = dates.map((date) => {
          const s = byDate[date]?.[t.id] || "-";
          return s === "PRESENT" ? "P" : s === "ABSENT" ? "A" : s === "LATE" ? "L" : s === "ON_LEAVE" ? "OL" : s;
        });
        const row = [
          t.teacherId.slice(0, 6),
          t.name.slice(0, 10),
          t.subject.slice(0, 6),
          t.phone.slice(0, 8),
          ...dayStatuses,
        ];
        row.forEach((cell, i) => {
          const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          drawText(String(cell).slice(0, 8), x, 7, false);
        });
        y -= rowHeight;
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `teacher-attendance-${periodStart}-to-${periodEnd}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Failed to generate PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  const teacherColumns = [
    { key: "teacherId", header: "TEACHER ID",
      render: (row: TeacherRow) => (
        <div className="flex items-center gap-3 min-w-[120px]">
          
          <span className="font-bold text-sm">{row.teacherId}</span>
        </div>
      ),
     },
    { 
      key: "name", 
      header: "NAME",
      render: (row: TeacherRow) => (
        <div className="flex items-center gap-3">
          <img src={row.avatar} alt="" className="w-10 h-10 rounded-xl border border-white/10" />
          <span className="font-medium">{row.name}</span>
        </div>
      )
    },
    { key: "subject", header: "SUBJECT",
      render: (row: TeacherRow) => (
        <div className="flex items-center gap-3 min-w-[120px]">
          
          <span className="text-white/50  text-sm">{row.subject}</span>
        </div>
      ),
     },
    {
      key: "attendance",
      header: "ATTENDANCE",
      render: (row: TeacherRow) => (
        <div className="flex items-center gap-3 min-w-[120px]">
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]" style={{ width: `${row.attendance}%` }} />
          </div>
          <span className="text-lime-400 font-bold text-sm">{row.attendance}%</span>
        </div>
      ),
    },
    { key: "phone", header: "PHONE" },
    {
      key: "status",
      header: "STATUS",
      render: (row: TeacherRow) => (
        <span className={`px-4 py-1 rounded-full text-[10px] font-bold border ${row.status === "Active" ? "bg-lime-400/10 text-lime-400 border-lime-400/20" : "bg-orange-400/10 text-orange-400 border-orange-400/20"
          }`}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTIONS",
      render: (row: TeacherRow) => (
        <div className="flex items-center gap-2">
          <button type="button" className="p-1.5 text-gray-400 hover:text-white transition-colors" title="View"><Eye size={18} /></button>
          <button type="button" className="p-1.5 text-gray-400 hover:text-lime-400 transition-colors" title="Edit"><Pencil size={18} /></button>
          <button type="button" onClick={() => handleDelete(row.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={18} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-screen-2xl mx-auto space-y-4 sm:space-y-6 min-w-0 overflow-x-hidden px-2 sm:px-0 pb-20 lg:pb-0">

      <PageHeader
        title="Teachers"
        subtitle="Overview of teaching staff, attendance, and assignments"
        transparent
        rightSlot={
          <button
            type="button"
            onClick={downloadReportAsPdf}
            disabled={pdfLoading || teachers.length === 0}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium transition-all text-gray-300 disabled:opacity-50"
          >
            <Download size={16} /> {pdfLoading ? "Generating…" : "Download PDF"}
          </button>
        }
      />

      {/* ===== Stats Cards ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Present"
          value={<>{presentCount} <span className="text-sm text-lime-400">/ {teachers.length}</span></>}
          icon={<UserCheck size={70} className="text-white/30" />}
          iconVariant="plain"
        />
        <StatCard
          title="On Leave"
          value={<>{onLeaveCount} <span className="text-yellow-400 text-sm">Teacher{onLeaveCount !== 1 ? "s" : ""}</span></>}
          icon={<Coffee size={70} className="text-white/30" />}
          iconVariant="plain"
        />
        <StatCard
          title="Late Arrival"
          value={<>{lateCount} <span className="text-sky-400 text-sm">Teacher{lateCount !== 1 ? "s" : ""}</span></>}
          icon={<Clock size={70} className="text-white/30" />}
          iconVariant="plain"
        />
        <StatCard
          title="Absent"
          value={<>{absentCount} <span className="text-red-400 text-sm">Unplanned</span></>}
          icon={<XCircle size={70} className="text-white/30" />}
          iconVariant="plain"
        />
      </div>

      {/* Attendance Card */}
      <div className=" bg-white/[0.04]
  backdrop-blur-2xl
  rounded-3xl
  border border-white/10
  shadow-[0_20px_60px_rgba(0,0,0,0.45)]
  overflow-hidden">

        <div className="px-3 sm:px-4 md:p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <Calendar size={18} />
              Mark Daily Attendance
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {attendanceDate === todayStr() ? "Today" : "Selected date"}: {attendanceDate} • Overall: <span className="text-lime-400 font-semibold">{overallPct}%</span> ({presentCount}/{teachers.length})
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-lime-400/50"
            />
            <button
              type="button"
              onClick={markAllPresent}
              className="px-3 py-1.5 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 border border-lime-400/20 rounded-lg text-xs font-semibold flex items-center gap-2"
            >
              Mark All Present
            </button>
          </div>
        </div>

        <div className="p-4 md:p-5">
          {attendanceLoading ? (
            <div className="text-center py-8 text-gray-400"><Spinner/></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {teachers.map((t) => {
                const status = attendanceMap[t.id] || "PRESENT";
                return (
                  <TeacherStatCard
                    key={t.id}
                    avatar={t.avatar}
                    name={t.name}
                    code={t.teacherId}
                    percentage={status === "PRESENT" || status === "LATE" ? 100 : 0}
                    stats={[
                      { label: "PRES", value: status === "PRESENT" ? 1 : 0, color: "text-lime-400" },
                      { label: "ABS", value: status === "ABSENT" ? 1 : 0, color: "text-red-400" },
                      { label: "LATE", value: status === "LATE" ? 1 : 0, color: "text-sky-400" },
                      { label: "LEAVE", value: status === "ON_LEAVE" ? 1 : 0, color: "text-yellow-400" },
                    ]}
                    statuses={[
                      { label: "P", active: status === "PRESENT" },
                      { label: "A", active: status === "ABSENT" },
                      { label: "L", active: status === "LATE" },
                      { label: "OL", active: status === "ON_LEAVE" },
                    ]}
                    onStatusChange={(label) => {
                      const idx = ["P", "A", "L", "OL"].indexOf(label);
                      if (idx >= 0) setTeacherAttendance(t.id, ATTENDANCE_STATUSES[idx]);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t border-white/5 px-4 pb-4">
          <button
            type="button"
            onClick={saveAttendance}
            disabled={saveAttendanceLoading}
            className="px-6 py-2.5 bg-lime-400 hover:bg-lime-500 text-black font-bold rounded-xl shadow-[0_0_15px_rgba(163,230,53,0.3)] flex items-center gap-2 disabled:opacity-60"
          >
            <Save size={18} />
            {saveAttendanceLoading ? "Saving..." : "Save Today's Attendance"}
          </button>
        </div>

      </div>

      {/* Main Table & Mobile Card Section */}
      <div className="grid gap-10
      ">
      <div className="w-full min-w-0 overflow-hidden">
        <TeachersList
          teachersLoading={teachersLoading}
          filteredTeachers={filteredTeachers}
          pagedTeachers={pagedTeachers}
          attendanceDate={attendanceDate}
          overallPct={overallPct}
          presentCount={presentCount}
          teachersCount={teachers.length}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          page={safePage}
          totalPages={totalPages}
          setPage={setPage}
          onDelete={handleDelete}
          onEditTeacher={handleEditTeacher}
        />
      </div>

      {editingTeacher && (
        <EditTeacher
          teacher={editingTeacher}
          onClose={() => setEditingTeacher(null)}
          onSave={(t) => {
            handleSaveTeacher(t);
            setEditingTeacher(null);
            void loadTeachers();
            try {
              router.refresh();
            } catch {
              /* noop */
            }
          }}
        />
      )}


      {/* ================= Teachers List ================= */}

      <div className="w-full min-w-0">
        <AppointTeacher
          onRosterChange={() => {
            void loadTeachers();
            try {
              router.refresh();
            } catch {
              /* noop */
            }
          }}
        />
      </div>
      </div>
    </div>
  );
};
export default SchoolAdminTeacherTab;


