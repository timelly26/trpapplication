'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import HomeworkHeader from './HomeworkHeader';
import HomeworkStats from './HomeworkStats';
import HomeworkFilters from './HomeworkFilters';
import HomeworkCard from './HomeworkCard';
import Spinner from '../../common/Spinner';

interface Homework {
  id: string;
  title: string;
  subject: string;
  description: string;
  teacher: {
    name: string;
  };
  dueDate: string | null;
  assignedDate: string | null;
  hasSubmitted?: boolean;
  submission?: {
    id: string;
    fileUrl: string | null;
    submittedAt: string;
  } | null;
}

export default function Page() {
  const { data: session } = useSession();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('All Subjects');
  const [status, setStatus] = useState('All');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('Student');

  const fetchStudentName = useCallback(async () => {
    if (!session?.user) return;
    
    const studentId = (session.user as { studentId?: string | null })?.studentId;
    if (!studentId) {
      if (session.user.name) {
        setStudentName(session.user.name);
      }
      return;
    }

    try {
      const res = await fetch(`/api/student/${studentId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.student?.user?.name) {
          setStudentName(data.student.user.name);
        } else if (session.user.name) {
          setStudentName(session.user.name);
        }
      } else if (session.user.name) {
        setStudentName(session.user.name);
      }
    } catch {
      if (session.user.name) {
        setStudentName(session.user.name);
      }
    }
  }, [session]);

  const fetchHomeworks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (subject !== 'All Subjects') {
        params.append('subject', subject);
      }

      const res = await fetch(`/api/homework/list?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to fetch homework');
      }

      const data = await res.json();
      const fetchedHomeworks = data.homeworks || [];
      setHomeworks(fetchedHomeworks);
    } catch (err) {
      console.error('Error fetching homeworks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load homework');
    } finally {
      setLoading(false);
    }
  }, [subject]);

  useEffect(() => {
    if (session) {
      fetchStudentName();
      fetchHomeworks();
    }
  }, [session, fetchStudentName, fetchHomeworks]);

  const filteredHomeworks = useMemo(() => {
    return homeworks.filter((item) => {
      const subjectMatch =
        subject === 'All Subjects' || item.subject === subject;
      
      let statusMatch = true;
      if (status !== 'All') {
        const itemStatus = item.hasSubmitted
          ? 'Submitted'
          : item.dueDate && new Date(item.dueDate) < new Date()
          ? 'Late'
          : 'Pending';
        statusMatch = itemStatus === status;
      }
      
      return subjectMatch && statusMatch;
    });
  }, [subject, status, homeworks]);

  const total = homeworks.length;
  const pending = homeworks.filter((h) => {
    if (h.hasSubmitted) return false;
    if (h.dueDate) {
      try {
        const due = new Date(h.dueDate);
        const now = new Date();
        if (now > due) return false; // It's late, not pending
      } catch {
        // Invalid date, treat as pending
      }
    }
    return true;
  }).length;
  const submitted = homeworks.filter((h) => h.hasSubmitted).length;
  const completion = total > 0 ? Math.round((submitted / total) * 100) : 0;

  const availableSubjects = useMemo(() => {
    const subjects = new Set(homeworks.map((h) => h.subject));
    return Array.from(subjects).sort();
  }, [homeworks]);

  const handleUpload = async (homeworkId: string) => {
    const homework = homeworks.find((h) => h.id === homeworkId);
    if (!homework) return;

    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploadingId(homeworkId);
      try {
        // First upload the file
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'homework');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          throw new Error(uploadData.message || 'File upload failed');
        }
        const fileUrl = uploadData.url as string | undefined;
        if (!fileUrl) {
          throw new Error('File upload succeeded but no URL was returned');
        }

        // Then submit the homework
        const submitRes = await fetch('/api/homework/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            homeworkId,
            fileUrl,
          }),
        });

        if (!submitRes.ok) {
          const submitData = await submitRes.json().catch(() => ({}));
          throw new Error(submitData.message || 'Submission failed');
        }

        // Refresh the homework list
        await fetchHomeworks();
      } catch (err) {
        console.error('Error submitting homework:', err);
        alert(err instanceof Error ? err.message : 'Failed to submit homework');
      } finally {
        setUploadingId(null);
      }
    };

    input.click();
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <Spinner/>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="somu rounded-2xl p-7 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => fetchHomeworks()}
            className="mt-4 px-6 py-2 rounded-xl border border-lime-400 text-lime-300 hover:bg-lime-400/10 transition"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen space-y-8 text-white">
      <HomeworkHeader studentName={studentName} />

      <HomeworkStats
        total={total}
        pending={pending}
        submitted={submitted}
        completion={completion}
      />

      <HomeworkFilters
        subject={subject}
        status={status}
        onSubjectChange={setSubject}
        onStatusChange={setStatus}
        filteredCount={filteredHomeworks.length}
        availableSubjects={availableSubjects}
      />

      <div className="space-y-6">
        {filteredHomeworks.length === 0 ? (
          <div className="somu rounded-2xl p-7 text-center">
            <p className="text-white/70">No homework found</p>
          </div>
        ) : (
          filteredHomeworks.map((homework) => (
            <HomeworkCard
              key={homework.id}
              homework={homework}
              onUpload={handleUpload}
              isUploading={uploadingId === homework.id}
            />
          ))
        )}
      </div>

      <style jsx>{`
        .card {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          transition: 0.3s ease;
        }

        .card:hover {
          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        .statCard {
          padding: 24px;
        }

        .icon {
          height: 24px;
          width: 24px;
        }

        .statValue {
          margin-top: 16px;
          font-size: 28px;
          font-weight: 700;
        }

        .statLabel {
          margin-top: 4px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </main>
  );
}
