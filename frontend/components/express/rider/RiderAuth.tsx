"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { riderAuthApi, saveRiderToken } from "@/lib/express/api";
import { VEHICLE_TYPES } from "@/lib/express/types";
import { CheckCircleIcon, AlertTriangleIcon } from "@/components/Icons";

type AuthMode = "login" | "otp";
type RegisterStep = 1 | 2 | 3;

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-1.5">
      {text}
      {required && <span className="text-[#ff2d2d] ml-0.5">*</span>}
    </p>
  );
}

function Field({
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3 text-[13px] text-[#e0e0e0]
        focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]
        disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

function StepIndicator({
  current,
  total,
}: {
  current: RegisterStep;
  total: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border transition-all
            ${
              s < current
                ? "bg-green-500/20 border-green-500/40 text-green-400"
                : s === current
                  ? "bg-[#ff2d2d] border-[#ff2d2d] text-white"
                  : "bg-[#111] border-[#2a2a2a] text-[#555]"
            }`}
          >
            {s < current ? "✓" : s}
          </div>
          {s < total && (
            <div
              className={`flex-1 h-px w-8 ${s < current ? "bg-green-500/40" : "bg-[#2a2a2a]"}`}
            />
          )}
        </div>
      ))}
      <p className="text-[11px] text-[#555] ml-1">
        Step {current} of {total}
      </p>
    </div>
  );
}

export default function RiderAuth() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [mode, setMode] = useState<AuthMode>("login");
  const [regStep, setRegStep] = useState<RegisterStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Register — Step 1: Personal
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Register — Step 2: Vehicle
  const [vehicleType, setVehicleType] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  // Register — Step 3: Bank
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  const clearError = () => setError(null);

  // ── Validate each step ────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!name.trim()) return (setError("Enter your full name"), false);
    if (!email.trim()) return (setError("Enter your email address"), false);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return (setError("Enter a valid email"), false);
    if (!phone.trim()) return (setError("Enter your phone number"), false);
    if (password.length < 8)
      return (setError("Password must be at least 8 characters"), false);
    if (password !== confirmPassword)
      return (setError("Passwords do not match"), false);
    clearError();
    return true;
  };

  const validateStep2 = () => {
    if (!vehicleType) return (setError("Select your vehicle type"), false);
    if (!vehiclePlate.trim())
      return (setError("Enter your vehicle plate number"), false);
    if (!licenseNumber.trim())
      return (setError("Enter your driver's license number"), false);
    clearError();
    return true;
  };

  const validateStep3 = () => {
    if (!bankName.trim()) return (setError("Enter your bank name"), false);
    if (!bankAccountNumber.trim())
      return (setError("Enter your account number"), false);
    if (bankAccountNumber.length < 10)
      return (setError("Account number must be 10 digits"), false);
    if (!bankAccountName.trim())
      return (setError("Enter your account name"), false);
    clearError();
    return true;
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim())
      return setError("Enter your email and password");
    setLoading(true);
    clearError();
    try {
      await riderAuthApi.login(loginEmail.trim(), loginPassword);
      setOtpEmail(loginEmail.trim());
      setMode("otp");
      setSuccess("OTP sent to your email");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP verify ───────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.trim().length < 4) return setError("Enter the OTP from your email");
    setLoading(true);
    clearError();
    try {
      const res = await riderAuthApi.verifyOtp(otpEmail, otp.trim());
      saveRiderToken(res.data.token);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => router.push("/express/rider"), 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const handleNextStep = () => {
    if (regStep === 1 && validateStep1()) setRegStep(2);
    else if (regStep === 2 && validateStep2()) setRegStep(3);
  };

  const handleRegister = async () => {
    if (!validateStep3()) return;
    setLoading(true);
    clearError();
    try {
      await riderAuthApi.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        vehicleType,
        vehiclePlateNumber: vehiclePlate.trim(),
        driverLicenseNumber: licenseNumber.trim(),
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim(),
      });
      setSuccess(
        "Registration submitted! Your account is pending verification (24–48 hrs). You'll be notified once approved.",
      );
      setTab("login");
      setRegStep(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ["Personal Info", "Vehicle Info", "Bank Details"];
  const stepSubtitles = [
    "Tell us about yourself",
    "Details about your vehicle",
    "Where we'll send your earnings",
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-start px-4 py-10 pb-24">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <Image
          src="/dezen-express-logo.png"
          alt="DezenExpress"
          width={36}
          height={36}
          className="object-contain"
        />
        <span className="font-[var(--font-syne)] font-extrabold text-[13px] tracking-[0.15em] text-[#f0f0f0]">
          DEZEN-EXPRESS
        </span>
      </div>

      <div className="w-full max-w-md">
        {/* Tab switcher — hide during OTP */}
        {mode !== "otp" && (
          <div className="flex gap-1 bg-[#1a1a1a] border border-[#222] rounded-xl p-1 mb-6">
            <button
              onClick={() => {
                setTab("login");
                setRegStep(1);
                clearError();
                setSuccess(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-none transition-all
                ${tab === "login" ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#666] hover:text-[#ccc]"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab("register");
                clearError();
                setSuccess(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-none transition-all
                ${tab === "register" ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#666] hover:text-[#ccc]"}`}
            >
              Register
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[13px] text-red-400 mb-4">
            <AlertTriangleIcon
              size={14}
              color="currentColor"
              className="shrink-0"
            />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-[13px] text-green-400 mb-4">
            <CheckCircleIcon
              size={14}
              color="currentColor"
              className="shrink-0 mt-0.5"
            />
            {success}
          </div>
        )}

        {/* ── LOGIN ─────────────────────────────────────────────────────── */}
        {tab === "login" && mode === "login" && (
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <h2 className="font-[var(--font-syne)] font-bold text-[20px] text-[#f0f0f0]">
                Welcome back
              </h2>
              <p className="text-[12px] text-[#555] mt-0.5">
                Sign in to your rider account
              </p>
            </div>
            <div>
              <Label text="Email Address" required />
              <Field
                type="email"
                value={loginEmail}
                onChange={setLoginEmail}
                placeholder="you@email.com"
              />
            </div>
            <div>
              <Label text="Password" required />
              <div className="relative">
                <Field
                  type={showPass ? "text" : "password"}
                  value={loginPassword}
                  onChange={setLoginPassword}
                  placeholder="Your password"
                />
                <button
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#555] hover:text-[#aaa] text-[11px]"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-[#ff2d2d] text-white rounded-xl text-[14px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
            >
              {loading ? "Sending OTP..." : "Sign In"}
            </button>
          </div>
        )}

        {/* ── OTP ───────────────────────────────────────────────────────── */}
        {tab === "login" && mode === "otp" && (
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <h2 className="font-[var(--font-syne)] font-bold text-[20px] text-[#f0f0f0]">
                Check your email
              </h2>
              <p className="text-[12px] text-[#555] mt-0.5">
                OTP sent to <strong className="text-[#aaa]">{otpEmail}</strong>
              </p>
            </div>
            <div>
              <Label text="One-Time Password" required />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3 text-[24px] text-[#e0e0e0] font-mono text-center tracking-[0.4em] focus:border-[#ff2d2d] focus:outline-none"
              />
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 4}
              className="w-full py-3 bg-[#ff2d2d] text-white rounded-xl text-[14px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>
            <button
              onClick={() => {
                setMode("login");
                setOtp("");
                clearError();
                setSuccess(null);
              }}
              className="text-[12px] text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer text-center"
            >
              ← Back to login
            </button>
          </div>
        )}

        {/* ── REGISTER (multi-step) ─────────────────────────────────────── */}
        {tab === "register" && (
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <h2 className="font-[var(--font-syne)] font-bold text-[20px] text-[#f0f0f0]">
                {stepTitles[regStep - 1]}
              </h2>
              <p className="text-[12px] text-[#555] mt-0.5">
                {stepSubtitles[regStep - 1]}
              </p>
            </div>

            <StepIndicator current={regStep} total={3} />

            {/* Step 1: Personal */}
            {regStep === 1 && (
              <div className="flex flex-col gap-3">
                <div>
                  <Label text="Full Name" required />
                  <Field
                    value={name}
                    onChange={setName}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label text="Email Address" required />
                  <Field
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <Label text="Phone Number" required />
                  <Field
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    placeholder="08012345678"
                  />
                </div>
                <div>
                  <Label text="Password" required />
                  <div className="relative">
                    <Field
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={setPassword}
                      placeholder="Min. 8 characters"
                    />
                    <button
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#555] hover:text-[#aaa] text-[11px]"
                    >
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div>
                  <Label text="Confirm Password" required />
                  <Field
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Repeat password"
                  />
                </div>
                <button
                  onClick={handleNextStep}
                  className="w-full py-3 bg-[#ff2d2d] text-white rounded-xl text-[14px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 mt-1"
                >
                  Next: Vehicle Info →
                </button>
              </div>
            )}

            {/* Step 2: Vehicle */}
            {regStep === 2 && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label text="Vehicle Type" required />
                  <div className="grid grid-cols-3 gap-2">
                    {VEHICLE_TYPES.map((v) => (
                      <button
                        key={v.value}
                        onClick={() => setVehicleType(v.value)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-center cursor-pointer transition-all
                          ${vehicleType === v.value ? "bg-[#ff2d2d]/10 border-[#ff2d2d]/40" : "bg-[#111] border-[#2a2a2a] hover:border-[#333]"}`}
                      >
                        <span className="text-2xl">{v.icon}</span>
                        <p
                          className={`text-[11px] font-medium ${vehicleType === v.value ? "text-[#ff2d2d]" : "text-[#555]"}`}
                        >
                          {v.label}
                        </p>
                        <p className="text-[9px] text-[#444]">{v.maxKg}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label text="Vehicle Plate Number" required />
                  <Field
                    value={vehiclePlate}
                    onChange={setVehiclePlate}
                    placeholder="e.g. LAG-234-KA"
                  />
                </div>
                <div>
                  <Label text="Driver's License Number" required />
                  <Field
                    value={licenseNumber}
                    onChange={setLicenseNumber}
                    placeholder="e.g. FRN-1234567890"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => {
                      setRegStep(1);
                      clearError();
                    }}
                    className="flex-1 py-2.5 bg-transparent border border-[#222] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-[2] py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90"
                  >
                    Next: Bank Details →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Bank */}
            {regStep === 3 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-2 px-3 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl">
                  <AlertTriangleIcon
                    size={13}
                    color="#555"
                    className="shrink-0 mt-0.5"
                  />
                  <p className="text-[11px] text-[#555]">
                    Your earnings (85% of every fare) will be paid to this bank
                    account.
                  </p>
                </div>
                <div>
                  <Label text="Bank Name" required />
                  <Field
                    value={bankName}
                    onChange={setBankName}
                    placeholder="e.g. First Bank"
                  />
                </div>
                <div>
                  <Label text="Account Number" required />
                  <Field
                    type="tel"
                    value={bankAccountNumber}
                    onChange={setBankAccountNumber}
                    placeholder="0123456789"
                  />
                </div>
                <div>
                  <Label text="Account Name" required />
                  <Field
                    value={bankAccountName}
                    onChange={setBankAccountName}
                    placeholder="Name on account"
                  />
                </div>

                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <AlertTriangleIcon
                    size={13}
                    color="#f59e0b"
                    className="shrink-0 mt-0.5"
                  />
                  <p className="text-[11px] text-amber-400">
                    Your account will be reviewed before you can start accepting
                    requests. This takes 24–48 hours.
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => {
                      setRegStep(2);
                      clearError();
                    }}
                    className="flex-1 py-2.5 bg-transparent border border-[#222] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="flex-[2] py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
                  >
                    {loading ? "Submitting..." : "Submit Registration"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-[12px] text-[#444] mt-6">
          Looking to book a ride?{" "}
          <a
            href="/express/customer"
            className="text-[#ff2d2d] no-underline hover:opacity-75"
          >
            Book as customer
          </a>
        </p>
      </div>
    </div>
  );
}
