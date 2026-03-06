/**
 * Validation utilities for the Eventify platform
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (Indian numbers)
const PHONE_REGEX = /^(\+91[-\s]?)?[0]?(91)?[6789]\d{9}$/;

// Name validation (letters, spaces, hyphens, apostrophes)
const NAME_REGEX = /^[a-zA-Z\s\-']+$/;

// Price validation (positive decimal numbers)
const PRICE_REGEX = /^\d+(\.\d{1,2})?$/;

// URL validation regex
const URL_REGEX = /^(ftp|http|https):\/\/[^ "]+$/;

/**
 * Sanitize string input
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  // Remove HTML tags and trim
  return str.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate phone number format
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Validate name format
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) return false;
  return NAME_REGEX.test(trimmedName);
}

/**
 * Validate price format
 */
export function validatePrice(price) {
  if (price === null || price === undefined) return true; // Allow null prices
  if (typeof price === 'string') {
    return PRICE_REGEX.test(price.trim());
  }
  if (typeof price === 'number') {
    return price >= 0;
  }
  return false;
}

/**
 * Validate URL format
 */
export function validateUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return URL_REGEX.test(url.trim());
}

/**
 * Validate date format (ISO string or Date object)
 */
export function validateDate(dateStr) {
  if (!dateStr) return false;
  
  // If it's already a Date object
  if (dateStr instanceof Date) {
    return !isNaN(dateStr.getTime());
  }
  
  // If it's a string, try to parse it
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate event category
 */
export function validateCategory(category) {
  if (!category || typeof category !== 'string') return false;
  const validCategories = [
    'conference', 'workshop', 'seminar', 'webinar', 'meetup', 
    'training', 'hackathon', 'expo', 'summit', 'symposium',
    'competition', 'tech-fest'
  ];
  return validCategories.includes(category.toLowerCase());
}

/**
 * Validate capacity (positive integer)
 */
export function validateCapacity(capacity) {
  if (capacity === null || capacity === undefined) return true; // Allow null capacity
  if (typeof capacity === 'string') {
    const num = parseInt(capacity, 10);
    return Number.isInteger(num) && num > 0;
  }
  if (typeof capacity === 'number') {
    return Number.isInteger(capacity) && capacity > 0;
  }
  return false;
}

/**
 * Validate role
 */
export function validateRole(role) {
  if (!role || typeof role !== 'string') return false;
  const validRoles = ['admin', 'organiser', 'attendee'];
  return validRoles.includes(role.toLowerCase());
}

/**
 * Validate status
 */
export function validateStatus(status, entityType = 'event') {
  if (!status || typeof status !== 'string') return false;
  
  let validStatuses = [];
  switch (entityType) {
    case 'event':
      validStatuses = ['draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled'];
      break;
    case 'registration':
      validStatuses = ['pending', 'confirmed', 'cancelled'];
      break;
    case 'payment':
      validStatuses = ['pending', 'completed', 'failed', 'refunded'];
      break;
    default:
      return false;
  }
  
  return validStatuses.includes(status.toLowerCase());
}

/**
 * Validate college/university name
 */
export function validateCollege(college) {
  if (!college || typeof college !== 'string') return false;
  const trimmedCollege = college.trim();
  if (trimmedCollege.length < 2 || trimmedCollege.length > 200) return false;
  return true; // Basic validation, could be more specific
}

/**
 * Validate event title
 */
export function validateTitle(title) {
  if (!title || typeof title !== 'string') return false;
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 3 || trimmedTitle.length > 255) return false;
  return true;
}

/**
 * Validate event description
 */
export function validateDescription(description) {
  if (description === null || description === undefined) return true; // Description is optional
  if (typeof description !== 'string') return false;
  const trimmedDesc = description.trim();
  if (trimmedDesc.length > 2000) return false; // Max 2000 chars
  return true;
}

/**
 * Validate location
 */
export function validateLocation(location) {
  if (!location || typeof location !== 'string') return false;
  const trimmedLocation = location.trim();
  if (trimmedLocation.length < 3 || trimmedLocation.length > 255) return false;
  return true;
}

/**
 * Validate ID (positive integer)
 */
export function validateId(id) {
  if (!id) return false;
  if (typeof id === 'string') {
    const num = parseInt(id, 10);
    return Number.isInteger(num) && num > 0;
  }
  if (typeof id === 'number') {
    return Number.isInteger(id) && id > 0;
  }
  return false;
}

/**
 * Comprehensive user validation
 */
export function validateUser(userData) {
  const errors = [];
  
  if (!validateName(userData.name)) {
    errors.push('Invalid name format');
  }
  
  if (!validateEmail(userData.email)) {
    errors.push('Invalid email format');
  }
  
  if (userData.phone && !validatePhone(userData.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (userData.college && !validateCollege(userData.college)) {
    errors.push('Invalid college name');
  }
  
  if (!validateRole(userData.role)) {
    errors.push('Invalid role');
  }
  
  if (userData.password && userData.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Comprehensive event validation
 */
export function validateEvent(eventData) {
  const errors = [];
  
  if (!validateTitle(eventData.title)) {
    errors.push('Invalid title format');
  }
  
  if (eventData.description && !validateDescription(eventData.description)) {
    errors.push('Invalid description format');
  }
  
  if (!validateCategory(eventData.category)) {
    errors.push('Invalid category');
  }
  
  if (eventData.image_url && !validateUrl(eventData.image_url)) {
    errors.push('Invalid image URL format');
  }
  
  if (!validateDate(eventData.start_date)) {
    errors.push('Invalid start date');
  }
  
  if (!validateDate(eventData.end_date)) {
    errors.push('Invalid end date');
  }
  
  if (new Date(eventData.start_date) >= new Date(eventData.end_date)) {
    errors.push('End date must be after start date');
  }
  
  if (!validateLocation(eventData.location)) {
    errors.push('Invalid location format');
  }
  
  if (eventData.max_capacity && !validateCapacity(eventData.max_capacity)) {
    errors.push('Invalid max capacity');
  }
  
  if (eventData.price !== undefined && !validatePrice(eventData.price)) {
    errors.push('Invalid price format');
  }
  
  if (eventData.status && !validateStatus(eventData.status, 'event')) {
    errors.push('Invalid status');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Comprehensive registration validation
 */
export function validateRegistration(regData) {
  const errors = [];
  
  if (!validateId(regData.eventId)) {
    errors.push('Invalid event ID');
  }
  
  // Note: user ID is typically validated server-side from session
  
  if (regData.status && !validateStatus(regData.status, 'registration')) {
    errors.push('Invalid registration status');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Comprehensive payment validation
 */
export function validatePayment(paymentData) {
  const errors = [];
  
  if (!validateId(paymentData.registrationId)) {
    errors.push('Invalid registration ID');
  }
  
  if (!validatePrice(paymentData.amount)) {
    errors.push('Invalid amount');
  }
  
  if (paymentData.status && !validateStatus(paymentData.status, 'payment')) {
    errors.push('Invalid payment status');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generic validation function that sanitizes and validates inputs
 */
export function validateAndSanitize(input, validatorFn) {
  if (typeof input === 'string') {
    input = sanitizeString(input);
  }
  
  const isValid = validatorFn(input);
  return {
    isValid,
    sanitizedValue: input,
    error: isValid ? null : 'Invalid input'
  };
}