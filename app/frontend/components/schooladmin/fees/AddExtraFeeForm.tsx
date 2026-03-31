"use client";

import { useState } from "react";
import SelectInput from "../../common/SelectInput";
import PrimaryButton from "../../common/PrimaryButton";
import SecondaryButton from "../../common/SecondaryButton";
import type { Class, Student } from "./types";

interface AddExtraFeeFormProps {
  classes: Class[];
  students: Student[];
  onSuccess: () => void;
}

export default function AddExtraFeeForm({ classes, students, onSuccess }: AddExtraFeeFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [targetType, setTargetType] = useState<"SCHOOL" | "CLASS" | "SECTION" | "STUDENT">("SCHOOL");
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");
  const [studentId, setStudentId] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !amount || Number(amount) <= 0) {
      alert("Name and amount required");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        amount: Number(amount),
        targetType,
      };
      if (targetType === "CLASS") body.targetClassId = classId || undefined;
      // SCHOOL: no target fields, applies to all
      if (targetType === "SECTION") {
        body.targetClassId = classId;
        body.targetSection = section;
      }
      if (targetType === "STUDENT") body.targetStudentId = studentId || undefined;

      const res = await fetch("/api/fees/extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to add extra fee");
        return;
      }
      setShowForm(false);
      setName("");
      setAmount("");
      setClassId("");
      setSection("");
      setStudentId("");
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  const sections = Array.from(new Set(classes.map((c) => c.section).filter(Boolean))) as string[];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-6">
      <h3 className="text-lg font-semibold mb-4">Add Extra Fees</h3>
      <p className="text-sm text-gray-400 mb-4">
        Add uniform, bus, library, or any custom fee for the entire school or a particular class.
      </p>
      {!showForm ? (
        <SecondaryButton title="Add Extra Fee" onClick={() => setShowForm(true)} />
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/70 mb-1">Fee Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-white"
              placeholder="e.g. Uniform Fee, Bus Fee"
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-white"
              placeholder="0"
            />
          </div>
          <SelectInput
            label="Apply To"
            value={targetType}
            onChange={(v) => setTargetType(v as "SCHOOL" | "CLASS" | "SECTION" | "STUDENT")}
            options={[
              { label: "Entire School", value: "SCHOOL" },
              { label: "Particular Class", value: "CLASS" },
              { label: "Section", value: "SECTION" },
              { label: "Particular Student", value: "STUDENT" },
            ]}
          />
          {targetType === "CLASS" && (
            <SelectInput
              label="Class"
              value={classId}
              onChange={setClassId}
              options={[
                { label: "Select class", value: "" },
                ...classes.map((c) => ({
                  label: `${c.name}${c.section ? `-${c.section}` : ""}`,
                  value: c.id,
                })),
              ]}
            />
          )}
          {targetType === "SECTION" && (
            <>
              <SelectInput
                label="Class"
                value={classId}
                onChange={setClassId}
                options={[
                  { label: "Select class", value: "" },
                  ...classes.map((c) => ({
                    label: `${c.name}${c.section ? `-${c.section}` : ""}`,
                    value: c.id,
                  })),
                ]}
              />
              <SelectInput
                label="Section"
                value={section}
                onChange={setSection}
                options={[
                  { label: "Select section", value: "" },
                  ...sections.map((s) => ({ label: s, value: s })),
                ]}
              />
            </>
          )}
          {targetType === "STUDENT" && (
            <SelectInput
              label="Student"
              value={studentId}
              onChange={setStudentId}
              options={[
                { label: "Select student", value: "" },
                ...students.map((s) => ({
                  label: `${s.user.name || s.admissionNumber}`,
                  value: s.id,
                })),
              ]}
            />
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <PrimaryButton
              title={saving ? "Adding..." : "Add Fee"}
              loading={saving}
              onClick={handleSubmit}
            />
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-white/20 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
