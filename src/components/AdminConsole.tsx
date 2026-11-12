import React, { useState } from 'react';
import { CollegeEvent, CurrentUser, DatabaseState } from '../types.ts';
import {
  Shield,
  Lock,
  Plus,
  Users,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface AdminConsoleProps {
  currentUser: CurrentUser;
  dbState: DatabaseState;
  onSwitchToAdmin: () => void;
  onAskAI: (prompt: string) => void;
  onRefreshDb: () => Promise<void>;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentUser,
  dbState,
  onSwitchToAdmin,
  onAskAI,
  onRefreshDb,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    dbState.events[0]?.event_id || ''
  );
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CollegeEvent | null>(null);

  // New Event Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('25 October 2026');
  const [newTime, setNewTime] = useState('2:00 PM');
  const [newVenue, setNewVenue] = useState('Auditorium A');
  const [newCapacity, setNewCapacity] = useState('100');

  // Edit Event Form State
  const [editVenue, setEditVenue] = useState('');
  const [editCapacity, setEditCapacity] = useState('');

  // Access control check
  if (currentUser.role !== 'admin') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-2xl mx-auto text-center shadow-2xl my-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">
          Administrator Authorization Required
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          In accordance with the College Event Management System security policy, participant rosters and event management actions are strictly restricted to authenticated administrators.
        </p>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-6 text-left max-w-md mx-auto text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-slate-200">Current Session:</p>
          <p className="text-slate-400">Student: {currentUser.name} ({currentUser.student_id})</p>
          <p className="text-slate-400">Course: {currentUser.course}</p>
        </div>
        <button
          onClick={onSwitchToAdmin}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-2 mx-auto cursor-pointer"
        >
          <Shield className="w-4 h-4 text-amber-300" />
          Switch to Dr. Sarah Vance (Administrator)
        </button>
      </div>
    );
  }

  // Active Admin View
  const selectedEvent =
    dbState.events.find((e) => e.event_id === selectedEventId) || dbState.events[0];

  const participants = dbState.registrations
    .filter((r) => r.event_id === selectedEvent?.event_id && r.status === 'confirmed')
    .map((r) => {
      const stu = dbState.students.find((s) => s.student_id === r.student_id);
      return {
        registration_id: r.registration_id,
        student_id: r.student_id,
        name: stu?.name || 'Unknown Student',
        email: stu?.email || 'N/A',
        course: stu?.course || 'N/A',
        registration_date: r.registration_date,
        calendar_status: r.calendar_status,
      };
    });

  const totalCapacity = dbState.events.reduce((acc, e) => acc + e.max_capacity, 0);
  const totalRegistrations = dbState.registrations.filter((r) => r.status === 'confirmed').length;
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreateError(null);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', role: 'admin' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || 'College workshop seminar',
          date: newDate,
          time: newTime,
          venue: newVenue,
          max_capacity: parseInt(newCapacity, 10) || 50,
        }),
      });
      if (res.ok) {
        setIsCreating(false);
        setNewName('');
        setNewDesc('');
        setCreateError(null);
        await onRefreshDb();
      } else {
        const data = await res.json();
        setCreateError(data.error || 'Failed to create event. An event with this name or venue might already exist.');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Network error creating event');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const res = await fetch(`/api/events/${editingEvent.event_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', role: 'admin' },
        body: JSON.stringify({
          venue: editVenue || editingEvent.venue,
          max_capacity: parseInt(editCapacity, 10) || editingEvent.max_capacity,
        }),
      });
      if (res.ok) {
        setEditingEvent(null);
        await onRefreshDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event and its registrations?')) return;
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { role: 'admin' },
      });
      if (res.ok) {
        await onRefreshDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs text-slate-400 font-medium">Total Active Events</span>
          <p className="text-2xl font-bold text-white mt-1">{dbState.events.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs text-slate-400 font-medium">Total Registered Students</span>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{totalRegistrations}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs text-slate-400 font-medium">System Occupancy Rate</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{occupancyPercent}%</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs text-slate-400 font-medium">At Maximum Capacity</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {dbState.events.filter((e) => e.is_full).length} Event(s)
          </p>
        </div>
      </div>

      {/* Main Admin Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Event Management List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Manage College Events
            </h3>
            <button
              onClick={() => setIsCreating(true)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {dbState.events.map((evt) => {
              const isSelected = selectedEvent?.event_id === evt.event_id;
              return (
                <div
                  key={evt.event_id}
                  onClick={() => setSelectedEventId(evt.event_id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/60 shadow-sm ring-1 ring-indigo-500/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-slate-400 text-[11px]">{evt.event_id}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        evt.is_full
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {evt.registered_count} / {evt.max_capacity} Seats
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-200 line-clamp-1 mb-1">{evt.name}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {evt.venue}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEvent(evt);
                        setEditVenue(evt.venue);
                        setEditCapacity(evt.max_capacity.toString());
                      }}
                      className="p-1 hover:text-indigo-300 text-slate-400"
                      title="Edit event"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(evt.event_id);
                      }}
                      className="p-1 hover:text-red-400 text-slate-400"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (2 cols wide): Participant Roster for Selected Event */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">
                Authorized Participant Roster
              </span>
              <h3 className="text-base font-bold text-white">
                {selectedEvent?.name}
              </h3>
            </div>
            <button
              onClick={() =>
                onAskAI(`Show participants for ${selectedEvent?.name}.`)
              }
              className="self-start sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Query via AI</span>
            </button>
          </div>

          {/* Roster table */}
          {participants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="py-2.5 px-3 font-semibold">Student ID</th>
                    <th className="py-2.5 px-3 font-semibold">Name</th>
                    <th className="py-2.5 px-3 font-semibold">Email</th>
                    <th className="py-2.5 px-3 font-semibold">Course</th>
                    <th className="py-2.5 px-3 font-semibold">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {participants.map((p) => (
                    <tr key={p.registration_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">
                        {p.student_id}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-200">{p.name}</td>
                      <td className="py-2.5 px-3 text-slate-400">{p.email}</td>
                      <td className="py-2.5 px-3 text-slate-400">{p.course}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {new Date(p.registration_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800/60">
              <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs font-medium text-slate-400">
                No students currently registered for this event
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Event */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Create New College Event</h3>
            <p className="text-xs text-slate-400 mb-4">Add a new seminar, workshop, or lab session</p>
            {createError && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-red-200">Duplicate / Validation Error</span>
                  <span className="leading-relaxed">{createError}</span>
                </div>
              </div>
            )}
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. AI Workshop: Autonomous Agents"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Hands-on workshop details..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date</label>
                  <input
                    type="text"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Venue</label>
                  <input
                    type="text"
                    required
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Maximum Capacity</label>
                  <input
                    type="number"
                    required
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Event */}
      {editingEvent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Update Event Details</h3>
            <p className="text-xs text-slate-400 mb-4">{editingEvent.name}</p>
            <form onSubmit={handleUpdateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Venue</label>
                <input
                  type="text"
                  value={editVenue}
                  onChange={(e) => setEditVenue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Maximum Capacity</label>
                <input
                  type="number"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
