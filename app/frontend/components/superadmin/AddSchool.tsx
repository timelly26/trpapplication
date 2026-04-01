"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRIMARY_COLOR } from "../../constants/colors";
import SearchInput from "../common/SearchInput";
import FormSection from "../common/FormSection";
import { SchoolFormState } from "../../interfaces/dashboard";
import SuccessPopups from "../common/SuccessPopUps";
import {
  School,
  Lock,
  Phone,
  Mail,
  MapPin,
  Hash,
  Map,
  Building2,
  Landmark,
  Globe
} from "lucide-react";
import PageHeader from "../common/PageHeader";

type FormErrors = {
  schoolName?: string;
  password?: string;
  email?: string;
  phone?: string;
  pincode?: string;
};

export default function AddSchool() {
  const router = useRouter();

  const [form, setForm] = useState<SchoolFormState>({
    schoolName: "",
    password: "",
    phone: "",
    email: "",
    classRange: "",
    board: "",
    addressLine: "",
    pincode: "",
    area: "",
    city: "",
    district: "",
    state: "",
    billingMode: "PARENT_SUBSCRIPTION",
    parentSubscriptionAmount: "",
    parentSubscriptionTrialDays: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const hasFieldErrors = Object.values(errors).some(Boolean);

  /* ---------------- Input Handler ---------------- */

  const handleChange =
    (field: keyof SchoolFormState) =>
      (value: string) => {

        /* Phone → only digits + 10 limit */
        if (field === "phone") {
          const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
          setForm((prev) => ({ ...prev, phone: digitsOnly }));
          setErrors((prev) => ({ ...prev, phone: "" }));
          return;
        }

        /* Pincode → digits only */
        if (field === "pincode") {
          const digitsOnly = value.replace(/\D/g, "");
          setForm((prev) => ({ ...prev, pincode: digitsOnly }));
          setErrors((prev) => ({ ...prev, pincode: "" }));
          return;
        }

        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
      };

  /* ---------------- Validation ---------------- */

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!form.schoolName.trim()) {
      newErrors.schoolName = "School name is required";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (form.phone && form.phone.length !== 10) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (form.pincode && !/^\d+$/.test(form.pincode)) {
      newErrors.pincode = "Pincode must contain digits only";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- Submit Handler ---------------- */

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const res = await fetch("/api/superadmin/schools/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: form.schoolName,
          email: form.email,
          password: form.password,
          address: [form.addressLine, form.area, form.city, form.district, form.state].filter(Boolean).join(", ") || form.schoolName,
          location: form.area || form.city || "",
          phone: form.phone || undefined,
          billingMode: form.billingMode,
          parentSubscriptionAmount: form.parentSubscriptionAmount
            ? parseFloat(form.parentSubscriptionAmount)
            : undefined,
          parentSubscriptionTrialDays: form.parentSubscriptionTrialDays
            ? parseInt(form.parentSubscriptionTrialDays, 10)
            : undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: { message?: string };
      try {
        data = await res.json();
      } catch {
        setError(res.ok ? "Invalid response from server" : `Request failed (${res.status})`);
        return;
      }

      if (!res.ok) {
        setError(data?.message || "Failed to create school");
        return;
      }
      setShowSuccess(true);
      try {
        router.refresh();
      } catch {
        /* noop */
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError("Request timed out. Please try again.");
        } else {
          setError(err.message || "Something went wrong");
        }
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Reset ---------------- */

  const handleReset = () => {
    setForm({
      schoolName: "",
      password: "",
      phone: "",
      email: "",
      classRange: "",
      board: "",
      addressLine: "",
      pincode: "",
      area: "",
      city: "",
      district: "",
      state: "",
      billingMode: "PARENT_SUBSCRIPTION",
      parentSubscriptionAmount: "",
      parentSubscriptionTrialDays: "",
    });

    setErrors({});
  };

  /* ---------------- UI ---------------- */

return (
  <>
  <main className="flex-1 overflow-y-auto">
    <div className=" bg-transparent min-h-screen">
      <div className="w-full space-y-6">
        <PageHeader
          title="Add New School"
          subtitle="Create a new school and onboard its admin here"
          className="w-full mb-0"
        />
        <form
          onSubmit={handleSignup}
          className="w-full rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-500/20"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Add New School
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto text-gray-200 border border-gray-300/20 px-4 py-2 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={loading || error !== "" || hasFieldErrors}
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="w-full sm:w-auto text-black px-6 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Backend error → RED */}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <FormSection title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <SearchInput
              label="School Name *"
              placeholder="School Name"
              value={form.schoolName}
              onChange={handleChange("schoolName")}
              error={errors.schoolName}
              icon={School}
            />

            <SearchInput
              label="Password *"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange("password")}
              error={errors.password}
              icon={Lock}
            />
          </div>
        </FormSection>

        <FormSection title="Subscription Settings (SaaS)">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <p className="text-sm font-medium text-white mb-2">Billing Mode</p>
              <p className="text-xs text-white/60 mb-3">
                Choose how this school pays for Timelly.
              </p>
              <div className="inline-flex rounded-xl bg-white/5 border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      billingMode: "SCHOOL_PAID",
                      parentSubscriptionAmount: "",
                      parentSubscriptionTrialDays: "",
                    }))
                  }
                  className={`px-3 py-2 text-xs sm:text-sm rounded-lg font-medium ${
                    form.billingMode === "SCHOOL_PAID"
                      ? "bg-lime-400 text-black"
                      : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  School Paid (no parent subscription)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      billingMode: "PARENT_SUBSCRIPTION",
                    }))
                  }
                  className={`ml-1 px-3 py-2 text-xs sm:text-sm rounded-lg font-medium ${
                    form.billingMode === "PARENT_SUBSCRIPTION"
                      ? "bg-lime-400 text-black"
                      : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  Parent Subscription (per annum)
                </button>
              </div>
            </div>
            {form.billingMode === "PARENT_SUBSCRIPTION" && (
              <>
                <SearchInput
                  label="Parent Subscription Amount (₹)"
                  placeholder="e.g. 2999"
                  value={form.parentSubscriptionAmount || ""}
                  onChange={handleChange("parentSubscriptionAmount")}
                  icon={Globe}
                />
                <SearchInput
                  label="Free Trial Days"
                  placeholder="e.g. 14"
                  value={form.parentSubscriptionTrialDays || ""}
                  onChange={handleChange("parentSubscriptionTrialDays")}
                  icon={Hash}
                />
              </>
            )}
          </div>
        </FormSection>

        <FormSection title="Contact Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <SearchInput
              label="Phone"
              placeholder="Contact number"
              value={form.phone}
              onChange={handleChange("phone")}
              error={errors.phone}
              icon={Phone}
            />

            <SearchInput
              label="Email *"
              type="email"
              placeholder="example@gmail.com"
              value={form.email}
              onChange={handleChange("email")}
              error={errors.email}
              icon={Mail}
            />
          </div>
        </FormSection>

        <FormSection title="Address Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <SearchInput
              label="Address Line"
              value={form.addressLine}
              placeholder="Enter address line"
              onChange={handleChange("addressLine")}
              icon={MapPin}
            />

            <SearchInput
              label="Pincode"
              value={form.pincode}
              onChange={handleChange("pincode")}
              placeholder="Enter pincode"
              error={errors.pincode}
              icon={Hash}
            />

            <SearchInput
              label="Area / Locality"
              value={form.area}
              onChange={handleChange("area")}
              placeholder="Enter area / locality"
              icon={Map}
            />

            <SearchInput
              label="City"
              value={form.city}
              onChange={handleChange("city")}
              placeholder="Enter city"
              icon={Building2}
            />

            <SearchInput
              label="District"
              value={form.district}
              onChange={handleChange("district")}
              placeholder="Enter district"
              icon={Landmark}
            />

            <SearchInput
              label="State"
              value={form.state}
              onChange={handleChange("state")}
              placeholder="Enter state"
              icon={Globe}
            />
          </div>
        </FormSection>
          </form>

          <SuccessPopups
            open={showSuccess}
            title="School Created and Onboarded Successfully!"
            onClose={() => {
              setShowSuccess(false);
              handleReset();
            }}
          />
        </div>
      </div>
      </main>
    </>
  );
}
