/**
 * Calendar Manager Agent
 * Handles automated scheduling, booking management, reminders, and availability tracking
 */

/**
 * Time slot representation
 */
export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  serviceId?: string;
  duration: number; // in minutes
}

/**
 * Booking entity
 */
export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  notes?: string;
  remindersSent: Reminder[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service definition for bookings
 */
export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price?: number;
  color?: string;
}

/**
 * Reminder configuration
 */
export interface Reminder {
  id: string;
  bookingId: string;
  minutesBefore: number;
  sentAt?: Date;
  status: "pending" | "sent" | "failed";
  channel: "email" | "sms" | "push";
  message?: string;
}

/**
 * Calendar configuration
 */
export interface CalendarConfig {
  timezone: string;
  language: string;
  slotDuration: number;
  bufferTime: number;
  maxAdvanceBookingDays: number;
  reminderMinutes: number[];
  workingHours: {
    [day: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
}

/**
 * Anomaly or conflict detection
 */
export interface ConflictDetection {
  hasConflict: boolean;
  conflictingBooking?: Booking;
  conflictType: "overlap" | "insufficient-buffer" | "outside-hours" | "none";
  message: string;
}

/**
 * Calendar Manager Agent
 * Manages all calendar and booking operations
 */
export class CalendarManager {
  private config: CalendarConfig;
  private bookings: Map<string, Booking> = new Map();
  private services: Map<string, Service> = new Map();
  private reminders: Map<string, Reminder> = new Map();

  /**
   * Initialize the Calendar Manager
   * @param config Calendar configuration
   */
  constructor(config: CalendarConfig) {
    this.config = config;
    this.initializeDefaultServices();
  }

  /**
   * Initialize default services
   * @private
   */
  private initializeDefaultServices(): void {
    const defaultServices: Service[] = [
      {
        id: "service-01",
        name: "Corte de cabello",
        description: "Corte y peinado estándar",
        duration: 30,
        price: 25,
        color: "#FF6B6B",
      },
      {
        id: "service-02",
        name: "Coloración",
        description: "Tinte y tratamiento capilar",
        duration: 90,
        price: 65,
        color: "#4ECDC4",
      },
      {
        id: "service-03",
        name: "Tratamiento",
        description: "Tratamiento intensivo capilar",
        duration: 45,
        price: 40,
        color: "#45B7D1",
      },
    ];

    defaultServices.forEach((service) => {
      this.services.set(service.id, service);
    });
  }

  /**
   * Get available time slots for a given date range
   * @param startDate Start date for availability check
   * @param endDate End date for availability check
   * @param serviceId Service ID to check availability for
   * @returns Array of available time slots
   */
  public async getAvailableSlots(
    startDate: Date,
    endDate: Date,
    serviceId: string
  ): Promise<TimeSlot[]> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    const slots: TimeSlot[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = this.getDayName(currentDate);
      const workingHours = this.config.workingHours[dayOfWeek];

      if (workingHours && workingHours.enabled) {
        const daySlots = this.generateDaySlots(
          currentDate,
          workingHours,
          service.duration
        );

        for (const slot of daySlots) {
          const conflict = this.detectConflicts(slot);
          if (!conflict.hasConflict) {
            slots.push(slot);
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  /**
   * Generate time slots for a specific day
   * @private
   */
  private generateDaySlots(
    date: Date,
    workingHours: { start: string; end: string; enabled: boolean },
    serviceDuration: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [startHour, startMin] = workingHours.start.split(":").map(Number);
    const [endHour, endMin] = workingHours.end.split(":").map(Number);

    const startTime = new Date(date);
    startTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMin, 0, 0);

    let currentSlotStart = new Date(startTime);

    while (currentSlotStart.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
      const slotEnd = new Date(currentSlotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);

      slots.push({
        id: `slot-${currentSlotStart.getTime()}`,
        startTime: new Date(currentSlotStart),
        endTime: new Date(slotEnd),
        isAvailable: true,
        duration: serviceDuration,
      });

      currentSlotStart.setMinutes(
        currentSlotStart.getMinutes() + this.config.slotDuration
      );
    }

    return slots;
  }

  /**
   * Create a new booking
   * @param clientName Client name
   * @param clientEmail Client email
   * @param serviceId Service ID
   * @param startTime Booking start time
   * @param notes Optional booking notes
   * @returns Created booking
   */
  public async createBooking(
    clientName: string,
    clientEmail: string,
    serviceId: string,
    startTime: Date,
    notes?: string
  ): Promise<Booking> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + service.duration);

    const timeSlot: TimeSlot = {
      id: `slot-${startTime.getTime()}`,
      startTime,
      endTime,
      isAvailable: true,
      serviceId,
      duration: service.duration,
    };

    const conflict = this.detectConflicts(timeSlot);
    if (conflict.hasConflict) {
      throw new Error(`Booking conflict: ${conflict.message}`);
    }

    const booking: Booking = {
      id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      clientName,
      clientEmail,
      serviceId,
      startTime,
      endTime,
      status: "confirmed",
      notes,
      remindersSent: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bookings.set(booking.id, booking);

    // Schedule reminders
    await this.scheduleReminders(booking);

    return booking;
  }

  /**
   * Cancel an existing booking
   * @param bookingId Booking ID to cancel
   * @returns Updated booking
   */
  public async cancelBooking(bookingId: string): Promise<Booking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    booking.status = "cancelled";
    booking.updatedAt = new Date();
    this.bookings.set(bookingId, booking);

    return booking;
  }

  /**
   * Reschedule an existing booking
   * @param bookingId Booking ID to reschedule
   * @param newStartTime New start time
   * @returns Updated booking
   */
  public async rescheduleBooking(
    bookingId: string,
    newStartTime: Date
  ): Promise<Booking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const service = this.services.get(booking.serviceId);
    if (!service) {
      throw new Error(`Service ${booking.serviceId} not found`);
    }

    const newEndTime = new Date(newStartTime);
    newEndTime.setMinutes(newEndTime.getMinutes() + service.duration);

    const timeSlot: TimeSlot = {
      id: `slot-${newStartTime.getTime()}`,
      startTime: newStartTime,
      endTime: newEndTime,
      isAvailable: true,
      serviceId: booking.serviceId,
      duration: service.duration,
    };

    const conflict = this.detectConflicts(timeSlot, bookingId);
    if (conflict.hasConflict) {
      throw new Error(`Rescheduling conflict: ${conflict.message}`);
    }

    booking.startTime = newStartTime;
    booking.endTime = newEndTime;
    booking.updatedAt = new Date();
    this.bookings.set(bookingId, booking);

    // Reschedule reminders
    await this.scheduleReminders(booking);

    return booking;
  }

  /**
   * Send reminders for upcoming bookings
   * @returns Number of reminders sent
   */
  public async sendReminders(): Promise<number> {
    let remindersSent = 0;
    const now = new Date();

    for (const [, booking] of this.bookings) {
      if (booking.status !== "confirmed") {
        continue;
      }

      for (const minutesBefore of this.config.reminderMinutes) {
        const reminderTime = new Date(booking.startTime);
        reminderTime.setMinutes(reminderTime.getMinutes() - minutesBefore);

        // Check if reminder should be sent now (within a 2-minute window)
        if (
          reminderTime <= now &&
          now.getTime() - reminderTime.getTime() < 2 * 60000
        ) {
          const reminder: Reminder = {
            id: `reminder-${Date.now()}`,
            bookingId: booking.id,
            minutesBefore,
            sentAt: now,
            status: "sent",
            channel: "email",
            message: this.generateReminderMessage(booking, minutesBefore),
          };

          this.reminders.set(reminder.id, reminder);
          booking.remindersSent.push(reminder);
          remindersSent++;

          console.log(
            `Reminder sent for booking ${booking.id}: ${reminder.message}`
          );
        }
      }
    }

    return remindersSent;
  }

  /**
   * Sync calendar with external calendar service
   * @returns Sync status
   */
  public async syncCalendar(): Promise<{ status: string; bookingsSynced: number }> {
    // Placeholder for Google Calendar API integration
    console.log(
      "Syncing calendar with external service (Google Calendar placeholder)"
    );

    const bookingCount = this.bookings.size;
    return {
      status: "success",
      bookingsSynced: bookingCount,
    };
  }

  /**
   * Detect conflicts with existing bookings
   * @private
   */
  private detectConflicts(
    timeSlot: TimeSlot,
    excludeBookingId?: string
  ): ConflictDetection {
    for (const [, booking] of this.bookings) {
      if (
        excludeBookingId &&
        booking.id === excludeBookingId
      ) {
        continue;
      }

      if (booking.status === "cancelled") {
        continue;
      }

      // Check for overlap
      if (
        timeSlot.startTime < booking.endTime &&
        timeSlot.endTime > booking.startTime
      ) {
        return {
          hasConflict: true,
          conflictingBooking: booking,
          conflictType: "overlap",
          message: `Overlap with existing booking: ${booking.clientName} from ${booking.startTime.toISOString()} to ${booking.endTime.toISOString()}`,
        };
      }

      // Check for insufficient buffer time
      const bufferMs = this.config.bufferTime * 60000;
      if (
        timeSlot.startTime.getTime() - booking.endTime.getTime() < bufferMs &&
        timeSlot.startTime.getTime() > booking.endTime.getTime()
      ) {
        return {
          hasConflict: true,
          conflictingBooking: booking,
          conflictType: "insufficient-buffer",
          message: `Insufficient buffer time after booking: ${booking.clientName}`,
        };
      }
    }

    return {
      hasConflict: false,
      conflictType: "none",
      message: "No conflicts detected",
    };
  }

  /**
   * Schedule reminders for a booking
   * @private
   */
  private async scheduleReminders(booking: Booking): Promise<void> {
    // Implementation for scheduling reminders
    console.log(
      `Scheduling reminders for booking ${booking.id} at ${this.config.reminderMinutes.join(", ")} minutes before`
    );
  }

  /**
   * Generate reminder message
   * @private
   */
  private generateReminderMessage(
    booking: Booking,
    minutesBefore: number
  ): string {
    const service = this.services.get(booking.serviceId);
    if (!service) {
      return "";
    }

    const timeStr = booking.startTime.toLocaleString(
      this.config.language === "es" ? "es-ES" : "en-US"
    );

    if (minutesBefore === 1440) {
      return `Recordatorio: Tu cita de ${service.name} está programada para mañana a las ${timeStr}`;
    } else if (minutesBefore === 60) {
      return `Recordatorio: Tu cita de ${service.name} comienza en 1 hora`;
    }

    return `Recordatorio: Tu cita de ${service.name} comienza en ${minutesBefore} minutos`;
  }

  /**
   * Get day name from date
   * @private
   */
  private getDayName(date: Date): string {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return days[date.getDay()];
  }

  /**
   * Get booking by ID
   */
  public getBooking(bookingId: string): Booking | undefined {
    return this.bookings.get(bookingId);
  }

  /**
   * Get all bookings
   */
  public getAllBookings(): Booking[] {
    return Array.from(this.bookings.values());
  }

  /**
   * Get service by ID
   */
  public getService(serviceId: string): Service | undefined {
    return this.services.get(serviceId);
  }

  /**
   * Get all services
   */
  public getAllServices(): Service[] {
    return Array.from(this.services.values());
  }

  /**
   * Add a new service
   */
  public addService(service: Service): void {
    this.services.set(service.id, service);
  }
}

/**
 * Export for use in the agent framework
 */
export default CalendarManager;
