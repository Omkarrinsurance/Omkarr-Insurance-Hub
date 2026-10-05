/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Shield, Mail, Lock, X, AlertCircle } from 'lucide-react';
import { MASTER_ADMIN_EMAIL } from '../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
        onSuccess(userCred.user.email || email.trim());
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
        onSuccess(userCred.user.email || email.trim());
      }
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please verify and try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      onSuccess(userCred.user.email || '');
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in was interrupted. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="sp-modal-header" style={{ background: '#002050', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/src/assets/images/omkarr_insurance_logo_1791216978459.jpg" 
              alt="Omkarr Logo" 
              style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #d4af37' }} 
            />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {isRegister ? 'Create Hub Account' : 'Omkarr Hub Sign In'}
              </h3>
              <p style={{ fontSize: '11px', color: '#90cdf4', margin: 0 }}>
                Internal Insurance Agent Toolkit
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 20px' }}>
          {error && (
            <div style={{ 
              background: '#fde7e9', 
              color: '#a80000', 
              padding: '10px 14px', 
              borderRadius: '4px', 
              fontSize: '12.5px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '16px' 
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #c8c6c4',
              borderRadius: '4px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '13.5px',
              fontWeight: 600,
              color: '#201f1e',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              marginBottom: '18px',
              transition: 'all 0.15s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            margin: '14px 0', 
            color: '#8a8886', 
            fontSize: '12px' 
          }}>
            <div style={{ flex: 1, height: '1px', background: '#edebe9' }}></div>
            <span>or with email & password</span>
            <div style={{ flex: 1, height: '1px', background: '#edebe9' }}></div>
          </div>

          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#323130', marginBottom: '5px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={15} style={{ position: 'absolute', left: '10px', color: '#605e5c' }} />
                <input 
                  type="email"
                  required
                  placeholder="agent@omkarr.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    border: '1px solid #c8c6c4',
                    borderRadius: '4px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#323130', marginBottom: '5px' }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={15} style={{ position: 'absolute', left: '10px', color: '#605e5c' }} />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    border: '1px solid #c8c6c4',
                    borderRadius: '4px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              style={{
                background: '#0078d4',
                color: '#ffffff',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              {isLoading ? 'Authenticating...' : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#605e5c' }}>
            {isRegister ? (
              <span>Already have an account? <strong style={{ color: '#0078d4', cursor: 'pointer' }} onClick={() => setIsRegister(false)}>Sign In</strong></span>
            ) : (
              <span>New agent or admin? <strong style={{ color: '#0078d4', cursor: 'pointer' }} onClick={() => setIsRegister(true)}>Create Account</strong></span>
            )}
          </div>

          <div style={{ 
            marginTop: '18px', 
            background: '#faf9f8', 
            border: '1px solid #edebe9', 
            borderRadius: '4px', 
            padding: '10px 12px', 
            fontSize: '11.5px', 
            color: '#605e5c', 
            lineHeight: 1.4 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#002050', marginBottom: '2px' }}>
              <Shield size={12} color="#0078d4" />
              <span>Role Permissions</span>
            </div>
            <div><strong>Admin:</strong> Full access to add/edit carriers, tabs, and manage users ({MASTER_ADMIN_EMAIL}).</div>
            <div><strong>Agent:</strong> Read-only access to view carriers, search directories, and launch portals.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
