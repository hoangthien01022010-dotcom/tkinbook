import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, CheckCircle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Mật khẩu cần ít nhất 6 ký tự"); return; }
    if (password !== confirmPassword) { setError("Mật khẩu không khớp"); return; }
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (err) throw err;
      // If email confirmations are off, a session is returned immediately.
      if (data.session) {
        navigate("/", { replace: true });
      } else {
        setSent(true);
      }
    } catch (err) {
      setError(err?.message || "Không thể tạo tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result?.error) throw result.error;
      if (result?.redirected) return;
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Không thể đăng ký với Google");
    }
  };

  if (sent) {
    return (
      <AuthLayout icon={CheckCircle} title="Kiểm tra email" subtitle="Chúng tôi đã gửi liên kết xác nhận"
        footer={<Link to="/login" className="text-primary font-medium hover:underline">Quay lại đăng nhập</Link>}
      >
        <p className="text-sm text-foreground text-center">
          Mở email <strong>{email}</strong> và bấm liên kết xác nhận để hoàn tất đăng ký.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Tạo tài khoản"
      subtitle="Đăng ký để bắt đầu"
      footer={<>Đã có tài khoản?{" "}<Link to="/login" className="text-primary font-medium hover:underline">Đăng nhập</Link></>}
    >
      <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle}>
        <GoogleIcon className="w-5 h-5 mr-2" />Đăng ký với Google
      </Button>
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">hoặc</span>
        </div>
      </div>
      {error && (<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>)}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Địa chỉ email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
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
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang tạo tài khoản...</>) : "Tạo tài khoản"}
        </Button>
      </form>
    </AuthLayout>
  );
}
