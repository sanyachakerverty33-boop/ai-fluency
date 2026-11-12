import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CurrentUser, ToolLogEntry } from '../types.ts';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Wrench,
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Info,
  Clock,
  Layers,
} from 'lucide-react';

interface ChatAssistantProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  currentUser: CurrentUser;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  messages,
  onSendMessage,
  isLoading,
  currentUser,
}) => {
  const [input, setInput] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    await onSendMessage(text);
  };

  const toggleLog = (messageId: string) => {
    setExpandedLogs((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const studentPrompts = [
    'Which AI workshops are happening this month?',
    'Register me for the AI workshop.',
    'Am I registered for the Business Analytics Workshop?',
    'Show my registrations.',
    'How many students have registered for the AI workshop?',
    'Show participants for the AI workshop.', // tests security enforcement!
  ];

  const adminPrompts = [
    'Show all users in the database.',
    'Show participants for the AI workshop.',
    'Create an AI workshop on 18 October at 2 PM in Auditorium A with capacity 50', // tests duplicate event error!
    'Change the AI workshop venue to Seminar Hall 2.',
    'How many students have registered for the AI workshop?',
    'Delete the AI workshop.',
  ];

  const activePrompts = currentUser.role === 'admin' ? adminPrompts : studentPrompts;

  // Extract calendar URL if present in toolLogs or text
  const extractCalendarUrl = (toolLogs?: ToolLogEntry[]): string | null => {
    if (!toolLogs) return null;
    const calTool = toolLogs.find((t) => t.tool === 'create_calendar_event' && t.result?.data?.calendar_url);
    if (calTool) return calTool.result.data.calendar_url;
    const regTool = toolLogs.find((t) => t.tool === 'get_my_registrations');
    if (regTool?.result?.data?.registrations) {
      const regWithCal = regTool.result.data.registrations.find((r: any) => r.calendar_url);
      if (regWithCal) return regWithCal.calendar_url;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header bar of Chat Assistant */}
      <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
              Event Management AI Assistant
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            </h2>
            <p className="text-xs text-slate-400">
              Live database tool-calling with duplicate registration & conflict protection
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] bg-slate-700/60 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600/50">
            {currentUser.role === 'admin' ? '🛡️ Administrator Mode' : `🎓 Student Mode (${currentUser.student_id})`}
          </span>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const hasLogs = msg.toolLogs && msg.toolLogs.length > 0;
          const isLogOpen = expandedLogs[msg.id];
          const calUrl = extractCalendarUrl(msg.toolLogs);
          const isDuplicateOrError =
            !isUser &&
            (msg.text.toLowerCase().includes('duplicate') ||
             msg.text.toLowerCase().includes('already registered') ||
             msg.text.startsWith('Error:') ||
             msg.text.toLowerCase().includes('cannot register') ||
             msg.text.toLowerCase().includes('access denied'));

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Sender label & Timestamp */}
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                {isUser ? (
                  <>
                    <span>{currentUser.name}</span>
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span className="font-medium text-slate-300">College AI Assistant</span>
                    <Clock className="w-3 h-3 text-slate-500 ml-1" />
                    <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : isDuplicateOrError
                    ? 'bg-red-950/40 text-red-100 border border-red-500/40 rounded-tl-none whitespace-pre-wrap'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {isDuplicateOrError && (
                  <div className="flex items-center gap-1.5 text-red-400 font-semibold text-xs mb-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Integrity / Validation Notice:</span>
                  </div>
                )}
                {msg.text}

                {/* Direct Google Calendar action if a calendar event was created */}
                {!isUser && calUrl && (
                  <div className="mt-3 pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Google Calendar ready
                    </span>
                    <a
                      href={calUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Add to Google Calendar
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  </div>
                )}
              </div>

              {/* Backend Tool Execution Trace Accordion */}
              {!isUser && hasLogs && (
                <div className="mt-2 w-full max-w-[85%] sm:max-w-[78%]">
                  <button
                    onClick={() => toggleLog(msg.id)}
                    className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-mono text-[11px] text-indigo-300">
                        {msg.toolLogs!.length} backend tool{msg.toolLogs!.length > 1 ? 's' : ''} executed
                      </span>
                      <div className="flex gap-1">
                        {msg.toolLogs!.map((t, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              t.result?.success !== false
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {t.tool}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isLogOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {/* Expanded Tool Details */}
                  {isLogOpen && (
                    <div className="mt-1.5 p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2.5 font-mono text-xs">
                      {msg.toolLogs!.map((log, idx) => {
                        const isSuccess = log.result?.success !== false;
                        return (
                          <div
                            key={idx}
                            className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-md"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                {log.tool}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-sans uppercase font-bold tracking-wider ${
                                  isSuccess
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {isSuccess ? 'Executed' : 'Blocked / Error'}
                              </span>
                            </div>

                            {/* Arguments */}
                            {log.args && Object.keys(log.args).length > 0 && (
                              <div className="mb-1 text-[11px] text-slate-400">
                                <span className="text-slate-500">Parameters:</span>{' '}
                                <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded">
                                  {JSON.stringify(log.args)}
                                </code>
                              </div>
                            )}

                            {/* Result payload */}
                            <div className="text-[11px] text-slate-400">
                              <span className="text-slate-500">Database Output:</span>
                              <pre className="mt-1 p-2 bg-slate-950 text-slate-300 rounded overflow-x-auto text-[11px] border border-slate-800/80">
                                {JSON.stringify(log.result, null, 2)}
                              </pre>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-1">
            <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-400">
              <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
              <span>AI Assistant evaluating live database tools...</span>
            </div>
            <div className="bg-slate-800 border border-slate-700/80 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
              </div>
              <span className="text-xs text-slate-400 ml-2 font-mono">
                Executing backend query...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-slate-400 font-medium">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Quick prompt examples ({currentUser.role === 'admin' ? 'Admin' : 'Student'}):</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
          {activePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(prompt)}
              disabled={isLoading}
              className="text-xs whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer flex-shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Bar */}
      <div className="p-3 bg-slate-800/90 border-t border-slate-700/80">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              currentUser.role === 'admin'
                ? 'Ask AI to create, update, delete events or show participants...'
                : 'Ask AI to find events, register, check status, or sync calendar...'
            }
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-indigo-500/20 transition-all disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
