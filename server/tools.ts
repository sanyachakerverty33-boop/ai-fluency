import { FunctionDeclaration, Type } from '@google/genai';
import { db } from './db.ts';

export interface UserContext {
  role: 'student' | 'admin';
  student_id?: string;
  name: string;
  email: string;
  course?: string;
}

// Tool function declarations for Gemini API
export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_events',
    description: 'Find and search college events, workshops, and seminars by keyword, venue, or date. Returns event details, date, time, venue, max capacity, registered count, and available seats.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Keyword search query such as event title, topic, or venue (e.g., "AI", "Business", "Robotics").',
        },
        date: {
          type: Type.STRING,
          description: 'Optional date filter (e.g., "18 October", "October", "2026-10-18").',
        },
      },
    },
  },
  {
    name: 'get_event',
    description: 'Get full details for a specific event by event_id or event name.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        event_id: {
          type: Type.STRING,
          description: 'The unique Event ID (e.g., "EVT-101").',
        },
        name: {
          type: Type.STRING,
          description: 'The name or partial title of the event.',
        },
      },
    },
  },
  {
    name: 'check_registration',
    description: "Check if the authenticated student is already registered for an event.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        event_id: {
          type: Type.STRING,
          description: 'The ID of the event to check.',
        },
        event_name: {
          type: Type.STRING,
          description: 'The name of the event to check (if event_id is not known).',
        },
      },
    },
  },
  {
    name: 'get_my_registrations',
    description: "Get all confirmed registrations for the currently authenticated student.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'register_student',
    description: 'Register the authenticated student for an event. Verifies student identity, event existence, checks that the student is not already registered, and enforces maximum capacity.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        event_id: {
          type: Type.STRING,
          description: 'The unique Event ID to register for (e.g., "EVT-101").',
        },
        event_name: {
          type: Type.STRING,
          description: 'The name of the event if event_id is not known.',
        },
      },
    },
  },
  {
    name: 'get_registration_count',
    description: 'Get the number of student registrations and available seats for an event.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        event_id: {
          type: Type.STRING,
          description: 'The unique Event ID.',
        },
        event_name: {
          type: Type.STRING,
          description: 'The name of the event.',
        },
      },
    },
  },
  {
    name: 'get_event_registrations',
    description: 'Get the participant roster and registration details for an event. ONLY authorized administrators may call this.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        event_id: {
          type: Type.STRING,
          description: 'The Event ID.',
        },
        event_name: {
          type: Type.STRING,
          description: 'The Event name (if event_id is not known).',
        },
      },
    },
  },
  {
    name: 'create_event',
    description: 'Create a new college event, workshop, or seminar. Restricted to authenticated administrators.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: 'Title of the event.',
        },
        description: {
          type: Type.STRING,
          description: 'Description of the event.',
        },
        date: {
          type: Type.STRING,
          description: 'Date of the event (e.g., "25 October 2026").',
        },
        time: {
          type: Type.STRING,
          description: 'Time of the event (e.g., "2:00 PM").',
        },
        venue: {
          type: Type.STRING,
          description: 'Venue / room name (e.g., "Auditorium A").',
        },
        max_capacity: {
          type: Type.NUMBER,
          description: 'Maximum attendee capacity (e.g., 100).',
        },
      },
      required: ['name', 'date', 'time', 'venue', 'max_capacity'],
    },
  },
  {
    name: 'update_event',
    description: 'Update details of an existing college event (e.g., change venue, date, time, capacity). Restricted to authenticated administrators.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        event_id: {
          type: Type.STRING,
          description: 'Event ID to update.',
        },
        event_name: {
          type: Type.STRING,
          description: 'Event name to update.',
        },
        name: {
          type: Type.STRING,
          description: 'Updated title.',
        },
        description: {
          type: Type.STRING,
          description: 'Updated description.',
        },
        date: {
          type: Type.STRING,
          description: 'Updated date.',
        },
        time: {
          type: Type.STRING,
          description: 'Updated time.',
        },
        venue: {
          type: Type.STRING,
          description: 'Updated venue.',
        },
        max_capacity: {
          type: Type.NUMBER,
          description: 'Updated maximum capacity.',
        },
      },
    },
  },
  {
    name: 'delete_event',
    description: 'Delete an event and its registrations. Restricted to authenticated administrators.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        event_id: {
          type: Type.STRING,
          description: 'Event ID to delete.',
        },
        event_name: {
          type: Type.STRING,
          description: 'Event name to delete.',
        },
      },
    },
  },
  {
    name: 'create_calendar_event',
    description: 'Add a confirmed event registration to the student\'s Google Calendar. MUST ONLY be called after a student registration has succeeded.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        event_id: {
          type: Type.STRING,
          description: 'Event ID that the student is registered for.',
        },
        event_name: {
          type: Type.STRING,
          description: 'Event name (if event_id is not known).',
        },
      },
    },
  },
  {
    name: 'get_all_users',
    description: 'Get live database list of all users of the app, including students and administrators, along with their registration counts and courses. Restricted to authenticated administrators.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

// Server-side tool execution router
export function executeTool(
  toolName: string,
  args: any,
  user: UserContext
): { success: boolean; data?: any; error?: string } {
  try {
    switch (toolName) {
      case 'get_events': {
        const events = db.findEvents(args.query, args.date);
        const detailed = events.map((e) => {
          const stats = db.getEventAvailableSeats(e.event_id);
          return {
            event_id: e.event_id,
            name: e.name,
            description: e.description,
            date: e.date,
            time: e.time,
            venue: e.venue,
            max_capacity: e.max_capacity,
            registered_count: stats.registered,
            available_seats: stats.remaining,
            is_full: stats.isFull,
          };
        });
        return { success: true, data: { count: detailed.length, events: detailed } };
      }

      case 'get_event': {
        let event = args.event_id ? db.getEventById(args.event_id) : undefined;
        if (!event && args.name) {
          event = db.findEventByName(args.name);
        }
        if (!event) {
          return { success: false, error: `Event "${args.event_id || args.name}" was not found.` };
        }
        const stats = db.getEventAvailableSeats(event.event_id);
        return {
          success: true,
          data: {
            event_id: event.event_id,
            name: event.name,
            description: event.description,
            date: event.date,
            time: event.time,
            venue: event.venue,
            max_capacity: event.max_capacity,
            registered_count: stats.registered,
            available_seats: stats.remaining,
            is_full: stats.isFull,
          },
        };
      }

      case 'check_registration': {
        if (user.role !== 'student' || !user.student_id) {
          return { success: false, error: 'Registration check requires an authenticated student account.' };
        }

        let event = args.event_id ? db.getEventById(args.event_id) : undefined;
        if (!event && args.event_name) {
          event = db.findEventByName(args.event_name);
        }

        if (!event) {
          return { success: false, error: `Event not found: "${args.event_id || args.event_name}".` };
        }

        const registration = db.isStudentRegistered(user.student_id, event.event_id);
        if (registration) {
          return {
            success: true,
            data: {
              is_registered: true,
              registration_id: registration.registration_id,
              event_id: event.event_id,
              event_name: event.name,
              date: event.date,
              time: event.time,
              venue: event.venue,
              status: registration.status,
              calendar_status: registration.calendar_status,
              message: `Student ${user.name} is registered for ${event.name}.`,
            },
          };
        } else {
          return {
            success: true,
            data: {
              is_registered: false,
              event_id: event.event_id,
              event_name: event.name,
              message: `Student ${user.name} is NOT registered for ${event.name}.`,
            },
          };
        }
      }

      case 'get_my_registrations': {
        if (user.role !== 'student' || !user.student_id) {
          return { success: false, error: 'Only authenticated students can view their registrations.' };
        }

        const regs = db.getStudentRegistrations(user.student_id);
        const results = regs.map((r) => {
          const event = db.getEventById(r.event_id);
          return {
            registration_id: r.registration_id,
            event_id: r.event_id,
            event_name: event?.name || 'Unknown Event',
            date: event?.date || 'N/A',
            time: event?.time || 'N/A',
            venue: event?.venue || 'N/A',
            registration_date: r.registration_date,
            status: r.status,
            calendar_status: r.calendar_status,
            calendar_url: r.calendar_url,
          };
        });

        return {
          success: true,
          data: {
            student: { student_id: user.student_id, name: user.name },
            registrations: results,
            total: results.length,
          },
        };
      }

      case 'register_student': {
        if (user.role !== 'student' || !user.student_id) {
          return { success: false, error: 'Registration requires an authenticated student identity.' };
        }

        let event = args.event_id ? db.getEventById(args.event_id) : undefined;
        if (!event && args.event_name) {
          event = db.findEventByName(args.event_name);
        }

        if (!event) {
          return { success: false, error: `Event not found: "${args.event_id || args.event_name}".` };
        }

        const result = db.registerStudent(user.student_id, event.event_id);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        return {
          success: true,
          data: {
            registration_id: result.registration?.registration_id,
            student_id: user.student_id,
            student_name: user.name,
            event_id: event.event_id,
            event_name: event.name,
            date: event.date,
            time: event.time,
            venue: event.venue,
            status: 'confirmed',
            message: `Registration confirmed for ${user.name} in ${event.name}.`,
          },
        };
      }

      case 'get_registration_count': {
        let event = args.event_id ? db.getEventById(args.event_id) : undefined;
        if (!event && args.event_name) {
          event = db.findEventByName(args.event_name);
        }

        if (!event) {
          return { success: false, error: `Event not found: "${args.event_id || args.event_name}".` };
        }

        const stats = db.getEventAvailableSeats(event.event_id);
        return {
          success: true,
          data: {
            event_id: event.event_id,
            event_name: event.name,
            registered_count: stats.registered,
            max_capacity: stats.capacity,
            available_seats: stats.remaining,
            is_full: stats.isFull,
          },
        };
      }

      case 'get_event_registrations': {
        // Rule: Only authenticated admins may view participant lists
        if (user.role !== 'admin') {
          return {
            success: false,
            error: 'Access denied: Only authenticated administrators are authorized to view participant information and registration rosters.',
          };
        }

        let event = args.event_id ? db.getEventById(args.event_id) : undefined;
        if (!event && args.event_name) {
          event = db.findEventByName(args.event_name);
        }

        if (!event) {
          return { success: false, error: `Event not found: "${args.event_id || args.event_name}".` };
        }

        const participants = db.getEventParticipants(event.event_id);
        return {
          success: true,
          data: {
            event_id: event.event_id,
            event_name: event.name,
            total_participants: participants.length,
            participants,
          },
        };
      }

      case 'create_event': {
        // Rule: Only authenticated admins may perform admin operations
        if (user.role !== 'admin') {
          return {
            success: false,
            error: 'Access denied: Only authenticated administrators can create events.',
          };
        }

        const res = db.createEvent({
          name: args.name,
          description: args.description || '',
          date: args.date,
          time: args.time,
          venue: args.venue,
          max_capacity: args.max_capacity,
        });

        if (!res.success) {
          return {
            success: false,
            error: res.error,
          };
        }

        const created = res.event!;
        return {
          success: true,
          data: {
            event_id: created.event_id,
            name: created.name,
            description: created.description,
            date: created.date,
            time: created.time,
            venue: created.venue,
            max_capacity: created.max_capacity,
            message: `Event "${created.name}" created successfully.`,
          },
        };
      }

      case 'get_all_users': {
        if (user.role !== 'admin') {
          return {
            success: false,
            error: 'Access denied: Only authenticated administrators can inspect the all users database roster.',
          };
        }
        const allUsers = db.getAllUsers();
        return {
          success: true,
          data: {
            total_users: allUsers.length,
            users: allUsers,
          },
        };
      }

      case 'update_event': {
        // Rule: Only authenticated admins may update events
        if (user.role !== 'admin') {
          return {
            success: false,
            error: 'Access denied: Only authenticated administrators can update events.',
          };
        }

        const identifier = args.event_id || args.event_name;
        if (!identifier) {
          return { success: false, error: 'Please provide either event_id or event_name to update.' };
        }

        const updates: any = {};
        if (args.name !== undefined) updates.name = args.name;
        if (args.description !== undefined) updates.description = args.description;
        if (args.date !== undefined) updates.date = args.date;
        if (args.time !== undefined) updates.time = args.time;
        if (args.venue !== undefined) updates.venue = args.venue;
        if (args.max_capacity !== undefined) updates.max_capacity = args.max_capacity;

        const updated = db.updateEvent(identifier, updates);
        if (!updated) {
          return { success: false, error: `Event "${identifier}" not found.` };
        }

        return {
          success: true,
          data: {
            event_id: updated.event_id,
            name: updated.name,
            description: updated.description,
            date: updated.date,
            time: updated.time,
            venue: updated.venue,
            max_capacity: updated.max_capacity,
            message: `Event "${updated.name}" updated successfully.`,
          },
        };
      }

      case 'delete_event': {
        // Rule: Only authenticated admins may delete events
        if (user.role !== 'admin') {
          return {
            success: false,
            error: 'Access denied: Only authenticated administrators can delete events.',
          };
        }

        const identifier = args.event_id || args.event_name;
        if (!identifier) {
          return { success: false, error: 'Please provide either event_id or event_name to delete.' };
        }

        const deleted = db.deleteEvent(identifier);
        if (!deleted) {
          return { success: false, error: `Event "${identifier}" not found or already deleted.` };
        }

        return {
          success: true,
          data: {
            message: `Event "${identifier}" and associated registrations were deleted successfully.`,
          },
        };
      }

      case 'create_calendar_event': {
        if (user.role !== 'student' || !user.student_id) {
          return { success: false, error: 'Calendar event creation requires an authenticated student.' };
        }

        let event = args.event_id ? db.getEventById(args.event_id) : undefined;
        if (!event && args.event_name) {
          event = db.findEventByName(args.event_name);
        }

        if (!event) {
          return { success: false, error: `Event not found: "${args.event_id || args.event_name}".` };
        }

        // Rule: Do not create a Google Calendar event until registration has successfully completed.
        const isRegistered = db.isStudentRegistered(user.student_id, event.event_id);
        if (!isRegistered) {
          return {
            success: false,
            error: `Cannot add to Google Calendar: Student ${user.name} is not registered for ${event.name}. Registration must be completed first.`,
          };
        }

        const calResult = db.createCalendarEvent(user.student_id, event.event_id);
        if (!calResult.success) {
          return { success: false, error: calResult.error };
        }

        return {
          success: true,
          data: {
            calendar_event_id: calResult.calendar_event_id,
            calendar_url: calResult.calendar_url,
            event_id: event.event_id,
            event_name: event.name,
            date: event.date,
            time: event.time,
            venue: event.venue,
            message: `Added to Google Calendar for ${user.name}.`,
          },
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error executing tool' };
  }
}
