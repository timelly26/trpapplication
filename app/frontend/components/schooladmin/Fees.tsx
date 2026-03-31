"use client";

import { useEffect, useState } from "react";
import PageHeader from "../common/PageHeader";
import FeeStatCards from "./fees/FeeStatCards";
import OfflinePaymentForm from "./fees/OfflinePaymentForm";
import AddExtraFeeForm from "./fees/AddExtraFeeForm";
import ExtraFeesList from "./fees/ExtraFeesList";
import FeeStructureConfig from "./fees/FeeStructureConfig";
import FeeRecordsTable from "./fees/FeeRecordsTable";
import FeeTransactionsList from "./fees/FeeTransactionsList";
import type { Class, Student, FeeSummary, FeeRecord, FeeStructure, ExtraFee } from "./fees/types";
import Spinner from "../common/Spinner";

export default function FeesTab() {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [stats, setStats] = useState<FeeSummary | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [extraFees, setExtraFees] = useState<ExtraFee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, clsRes, stuRes, structRes, extraRes] = await Promise.all([
        fetch("/api/fees/summary"),
        fetch("/api/class/list"),
        fetch("/api/student/list"),
        fetch("/api/fees/structure"),
        fetch("/api/fees/extra"),
      ]);
      const [sumData, clsData, stuData, structData, extraData] = await Promise.all([
        sumRes.json(),
        clsRes.json(),
        stuRes.json(),
        structRes.json(),
        extraRes.json(),
      ]);

      if (sumRes.ok) {
        setFees(sumData.fees || []);
        setStats(sumData.stats || null);
      }
      if (clsRes.ok) setClasses(clsData.classes || []);
      if (stuRes.ok) setStudents(stuData.students || []);
      if (structRes.ok) setStructures(structData.structures || []);
      if (extraRes.ok) setExtraFees(Array.isArray(extraData?.extraFees) ? extraData.extraFees : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Spinner/>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden text-white">
      <div className="w-full space-y-4 px-3 pb-6 sm:space-y-6 sm:px-4 md:px-6">
        <PageHeader
          title="Fees Management"
          subtitle="Track and manage student fee payments with detailed breakdowns"
        />

        <FeeStatCards stats={stats} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
          <OfflinePaymentForm
            classes={classes}
            structures={structures}
            extraFees={extraFees}
            students={students}
            onSuccess={fetchData}
          />
          <AddExtraFeeForm classes={classes} students={students} onSuccess={fetchData} />
        </div>

        <FeeStructureConfig
          classes={classes}
          structures={structures}
          onSuccess={fetchData}
        />

        <ExtraFeesList
          extraFees={extraFees}
          classes={classes}
          students={students}
          onSuccess={fetchData}
        />

        <FeeTransactionsList students={students} onSuccess={fetchData} />

        <FeeRecordsTable fees={fees} classes={classes} />
      </div>
    </div>
  );
}
