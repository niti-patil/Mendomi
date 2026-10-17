const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Sparkles } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import MicrosoftIcon from "@/components/MicrosoftIcon";
import Logo from "@/components/Logo";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { enterDemoMode } from "@/lib/demoClient";

export default function Auth({ defaultMode = "signup" }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const returnTo = safeReturnTo();

  const finish = () => { window.location.href = returnTo; };
  const handleGoogle = () => { db.auth.loginWithProvider("google", returnTo); };
  const handleMicrosoft = () => { db.auth.loginWithProvider("microsoft", returnTo); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await db.auth.loginViaEmailPassword(email, password);
        finish();
      } else {
        await db.auth.register({ email, password });
        setShowOtp(true);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const exploreAsNinja = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    enterDemoMode();
    window.location.href = returnTo;
  };

  const verify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await db.auth.verifyOtp({ email, otpCode: otp });
      if (res?.access_token) db.auth.setToken(res.access_token);
      finish();
    } catch (err) {
      setError(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await db.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  if (showOtp) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <Mail className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Verify your email</h1>
            <p className="text-muted-foreground mt-2">We sent a code to {email}</p>
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}
            <div className="flex justify-center mb-6">
              <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus autoComplete="one-time-code">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button className="w-full h-12 font-medium" onClick={verify} disabled={loading || otp.length < 6}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>
              ) : "Verify"}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Didn't receive the code?{" "}
              <button onClick={resend} className="text-primary font-medium hover:underline">Resend</button>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <header className="bg-primary px-6 pt-12 pb-10 text-center">
        <div className="flex justify-center mb-4">
          <Logo className="w-14 h-14" color="#ffffff" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Mendly</h1>
        <p className="text-white/80 mt-2">Everything you need to heal, in one place.</p>
      </header>
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <div className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-xl bg-muted">
            <button type="button" onClick={() => setMode("signup")} className={`py-2 rounded-lg text-sm font-medium transition ${mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Sign Up</button>
            <button type="button" onClick={() => setMode("login")} className={`py-2 rounded-lg text-sm font-medium transition ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Log In</button>
          </div>

          <div className="space-y-2.5 mb-6">
            <Button variant="outline" className="w-full h-12 text-sm font-medium" onClick={handleGoogle}>
              <GoogleIcon className="w-5 h-5 mr-2" /> Continue with Google
            </Button>
            <Button variant="outline" className="w-full h-12 text-sm font-medium" onClick={handleMicrosoft}>
              <MicrosoftIcon className="w-5 h-5 mr-2" /> Continue with Microsoft
            </Button>
            <Button
              type="button"
              className="w-full h-12 text-sm font-medium bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90"
              onClick={exploreAsNinja}
              disabled={loading}
            >
              <Sparkles className="w-4 h-4 mr-2" /> Explore as Ninja
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground">or</span></div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
              </div>
            </div>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10 h-12" required />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{mode === "login" ? "Logging in..." : "Creating account..."}</>
              ) : (
                mode === "login" ? "Log in" : "Create account"
              )}
            </Button>
          </form>
        </div>
        </div>
      </div>
    </main>
  );
}