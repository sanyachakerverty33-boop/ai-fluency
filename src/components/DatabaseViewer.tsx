import React, { useState } from 'react';
import { DatabaseState } from '../types.ts';
import { Database, Table, RefreshCw, Download, Search, Users, Calendar, Ticket, ExternalLink } from 'lucide-react';

interface DatabaseViewerProps {
  dbState: DatabaseState;
  onRefresh: () => Promise<void>;
}

export const DatabaseViewer: React.FC<DatabaseViewerProps> = ({ dbState, onRefresh }) => {
  const [activeTable, setActiveTable] = useState<'events' | 'users' | 'registrations'>('events');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const users = dbState.users || [];
  const events = dbState.events || [];
  const registrations = dbState.registrations || [];

  // Filter events
  const filteredEvents = events.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter users
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.course && u.course.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter registrations
  const filteredRegistrations = registrations.filter(
    (r) =>
      r.registration_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.event_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCurrentTableJson = () => {
    let exportData: any = events;
    let filename = 'college_events_database.json';
    if (activeTable === 'users') {
      exportData = users;
      filename = 'college_users_database.json';
    } else if (activeTable === 'registrations') {
      exportData = registrations;
      filename = 'college_registrations_database.json';
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      {/* Table Selector & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-white">College System Database Explorer</h3>
            <p className="text-xs text-slate-400">
              Query and inspect raw relational tables (Events, Users, and Registrations)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Table Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => {
                setActiveTable('events');
                setSearchTerm('');
              }}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                activeTable === 'events'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>All Events Database ({events.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTable('users');
                setSearchTerm('');
              }}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                activeTable === 'users'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Users Database ({users.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTable('registrations');
                setSearchTerm('');
              }}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                activeTable === 'registrations'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Registrations ({registrations.length})</span>
            </button>
          </div>

          <button
            onClick={exportCurrentTableJson}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            title="Export table as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export</span>
          </button>

          <button
            onClick={handleRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors"
            title="Refresh database snapshot"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Input for Current Table */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search ${activeTable} database...`}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* TABLE 1: All Events Database */}
      {activeTable === 'events' && (
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-semibold">
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Event Name & Description</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Venue</th>
                <th className="py-2.5 px-3">Capacity</th>
                <th className="py-2.5 px-3">Registered</th>
                <th className="py-2.5 px-3">Available Seats</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredEvents.map((e) => (
                <tr key={e.event_id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 text-indigo-400 font-bold">{e.event_id}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="font-semibold text-slate-200 block">{e.name}</span>
                    <span className="text-[11px] text-slate-400 line-clamp-1">{e.description}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-sans whitespace-nowrap">
                    {e.date} • {e.time}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-sans">{e.venue}</td>
                  <td className="py-2.5 px-3 text-slate-300">{e.max_capacity}</td>
                  <td className="py-2.5 px-3 text-indigo-300">{e.registered_count}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{e.available_seats}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                        e.is_full
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {e.is_full ? 'FULL' : 'OPEN'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLE 2: All Users of the App Database */}
      {activeTable === 'users' && (
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-semibold">
                <th className="py-2.5 px-3">User ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Course / Department</th>
                <th className="py-2.5 px-3">Registered Events Count</th>
                <th className="py-2.5 px-3">Registered Events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-mono font-bold">
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
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{u.name}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        u.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">{u.email}</td>
                  <td className="py-2.5 px-3 text-slate-400">{u.course || 'N/A'}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">
                    {u.role === 'admin' ? '-' : u.registered_events_count || 0}
                  </td>
                  <td className="py-2.5 px-3">
                    {u.registered_event_names && u.registered_event_names.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {u.registered_event_names.map((name, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.2 rounded border border-slate-800"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLE 3: Registrations Database */}
      {activeTable === 'registrations' && (
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-semibold">
                <th className="py-2.5 px-3">Registration ID</th>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Registration Timestamp</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Google Calendar Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredRegistrations.map((r) => {
                const stu = dbState.students.find((s) => s.student_id === r.student_id);
                const evt = dbState.events.find((e) => e.event_id === r.event_id);

                return (
                  <tr key={r.registration_id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-indigo-400 font-bold">{r.registration_id}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="text-emerald-400 font-mono font-semibold block">{r.student_id}</span>
                      <span className="text-slate-300 text-[11px]">{stu?.name || 'Unknown'}</span>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="text-amber-400 font-mono font-semibold block">{r.event_id}</span>
                      <span className="text-slate-300 text-[11px] line-clamp-1">{evt?.name || 'Unknown Event'}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                      {new Date(r.registration_date).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                          r.calendar_status === 'added'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.calendar_status === 'added' ? 'SYNCED' : 'NONE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
