import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // When Supabase redirects with the recovery hash, it auto-creates a session
  // via detectSessionInUrl. We just need to confirm one exists.
  useEffect(() => {
    supabase.auth.getSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Mật khẩu cần ít nhất 6 ký tự"); return; }
    if (newPassword !== confirmPassword) { setError("Mật khẩu không khớp"); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword });
      if (err) throw err;
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(err?.message || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout icon={Lock} title="Đặt mật khẩu mới" subtitle="Nhập mật khẩu mới của bạn"
      footer={<Link to="/login" className="text-primary font-medium hover:underline">Quay lại đăng nhập</Link>}
    >
      {done ? (
        <p className="text-sm text-foreground text-center">Đã cập nhật mật khẩu. Đang chuyển hướng…</p>
      ) : (
        <>
          {error && (<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>)}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="newPassword" type="password" autoComplete="new-password" placeholder="••••••••"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 h-12" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
              {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</>) : "Đặt lại mật khẩu"}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
