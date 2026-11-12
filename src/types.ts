export interface Student {
  student_id: string;
  name: string;
  email: string;
  course: string;
}

export interface CollegeEvent {
  event_id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  max_capacity: number;
  registered_count: number;
  available_seats: number;
  is_full: boolean;
}

export interface Registration {
  registration_id: string;
  student_id: string;
  event_id: string;
  registration_date: string;
  status: 'confirmed' | 'cancelled';
  calendar_status: 'added' | 'failed' | 'none';
  calendar_event_id?: string;
  calendar_url?: string;
}

export interface ToolLogEntry {
  tool: string;
  args: any;
  result: any;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  toolLogs?: ToolLogEntry[];
  timestamp: string;
}

export interface CurrentUser {
  role: 'student' | 'admin';
  student_id?: string;
  name: string;
  email: string;
  course?: string;
}

export interface AppUser {
  user_id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  course?: string;
  registered_events_count: number;
  registered_event_names: string[];
}

export interface DatabaseState {
  students: Student[];
  users: AppUser[];
  events: CollegeEvent[];
  registrations: Registration[];
  admin: {
    admin_id: string;
    name: string;
    email: string;
    role: 'admin';
  };
}
