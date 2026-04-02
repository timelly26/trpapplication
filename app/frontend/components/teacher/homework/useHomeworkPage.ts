"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import type { HomeworkItem, ClassOption, HomeworkFilter } from "./types";

export default function useHomeworkPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<HomeworkFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingHomework, setEditingHomework] = useState<HomeworkItem | null>(null);

  const fetchData = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [hwRes, classRes] = await Promise.all([
        fetch("/api/homework/list", { credentials: "include" }),
        fetch("/api/class/list", { credentials: "include" }),
      ]);
      if (hwRes.ok) {
        const d = await hwRes.json();
        setHomeworks(d.homeworks ?? []);
      }
      
      if (classRes.ok) {
        const c = await classRes.json();
        setClasses(c.classes ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) void fetchData();
  }, [session]);

  const filteredHomeworks = useMemo(() => {
    let list = [...homeworks];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.subject.toLowerCase().includes(q) ||
          (h.class?.name && h.class.name.toLowerCase().includes(q))
      );
    }
    const now = new Date().toISOString();
    if (filter === "active") {
      list = list.filter((h) => h.dueDate && h.dueDate >= now);
    } else if (filter === "closed") {
      list = list.filter((h) => !h.dueDate || h.dueDate < now);
    }
    return list;
  }, [homeworks, searchQuery, filter]);

  const totalSubmissions = useMemo(
    () => homeworks.reduce((a, b) => a + (b._count?.submissions ?? 0), 0),
    [homeworks]
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Do you really want to delete this assignment? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/homework/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setHomeworks((prev) => prev.filter((h) => h.id !== id));
        if (expandedId === id) setExpandedId(null);
        await fetchData();
        try {
          router.refresh();
        } catch {
          /* noop */
        }
      } else {
        alert(d.message || "Delete failed");
      }
    } catch (e) {
      console.error(e);
      alert("Delete failed. Check your connection.");
    }
  };

  const handleEditClick = (h: HomeworkItem) => {
    setEditingHomework(h);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingHomework(null);
  };

  const handleSubmitSuccess = async (createdOrUpdated: HomeworkItem) => {
    if (editingHomework) {
      setHomeworks((prev) => prev.map((h) => (h.id === createdOrUpdated.id ? createdOrUpdated : h)));
    } else {
      setHomeworks((prev) => [createdOrUpdated, ...prev]);
    }
    setShowForm(false);
    setEditingHomework(null);
    await fetchData();
    try {
      router.refresh();
    } catch {
      /* noop */
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return {
    session,
    status,
    homeworks,
    filteredHomeworks,
    classes,
    loading,
    showForm,
    setShowForm,
    expandedId,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    editingHomework,
    totalSubmissions,
    fetchData,
    handleDelete,
    handleEditClick,
    handleFormClose,
    handleSubmitSuccess,
    toggleExpanded,
  };
}
