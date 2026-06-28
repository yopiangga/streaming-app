import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';

// Static password gate (front-end only — NOT real security; the password ships
// in the bundle). Placeholder until a real auth backend exists.
const ADMIN_PASSWORD = 'cawang';
const STORAGE_KEY = 'admin-authed';

const AuthGate = ({ children }) => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(STORAGE_KEY) === '1');
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (value === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setAuthed(true);
    } else {
      setError(true);
      setValue('');
    }
  };

  if (authed) return children;

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black text-zinc-100 font-sans">
      <form
        onSubmit={submit}
        className="w-full max-w-xs bg-zinc-950 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-6 shadow-2xl"
      >
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Shield size={28} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="font-bold text-lg">Hanoman Eyes</h1>
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold">Admin Login</p>
        </div>

        <div className="w-full">
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="password"
              autoFocus
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(false); }}
              placeholder="Password"
              className={`w-full bg-black/40 border rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors ${error ? 'border-red-500' : 'border-white/15 focus:border-indigo-500'}`}
            />
          </div>
          {error && <p className="text-[11px] text-red-400 mt-2">Password salah.</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-xl py-2.5 text-sm font-semibold"
        >
          Masuk
        </button>
      </form>
    </div>
  );
};

export default AuthGate;
