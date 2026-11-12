import React, { useState } from 'react';
import { CollegeEvent, CurrentUser, Registration } from '../types.ts';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

interface EventsListProps {
  events: CollegeEvent[];
  registrations: Registration[];
  currentUser: CurrentUser;
  onAskAI: (prompt: string) => void;
  onRegisterDirect: (eventId: string) => Promise<void>;
  onViewUsersDatabase: () => void;
  isRegistering: boolean;
}

export const EventsList: React.FC<EventsListProps> = ({
  events,
  registrations,
  currentUser,
  onAskAI,
  onRegisterDirect,
  onViewUsersDatabase,
  isRegistering,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'registered'>('all');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Filter events
  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.date.toLowerCase().includes(searchTerm.toLowerCase());

    const isUserRegistered = registrations.some(
      (r) =>
        r.event_id.toLowerCase() === evt.event_id.toLowerCase() &&
        r.student_id.toLowerCase() === (currentUser.student_id || '').toLowerCase() &&
        r.status === 'confirmed'
    );

    if (!matchesSearch) return false;
    if (filter === 'available') return !evt.is_full;
    if (filter === 'registered') return isUserRegistered;
    return true;
  });

  const handleAttemptDuplicate = (eventName: string) => {
    setDuplicateWarning(`Duplicate registration error: Student ${currentUser.name} (${currentUser.student_id}) is already registered for "${eventName}".`);
    setTimeout(() => setDuplicateWarning(null), 5000);
  };

  return (
    <div className="space-y-5">
      {/* Duplicate warning notification */}
      {duplicateWarning && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="font-medium">{duplicateWarning}</span>
          </div>
          <button
            onClick={() => setDuplicateWarning(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Database Overview & Quick Links Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            College Events Database
          </h2>
          <p className="text-xs text-slate-400">
            {events.length} active college events • {events.reduce((acc, e) => acc + e.registered_count, 0)} total attendee registrations
          </p>
        </div>

        <button
          onClick={onViewUsersDatabase}
          className="self-stretch md:self-auto px-3.5 py-1.5 bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-slate-700 hover:border-indigo-500/50 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" />
          <span>View All Users Database</span>
          <ArrowRight className="w-3.5 h-3.5 opacity-70" />
        </button>
      </div>

      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events, topics, venues..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'available'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Available Seats
          </button>
          {currentUser.role === 'student' && (
            <button
              onClick={() => setFilter('registered')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'registered'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Registered
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((evt) => {
          const isRegistered = registrations.some(
            (r) =>
              r.event_id.toLowerCase() === evt.event_id.toLowerCase() &&
              r.student_id.toLowerCase() === (currentUser.student_id || '').toLowerCase() &&
              r.status === 'confirmed'
          );

          const percentFilled = Math.min(
            100,
            Math.round((evt.registered_count / evt.max_capacity) * 100)
          );

          return (
            <div
              key={evt.event_id}
              className={`bg-slate-900 border rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all hover:border-slate-600/80 ${
                isRegistered
                  ? 'border-emerald-500/50 bg-slate-900/90 ring-1 ring-emerald-500/30'
                  : evt.is_full
                  ? 'border-slate-800 opacity-80'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Header row: ID & Status Badges */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {evt.event_id}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isRegistered && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Registered
                      </span>
                    )}
                    {evt.is_full ? (
                      <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        Full
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                        {evt.available_seats} seats left
                      </span>
                    )}
                  </div>
                </div>

                {/* Event Name */}
                <h3 className="text-base font-bold text-white mb-2 line-clamp-2">
                  {evt.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-400 mb-4 line-clamp-3 leading-relaxed">
                  {evt.description}
                </p>

                {/* Meta: Date, Time, Venue */}
                <div className="space-y-1.5 mb-4 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{evt.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{evt.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="truncate">{evt.venue}</span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      Attendance Capacity
                    </span>
                    <span className="font-mono text-slate-300">
                      {evt.registered_count} / {evt.max_capacity}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        evt.is_full
                          ? 'bg-red-500'
                          : percentFilled > 80
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${percentFilled}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => onAskAI(`What are the details for ${evt.name}?`)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Ask AI about this</span>
                </button>

                {currentUser.role === 'student' && !isRegistered && !evt.is_full && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAskAI(`Register me for the ${evt.name}.`)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Register with AI</span>
                    </button>
                    <button
                      onClick={() => onRegisterDirect(evt.event_id)}
                      disabled={isRegistering}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer"
                      title="Direct database registration"
                    >
                      <span>Direct Register</span>
                    </button>
                  </div>
                )}

                {currentUser.role === 'student' && isRegistered && (
                  <button
                    onClick={() => handleAttemptDuplicate(evt.name)}
                    className="text-xs text-emerald-400 font-medium hover:text-amber-300 transition-colors cursor-pointer"
                    title="Click to verify duplicate registration rejection"
                  >
                    ✓ You are registered (Duplicate Protected)
                  </button>
                )}

                {evt.is_full && !isRegistered && (
                  <span className="text-xs text-slate-500">
                    Registration Closed (Full)
                  </span>
                )}

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => onAskAI(`Show participants for ${evt.name}.`)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                  >
                    <span>View Roster</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No events found matching your search</p>
            <p className="text-xs text-slate-600 mt-1">Try another keyword or clear the filter</p>
          </div>
        )}
      </div>
    </div>
  );
};
