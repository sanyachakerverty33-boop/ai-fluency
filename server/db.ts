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

export interface Admin {
  admin_id: string;
  name: string;
  email: string;
  role: 'admin';
}

const INITIAL_STUDENTS: Student[] = [
  {
    student_id: 'STU-101',
    name: 'Alex Rivera',
    email: 'alex.rivera@college.edu',
    course: 'Computer Science, B.S.',
  },
  {
    student_id: 'STU-102',
    name: 'Priya Sharma',
    email: 'priya.sharma@college.edu',
    course: 'Data Science & AI, M.S.',
  },
  {
    student_id: 'STU-103',
    name: 'Marcus Chen',
    email: 'marcus.chen@college.edu',
    course: 'Business Analytics, B.S.',
  },
  {
    student_id: 'STU-104',
    name: 'Elena Rostova',
    email: 'elena.rostova@college.edu',
    course: 'Cybersecurity Engineering, B.S.',
  },
];

const INITIAL_EVENTS: CollegeEvent[] = [
  {
    event_id: 'EVT-101',
    name: 'AI Workshop: Generative AI & Autonomous Agents',
    description: 'Hands-on laboratory exploring foundation models, vector embeddings, and autonomous agent systems.',
    date: '18 October 2026',
    time: '2:00 PM',
    venue: 'Auditorium A',
    max_capacity: 50,
  },
  {
    event_id: 'EVT-102',
    name: 'Business Analytics Workshop & Predictive Modeling',
    description: 'Practical seminar on forecasting market demand and executive dashboard analytics using Python and SQL.',
    date: '22 October 2026',
    time: '10:30 AM',
    venue: 'Seminar Hall 2',
    max_capacity: 30,
  },
  {
    event_id: 'EVT-103',
    name: 'Autonomous Robotics Lab: ROS2 & Computer Vision',
    description: 'Live hardware lab building edge perception pipelines for robotic manipulation and navigation.',
    date: '26 October 2026',
    time: '3:00 PM',
    venue: 'Robotics Engineering Wing B-12',
    max_capacity: 20,
  },
  {
    event_id: 'EVT-104',
    name: 'Cloud Native Microservices with Kubernetes Bootcamp',
    description: 'Architecting fault-tolerant microservices, service meshes, and deployment pipelines at scale.',
    date: '02 November 2026',
    time: '1:00 PM',
    venue: 'Tech Center Hall 3',
    max_capacity: 40,
  },
  {
    event_id: 'EVT-105',
    name: 'Full Capacity Cybersecurity War Games (Demo Full Event)',
    description: 'Live ethical hacking capture-the-flag simulation. Fully booked to demonstrate capacity enforcement.',
    date: '15 October 2026',
    time: '4:00 PM',
    venue: 'Cyber Security Lab 101',
    max_capacity: 2,
  },
];

const INITIAL_REGISTRATIONS: Registration[] = [
  {
    registration_id: 'REG-1001',
    student_id: 'STU-102',
    event_id: 'EVT-101',
    registration_date: '2026-10-05T09:15:00Z',
    status: 'confirmed',
    calendar_status: 'added',
    calendar_event_id: 'CAL-1001',
    calendar_url: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=AI%20Workshop&dates=20261018T140000Z/20261018T160000Z',
  },
  {
    registration_id: 'REG-1002',
    student_id: 'STU-103',
    event_id: 'EVT-102',
    registration_date: '2026-10-06T11:30:00Z',
    status: 'confirmed',
    calendar_status: 'added',
    calendar_event_id: 'CAL-1002',
  },
  {
    registration_id: 'REG-1003',
    student_id: 'STU-103',
    event_id: 'EVT-105',
    registration_date: '2026-10-04T10:00:00Z',
    status: 'confirmed',
    calendar_status: 'added',
  },
  {
    registration_id: 'REG-1004',
    student_id: 'STU-104',
    event_id: 'EVT-105',
    registration_date: '2026-10-04T10:05:00Z',
    status: 'confirmed',
    calendar_status: 'added',
  },
];

const INITIAL_ADMIN: Admin = {
  admin_id: 'ADM-001',
  name: 'Dr. Sarah Vance',
  email: 's.vance@college.edu',
  role: 'admin',
};

class CollegeDatabase {
  private students: Student[] = [];
  private events: CollegeEvent[] = [];
  private registrations: Registration[] = [];
  private admin: Admin = { ...INITIAL_ADMIN };

  constructor() {
    this.reset();
  }

  public reset() {
    this.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    this.events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
    this.registrations = JSON.parse(JSON.stringify(INITIAL_REGISTRATIONS));
    this.admin = { ...INITIAL_ADMIN };
  }

  public getStudents(): Student[] {
    return this.students;
  }

  public getStudentById(id: string): Student | undefined {
    return this.students.find((s) => s.student_id.toLowerCase() === id.toLowerCase());
  }

  public getEvents(): CollegeEvent[] {
    return this.events;
  }

  public getEventById(id: string): CollegeEvent | undefined {
    return this.events.find((e) => e.event_id.toLowerCase() === id.toLowerCase());
  }

  public findEvents(query?: string, date?: string): CollegeEvent[] {
    let result = [...this.events];
    if (query) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q)
      );
    }
    if (date) {
      const d = date.toLowerCase().trim();
      result = result.filter((e) => e.date.toLowerCase().includes(d));
    }
    return result;
  }

  public findEventByName(name: string): CollegeEvent | undefined {
    const q = name.toLowerCase().trim();
    // exact or substring match
    return (
      this.events.find((e) => e.name.toLowerCase() === q) ||
      this.events.find((e) => e.name.toLowerCase().includes(q)) ||
      this.events.find((e) => q.includes(e.name.toLowerCase()))
    );
  }

  public getRegistrationCount(eventId: string): number {
    return this.registrations.filter(
      (r) => r.event_id.toLowerCase() === eventId.toLowerCase() && r.status === 'confirmed'
    ).length;
  }

  public getEventAvailableSeats(eventId: string): { registered: number; capacity: number; remaining: number; isFull: boolean } {
    const event = this.getEventById(eventId);
    if (!event) return { registered: 0, capacity: 0, remaining: 0, isFull: false };
    const registered = this.getRegistrationCount(eventId);
    const capacity = event.max_capacity;
    const remaining = Math.max(0, capacity - registered);
    return {
      registered,
      capacity,
      remaining,
      isFull: remaining <= 0,
    };
  }

  public getRegistrations(): Registration[] {
    return this.registrations;
  }

  public getStudentRegistrations(studentId: string): Registration[] {
    return this.registrations.filter(
      (r) => r.student_id.toLowerCase() === studentId.toLowerCase() && r.status === 'confirmed'
    );
  }

  public isStudentRegistered(studentId: string, eventId: string): Registration | undefined {
    return this.registrations.find(
      (r) =>
        r.student_id.toLowerCase() === studentId.toLowerCase() &&
        r.event_id.toLowerCase() === eventId.toLowerCase() &&
        r.status === 'confirmed'
    );
  }

  public registerStudent(studentId: string, eventId: string): { success: boolean; error?: string; registration?: Registration } {
    const student = this.getStudentById(studentId);
    if (!student) {
      return { success: false, error: `Student with ID "${studentId}" not found.` };
    }

    const event = this.getEventById(eventId);
    if (!event) {
      return { success: false, error: `Event with ID "${eventId}" not found.` };
    }

    // Rule: Never register a student twice for the same event
    const existing = this.isStudentRegistered(studentId, eventId);
    if (existing) {
      return {
        success: false,
        error: `Duplicate registration error: Student ${student.name} (${student.student_id}) is already registered for "${event.name}" (Registration ID: ${existing.registration_id}). Duplicate registrations are not permitted.`,
      };
    }

    // Rule: Never register a student if event is full
    const { remaining, isFull } = this.getEventAvailableSeats(eventId);
    if (isFull || remaining <= 0) {
      return { success: false, error: `Cannot register: Event "${event.name}" is full (capacity reached: ${event.max_capacity}).` };
    }

    const regId = `REG-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReg: Registration = {
      registration_id: regId,
      student_id: student.student_id,
      event_id: event.event_id,
      registration_date: new Date().toISOString(),
      status: 'confirmed',
      calendar_status: 'none',
    };

    this.registrations.push(newReg);
    return { success: true, registration: newReg };
  }

  public createCalendarEvent(studentId: string, eventId: string): { success: boolean; error?: string; calendar_event_id?: string; calendar_url?: string } {
    const reg = this.isStudentRegistered(studentId, eventId);
    if (!reg) {
      return { success: false, error: 'Cannot create calendar event: Registration not found or student is not registered.' };
    }

    const event = this.getEventById(eventId);
    if (!event) {
      return { success: false, error: 'Event not found.' };
    }

    const calendarId = `CAL-${Date.now().toString().slice(-6)}`;
    const encodedTitle = encodeURIComponent(event.name);
    const encodedDetails = encodeURIComponent(`College Event: ${event.description}\nTime: ${event.time}\nVenue: ${event.venue}`);
    const encodedVenue = encodeURIComponent(event.venue);
    // Format a standard Google Calendar URL template
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&details=${encodedDetails}&location=${encodedVenue}`;

    reg.calendar_status = 'added';
    reg.calendar_event_id = calendarId;
    reg.calendar_url = calendarUrl;

    return {
      success: true,
      calendar_event_id: calendarId,
      calendar_url: calendarUrl,
    };
  }

  public getEventParticipants(eventId: string): Array<{
    registration_id: string;
    student_id: string;
    name: string;
    email: string;
    course: string;
    registration_date: string;
    status: string;
  }> {
    const eventRegs = this.registrations.filter(
      (r) => r.event_id.toLowerCase() === eventId.toLowerCase() && r.status === 'confirmed'
    );

    return eventRegs.map((r) => {
      const student = this.getStudentById(r.student_id);
      return {
        registration_id: r.registration_id,
        student_id: r.student_id,
        name: student?.name || 'Unknown Student',
        email: student?.email || 'N/A',
        course: student?.course || 'N/A',
        registration_date: r.registration_date,
        status: r.status,
      };
    });
  }

  public createEvent(data: {
    name: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    max_capacity: number;
  }): { success: boolean; event?: CollegeEvent; error?: string } {
    const trimmedName = data.name.trim();
    const trimmedVenue = data.venue.trim();
    const trimmedDate = data.date.trim();

    // Check 1: Duplicate event with same or substantially matching name
    const existingByName = this.events.find(
      (e) => e.name.toLowerCase().trim() === trimmedName.toLowerCase()
    );
    if (existingByName) {
      return {
        success: false,
        error: `Duplicate event error: An event named "${existingByName.name}" already exists (ID: ${existingByName.event_id}, Date: ${existingByName.date}, Venue: ${existingByName.venue}). Duplicate events are not permitted.`,
      };
    }

    // Check 2: Schedule conflict at same venue, date, and time
    const existingByVenue = this.events.find(
      (e) =>
        e.venue.toLowerCase().trim() === trimmedVenue.toLowerCase() &&
        e.date.toLowerCase().trim() === trimmedDate.toLowerCase() &&
        e.time.toLowerCase().trim() === data.time.toLowerCase().trim()
    );
    if (existingByVenue) {
      return {
        success: false,
        error: `Duplicate booking conflict: Venue "${trimmedVenue}" is already booked on ${trimmedDate} at ${data.time} for "${existingByVenue.name}".`,
      };
    }

    const eventId = `EVT-${Math.floor(100 + Math.random() * 900)}`;
    const newEvent: CollegeEvent = {
      event_id: eventId,
      name: trimmedName,
      description: data.description?.trim() || 'College workshop seminar.',
      date: trimmedDate,
      time: data.time.trim(),
      venue: trimmedVenue,
      max_capacity: Number(data.max_capacity) || 50,
    };
    this.events.push(newEvent);
    return { success: true, event: newEvent };
  }

  public updateEvent(
    identifier: string,
    updates: Partial<Omit<CollegeEvent, 'event_id'>>
  ): CollegeEvent | undefined {
    let event = this.getEventById(identifier);
    if (!event) {
      event = this.findEventByName(identifier);
    }
    if (!event) return undefined;

    if (updates.name !== undefined) event.name = updates.name.trim();
    if (updates.description !== undefined) event.description = updates.description.trim();
    if (updates.date !== undefined) event.date = updates.date.trim();
    if (updates.time !== undefined) event.time = updates.time.trim();
    if (updates.venue !== undefined) event.venue = updates.venue.trim();
    if (updates.max_capacity !== undefined) event.max_capacity = Number(updates.max_capacity);

    return event;
  }

  public deleteEvent(identifier: string): boolean {
    const event = this.getEventById(identifier) || this.findEventByName(identifier);
    if (!event) return false;

    const eventId = event.event_id;
    this.events = this.events.filter((e) => e.event_id !== eventId);
    this.registrations = this.registrations.filter((r) => r.event_id !== eventId);
    return true;
  }

  public getAllUsers() {
    const studentUsers = this.students.map((s) => {
      const userRegs = this.getStudentRegistrations(s.student_id);
      const eventNames = userRegs.map((r) => this.getEventById(r.event_id)?.name || r.event_id);
      return {
        user_id: s.student_id,
        name: s.name,
        email: s.email,
        role: 'student' as const,
        course: s.course,
        registered_events_count: userRegs.length,
        registered_event_names: eventNames,
      };
    });

    const adminUser = {
      user_id: this.admin.admin_id,
      name: this.admin.name,
      email: this.admin.email,
      role: 'admin' as const,
      course: 'Event Administration & Student Affairs',
      registered_events_count: 0,
      registered_event_names: [] as string[],
    };

    return [adminUser, ...studentUsers];
  }

  public getFullState() {
    return {
      students: this.students,
      users: this.getAllUsers(),
      events: this.events.map((e) => {
        const stats = this.getEventAvailableSeats(e.event_id);
        return {
          ...e,
          registered_count: stats.registered,
          available_seats: stats.remaining,
          is_full: stats.isFull,
        };
      }),
      registrations: this.registrations,
      admin: this.admin,
    };
  }
}

export const db = new CollegeDatabase();
