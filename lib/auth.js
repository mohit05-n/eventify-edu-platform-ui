import bcrypt from "bcryptjs"
import {  query  } from "./db"

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export async function getUserByEmail(email) {
  const result = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()])
  return result[0] || null
}

export async function createUser(
  email,
  password,
  name,
  role,
  phone,
  college,
) {
  // Only hash password if it's provided
  const hashedPassword = password ? await hashPassword(password) : null
  const result = await query(
    "INSERT INTO users (email, password, name, role, phone, college) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, role",
    [email.toLowerCase(), hashedPassword, name, role, phone, college],
  )
  return result[0]
}

export async function getUserById(id) {
  const result = await query("SELECT id, email, name, role, phone, college FROM users WHERE id = $1", [id])
  return result[0] || null
}

