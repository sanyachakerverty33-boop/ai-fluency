import React, { useState } from 'react';
import { AppUser, CurrentUser, DatabaseState } from '../types.ts';
import {
  Users,
  Shield,
  GraduationCap,
  Search,
  Filter,
  ArrowRight,
  Ticket,
  Mail,
  BookOpen,
  CheckCircle2,
  Download,
  Sparkles,
} from 'lucide-react';

interface UsersDatabaseViewerProps {
  dbState: DatabaseState;
  currentUser: CurrentUser;
  onSwitchUser: (user: CurrentUser) => void;
  onAskAI: (prompt: string) => void;
}

export const UsersDatabaseViewer: React.FC<UsersDatabaseViewerProps> = ({
  dbState,
  currentUser,
  onSwitchUser,
  onAskAI,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  const users = dbState.users || [];

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.course && u.course.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return true;
  });

  const studentsCount = users.filter((u) => u.role === 'student').length;
  const adminsCount = users.filter((u) => u.role === 'admin').length;
  const totalRegisteredTickets = users.reduce((acc, u) => acc + (u.registered_events_count || 0), 0);

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `college_app_users_database_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total App Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
          <span className="text-[11px] text-slate-500">Live profiles in database</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Enrolled Students</span>
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{studentsCount}</p>
          <span className="text-[11px] text-slate-500">Eligible for registration</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Administrators</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1">{adminsCount}</p>
          <span className="text-[11px] text-slate-500">Faculty & event staff</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Enrollments</span>
            <Ticket className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{totalRegisteredTickets}</p>
          <span className="text-[11px] text-slate-500">Total event registrations</span>
        </div>
      </div>

      {/* Main Database Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              All Users of the App Database
            </h3>
            <p className="text-xs text-slate-400">
              Live schema containing authenticated student profiles and administrator accounts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAskAI('Show all users in the database.')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Query via AI</span>
            </button>
            <button
              onClick={exportJson}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user ID, name, email, course..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                roleFilter === 'all'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('student')}
              className={`px-3 py-1 rounded-md transition-colors ${
                roleFilter === 'student'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Students ({studentsCount})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1 rounded-md transition-colors ${
                roleFilter === 'admin'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admins ({adminsCount})
            </button>
          </div>
        </div>

        {/* Database Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="py-3 px-3.5 font-semibold">User ID</th>
                <th className="py-3 px-3.5 font-semibold">Name & Role</th>
                <th className="py-3 px-3.5 font-semibold">Email</th>
                <th className="py-3 px-3.5 font-semibold">Course / Department</th>
                <th className="py-3 px-3.5 font-semibold">Registered Events</th>
                <th className="py-3 px-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => {
                const isCurrentActive =
                  (currentUser.student_id && currentUser.student_id.toLowerCase() === u.user_id.toLowerCase()) ||
                  (currentUser.role === 'admin' && u.role === 'admin');

                return (
                  <tr
                    key={u.user_id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isCurrentActive ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* User ID */}
                    <td className="py-3 px-3.5 font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          u.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {u.user_id}
                      </span>
                    </td>

                    {/* Name & Role */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{u.name}</span>
                        {isCurrentActive && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-bold">
                            Active Session
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        {u.role === 'admin' ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Administrator
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-emerald-400" /> Student
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-3.5 text-slate-300 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {u.email}
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3 px-3.5 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-slate-500" />
                        <span className="line-clamp-1">{u.course || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Registered Events */}
                    <td className="py-3 px-3.5">
                      {u.role === 'admin' ? (
                        <span className="text-[11px] text-slate-500 italic">
                          Staff / Host
                        </span>
                      ) : (
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              (u.registered_events_count || 0) > 0
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <Ticket className="w-3 h-3" />
                            {u.registered_events_count || 0} Registered
                          </span>

                          {u.registered_event_names && u.registered_event_names.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1 max-w-[250px]">
                              {u.registered_event_names.map((name, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.2 rounded border border-slate-800 truncate max-w-[200px]"
                                  title={name}
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions: Quick Switch */}
                    <td className="py-3 px-3.5 text-right">
                      {!isCurrentActive ? (
                        <button
                          onClick={() => {
                            if (u.role === 'admin') {
                              onSwitchUser({
                                role: 'admin',
                                name: u.name,
                                email: u.email,
                              });
                            } else {
                              onSwitchUser({
                                role: 'student',
                                student_id: u.user_id,
                                name: u.name,
                                email: u.email,
                                course: u.course,
                              });
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title={`Switch session to ${u.name}`}
                        >
                          <span>Switch to User</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-indigo-400 font-medium flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Logged In
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
