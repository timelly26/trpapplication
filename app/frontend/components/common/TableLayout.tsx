"use client";

import { ReactNode, memo } from "react";
import { Column } from "../../types/superadmin";
import Spinner from "./Spinner";

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: (row: T, index: number) => string | number;
  caption?: string;
  tableTitle?: string;
  tableSubtitle?: string;
  showMobile?: boolean;
  container?: boolean;
  rounded?: boolean;
  containerClassName?: string;
  tableClassName?: string;
  theadClassName?: string;
  thClassName?: string;
  tbodyClassName?: string;
  rowClassName?: string;
  tdClassName?: string;
  pagination?: {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
  };
};

const ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyText = "No data found",
  rowKey,
  caption,
  tableTitle,
  tableSubtitle,
  showMobile = true,
  container = true,
  rounded = true,
  containerClassName = "",
  tableClassName = "",
  theadClassName = "",
  thClassName = "",
  tbodyClassName = "",
  rowClassName = "",
  tdClassName = "",
  pagination,
}: DataTableProps<T>) {
  const canPaginate =
    Boolean(pagination) &&
    (pagination?.totalPages ?? 1) > 1 &&
    !loading &&
    data.length > 0;

  const handlePrev = () => {
    if (!pagination) return;
    pagination.onChange(Math.max(1, pagination.page - 1));
  };

  const handleNext = () => {
    if (!pagination) return;
    pagination.onChange(Math.min(pagination.totalPages, pagination.page + 1));
  };

  const getKey = (row: T, index: number) => {
    if (rowKey) return rowKey(row, index);
    if ((row as any)?.id) return (row as any).id;
    return `row-${index}`;
  };

  const renderCell = (col: Column<T>, row: T, rowIndex: number) => {
    if (col.render) return col.render(row, rowIndex);
    const value = row[col.accessor as keyof T];
    return value as ReactNode;
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={`block ${
          container
            ? `
              ${rounded ? "rounded-3xl" : "rounded-none"}
              overflow-hidden
              border border-white/10
              bg-transparent backdrop-blur-xl shadow-2xl
            `
            : "w-full"
        } ${containerClassName}`}
      >
        {tableTitle && (
          <div className="p-4 lg:p-5 border-b border-white/10">
            <div className="text-base lg:text-lg font-semibold text-white">
              {tableTitle}
            </div>
            {tableSubtitle && (
              <div className="text-xs text-white/60 mt-1">
                {tableSubtitle}
              </div>
            )}
          </div>
        )}

        {/* 🔥 FIXED TABLE WRAPPER */}
        <div className="w-full overflow-x-auto">
          <table
            className={`w-full table-fixed text-sm border-collapse ${tableClassName}`}
            aria-busy={loading}
          >
            {caption && <caption className="sr-only">{caption}</caption>}

            <thead
              className={`bg-white/5 border-b border-white/10 ${theadClassName}`}
            >
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={`px-3 md:px-4 lg:px-6 py-3 md:py-4 text-[11px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider ${
                      ALIGN_CLASS[col.align ?? "left"]
                    } ${thClassName}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody
              className={`divide-y divide-white/10 ${tbodyClassName}`}
            >
              {loading && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-white/60"
                  >
                    <Spinner size={26} label="Loading..." />
                  </td>
                </tr>
              )}

              {!loading && data.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-white/60"
                  >
                    {emptyText}
                  </td>
                </tr>
              )}

              {!loading &&
                data.map((row, rowIndex) => (
                  <tr
                    key={getKey(row, rowIndex)}
                    className={`hover:bg-white/5 transition-colors duration-200 ${rowClassName}`}
                  >
                    {columns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-3 md:px-4 lg:px-6 py-3 md:py-4 text-sm text-white truncate ${
                          ALIGN_CLASS[col.align ?? "left"]
                        } ${tdClassName}`}
                      >
                        {renderCell(col, row, rowIndex)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {canPaginate && pagination && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-xs text-white/60">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={pagination.page <= 1}
              className="rounded-full px-4 py-2 text-xs font-semibold border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-full px-4 py-2 text-xs font-semibold border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(DataTable) as typeof DataTable;
