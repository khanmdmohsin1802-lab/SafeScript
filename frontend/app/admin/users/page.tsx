"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Plus, Trash2, ToggleLeft, ToggleRight, UserCheck,
  UserX, AlertCircle, Loader2, LogOut, Eye, EyeOff, X,
} from "lucide-react";
import { useAuth, authHeader } from "../../../context/AuthContext";
import UnauthorizedView from "../../../components/UnauthorizedView";

const API = "http://127.0.0.1:8000";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  admin_id: string | null;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, logout, isAdmin, isLoading: authLoading } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Add user form */
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* Delete confirm */
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/users`, { headers: authHeader(user.token) });
      if (!res.ok) throw new Error("Failed to fetch users");
      setUsers(await res.json());
    } catch {
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/"); return; }
    fetchUsers();
  }, [fetchUsers, user, authLoading, router]);

  if (!authLoading && !isAdmin) return <UnauthorizedView pageName="User Management" />;

  /* ── Create user ── */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader(user!.token) },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), password: newPassword, role: newRole }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to create user");
      }
      const created: UserRecord = await res.json();
      setUsers((prev) => [created, ...prev]);
      setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("user"); setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Toggle active ── */
  const toggleActive = async (u: UserRecord) => {
    try {
      const res = await fetch(`${API}/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader(user!.token) },
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      const updated: UserRecord = await res.json();
      setUsers((prev) => prev.map((r) => (r.id === u.id ? updated : r)));
    } catch {
      setError("Failed to update user.");
    }
  };

  /* ── Change role ── */
  const changeRole = async (u: UserRecord, role: string) => {
    try {
      const res = await fetch(`${API}/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader(user!.token) },
        body: JSON.stringify({ role }),
      });
      const updated: UserRecord = await res.json();
      setUsers((prev) => prev.map((r) => (r.id === u.id ? updated : r)));
    } catch {
      setError("Failed to update role.");
    }
  };

  /* ── Delete ── */
  const deleteUser = async (id: string) => {
    try {
      await fetch(`${API}/users/${id}`, { method: "DELETE", headers: authHeader(user!.token) });
      setUsers((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ────── Render ────── */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        .font-body  { font-family: 'Manrope', sans-serif; }
        .font-label { font-family: 'Plus Jakarta Sans', sans-serif; }
        .bouncy-hover { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .bouncy-hover:hover { transform: scale(1.015); }
      `}} />

      <div className="font-body min-h-screen bg-[#f8faf5] text-[#191c1a]">

        {/* NAV */}
        <nav className="sticky top-0 z-40 flex items-center justify-between px-8 h-16 bg-[#f8faf5]/90 backdrop-blur-xl border-b border-[#c1c8c4]/20">
          <div className="flex items-center gap-10">
            <span className="text-xl font-bold text-[#16342b] tracking-tight">SafeScript</span>
            <div className="hidden md:flex gap-7">
              <span onClick={() => router.push("/prompt")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Gateway</span>
              <span onClick={() => router.push("/dashboard")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Dashboard</span>
              <span onClick={() => router.push("/policies")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Policies</span>
              <span onClick={() => router.push("/logs")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Audit Logs</span>
              <span className="text-[#16342b] font-bold border-b-2 border-[#16342b] pb-0.5 text-sm cursor-pointer">Users</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { logout(); router.push("/"); }} className="p-2 hover:bg-red-50 rounded-full transition-colors" title="Sign out">
              <LogOut className="w-4 h-4 text-[#414845]" />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#302a4e] flex items-center justify-center text-[#cac1ee] font-bold text-sm" title={user?.name}>
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-[#16342b] tracking-tight">User Management</h1>
              <p className="text-[#414845] text-sm mt-1 font-label">
                Manage all users under your admin account · {users.length} member{users.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-[#16342b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold bouncy-hover shadow-lg shadow-[#16342b]/10"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? "Cancel" : "Add User"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
              <p className="text-sm text-[#ba1a1a] font-label">{error}</p>
              <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4 text-[#ba1a1a]" /></button>
            </div>
          )}

          {/* Add user form */}
          {showForm && (
            <form onSubmit={handleCreateUser} className="bg-white border border-[#c1c8c4]/30 rounded-2xl p-6 shadow-sm space-y-5 animate-in slide-in-from-top-4 duration-300">
              <h2 className="font-bold text-[#16342b] text-lg flex items-center gap-2"><Users className="w-5 h-5" /> Create New User</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975]">Full Name</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} required
                    className="w-full h-12 px-4 bg-[#f2f4ef] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#16342b]/20"
                    placeholder="Jane Doe" />
                </div>
                <div className="space-y-1.5">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975]">Work Email</label>
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required
                    className="w-full h-12 px-4 bg-[#f2f4ef] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#16342b]/20"
                    placeholder="jane@company.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975]">Initial Password</label>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                      className="w-full h-12 px-4 pr-12 bg-[#f2f4ef] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#16342b]/20"
                      placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727975]">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975]">Role</label>
                  <div className="flex gap-2 h-12 items-center">
                    {(["user", "admin"] as const).map((r) => (
                      <button key={r} type="button" onClick={() => setNewRole(r)}
                        className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all ${newRole === r ? (r === "admin" ? "bg-[#302a4e] text-white" : "bg-[#16342b] text-white") : "bg-[#f2f4ef] text-[#414845] hover:bg-[#e1e3de]"}`}>
                        {r === "admin" ? "Admin" : "User"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {newRole === "admin" && (
                <div className="bg-[#302a4e]/5 border border-[#302a4e]/10 rounded-xl px-4 py-3 text-xs font-label text-[#484267]">
                  ⚠️ This user will have full admin access — audit logs, policy management, and user control.
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-[#414845] bg-[#ecefea] hover:bg-[#e1e3de] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-[#16342b] text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#2d4b41] transition-colors">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {submitting ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          )}

          {/* Users table */}
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#16342b] animate-spin" /></div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#c1c8c4]/30 rounded-2xl">
              <Users className="w-12 h-12 text-[#414845]/20 mb-4" />
              <h3 className="font-bold text-[#191c1a] mb-1">No users yet</h3>
              <p className="text-sm text-[#414845]/60 font-label text-center max-w-xs">Add your first team member using the button above. Only you (the admin) can create accounts.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#c1c8c4]/20 rounded-2xl shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_1.5fr_80px_100px_120px] px-6 py-3 bg-[#f2f4ef] border-b border-[#c1c8c4]/20">
                {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
                  <span key={h} className="text-[10px] font-label font-bold uppercase tracking-widest text-[#414845]/60">{h}</span>
                ))}
              </div>
              {/* Rows */}
              {users.map((u) => (
                <div key={u.id} className="grid grid-cols-[1fr_1.5fr_80px_100px_120px] px-6 py-4 items-center border-b border-[#c1c8c4]/10 last:border-0 hover:bg-[#f8faf5] transition-colors">
                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${u.role === "admin" ? "bg-[#302a4e]/15 text-[#302a4e]" : "bg-[#c8eadc] text-[#16342b]"}`}>
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#191c1a]">{u.name}</p>
                      <p className="text-[10px] text-[#414845]/50 font-label">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {/* Email */}
                  <p className="text-sm text-[#414845] truncate font-label">{u.email}</p>
                  {/* Role selector */}
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value)}
                    className={`text-xs font-label font-bold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${u.role === "admin" ? "bg-[#302a4e]/10 text-[#302a4e]" : "bg-[#ecefea] text-[#414845]"}`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {/* Status toggle */}
                  <button onClick={() => toggleActive(u)} className="flex items-center gap-1.5 text-xs font-label font-bold transition-colors">
                    {u.is_active
                      ? <><ToggleRight className="w-5 h-5 text-[#16342b]" /><span className="text-[#16342b]">Active</span></>
                      : <><ToggleLeft className="w-5 h-5 text-[#414845]/40" /><span className="text-[#414845]/40">Inactive</span></>}
                  </button>
                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    {u.is_active
                      ? <button onClick={() => toggleActive(u)} title="Deactivate" className="p-1.5 hover:bg-[#ffdad6] rounded-lg transition-colors"><UserX className="w-4 h-4 text-[#414845]/60 hover:text-[#ba1a1a]" /></button>
                      : <button onClick={() => toggleActive(u)} title="Activate" className="p-1.5 hover:bg-[#c8eadc] rounded-lg transition-colors"><UserCheck className="w-4 h-4 text-[#414845]/60 hover:text-[#16342b]" /></button>
                    }
                    {deletingId === u.id ? (
                      <>
                        <button onClick={() => deleteUser(u.id)} className="px-2 py-1 bg-[#ba1a1a] text-white text-xs rounded-lg font-bold">Yes</button>
                        <button onClick={() => setDeletingId(null)} className="px-2 py-1 bg-[#ecefea] text-[#414845] text-xs rounded-lg font-bold">No</button>
                      </>
                    ) : (
                      <button onClick={() => setDeletingId(u.id)} title="Delete" className="p-1.5 hover:bg-[#ffdad6] rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-[#414845]/40 hover:text-[#ba1a1a]" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info card */}
          <div className="bg-[#ecefea] border border-[#c1c8c4]/20 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#16342b] flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-[#c8eadc]" />
            </div>
            <div>
              <p className="font-semibold text-[#16342b] text-sm">You control access</p>
              <p className="text-xs text-[#414845] font-label mt-1 leading-relaxed">
                Only admins can create accounts. Regular users can only access the AI Gateway (prompt page).
                Deactivating a user immediately prevents them logging in. All their prompt activity remains in the audit log.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
