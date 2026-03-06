import { EventDB } from "./db-utils";
import { query } from "./db";

/**
 * Event workflow management service
 */

/**
 * Event status transitions and validation
 */
export const EventWorkflow = {
  /**
   * Define valid status transitions
   */
  validTransitions: {
    draft: ['pending'],
    pending: ['approved', 'rejected'],
    approved: ['completed', 'cancelled'],
    rejected: ['pending'], // Allow re-submission
    completed: [],
    cancelled: []
  },

  /**
   * Check if a status transition is valid
   */
  isValidTransition(currentStatus, newStatus) {
    const validNewStatuses = this.validTransitions[currentStatus] || [];
    return validNewStatuses.includes(newStatus);
  },

  /**
   * Submit event for approval (change from draft to pending)
   */
  async submitForApproval(eventId) {
    const event = await EventDB.getById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!this.isValidTransition(event.status, 'pending')) {
      throw new Error(`Cannot submit event with status "${event.status}" for approval`);
    }

    // Update status to pending
    const updatedEvent = await EventDB.updateStatus(eventId, 'pending');
    return updatedEvent;
  },

  /**
   * Approve an event (admin only)
   */
  async approveEvent(eventId) {
    const event = await EventDB.getById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!this.isValidTransition(event.status, 'approved')) {
      throw new Error(`Cannot approve event with status "${event.status}"`);
    }

    // Update status to approved
    const updatedEvent = await EventDB.updateStatus(eventId, 'approved');
    return updatedEvent;
  },

  /**
   * Reject an event (admin only)
   */
  async rejectEvent(eventId, reason = null) {
    const event = await EventDB.getById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!this.isValidTransition(event.status, 'rejected')) {
      throw new Error(`Cannot reject event with status "${event.status}"`);
    }

    // Update status to rejected
    const updatedEvent = await EventDB.updateStatus(eventId, 'rejected');
    return updatedEvent;
  },

  /**
   * Mark event as completed
   */
  async completeEvent(eventId) {
    const event = await EventDB.getById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!this.isValidTransition(event.status, 'completed')) {
      throw new Error(`Cannot complete event with status "${event.status}"`);
    }

    // Update status to completed
    const updatedEvent = await EventDB.updateStatus(eventId, 'completed');
    return updatedEvent;
  },

  /**
   * Cancel an event
   */
  async cancelEvent(eventId, reason = null) {
    const event = await EventDB.getById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!this.isValidTransition(event.status, 'cancelled')) {
      throw new Error(`Cannot cancel event with status "${event.status}"`);
    }

    // Update status to cancelled
    const updatedEvent = await EventDB.updateStatus(eventId, 'cancelled');
    return updatedEvent;
  },

  /**
   * Get events by status for different user roles
   */
  async getEventsByRole(userId, role, status = null) {
    let events = [];

    if (role === 'admin') {
      // Admin can see all events, optionally filtered by status
      if (status) {
        events = await query(
          "SELECT * FROM events WHERE status = $1 ORDER BY created_at DESC",
          [status]
        );
      } else {
        events = await query(
          "SELECT * FROM events ORDER BY created_at DESC"
        );
      }
    } else if (role === 'organiser') {
      // Organiser can see their own events, optionally filtered by status
      if (status) {
        events = await query(
          "SELECT * FROM events WHERE organiser_id = $1 AND status = $2 ORDER BY created_at DESC",
          [userId, status]
        );
      } else {
        events = await query(
          "SELECT * FROM events WHERE organiser_id = $1 ORDER BY created_at DESC",
          [userId]
        );
      }
    } else if (role === 'attendee') {
      // Attendee can see approved events
      if (status === 'approved' || !status) {
        events = await query(
          "SELECT * FROM events WHERE status = 'approved' ORDER BY start_date ASC"
        );
      }
    }

    return events;
  },

  /**
   * Get events requiring admin action (pending approval)
   */
  async getPendingEvents() {
    return await query(
      "SELECT e.*, u.name as organiser_name, u.email as organiser_email FROM events e JOIN users u ON e.organiser_id = u.id WHERE e.status = 'pending' ORDER BY e.created_at ASC"
    );
  },

  /**
   * Get upcoming events for an organiser
   */
  async getUpcomingEventsByOrganiser(organiserId) {
    return await query(
      "SELECT * FROM events WHERE organiser_id = $1 AND status IN ('approved', 'completed') AND start_date >= NOW() ORDER BY start_date ASC",
      [organiserId]
    );
  },

  /**
   * Get past events for an organiser
   */
  async getPastEventsByOrganiser(organiserId) {
    return await query(
      "SELECT * FROM events WHERE organiser_id = $1 AND status IN ('completed', 'cancelled') AND end_date < NOW() ORDER BY end_date DESC",
      [organiserId]
    );
  },

  /**
   * Get events by date range
   */
  async getEventsByDateRange(startDate, endDate, organiserId = null) {
    let sql = "SELECT * FROM events WHERE start_date >= $1 AND end_date <= $2";
    let params = [startDate, endDate];

    if (organiserId) {
      sql += " AND organiser_id = $" + (params.length + 1);
      params.push(organiserId);
    }

    sql += " ORDER BY start_date ASC";

    return await query(sql, params);
  },

  /**
   * Check if an event can be modified based on its status
   */
  canModifyEvent(eventStatus, userRole, isOwner) {
    // Admin can always modify
    if (userRole === 'admin') {
      return true;
    }

    // Owner can modify if status is draft or pending
    if (isOwner && (eventStatus === 'draft' || eventStatus === 'pending')) {
      return true;
    }

    // Otherwise, cannot modify
    return false;
  },

  /**
   * Check if an event can be cancelled based on its status and date
   */
  async canCancelEvent(eventId) {
    const event = await EventDB.getById(eventId);
    if (!event) {
      return { canCancel: false, reason: 'Event not found' };
    }

    // Cannot cancel if already completed or cancelled
    if (event.status === 'completed' || event.status === 'cancelled') {
      return { canCancel: false, reason: 'Event already ' + event.status };
    }

    // Check if event has already started
    const now = new Date();
    const eventStartDate = new Date(event.start_date);
    
    if (eventStartDate <= now) {
      return { canCancel: false, reason: 'Event has already started' };
    }

    // Check if it's too close to the event date (e.g., within 24 hours)
    const hoursToEvent = (eventStartDate - now) / (1000 * 60 * 60);
    if (hoursToEvent < 24) {
      return { canCancel: false, reason: 'Cannot cancel within 24 hours of event start' };
    }

    return { canCancel: true, reason: null };
  },

  /**
   * Get status statistics for dashboard
   */
  async getStatusStats(role, organiserId = null) {
    if (role === 'admin') {
      // Get stats for all events
      const result = await query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM events
        GROUP BY status
      `);
      
      // Initialize all status counts to 0
      const stats = {
        draft: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        cancelled: 0
      };
      
      // Update with actual counts
      result.forEach(row => {
        stats[row.status] = parseInt(row.count);
      });
      
      return stats;
    } else if (role === 'organiser' && organiserId) {
      // Get stats for organiser's events only
      const result = await query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM events
        WHERE organiser_id = $1
        GROUP BY status
      `, [organiserId]);
      
      // Initialize all status counts to 0
      const stats = {
        draft: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        cancelled: 0
      };
      
      // Update with actual counts
      result.forEach(row => {
        stats[row.status] = parseInt(row.count);
      });
      
      return stats;
    }
    
    return null;
  }
};