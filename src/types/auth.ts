/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'agent';

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  addedBy?: string;
  createdAt?: string;
}

export const MASTER_ADMIN_EMAIL = 'sumit13org@gmail.com';
