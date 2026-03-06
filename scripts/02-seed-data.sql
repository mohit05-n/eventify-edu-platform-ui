-- Insert test users with hashed password for "password"
-- Hashed with bcryptjs (10 rounds): $2a$10$CwTycUXWue0Thq9StjUM0uJ8K0RVZfRhZPDr.9u3r3UUUKvMKqJ8i
INSERT INTO users (email, password, name, role, phone, college) VALUES
('admin@eventify.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8K0RVZfRhZPDr.9u3r3UUUKvMKqJ8i', 'Admin User', 'admin', '9999999999', 'Admin College'),
('organiser@eventify.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8K0RVZfRhZPDr.9u3r3UUUKvMKqJ8i', 'John Organiser', 'organiser', '9888888888', 'Tech Institute'),
('attendee@eventify.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8K0RVZfRhZPDr.9u3r3UUUKvMKqJ8i', 'Jane Attendee', 'attendee', '9777777777', 'Engineering College')
ON CONFLICT (email) DO NOTHING;

-- Insert one approved test event created by organiser (user_id: 2)
INSERT INTO events (title, description, organiser_id, category, image_url, start_date, end_date, location, max_capacity, current_capacity, status, price, speakers, schedule) VALUES
('Tech Summit 2025', 'Annual technology conference featuring industry leaders discussing the latest trends in AI, cloud computing, and web development', 2, 'conference', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop', NOW() + INTERVAL '30 days', NOW() + INTERVAL '32 days', 'Delhi Convention Center', 500, 0, 'approved', 499.99, 'John Doe, Sarah Smith, Mike Johnson', '[{"time":"09:00","title":"Opening Keynote"},{"time":"11:00","title":"Panel Discussion"},{"time":"14:00","title":"Workshops"}]');
