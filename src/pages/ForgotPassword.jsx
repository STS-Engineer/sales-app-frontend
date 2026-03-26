import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { forgotPassword } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await forgotPassword({ email });
    setSent(true);
  };

  return (
    <AuthLayout title="Forgot password">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          <span>Email</span>
          <input
            className="input-field"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@avocarbon.com"
            required
          />
        </label>
        <button
          type="submit"
          className="gradient-button w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-soft"
        >
          Send reset link
        </button>
        <div className="text-center text-xs text-slate-500">
          {sent ? "Email sent if the account exists." : ""}
        </div>
        <div className="text-center text-xs text-slate-500">
          <Link className="font-semibold text-tide" to="/">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

