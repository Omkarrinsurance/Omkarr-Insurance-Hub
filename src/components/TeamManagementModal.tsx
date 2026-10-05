/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AppUser, UserRole, MASTER_ADMIN_EMAIL } from '../types/auth';
import { Shield, UserPlus, Trash2, X, Check, Users, ShieldAlert } from 'lucide-react';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUserEmail 
}) => {
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('agent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Listen to Firestore users collection
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const users: AppUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        users.push({
          uid: docSnap.id,
          email: data.email || docSnap.id,
          displayName: data.displayName || '',
          role: (data.role as UserRole) || 'agent',
          addedBy: data.addedBy || '',
          createdAt: data.createdAt || ''
        });
      });

      // Ensure Master Admin is included
      if (!users.some(u => u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase())) {
        users.unshift({
          uid: 'master_admin',
          email: MASTER_ADMIN_EMAIL,
          role: 'admin',
          displayName: 'Master Administrator',
          createdAt: 'System Initialized'
        });
      }

      setUsersList(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const emailClean = newEmail.trim().toLowerCase();
    setIsSubmitting(true);

    try {
      const docId = emailClean.replace(/[^a-z0-9]/g, '_');
      const userRef = doc(db, 'users', docId);

      await setDoc(userRef, {
        email: emailClean,
        role: newRole,
        addedBy: currentUserEmail,
        createdAt: new Date().toLocaleDateString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      showStatus(`Added ${emailClean} as ${newRole === 'admin' ? 'Admin' : 'Agent'}`);
      setNewEmail('');
      setNewRole('agent');
    } catch (err: any) {
      console.error('Error adding user:', err);
      showStatus(`Error adding user: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeRole = async (user: AppUser, targetRole: UserRole) => {
    if (user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      showStatus('Master administrator role cannot be altered.');
      return;
    }

    try {
      const docId = user.uid;
      const userRef = doc(db, 'users', docId);
      await setDoc(userRef, { role: targetRole, updatedAt: new Date().toISOString() }, { merge: true });
      showStatus(`Updated ${user.email} to ${targetRole.toUpperCase()}`);
    } catch (err: any) {
      console.error('Error updating role:', err);
      showStatus('Failed to update role in database.');
    }
  };

  const handleRemoveUser = async (user: AppUser) => {
    if (user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      showStatus('Cannot remove Master Administrator.');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);
      showStatus(`Removed access for ${user.email}`);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      showStatus('Failed to remove user from database.');
    }
  };

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div className="sp-modal-header" style={{ background: '#002050', padding: '16px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '6px', 
              background: '#0078d4', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Users size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Team & Access Management
              </h3>
              <p style={{ fontSize: '11.5px', color: '#90cdf4', margin: 0 }}>
                Control who can view or edit Omkarr Insurance Hub
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 22px', maxHeight: '70vh', overflowY: 'auto' }}>
          {statusMessage && (
            <div style={{ 
              background: '#f0fdf4', 
              color: '#166534', 
              border: '1px solid #bbf7d0', 
              padding: '8px 14px', 
              borderRadius: '4px', 
              fontSize: '12.5px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              marginBottom: '16px' 
            }}>
              <Check size={14} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Add / Invite User Form */}
          <div style={{ 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '6px', 
            padding: '16px', 
            marginBottom: '20px' 
          }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#002050', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={15} color="#0078d4" />
              <span>Add Member by Email</span>
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              Agents can only view the hub and launch portals. Admins have full access to add/edit carriers, tabs, and manage users.
            </p>

            <form onSubmit={handleAddMember} style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr auto', gap: '10px' }}>
              <input 
                type="email" 
                required
                placeholder="colleague@omkarr.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <select 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                style={{
                  padding: '8px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              >
                <option value="agent">Agent (View Only)</option>
                <option value="admin">Admin (Full Edit)</option>
              </select>
              <button 
                type="submit" 
                disabled={isSubmitting || !newEmail.trim()}
                style={{
                  background: '#0078d4',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {isSubmitting ? 'Adding...' : 'Add Member'}
              </button>
            </form>
          </div>

          {/* Members List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#002050' }}>
                Active Members & Roles ({usersList.length})
              </h4>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Synchronized with Firebase
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {usersList.map((user) => {
                const isMaster = user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

                return (
                  <div 
                    key={user.uid} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: user.role === 'admin' ? '#002050' : '#e2e8f0',
                        color: user.role === 'admin' ? '#ffffff' : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}>
                        {user.email.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                          {user.email}
                          {isMaster && (
                            <span style={{ 
                              marginLeft: '8px', 
                              background: '#fef3c7', 
                              color: '#92400e', 
                              fontSize: '10px', 
                              fontWeight: 700, 
                              padding: '1px 6px', 
                              borderRadius: '4px' 
                            }}>
                              Master Admin
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {user.role === 'admin' ? 'Full editing and user administration' : 'View only access to carrier portals & tools'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Role Selector */}
                      {!isMaster ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user, e.target.value as UserRole)}
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            background: user.role === 'admin' ? '#eff6fc' : '#ffffff',
                            color: user.role === 'admin' ? '#0078d4' : '#475569',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="agent">Agent (View Only)</option>
                          <option value="admin">Admin (Full Edit)</option>
                        </select>
                      ) : (
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          color: '#0078d4', 
                          background: '#eff6fc', 
                          padding: '4px 10px', 
                          borderRadius: '4px' 
                        }}>
                          ADMIN
                        </span>
                      )}

                      {/* Remove Button */}
                      {!isMaster && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          title={`Revoke access for ${user.email}`}
                        >
                          <Trash2 size={15} color="#ef4444" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sp-modal-footer">
          <button type="button" className="sp-btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
