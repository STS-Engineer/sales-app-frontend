import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../components/TopBar.jsx";
import {
  approveUser,
  getApprovedUsers,
  getCurrentUserRole,
  getPendingUsers,
  isOwnerEmail
} from "../utils/userStore.js";

const ROLE_OPTIONS = ["Commercial", "Zone Manager"];

export default function UserValidation() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [roleByEmail, setRoleByEmail] = useState({});
  const [openSelectEmail, setOpenSelectEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [approvedCount, setApprovedCount] = useState(0);
  const dropdownRef = useRef(null);
  const storedEmail =
    typeof window !== "undefined" ? localStorage.getItem("rfq_user_email") || "" : "";
  const isOwner =
    getCurrentUserRole() === "owner" || isOwnerEmail(storedEmail);

  useEffect(() => {
    setPendingUsers(getPendingUsers());
    setApprovedCount(getApprovedUsers().length);
  }, []);

  useEffect(() => {
    if (!openSelectEmail) {
      return;
    }
    const handlePointer = (event) => {
      if (dropdownRef.current?.contains(event.target)) {
        return;
      }
      setOpenSelectEmail(null);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpenSelectEmail(null);
      }
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openSelectEmail]);

  const pendingCount = pendingUsers.length;

  const handleRoleChange = (email, value) => {
    setRoleByEmail((prev) => ({ ...prev, [email]: value }));
  };

  const handleApprove = (email) => {
    const role = roleByEmail[email] || ROLE_OPTIONS[0];
    approveUser(email, role);
    setPendingUsers(getPendingUsers());
    setApprovedCount(getApprovedUsers().length);
  };

  const formattedUsers = useMemo(
    () =>
      pendingUsers.map((user) => ({
        ...user,
        displayName: user.name || user.email,
        requestedAtLabel: user.requestedAt
          ? new Date(user.requestedAt).toLocaleString()
          : "N/A"
      })),
    [pendingUsers]
  );

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return formattedUsers;
    }
    return formattedUsers.filter((user) =>
      [user.displayName, user.email].some((value) =>
        String(value || "").toLowerCase().includes(term)
      )
    );
  }, [formattedUsers, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-100/70">
      <TopBar />

      <div className="px-6 py-10">
        <div className="w-full">
          {!isOwner ? (
            <div className="card p-6 text-center">
              <p className="text-sm font-semibold text-ink">Access restricted</p>
              <p className="mt-2 text-sm text-slate-500">
                Only the owner can validate new users.
              </p>
              <Link
                to="/dashboard"
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-tide/40 hover:shadow-md"
              >
                Back to dashboard
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              <div className="card space-y-7 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Owner panel
                    </p>
                    <h2 className="font-display text-2xl text-ink">Users to validate</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Review requests, assign roles, and unlock access.
                    </p>
                  </div>
                  <div className="w-full sm:w-64">
                    <div className="relative">
                      <input
                        className="input-field w-full pl-12 pr-10"
                        type="text"
                        placeholder="Search users"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                      />
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="6.5" />
                          <path d="M16.2 16.2L20 20" />
                        </svg>
                      </span>
                      {searchTerm ? (
                        <button
                          type="button"
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Clear search"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <path d="M6 6l12 12" />
                            <path d="M18 6l-12 12" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                    <p
                      className={`mt-2 text-xs text-slate-500 transition ${
                        searchTerm ? "opacity-100" : "opacity-0"
                      }`}
                      aria-live="polite"
                      aria-atomic="true"
                      aria-hidden={!searchTerm}
                    >
                      {searchTerm
                        ? `${filteredUsers.length} result${
                            filteredUsers.length === 1 ? "" : "s"
                          }`
                        : "\u00A0"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-soft">
                    <span className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-tide" />
                    <div className="flex items-center gap-4 pl-2">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-tide/10 text-tide">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="7" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Pending</p>
                        <p className="mt-1 font-display text-3xl text-ink">{pendingCount}</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-soft">
                    <span className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-mint" />
                    <div className="flex items-center gap-4 pl-2">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/10 text-mint">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Approved</p>
                        <p className="mt-1 font-display text-3xl text-ink">{approvedCount}</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-soft">
                    <span className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-sun" />
                    <div className="flex items-center gap-4 pl-2">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sun/10 text-sun">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 12h18" />
                          <path d="M12 3v18" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Total</p>
                        <p className="mt-1 font-display text-3xl text-ink">
                          {pendingCount + approvedCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/70 p-6 text-center text-sm text-slate-500">
                    {searchTerm
                      ? "No users match your search."
                      : "No pending users right now."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.email}
                        className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/95 px-5 py-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-base font-semibold text-ink">{user.displayName}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            Requested: {user.requestedAtLabel}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div
                            className="relative"
                            ref={openSelectEmail === user.email ? dropdownRef : null}
                          >
                            <button
                              type="button"
                              className="input-field min-w-[160px] text-left"
                              onClick={() =>
                                setOpenSelectEmail((prev) =>
                                  prev === user.email ? null : user.email
                                )
                              }
                              aria-haspopup="listbox"
                              aria-expanded={openSelectEmail === user.email}
                            >
                              <span className="block pr-6">
                                {roleByEmail[user.email] || ROLE_OPTIONS[0]}
                              </span>
                              <span
                                className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition ${
                                  openSelectEmail === user.email ? "-rotate-180" : ""
                                }`}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M6 9l6 6 6-6" />
                                </svg>
                              </span>
                            </button>
                            {openSelectEmail === user.email ? (
                              <div
                                className="absolute right-0 z-10 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card"
                                role="listbox"
                              >
                                {ROLE_OPTIONS.map((role) => {
                                  const isActive =
                                    (roleByEmail[user.email] || ROLE_OPTIONS[0]) === role;
                                  return (
                                    <button
                                      key={role}
                                      type="button"
                                      role="option"
                                      aria-selected={isActive}
                                      onClick={() => {
                                        handleRoleChange(user.email, role);
                                        setOpenSelectEmail(null);
                                      }}
                                      className={`flex w-full items-center justify-between px-3 py-2 text-sm font-semibold transition ${
                                        isActive
                                          ? "bg-slate-100 text-ink"
                                          : "text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      <span>{role}</span>
                                      {isActive ? (
                                        <span className="text-tide">
                                          <svg
                                            viewBox="0 0 24 24"
                                            className="h-4 w-4"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                          >
                                            <path d="M20 6L9 17l-5-5" />
                                          </svg>
                                        </span>
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="gradient-button rounded-xl px-4 py-3 text-sm font-semibold shadow-soft"
                            onClick={() => handleApprove(user.email)}
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
