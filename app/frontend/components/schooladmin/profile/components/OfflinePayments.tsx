"use client";

import { useState } from "react";
import { CreditCard, Plus, Check } from "lucide-react";

type Props = {
    studentId: string;
    studentName: string;
    remainingFee: number;
    onPaymentAdded?: () => void;
};

type OfflinePaymentMethod = "CASH" | "CHEQUE" | "BANK_TRANSFER" | "DD";

export const OfflinePayments = ({ studentId, studentName, remainingFee, onPaymentAdded }: Props) => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageTone, setMessageTone] = useState<"success" | "error">("success");

    const [formData, setFormData] = useState({
        method: "CASH" as OfflinePaymentMethod,
        amount: "",
        description: "",
        referenceNumber: "",
        bankName: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const amount = parseFloat(formData.amount);
            if (!amount || amount <= 0) {
                throw new Error("Please enter a valid amount");
            }

            if (amount > remainingFee) {
                throw new Error(`Amount exceeds remaining fee of ₹${remainingFee.toLocaleString("en-IN")}`);
            }

            if (formData.method === "CHEQUE" && !formData.referenceNumber) {
                throw new Error("Cheque number is required");
            }

            if (formData.method === "BANK_TRANSFER" && !formData.bankName) {
                throw new Error("Bank name is required");
            }

            const response = await fetch("/api/student/offline-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    studentId,
                    amount,
                    method: formData.method,
                    referenceNumber: formData.referenceNumber || null,
                    bankName: formData.bankName || null,
                    description: formData.description || null,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data?.message || "Failed to record payment");

            setMessageTone("success");
            setMessage("Offline payment recorded successfully!");
            setFormData({ method: "CASH", amount: "", description: "", referenceNumber: "", bankName: "" });
            setTimeout(() => {
                setShowModal(false);
                onPaymentAdded?.();
            }, 1500);
        } catch (error) {
            setMessageTone("error");
            setMessage(error instanceof Error ? error.message : "Failed to record payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400 flex-shrink-0" /> Offline Payments
                </h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 text-sm font-semibold flex items-center gap-2"
                >
                    <Plus size={16} />
                    Record Payment
                </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm">
                <p className="text-blue-300">
                    <span className="font-semibold">Remaining Fee:</span>{" "}
                    <span className="text-lg font-bold">₹{remainingFee.toLocaleString("en-IN")}</span>
                </p>
                <p className="text-blue-200/70 text-xs mt-2">
                    Record cash, cheque, bank transfer, or demand draft payments manually.
                </p>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#0B1220] border border-white/10 rounded-2xl p-6 space-y-4">
                        <h4 className="text-white font-semibold text-lg">Record Offline Payment</h4>
                        <p className="text-sm text-gray-400">Student: {studentName}</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-2">Payment Method</label>
                                <select
                                    value={formData.method}
                                    onChange={(e) => setFormData({ ...formData, method: e.target.value as OfflinePaymentMethod })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 text-sm outline-none focus:ring-1 focus:ring-blue-400/50"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="DD">Demand Draft (DD)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-2">Amount (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 text-sm outline-none focus:ring-1 focus:ring-blue-400/50"
                                    required
                                />
                            </div>

                            {formData.method === "CHEQUE" && (
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2">Cheque Number</label>
                                    <input
                                        type="text"
                                        value={formData.referenceNumber}
                                        onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                                        placeholder="e.g., 123456"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 text-sm outline-none focus:ring-1 focus:ring-blue-400/50"
                                        required
                                    />
                                </div>
                            )}

                            {formData.method === "BANK_TRANSFER" && (
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2">Bank Name</label>
                                    <input
                                        type="text"
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        placeholder="e.g., HDFC Bank"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 text-sm outline-none focus:ring-1 focus:ring-blue-400/50"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs text-gray-400 mb-2">Description (optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., Fee payment for monthly installment"
                                    rows={2}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 text-sm outline-none focus:ring-1 focus:ring-blue-400/50"
                                />
                            </div>

                            {message && (
                                <div
                                    className={`rounded-xl border p-3 text-sm ${messageTone === "success"
                                            ? "bg-green-400/10 border-green-400/20 text-green-300"
                                            : "bg-red-500/10 border-red-500/20 text-red-300"
                                        }`}
                                >
                                    {messageTone === "success" && <Check size={16} className="inline mr-2" />}
                                    {message}
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-semibold hover:bg-blue-500/30 disabled:opacity-60"
                                >
                                    {loading ? "Recording..." : "Record Payment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
