import React from 'react';
import { CurrentUser } from '../types.ts';
import { Sparkles, User, Shield, RotateCcw, GraduationCap, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentUser: CurrentUser;
  onUserChange: (user: CurrentUser) => void;
  onResetDb: () => void;
  isResetting: boolean;
}

export const PRESET_USERS: CurrentUser[] = [
  {
    role: 'student',
    student_id: 'STU-101',
    name: 'Alex Rivera',
    email: 'alex.rivera@college.edu',
    course: 'Computer Science, B.S.',
  },
  {
    role: 'student',
    student_id: 'STU-102',
    name: 'Priya Sharma',
    email: 'priya.sharma@college.edu',
    course: 'Data Science & AI, M.S.',
  },
  {
    role: 'student',
    student_id: 'STU-103',
    name: 'Marcus Chen',
    email: 'marcus.chen@college.edu',
    course: 'Business Analytics, B.S.',
  },
  {
    role: 'admin',
    name: 'Dr. Sarah Vance',
    email: 's.vance@college.edu',
  },
];

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  onResetDb,
  isResetting,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                  College Event Management
                </span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  AI Assistant
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Authenticated workshop & seminar assistant with live database tool-calling
              </p>
            </div>
          </div>

          {/* Right Controls: Persona Switcher & Reset */}
          <div className="flex items-center space-x-3">
            {/* Active Identity Selector */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg p-1">
              <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-slate-300">
                {currentUser.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="hidden md:inline text-slate-400">Authenticated:</span>
              </div>
              <select
                value={currentUser.student_id || 'admin'}
                onChange={(e) => {
                  const val = e.target.value;
                  const match = PRESET_USERS.find(
                    (u) => (u.student_id || 'admin') === val
                  );
                  if (match) onUserChange(match);
                }}
                className="bg-slate-900 text-xs text-white font-medium border border-slate-700 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {PRESET_USERS.map((u) => (
                  <option key={u.student_id || 'admin'} value={u.student_id || 'admin'}>
                    {u.role === 'admin'
                      ? `🛡️ ${u.name} (Admin)`
                      : `🎓 ${u.name} (${u.student_id})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Database Button */}
            <button
              onClick={onResetDb}
              disabled={isResetting}
              title="Reset database to seed records"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset DB</span>
            </button>
          </div>
        </div>

        {/* Current User Quick Info Bar */}
        <div className="py-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="text-slate-500">Active Session:</span>
            <span className="font-semibold text-slate-200">{currentUser.name}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">{currentUser.email}</span>
            {currentUser.role === 'student' ? (
              <>
                <span className="text-slate-600">•</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded text-[11px] font-mono">
                  {currentUser.student_id}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 truncate max-w-[200px]">{currentUser.course}</span>
              </>
            ) : (
              <>
                <span className="text-slate-600">•</span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded text-[11px] font-semibold">
                  Administrator Privileges
                </span>
              </>
            )}
          </div>
          <div className="hidden lg:flex items-center gap-1.5 text-emerald-400 text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            <span>Live Tools Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
