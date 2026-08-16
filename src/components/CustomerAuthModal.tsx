import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Phone, Lock, MapPin, LogIn, UserPlus, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck, HelpCircle } from 'lucide-react';
import { customerLogin, customerSignup, customerGoogleAuth, customerResetPassword } from '../lib/api';
import { CustomerUser } from '../types';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CustomerUser, token: string, message: string) => void;
  onError: (msg: string) => void;
  checkoutGateNote?: boolean;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  checkoutGateNote
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('signup');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState(''); // phone or email
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');

  // Password Recovery Fields
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const userGoogleName = prompt('Enter your Google Account Name:', 'Ali Khan') || 'Google Customer';
      const userGoogleEmail = prompt('Enter your Google Email:', 'ali.khan@gmail.com') || 'google.user@gmail.com';

      if (!userGoogleEmail || !userGoogleEmail.includes('@')) {
        setGoogleLoading(false);
        onError('Valid Google email is required.');
        return;
      }

      const res = await customerGoogleAuth(userGoogleName, userGoogleEmail);
      setGoogleLoading(false);
      onSuccess(res.user, res.token, `Signed in with Google as ${res.user.name}! 🎉`);
      onClose();
    } catch (err: any) {
      setGoogleLoading(false);
      onError(err.message || 'Google sign-in failed.');
    }
  };

  const handleSendRecoveryCode = () => {
    if (!recoveryIdentifier.trim()) {
      onError('Please enter your registered Phone Number or Email first.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    alert(`🔐 SECURITY VERIFICATION CODE\n\nYour Cheez O'Clock account recovery code is: ${code}\n\nPlease enter this code to reset your password.`);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryIdentifier.trim()) {
      onError('Please enter your Phone Number or Email.');
      return;
    }

    if (sentCode && verificationCode.trim() !== sentCode) {
      onError('Invalid verification code. Please check the code and try again.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      onError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      onError('New passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const msg = await customerResetPassword(recoveryIdentifier.trim(), newPassword);
      setLoading(false);
      setRecoverySuccessMsg(msg);
      setLoginIdentifier(recoveryIdentifier.trim());
      setTimeout(() => {
        setMode('login');
        setRecoverySuccessMsg('');
      }, 2000);
    } catch (err: any) {
      setLoading(false);
      onError(err.message || 'Password reset failed. Please check your account details.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!loginIdentifier.trim() || !password) {
          onError('Please enter your Phone Number or Email and Password.');
          setLoading(false);
          return;
        }

        const res = await customerLogin(loginIdentifier.trim(), password, rememberMe);
        setLoading(false);
        onSuccess(res.user, res.token, `Welcome back, ${res.user.name}! 👋`);
        onClose();
      } else if (mode === 'signup') {
        if (!phone.trim() || !password) {
          onError('Please enter your Mobile Phone Number and Password.');
          setLoading(false);
          return;
        }

        if (password.length < 4) {
          onError('Password must be at least 4 characters long.');
          setLoading(false);
          return;
        }

        const res = await customerSignup({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim(),
          password,
          address: address.trim() || undefined
        }, rememberMe);

        setLoading(false);
        onSuccess(res.user, res.token, `Account created! Welcome to Cheez O'Clock, ${res.user.name}! 🎉`);
        onClose();
      }
    } catch (err: any) {
      setLoading(false);
      onError(err.message || 'Authentication error. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#2C0202] rounded-3xl border border-[#FFB703]/40 overflow-hidden shadow-2xl my-6 text-[#FFFBEB]"
        >
          {/* Top Header */}
          <div className="p-6 bg-[#1A0101] border-b border-[#FFB703]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FFB703] text-[#3B0202]">
                {mode === 'login' ? (
                  <LogIn className="w-5 h-5 stroke-[2.5]" />
                ) : mode === 'signup' ? (
                  <UserPlus className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <KeyRound className="w-5 h-5 stroke-[2.5]" />
                )}
              </div>
              <div>
                <h2 className="font-display text-2xl tracking-wide text-[#FFFBEB]">
                  {mode === 'login' ? 'CUSTOMER LOGIN' : mode === 'signup' ? 'EASY SIGN UP' : 'ACCOUNT RECOVERY'}
                </h2>
                <p className="text-xs text-[#FFD166] mt-0.5">
                  {checkoutGateNote
                    ? '⚡ Please log in or sign up to complete checkout'
                    : mode === 'login'
                    ? 'Access your saved orders & history'
                    : mode === 'signup'
                    ? 'Instant order placement in seconds!'
                    : 'Reset your password in 2 easy steps'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#3B0202] text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Google Sign In (for login / signup modes) */}
          {mode !== 'forgot' && (
            <div className="p-6 pb-2 space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-3 px-4 rounded-xl bg-white text-gray-800 font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:bg-gray-100 transition-all cursor-pointer border border-gray-200 active:scale-98"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-gray-400">or with Phone / Email</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 bg-[#1A0101]/60 px-6 py-1 border-b border-[#FFB703]/10">
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#FFB703] text-[#3B0202] shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign Up (Fast)
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#FFB703] text-[#3B0202] shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Log In
            </button>
          </div>

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' ? (
            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              {recoverySuccessMsg ? (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p>{recoverySuccessMsg}</p>
                  <p className="text-[10px] text-gray-300">Redirecting to login...</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Your Registered Mobile Phone or Email <span className="text-[#C8102E]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={recoveryIdentifier}
                        onChange={(e) => setRecoveryIdentifier(e.target.value)}
                        placeholder="e.g. 03001234567 or email@domain.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-300">
                        Security Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={handleSendRecoveryCode}
                        className="text-[11px] text-[#FFB703] font-bold hover:underline cursor-pointer"
                      >
                        {sentCode ? 'Resend Code' : 'Get Recovery Code'}
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Set New Password <span className="text-[#C8102E]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password (min 4 chars)"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Confirm New Password <span className="text-[#C8102E]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-[#3B0202] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <span>RESETTING PASSWORD...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                        <span>UPDATE & RESET PASSWORD</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          ) : (
            /* LOGIN & SIGNUP FORM */
            <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-3.5">
              {mode === 'login' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Mobile Phone or Email <span className="text-[#C8102E]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="03001234567 or email@domain.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Mobile Phone Number <span className="text-[#C8102E]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 03001234567"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. name@example.com"
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A0101] border border-[#FFB703]/20 text-white text-xs focus:outline-none focus:border-[#FFB703]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-300">
                    Password <span className="text-[#C8102E]">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-[#FFB703] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Forgot Password?</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ali Ahmed"
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A0101] border border-[#FFB703]/20 text-white text-xs focus:outline-none focus:border-[#FFB703]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Delivery Address in Rawalpindi (Optional)
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House/Street details in Rawalpindi"
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A0101] border border-[#FFB703]/20 text-white text-xs focus:outline-none focus:border-[#FFB703]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Remember Me Option */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 accent-[#FFB703] cursor-pointer"
                  />
                  <span>Remember Me on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-[#3B0202] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>PLEASE WAIT...</span>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                    <span>LOGIN TO MY ACCOUNT</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>CREATE MY ACCOUNT & CONTINUE</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer navigation */}
          <div className="p-4 bg-[#1A0101]/80 text-center border-t border-white/5 text-xs text-gray-400">
            {mode === 'forgot' ? (
              <p>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#FFB703] font-bold hover:underline cursor-pointer"
                >
                  Back to Log In
                </button>
              </p>
            ) : mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[#FFB703] font-bold hover:underline cursor-pointer"
                >
                  Quick Sign up with Phone
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#FFB703] font-bold hover:underline cursor-pointer"
                >
                  Log in here
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
