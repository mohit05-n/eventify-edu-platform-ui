-- Extended seed data for Educational Event Management System
-- Run this after 02-extended-schema.sql

-- Insert test users with hashed password for "password"
-- Hashed with bcryptjs (10 rounds): $2a$10$CwTycUXWue0Thq9StjUM0uJ8K0RVZfRhZPDr.9u3r3UUUKvMKqJ8i
INSERT INTO users (email, password, name, role, phone, college, department) VALUES
('mohitnand', '$2a$10$kjG22tWLxuyXH5N96NClgufJY0Xc9VtLtfox6MzWD/hrsTTKJ.bGa', 'Mohit Nandasana', 'admin', '9898989898', 'Admin College', 'Administration')
ON CONFLICT (email) DO NOTHING;

-- Insert one approved test event created by organiser (user_id: 2)
INSERT INTO events (title, description, organiser_id, category, image_url, start_date, end_date, location, max_capacity, current_capacity, status, price, speakers, schedule) VALUES
('Tech Summit 2025', 'Annual technology conference featuring industry leaders discussing the latest trends in AI, cloud computing, and web development', 2, 'conference', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop', NOW() + INTERVAL '30 days', NOW() + INTERVAL '32 days', 'Delhi Convention Center', 500, 0, 'approved', 499.99, 'John Doe, Sarah Smith, Mike Johnson', '[{"time":"09:00","title":"Opening Keynote"},{"time":"11:00","title":"Panel Discussion"},{"time":"14:00","title":"Workshops"}]')
ON CONFLICT DO NOTHING;

-- Assign event coordinator to the test event (assuming event_id: 1, user_id: 3)
INSERT INTO event_assignments (event_id, user_id, role, assigned_by) VALUES
(1, 3, 'event_coordinator', 2)
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Assign student coordinator to the test event (assuming event_id: 1, user_id: 4)
INSERT INTO event_assignments (event_id, user_id, role, assigned_by) VALUES
(1, 4, 'student_coordinator', 3)
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Create sample tasks for the event
INSERT INTO tasks (event_id, title, description, assigned_to, assigned_by, deadline, priority, status) VALUES
(1, 'Design Event Poster', 'Create an attractive poster for Tech Summit 2025 with all event details', 4, 3, NOW() + INTERVAL '7 days', 'high', 'pending'),
(1, 'Arrange Venue Setup', 'Coordinate with venue management for stage, seating, and audio-visual setup', 4, 3, NOW() + INTERVAL '14 days', 'high', 'pending'),
(1, 'Prepare Registration Desk', 'Set up registration desk with check-in materials and name badges', 4, 3, NOW() + INTERVAL '25 days', 'medium', 'pending');

-- Create sample budget items
INSERT INTO budgets (event_id, category, description, estimated_amount, status, created_by) VALUES
(1, 'Venue', 'Venue rental for 3 days', 50000.00, 'approved', 2),
(1, 'Catering', 'Food and beverages for 500 attendees', 75000.00, 'approved', 2),
(1, 'Marketing', 'Digital marketing and print materials', 15000.00, 'proposed', 2),
(1, 'Equipment', 'AV equipment rental', 25000.00, 'proposed', 2);

-- Create sample notifications
INSERT INTO notifications (user_id, title, message, type, related_event_id) VALUES
(3, 'You have been assigned as Event Coordinator', 'You are now the Event Coordinator for Tech Summit 2025', 'general', 1),
(4, 'New Task Assigned', 'You have been assigned the task: Design Event Poster', 'task_assigned', 1);
