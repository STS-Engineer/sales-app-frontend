import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { addPendingUser, getOwnerEmail } from "../utils/userStore.js";

const EyeIcon = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
    <circle cx="12" cy="12" r="3" />
    {!open ? <path d="M4 4l16 16" /> : null}
  </svg>
);

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const ownerEmail = useMemo(() => getOwnerEmail(), []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);
    if (form.password !== form.confirmPassword) {
      setStatus({
        type: "error",
        message: "Passwords do not match. Please confirm again."
      });
      return;
    }
    setLoading(true);
    const requestPayload = {
      id: `req-${Date.now()}`,
      name: form.name,
      email: form.email,
      requestedAt: new Date().toISOString()
    };
    const result = addPendingUser(requestPayload);
    if (!result.ok) {
      const message =
        result.reason === "pending"
          ? "Your request is already pending owner approval."
          : result.reason === "approved"
            ? "This user is already approved. You can log in."
            : "Unable to submit your request. Please try again.";
      setStatus({ type: "error", message });
      setLoading(false);
      return;
    }
    const subject = `New user approval request: ${form.name || form.email}`;
    const body = `Hello Owner,

A new user just requested access to the RFQ app.

Name: ${form.name || "N/A"}
Email: ${form.email}

Next step:
1) Open the app
2) Click your profile in the TopBar
3) Select "User validation"
4) Assign a role and confirm

Thanks,
AVO Carbon RFQ`;
    setStatus({
      type: "success",
      message: `Request sent to ${ownerEmail}. You will be able to log in once approved.`
    });
    setLoading(false);
  };

  return (
    <AuthLayout title="Create account">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          <span>Full name</span>
          <input
            className="input-field"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          <span>Email</span>
          <input
            className="input-field"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@avocarbon.com"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          <span>Password</span>
          <div className="relative">
            <input
              className="input-field w-full pr-12"
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:text-tide focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          <span>Confirm password</span>
          <div className="relative">
            <input
              className="input-field w-full pr-12"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:text-tide focus:outline-none"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              title={showConfirmPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showConfirmPassword} />
            </button>
          </div>
        </label>
        <button
          type="submit"
          className="gradient-button w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-soft"
          disabled={loading}
        >
          {loading ? "Sending request..." : "Create account"}
        </button>
        {status ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              status.type === "success"
                ? "border-mint/30 bg-mint/10 text-mint"
                : "border-coral/30 bg-coral/10 text-coral"
            }`}
          >
            {status.message}
          </div>
        ) : null}
        <div className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link className="font-semibold text-tide" to="/">
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}


