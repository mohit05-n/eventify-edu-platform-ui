import { query } from "./db";

/**
 * Database utility functions for common operations
 */

/**
 * User-related database utilities
 */
export const UserDB = {
  /**
   * Get user by ID
   */
  async getById(id) {
    const result = await query(
      "SELECT id, email, name, role, phone, college, created_at FROM users WHERE id = $1",
      [id]
    );
    return result[0] || null;
  },

  /**
   * Get user by email
   */
  async getByEmail(email) {
    const result = await query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    return result[0] || null;
  },

  /**
   * Create a new user
   */
  async create(userData) {
    const { email, password, name, role, phone, college } = userData;
    const result = await query(
      "INSERT INTO users (email, password, name, role, phone, college) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, role",
      [email.toLowerCase(), password, name, role, phone, college]
    );
    return result[0];
  },

  /**
   * Update user profile
   */
  async update(id, updateData) {
    const fields = Object.keys(updateData);
    if (fields.length === 0) return null;

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const values = Object.values(updateData);
    values.push(id); // Add ID for WHERE clause

    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING id, email, name, role, phone, college`,
      values
    );

    return result[0] || null;
  },

  /**
   * Get all users (admin only)
   */
  async getAll(limit = 100, offset = 0) {
    const result = await query(
      "SELECT id, email, name, role, phone, college, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    return result;
  },

  /**
   * Count total users
   */
  async count() {
    const result = await query("SELECT COUNT(*) as count FROM users");
    return parseInt(result[0]?.count || 0);
  }
};

/**
 * Event-related database utilities
 */
export const EventDB = {
  /**
   * Get event by ID
   */
  async getById(id) {
    const result = await query(
      "SELECT * FROM events WHERE id = $1",
      [id]
    );
    return result[0] || null;
  },

  /**
   * Get approved events with optional filtering
   */
  async getApproved(filters = {}) {
    let sql = "SELECT * FROM events WHERE status = 'approved'";
    const params = [];

    if (filters.category) {
      sql += " AND category = $" + (params.length + 1);
      params.push(filters.category);
    }

    if (filters.search) {
      sql += " AND (title ILIKE $" + (params.length + 1) + " OR description ILIKE $" + (params.length + 1) + ")";
      params.push(`%${filters.search}%`);
    }

    if (filters.location) {
      sql += " AND location ILIKE $" + (params.length + 1);
      params.push(`%${filters.location}%`);
    }

    sql += " ORDER BY start_date ASC";

    const result = await query(sql, params);
    return result;
  },

  /**
   * Get events by organiser ID
   */
  async getByOrganiserId(organiserId, filters = {}) {
    let sql = "SELECT * FROM events WHERE organiser_id = $1";
    const params = [organiserId];

    if (filters.status) {
      sql += " AND status = $" + (params.length + 1);
      params.push(filters.status);
    }

    sql += " ORDER BY created_at DESC";

    const result = await query(sql, params);
    return result;
  },

  /**
   * Create a new event
   */
  async create(eventData) {
    const {
      title,
      description,
      organiser_id,
      category,
      image_url,
      start_date,
      end_date,
      location,
      max_capacity,
      price,
      speakers,
      schedule
    } = eventData;

    const result = await query(
      `INSERT INTO events (title, description, organiser_id, category, image_url, start_date, end_date, location, max_capacity, price, speakers, schedule, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [
        title,
        description,
        organiser_id,
        category,
        image_url,
        start_date,
        end_date,
        location,
        max_capacity,
        price,
        speakers,
        schedule,
        "pending"
      ]
    );
    return result[0];
  },

  /**
   * Update an event
   */
  async update(id, updateData) {
    const fields = Object.keys(updateData);
    if (fields.length === 0) return null;

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const values = Object.values(updateData);
    values.push(id); // Add ID for WHERE clause

    const result = await query(
      `UPDATE events SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING id`,
      values
    );

    return result[0] || null;
  },

  /**
   * Delete an event
   */
  async delete(id) {
    const result = await query(
      "DELETE FROM events WHERE id = $1",
      [id]
    );
    return result.rowCount > 0;
  },

  /**
   * Update event status
   */
  async updateStatus(id, status) {
    const result = await query(
      "UPDATE events SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status",
      [status, id]
    );
    return result[0] || null;
  },

  /**
   * Get pending events for admin approval
   */
  async getPending() {
    const result = await query(
      "SELECT * FROM events WHERE status = 'pending' ORDER BY created_at ASC"
    );
    return result;
  },

  /**
   * Count events by status
   */
  async countByStatus(status) {
    const result = await query(
      "SELECT COUNT(*) as count FROM events WHERE status = $1",
      [status]
    );
    return parseInt(result[0]?.count || 0);
  }
};

/**
 * Registration-related database utilities
 */
export const RegistrationDB = {
  /**
   * Get registration by ID
   */
  async getById(id) {
    const result = await query(
      "SELECT * FROM registrations WHERE id = $1",
      [id]
    );
    return result[0] || null;
  },

  /**
   * Get registration by event and user ID
   */
  async getByEventAndUser(eventId, userId) {
    const result = await query(
      "SELECT * FROM registrations WHERE event_id = $1 AND user_id = $2",
      [eventId, userId]
    );
    return result[0] || null;
  },

  /**
   * Get registrations by user ID
   */
  async getByUserId(userId, limit = 100, offset = 0) {
    const result = await query(
      `SELECT r.*, e.title as event_title, e.location as event_location, e.start_date as event_start_date
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result;
  },

  /**
   * Get registrations by event ID
   */
  async getByEventId(eventId, limit = 100, offset = 0) {
    const result = await query(
      "SELECT * FROM registrations WHERE event_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [eventId, limit, offset]
    );
    return result;
  },

  /**
   * Create a new registration
   */
  async create(registrationData) {
    const { event_id, user_id, status = "pending" } = registrationData;

    const result = await query(
      "INSERT INTO registrations (event_id, user_id, status) VALUES ($1, $2, $3) RETURNING id",
      [event_id, user_id, status]
    );
    return result[0];
  },

  /**
   * Update registration status
   */
  async updateStatus(id, status) {
    const result = await query(
      "UPDATE registrations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status",
      [status, id]
    );
    return result[0] || null;
  },

  /**
   * Delete a registration
   */
  async delete(id) {
    const result = await query(
      "DELETE FROM registrations WHERE id = $1",
      [id]
    );
    return result.rowCount > 0;
  },

  /**
   * Count registrations for an event
   */
  async countByEvent(eventId) {
    const result = await query(
      "SELECT COUNT(*) as count FROM registrations WHERE event_id = $1",
      [eventId]
    );
    return parseInt(result[0]?.count || 0);
  }
};

/**
 * Payment-related database utilities
 */
export const PaymentDB = {
  /**
   * Get payment by ID
   */
  async getById(id) {
    const result = await query(
      "SELECT * FROM payments WHERE id = $1",
      [id]
    );
    return result[0] || null;
  },

  /**
   * Get payment by registration ID
   */
  async getByRegistrationId(registrationId) {
    const result = await query(
      "SELECT * FROM payments WHERE registration_id = $1 ORDER BY created_at DESC LIMIT 1",
      [registrationId]
    );
    return result[0] || null;
  },

  /**
   * Create a new payment record
   */
  async create(paymentData) {
    const {
      registration_id,
      amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status = "pending"
    } = paymentData;

    const result = await query(
      "INSERT INTO payments (registration_id, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [registration_id, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature, status]
    );
    return result[0];
  },

  /**
   * Update payment status
   */
  async updateStatus(id, status) {
    const result = await query(
      "UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status",
      [status, id]
    );
    return result[0] || null;
  },

  /**
   * Update payment details after verification
   */
  async updateVerificationDetails(id, verificationData) {
    const { razorpay_payment_id, razorpay_signature } = verificationData;

    const result = await query(
      "UPDATE payments SET status = $1, razorpay_payment_id = $2, razorpay_signature = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id",
      ["completed", razorpay_payment_id, razorpay_signature, id]
    );
    return result[0] || null;
  },

  /**
   * Get total revenue for an event
   */
  async getTotalRevenueByEvent(eventId) {
    const result = await query(`
      SELECT SUM(p.amount) as total_revenue
      FROM payments p
      JOIN registrations r ON p.registration_id = r.id
      WHERE r.event_id = $1 AND p.status = 'completed'
    `, [eventId]);

    return parseFloat(result[0]?.total_revenue || 0);
  },

  /**
   * Count successful payments for an event
   */
  async countSuccessfulPaymentsByEvent(eventId) {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM payments p
      JOIN registrations r ON p.registration_id = r.id
      WHERE r.event_id = $1 AND p.status = 'completed'
    `, [eventId]);

    return parseInt(result[0]?.count || 0);
  }
};

/**
 * Statistics utilities
 */
export const StatsDB = {
  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    const [
      totalEvents,
      totalRegistrations,
      totalRevenue,
      totalUsers
    ] = await Promise.all([
      query("SELECT COUNT(*) as count FROM events"),
      query("SELECT COUNT(*) as count FROM registrations"),
      query("SELECT SUM(amount) as total FROM payments WHERE status = 'completed'"),
      query("SELECT COUNT(*) as count FROM users")
    ]);

    return {
      totalEvents: parseInt(totalEvents[0]?.count || 0),
      totalRegistrations: parseInt(totalRegistrations[0]?.count || 0),
      totalRevenue: parseFloat(totalRevenue[0]?.total || 0),
      totalUsers: parseInt(totalUsers[0]?.count || 0)
    };
  },

  /**
   * Get event statistics by organiser
   */
  async getOrganiserStats(organiserId) {
    const [
      totalEvents,
      totalRegistrations,
      totalRevenue
    ] = await Promise.all([
      query("SELECT COUNT(*) as count FROM events WHERE organiser_id = $1", [organiserId]),
      query(`
        SELECT COUNT(*) as count 
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE e.organiser_id = $1
      `, [organiserId]),
      query(`
        SELECT SUM(p.amount) as total
        FROM payments p
        JOIN registrations r ON p.registration_id = r.id
        JOIN events e ON r.event_id = e.id
        WHERE e.organiser_id = $1 AND p.status = 'completed'
      `, [organiserId])
    ]);

    return {
      totalEvents: parseInt(totalEvents[0]?.count || 0),
      totalRegistrations: parseInt(totalRegistrations[0]?.count || 0),
      totalRevenue: parseFloat(totalRevenue[0]?.total || 0)
    };
  }
};

/**
 * Task-related database utilities
 */
export const TaskDB = {
  /**
   * Get task by ID
   */
  async getById(id) {
    const result = await query(
      `SELECT t.*, u1.name as assigned_to_name, u2.name as assigned_by_name, e.title as event_title
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.assigned_by = u2.id
       LEFT JOIN events e ON t.event_id = e.id
       WHERE t.id = $1`,
      [id]
    );
    return result[0] || null;
  },

  /**
   * Get tasks by event ID
   */
  async getByEventId(eventId) {
    const result = await query(
      `SELECT t.*, u1.name as assigned_to_name, u2.name as assigned_by_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.assigned_by = u2.id
       WHERE t.event_id = $1
       ORDER BY t.deadline ASC, t.priority DESC`,
      [eventId]
    );
    return result;
  },

  /**
   * Get tasks assigned to a user
   */
  async getByAssignedTo(userId) {
    const result = await query(
      `SELECT t.*, e.title as event_title, u.name as assigned_by_name
       FROM tasks t
       JOIN events e ON t.event_id = e.id
       LEFT JOIN users u ON t.assigned_by = u.id
       WHERE t.assigned_to = $1
       ORDER BY t.deadline ASC`,
      [userId]
    );
    return result;
  },

  /**
   * Create a new task
   */
  async create(taskData) {
    const { event_id, title, description, assigned_to, assigned_by, deadline, priority } = taskData;
    const result = await query(
      `INSERT INTO tasks (event_id, title, description, assigned_to, assigned_by, deadline, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [event_id, title, description, assigned_to, assigned_by, deadline, priority || 'medium']
    );
    return result[0];
  },

  /**
   * Update task status
   */
  async updateStatus(id, status, feedback = null) {
    const result = await query(
      `UPDATE tasks SET status = $1, feedback = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 RETURNING id, status`,
      [status, feedback, id]
    );
    return result[0] || null;
  },

  /**
   * Upload proof for task
   */
  async uploadProof(id, proofUrl) {
    const result = await query(
      `UPDATE tasks SET proof_url = $1, status = 'submitted', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING id`,
      [proofUrl, id]
    );
    return result[0] || null;
  },

  /**
   * Update task
   */
  async update(id, updateData) {
    const fields = Object.keys(updateData);
    if (fields.length === 0) return null;

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const values = Object.values(updateData);
    values.push(id);

    const result = await query(
      `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING id`,
      values
    );

    return result[0] || null;
  },

  /**
   * Delete task
   */
  async delete(id) {
    const result = await query("DELETE FROM tasks WHERE id = $1", [id]);
    return result.rowCount > 0;
  },

  /**
   * Count tasks by status for an event
   */
  async countByEventAndStatus(eventId, status) {
    const result = await query(
      "SELECT COUNT(*) as count FROM tasks WHERE event_id = $1 AND status = $2",
      [eventId, status]
    );
    return parseInt(result[0]?.count || 0);
  }
};

/**
 * Document-related database utilities
 */
export const DocumentDB = {
  /**
   * Get document by ID
   */
  async getById(id) {
    const result = await query(
      `SELECT d.*, u.name as uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.id = $1`,
      [id]
    );
    return result[0] || null;
  },

  /**
   * Get documents by event ID
   */
  async getByEventId(eventId, documentType = null) {
    let sql = `SELECT d.*, u.name as uploaded_by_name
               FROM documents d
               LEFT JOIN users u ON d.uploaded_by = u.id
               WHERE d.event_id = $1`;
    const params = [eventId];

    if (documentType) {
      sql += " AND d.document_type = $2";
      params.push(documentType);
    }

    sql += " ORDER BY d.created_at DESC";

    const result = await query(sql, params);
    return result;
  },

  /**
   * Create a new document
   */
  async create(documentData) {
    const { event_id, uploaded_by, file_name, file_url, file_type, document_type } = documentData;
    const result = await query(
      `INSERT INTO documents (event_id, uploaded_by, file_name, file_url, file_type, document_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [event_id, uploaded_by, file_name, file_url, file_type, document_type || 'other']
    );
    return result[0];
  },

  /**
   * Delete document
   */
  async delete(id) {
    const result = await query("DELETE FROM documents WHERE id = $1", [id]);
    return result.rowCount > 0;
  }
};

/**
 * Budget-related database utilities
 */
export const BudgetDB = {
  /**
   * Get budget item by ID
   */
  async getById(id) {
    const result = await query(
      `SELECT b.*, u1.name as created_by_name, u2.name as approved_by_name
       FROM budgets b
       LEFT JOIN users u1 ON b.created_by = u1.id
       LEFT JOIN users u2 ON b.approved_by = u2.id
       WHERE b.id = $1`,
      [id]
    );
    return result[0] || null;
  },

  /**
   * Get budget items by event ID
   */
  async getByEventId(eventId) {
    const result = await query(
      `SELECT b.*, u1.name as created_by_name, u2.name as approved_by_name
       FROM budgets b
       LEFT JOIN users u1 ON b.created_by = u1.id
       LEFT JOIN users u2 ON b.approved_by = u2.id
       WHERE b.event_id = $1
       ORDER BY b.created_at DESC`,
      [eventId]
    );
    return result;
  },

  /**
   * Create a new budget item
   */
  async create(budgetData) {
    const { event_id, category, description, estimated_amount, created_by } = budgetData;
    const result = await query(
      `INSERT INTO budgets (event_id, category, description, estimated_amount, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [event_id, category, description, estimated_amount, created_by]
    );
    return result[0];
  },

  /**
   * Update budget item
   */
  async update(id, updateData) {
    const fields = Object.keys(updateData);
    if (fields.length === 0) return null;

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const values = Object.values(updateData);
    values.push(id);

    const result = await query(
      `UPDATE budgets SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING id`,
      values
    );

    return result[0] || null;
  },

  /**
   * Approve/reject budget item
   */
  async updateStatus(id, status, approvedBy) {
    const result = await query(
      `UPDATE budgets SET status = $1, approved_by = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 RETURNING id, status`,
      [status, approvedBy, id]
    );
    return result[0] || null;
  },

  /**
   * Get budget summary for an event
   */
  async getSummaryByEventId(eventId) {
    const result = await query(
      `SELECT 
        SUM(estimated_amount) as total_estimated,
        SUM(actual_amount) as total_actual,
        SUM(CASE WHEN status = 'approved' THEN estimated_amount ELSE 0 END) as approved_budget,
        COUNT(*) as total_items
       FROM budgets WHERE event_id = $1`,
      [eventId]
    );
    return result[0];
  },

  /**
   * Delete budget item
   */
  async delete(id) {
    const result = await query("DELETE FROM budgets WHERE id = $1", [id]);
    return result.rowCount > 0;
  }
};

/**
 * Notification-related database utilities
 */
export const NotificationDB = {
  /**
   * Get notifications for a user
   */
  async getByUserId(userId, limit = 50, unreadOnly = false) {
    let sql = `SELECT n.*, e.title as event_title
               FROM notifications n
               LEFT JOIN events e ON n.related_event_id = e.id
               WHERE n.user_id = $1`;

    if (unreadOnly) {
      sql += " AND n.is_read = FALSE";
    }

    sql += " ORDER BY n.created_at DESC LIMIT $2";

    const result = await query(sql, [userId, limit]);
    return result;
  },

  /**
   * Create a notification
   */
  async create(notificationData) {
    const { user_id, title, message, type, related_event_id, related_task_id } = notificationData;
    const result = await query(
      `INSERT INTO notifications (user_id, title, message, type, related_event_id, related_task_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user_id, title, message, type || 'general', related_event_id, related_task_id]
    );
    return result[0];
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id) {
    const result = await query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING id",
      [id]
    );
    return result[0] || null;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    await query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
      [userId]
    );
    return true;
  },

  /**
   * Count unread notifications
   */
  async countUnread(userId) {
    const result = await query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE",
      [userId]
    );
    return parseInt(result[0]?.count || 0);
  },

  /**
   * Delete notification
   */
  async delete(id) {
    const result = await query("DELETE FROM notifications WHERE id = $1", [id]);
    return result.rowCount > 0;
  }
};

/**
 * Event Assignment-related database utilities
 */
export const EventAssignmentDB = {
  /**
   * Get assignments by event ID
   */
  async getByEventId(eventId) {
    const result = await query(
      `SELECT ea.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u2.name as assigned_by_name
       FROM event_assignments ea
       JOIN users u ON ea.user_id = u.id
       LEFT JOIN users u2 ON ea.assigned_by = u2.id
       WHERE ea.event_id = $1
       ORDER BY ea.role, ea.created_at`,
      [eventId]
    );
    return result;
  },

  /**
   * Get events assigned to a user
   */
  async getByUserId(userId) {
    const result = await query(
      `SELECT ea.*, e.title as event_title, e.status as event_status, e.start_date, e.end_date, e.location,
              u.name as organiser_name
       FROM event_assignments ea
       JOIN events e ON ea.event_id = e.id
       LEFT JOIN users u ON e.organiser_id = u.id
       WHERE ea.user_id = $1
       ORDER BY e.start_date ASC`,
      [userId]
    );
    return result;
  },

  /**
   * Create an assignment
   */
  async create(assignmentData) {
    const { event_id, user_id, role, assigned_by } = assignmentData;
    const result = await query(
      `INSERT INTO event_assignments (event_id, user_id, role, assigned_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [event_id, user_id, role, assigned_by]
    );
    return result[0];
  },

  /**
   * Delete assignment
   */
  async delete(eventId, userId) {
    const result = await query(
      "DELETE FROM event_assignments WHERE event_id = $1 AND user_id = $2",
      [eventId, userId]
    );
    return result.rowCount > 0;
  },

  /**
   * Check if user is assigned to event
   */
  async isUserAssigned(eventId, userId) {
    const result = await query(
      "SELECT id FROM event_assignments WHERE event_id = $1 AND user_id = $2",
      [eventId, userId]
    );
    return result.length > 0;
  },

  /**
   * Get coordinators by role for an event
   */
  async getByEventAndRole(eventId, role) {
    const result = await query(
      `SELECT ea.*, u.name as user_name, u.email as user_email
       FROM event_assignments ea
       JOIN users u ON ea.user_id = u.id
       WHERE ea.event_id = $1 AND ea.role = $2`,
      [eventId, role]
    );
    return result;
  }
};

/**
 * Feedback-related database utilities
 */
export const FeedbackDB = {
  /**
   * Get feedback by event ID
   */
  async getByEventId(eventId) {
    const result = await query(
      `SELECT f.*, u.name as user_name
       FROM feedback f
       JOIN users u ON f.user_id = u.id
       WHERE f.event_id = $1
       ORDER BY f.created_at DESC`,
      [eventId]
    );
    return result;
  },

  /**
   * Create feedback
   */
  async create(feedbackData) {
    const { event_id, user_id, rating, comment } = feedbackData;
    const result = await query(
      `INSERT INTO feedback (event_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [event_id, user_id, rating, comment]
    );
    return result[0];
  },

  /**
   * Check if user has given feedback
   */
  async hasUserGivenFeedback(eventId, userId) {
    const result = await query(
      "SELECT id FROM feedback WHERE event_id = $1 AND user_id = $2",
      [eventId, userId]
    );
    return result.length > 0;
  },

  /**
   * Get average rating for an event
   */
  async getAverageRating(eventId) {
    const result = await query(
      "SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM feedback WHERE event_id = $1",
      [eventId]
    );
    return {
      averageRating: parseFloat(result[0]?.avg_rating || 0),
      totalReviews: parseInt(result[0]?.total_reviews || 0)
    };
  }
};