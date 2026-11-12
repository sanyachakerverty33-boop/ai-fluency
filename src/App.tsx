import React, { useState, useEffect } from 'react';
import { Header, PRESET_USERS } from './components/Header.tsx';
import { ChatAssistant } from './components/ChatAssistant.tsx';
import { EventsList } from './components/EventsList.tsx';
import { MyRegistrations } from './components/MyRegistrations.tsx';
import { AdminConsole } from './components/AdminConsole.tsx';
import { DatabaseViewer } from './components/DatabaseViewer.tsx';
import { UsersDatabaseViewer } from './components/UsersDatabaseViewer.tsx';
import { CurrentUser, DatabaseState, ChatMessage } from './types.ts';
import {
  Bot,
  Calendar,
  Ticket,
  Shield,
  Database,
  Users,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(PRESET_USERS[0]);
  const [activeTab, setActiveTab] = useState<'assistant' | 'events' | 'users' | 'registrations' | 'admin' | 'database'>('assistant');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [dbState, setDbState] = useState<DatabaseState>({
    students: [],
    users: [],
    events: [],
    registrations: [],
    admin: {
      admin_id: 'ADM-001',
      name: 'Dr. Sarah Vance',
      email: 's.vance@college.edu',
      role: 'admin',
    },
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'assistant',
      text: `Hello ${PRESET_USERS[0].name}! I am your College Event Management AI Assistant.\n\nI help manage live events, enforce single-registration rules, and sync confirmations to Google Calendar.\n\nTry asking:\n• "Which AI workshops are happening this month?"\n• "Register me for the AI workshop."\n• "Am I registered for the Business Analytics Workshop?"\n• "Show my registrations."`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Fetch live database state
  const fetchDbState = async () => {
    try {
      const res = await fetch('/api/database/state');
      if (res.ok) {
        const data = await res.json();
        setDbState(data);
      }
    } catch (err) {
      console.error('Failed to fetch database state:', err);
    }
  };

  useEffect(() => {
    fetchDbState();
  }, []);

  // Update greeting when user persona changes
  const handleUserChange = (newUser: CurrentUser) => {
    setCurrentUser(newUser);
    const greetingText =
      newUser.role === 'admin'
        ? `Switched session to Dr. Sarah Vance (Administrator).\n\nYou have full privileges to create events, update venues/capacity, delete events, and view live participant rosters.\n\nTry asking:\n• "Show participants for the AI workshop."\n• "Create an AI workshop on 25 October at 2 PM in Auditorium A with capacity 100"\n• "Show all users in the database."`
        : `Switched session to student ${newUser.name} (${newUser.student_id}).\n\nYou can search events, check personal registrations, and register for workshops.\n\nTry asking:\n• "Show my registrations."\n• "Register me for the AI workshop."`;

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-switch-${Date.now()}`,
        sender: 'assistant',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Reset database to initial seed
  const handleResetDb = async () => {
    setIsResetting(true);
    setGlobalError(null);
    try {
      const res = await fetch('/api/database/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDbState(data.state);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-reset-${Date.now()}`,
            sender: 'assistant',
            text: 'System database has been reset to initial seed data. All capacities and default registrations are restored.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to reset DB:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Send message to AI assistant
  const handleSendMessage = async (text: string) => {
    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: (m.sender === 'assistant' ? 'model' : 'user') as 'model' | 'user',
        text: m.text,
      }));

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          currentUser,
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned an error');
      }

      const data = await res.json();

      // Check if any tool returned a duplicate error or validation error to show toast
      const duplicateErrorLog = data.toolLogs?.find((t: any) =>
        t.result?.success === false &&
        (t.result?.error?.toLowerCase().includes('duplicate') ||
         t.result?.error?.toLowerCase().includes('already registered') ||
         t.result?.error?.toLowerCase().includes('already exists'))
      );

      if (duplicateErrorLog) {
        setGlobalError(duplicateErrorLog.result.error);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'Action completed.',
        toolLogs: data.toolLogs || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (data.dbState) {
        setDbState(data.dbState);
      } else {
        await fetchDbState();
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: 'An error occurred while communicating with the assistant. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct registration trigger with duplicate check
  const handleRegisterDirect = async (eventId: string) => {
    const targetEvent = dbState.events.find((e) => e.event_id === eventId);
    const eventName = targetEvent?.name || eventId;

    // Check if already registered on the client before calling
    const isAlready = dbState.registrations.some(
      (r) =>
        r.event_id.toLowerCase() === eventId.toLowerCase() &&
        r.student_id.toLowerCase() === (currentUser.student_id || '').toLowerCase() &&
        r.status === 'confirmed'
    );

    if (isAlready) {
      setGlobalError(`Duplicate registration error: Student ${currentUser.name} (${currentUser.student_id}) is already registered for "${eventName}". Duplicate registrations are not permitted.`);
      return;
    }

    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: currentUser.student_id,
          event_id: eventId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setGlobalError(data.error || 'Registration failed');
      } else {
        await fetchDbState();
        setActiveTab('registrations');
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Error executing registration');
    }
  };

  const handleAskAI = (prompt: string) => {
    setActiveTab('assistant');
    handleSendMessage(prompt);
  };

  // Count current user registrations
  const studentRegCount = dbState.registrations.filter(
    (r) =>
      r.student_id.toLowerCase() === (currentUser.student_id || '').toLowerCase() &&
      r.status === 'confirmed'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onResetDb={handleResetDb}
        isResetting={isResetting}
      />

      {/* Global Error Alert Banner (e.g. Duplicate Registration / Duplicate Event) */}
      {globalError && (
        <div className="bg-red-500/15 border-b border-red-500/30 text-red-200 px-4 py-3 flex items-center justify-between text-xs sm:text-sm animate-fadeIn">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-red-300 mr-2">Integrity Error:</span>
                <span>{globalError}</span>
              </div>
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors ml-4"
              title="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5 overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 1. AI Assistant Tab */}
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Bot className="w-4 h-4 text-indigo-300" />
              <span>AI Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>

            {/* 2. All Events Database Tab */}
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-300" />
              <span>Events Database</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {dbState.events.length}
              </span>
            </button>

            {/* 3. All Users Database Tab */}
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-300" />
              <span>All Users Database</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {dbState.users?.length || dbState.students.length + 1}
              </span>
            </button>

            {/* 4. My Registrations Tab (for student) */}
            {currentUser.role === 'student' && (
              <button
                onClick={() => setActiveTab('registrations')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'registrations'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                <Ticket className="w-4 h-4 text-indigo-300" />
                <span>My Registrations</span>
                {studentRegCount > 0 && (
                  <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    {studentRegCount}
                  </span>
                )}
              </button>
            )}

            {/* 5. Admin Console Tab */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-300" />
              <span>Admin Console</span>
              {currentUser.role === 'admin' && (
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                  Active
                </span>
              )}
            </button>

            {/* 6. Raw Database Inspector Tab */}
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Database className="w-4 h-4 text-indigo-300" />
              <span className="hidden sm:inline">Database Inspector</span>
              <span className="sm:hidden">DB</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1">
          {activeTab === 'assistant' && (
            <ChatAssistant
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'events' && (
            <EventsList
              events={dbState.events}
              registrations={dbState.registrations}
              currentUser={currentUser}
              onAskAI={handleAskAI}
              onRegisterDirect={handleRegisterDirect}
              onViewUsersDatabase={() => setActiveTab('users')}
              isRegistering={isLoading}
            />
          )}

          {activeTab === 'users' && (
            <UsersDatabaseViewer
              dbState={dbState}
              currentUser={currentUser}
              onSwitchUser={(user) => {
                handleUserChange(user);
                setActiveTab('assistant');
              }}
              onAskAI={handleAskAI}
            />
          )}

          {activeTab === 'registrations' && (
            <MyRegistrations
              currentUser={currentUser}
              registrations={dbState.registrations}
              events={dbState.events}
              onAskAI={handleAskAI}
              onNavigateToEvents={() => setActiveTab('events')}
            />
          )}

          {activeTab === 'admin' && (
            <AdminConsole
              currentUser={currentUser}
              dbState={dbState}
              onSwitchToAdmin={() => {
                const adminUser = PRESET_USERS.find((u) => u.role === 'admin');
                if (adminUser) handleUserChange(adminUser);
              }}
              onAskAI={handleAskAI}
              onRefreshDb={fetchDbState}
            />
          )}

          {activeTab === 'database' && (
            <DatabaseViewer dbState={dbState} onRefresh={fetchDbState} />
          )}
        </div>
      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500">
        College Event Management AI Assistant • Enforcing capacity limits, duplicate registration & event protection, and Google Calendar sync.
      </footer>
    </div>
  );
}
