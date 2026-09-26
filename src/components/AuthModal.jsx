import React, { useState } from 'react';
import { X, Lock, Mail, Key, UserPlus, LogIn } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onSuccess, initialReason }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Temporary client-side mock authentication until cloud backend is configured
    if (email && password) {
      const mockUser = { email, name: email.split('@')[0] };
      onSuccess(mockUser);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden">
      <div className="relative w-full max-w-md bg-[#0a0f1d] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
        
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-cyan-400/10 border border-cyan-400/30 rounded-xl text-cyan-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {isSignUp ? 'Create an Account' : 'Sign In to Proceed'}
            </h2>
            <p className="text-xs text-slate-400">
              {initialReason || 'Sync your charts and setlists across all devices.'}
            </p>
          </div>
        </div>

        {/* GUEST WARNING BANNER */}
        <div className="mb-5 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs">
          <strong>Note:</strong> Unregistered guest charts and setlists are stored locally in this browser. Creating an account backs them up safely to the cloud.
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="worship.leader@church.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-cyan-400 hover:bg-white text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
          >
            {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {isSignUp ? 'Create Account & Save Data' : 'Sign In'}
          </button>
        </form>

        {/* TOGGLE TAB */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-cyan-400 hover:underline font-bold"
            >
              {isSignUp ? 'Sign In' : 'Create One'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}