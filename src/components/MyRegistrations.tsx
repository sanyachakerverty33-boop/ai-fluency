import React from 'react';
import { CollegeEvent, CurrentUser, Registration } from '../types.ts';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Ticket,
  Sparkles,
} from 'lucide-react';

interface MyRegistrationsProps {
  currentUser: CurrentUser;
  registrations: Registration[];
  events: CollegeEvent[];
  onAskAI: (prompt: string) => void;
  onNavigateToEvents: () => void;
}

export const MyRegistrations: React.FC<MyRegistrationsProps> = ({
  currentUser,
  registrations,
  events,
  onAskAI,
  onNavigateToEvents,
}) => {
  const studentRegs = registrations.filter(
    (r) =>
      r.student_id.toLowerCase() === (currentUser.student_id || '').toLowerCase() &&
      r.status === 'confirmed'
  );

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-400" />
            My Registered Events
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Student: <span className="text-slate-200 font-medium">{currentUser.name}</span> (
            <span className="font-mono text-emerald-400">{currentUser.student_id}</span>) • {currentUser.course}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-full font-medium">
            {studentRegs.length} Active Registration{studentRegs.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Registrations List */}
      {studentRegs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentRegs.map((reg) => {
            const event = events.find(
              (e) => e.event_id.toLowerCase() === reg.event_id.toLowerCase()
            );

            const eventName = event?.name || 'Registered Event';
            const eventDate = event?.date || 'N/A';
            const eventTime = event?.time || 'N/A';
            const eventVenue = event?.venue || 'N/A';

            // Google Calendar template URL
            const calendarUrl =
              reg.calendar_url ||
              `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                eventName
              )}&details=${encodeURIComponent(
                `College Event: ${event?.description || ''}\nTime: ${eventTime}\nVenue: ${eventVenue}`
              )}&location=${encodeURIComponent(eventVenue)}`;

            return (
              <div
                key={reg.registration_id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge: Reg ID & Confirmation */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {reg.registration_id}
                    </span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Confirmed
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-2">
                    {eventName}
                  </h3>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>{eventDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>{eventTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>{eventVenue}</span>
                    </div>
                  </div>

                  {/* Registration Date Info */}
                  <p className="text-[11px] text-slate-500 mb-4">
                    Registered on: {new Date(reg.registration_date).toLocaleString()}
                  </p>
                </div>

                {/* Footer: Calendar & Ask AI */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Google Calendar</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>

                  <button
                    onClick={() => onAskAI(`Am I registered for ${eventName}?`)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Check with AI</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-xl p-8">
          <Ticket className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-300 mb-1">
            No Event Registrations Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
            You haven't registered for any workshops or seminars. You can ask the AI assistant: "Register me for the AI workshop" or explore available events.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onNavigateToEvents}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Browse Events Directory
            </button>
            <button
              onClick={() => onAskAI('Which AI workshops are happening this month?')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Ask AI for Workshops
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
