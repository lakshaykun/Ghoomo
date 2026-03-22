/**
 * User Service
 */

import { query } from '../database';
import { User, UserRole } from '../core';
import { generateId } from '../utils';

/**
 * Find user by email
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

/**
 * Find user by ID
 */
export const findUserById = async (id: string): Promise<User | null> => {
  try {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

/**
 * Create new user
 */
export const createUser = async (
  email: string,
  name: string,
  hashedPassword: string,
  role: UserRole = UserRole.USER
): Promise<User> => {
  try {
    const id = generateId();
    const now = new Date();

    const result = await query(
      `INSERT INTO users (id, email, name, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, email, name, hashedPassword, role, now, now]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update user
 */
export const updateUser = async (
  id: string,
  updates: Partial<User>
): Promise<User | null> => {
  try {
    const setFields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const result = await query(
      `UPDATE users SET ${setFields}, updated_at = $1 WHERE id = $1 RETURNING *`,
      [new Date(), ...Object.values(updates)]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete user
 */
export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    const result = await query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return result.rowCount! > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
