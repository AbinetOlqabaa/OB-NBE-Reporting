/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { UserSession } from '../types/regulatory.ts';
import { userService } from '../services/userService.ts';
import { vibrate, haptics } from '../utils/haptics.ts';

interface StoredBiometricCredential {
  credentialId: string;
  rawIdBase64: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  department: string;
  employeeId?: string;
  registeredAt: string;
  deviceLabel: string;
}

const STORAGE_KEY = 'ob_webauthn_credentials';
const LAST_USER_KEY = 'ob_last_biometric_user';

// Helper utilities for ArrayBuffer <-> Base64 / Hex conversions
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<StoredBiometricCredential[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to read stored credentials
  const getStoredCredentials = useCallback((): StoredBiometricCredential[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {}
    return [];
  }, []);

  const refreshEnrolledStatus = useCallback(() => {
    const list = getStoredCredentials();
    setRegisteredUsers(list);
    const lastUser = localStorage.getItem(LAST_USER_KEY);
    if (list.length > 0) {
      setIsRegistered(true);
      const matched = list.find((u) => u.email === lastUser) || list[0];
      setRegisteredEmail(matched.email);
    } else {
      setIsRegistered(false);
      setRegisteredEmail(null);
    }
  }, [getStoredCredentials]);

  // Check WebAuthn platform availability on mount
  useEffect(() => {
    async function checkAvailability() {
      if (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      ) {
        setIsSupported(true);
        try {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsPlatformAvailable(available);
        } catch {
          setIsPlatformAvailable(false);
        }
      } else {
        setIsSupported(false);
        setIsPlatformAvailable(false);
      }
      refreshEnrolledStatus();
    }

    checkAvailability();
  }, [refreshEnrolledStatus]);

  /**
   * Register biometric credentials for a specific user using Web Authentication API
   */
  const registerBiometric = async (user: {
    id: string;
    email: string;
    name: string;
    role?: string;
    department?: string;
    employeeId?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsRegistering(true);

    if (!isSupported) {
      const msg = 'Web Authentication API is not supported in this browser.';
      setError(msg);
      setIsRegistering(false);
      haptics.error();
      return { success: false, error: msg };
    }

    try {
      // 1. Generate cryptographic challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // 2. Prepare user id buffer
      const userIdBuffer = new TextEncoder().encode(user.id || user.email);

      // 3. Platform Authenticator Creation Options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Oromia Bank NBE Gateway',
          id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        },
        user: {
          id: userIdBuffer,
          name: user.email,
          displayName: user.name || user.email,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256 (standard platform auth)
          { alg: -257, type: 'public-key' },  // RS256 (fallback)
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Fingerprint, Face ID, Touch ID, Windows Hello
          userVerification: 'preferred',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      };

      // 4. Request credential creation
      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('Biometric passkey creation was rejected or not returned by the platform authenticator.');
      }

      const rawIdBase64 = bufferToBase64(credential.rawId);
      const newEntry: StoredBiometricCredential = {
        credentialId: credential.id,
        rawIdBase64,
        userId: user.id,
        email: user.email.toLowerCase(),
        name: user.name,
        role: user.role || 'MAKER',
        department: user.department || 'Credit Operations & Portfolio Management',
        employeeId: user.employeeId || 'OB-BIO-001',
        registeredAt: new Date().toISOString(),
        deviceLabel: navigator.userAgent.includes('Mobile') ? 'Mobile Device Biometrics' : 'Platform Biometrics',
      };

      // Save to localStorage
      const existing = getStoredCredentials().filter((u) => u.email !== user.email.toLowerCase());
      existing.unshift(newEntry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      localStorage.setItem(LAST_USER_KEY, user.email.toLowerCase());

      refreshEnrolledStatus();
      vibrate([25, 45, 30]);
      haptics.success();
      setIsRegistering(false);
      return { success: true };
    } catch (err: any) {
      let friendlyMessage = 'Biometric registration failed.';
      if (err.name === 'NotAllowedError') {
        friendlyMessage = 'Biometric registration was cancelled or timed out.';
      } else if (err.name === 'NotSupportedError') {
        friendlyMessage = 'Biometrics (Face ID / Fingerprint) not supported on this device/browser.';
      } else if (err.message) {
        friendlyMessage = err.message;
      }
      setError(friendlyMessage);
      haptics.error();
      setIsRegistering(false);
      return { success: false, error: friendlyMessage };
    }
  };

  /**
   * Authenticate user via WebAuthn Biometrics (Face ID, Fingerprint, Touch ID)
   */
  const authenticateBiometric = async (
    targetEmail?: string
  ): Promise<{
    success: boolean;
    user?: UserSession;
    redirectTab?: string;
    error?: string;
  }> => {
    setError(null);
    setIsAuthenticating(true);

    if (!isSupported) {
      const msg = 'Web Authentication API is not supported on this device.';
      setError(msg);
      setIsAuthenticating(false);
      haptics.error();
      return { success: false, error: msg };
    }

    const credentialsList = getStoredCredentials();
    if (credentialsList.length === 0) {
      const msg = 'No biometric passkey registered on this device. Please register or sign in with your email first.';
      setError(msg);
      setIsAuthenticating(false);
      haptics.error();
      return { success: false, error: msg };
    }

    // Determine target credential
    let targetCred = targetEmail
      ? credentialsList.find((c) => c.email.toLowerCase() === targetEmail.toLowerCase())
      : credentialsList[0];

    if (!targetCred) {
      targetCred = credentialsList[0];
    }

    try {
      // 1. Generate challenge buffer
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // 2. Prepare allowCredentials descriptors
      const allowCredentials: PublicKeyCredentialDescriptor[] = credentialsList.map((cred) => ({
        id: base64ToBuffer(cred.rawIdBase64),
        type: 'public-key' as const,
        transports: ['internal' as AuthenticatorTransport],
      }));

      // 3. WebAuthn Get Request
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: 'preferred',
        timeout: 60000,
      };

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error('Biometric authentication returned empty result.');
      }

      // 4. Identify the authenticated user
      const matchedCredential =
        credentialsList.find((c) => c.credentialId === assertion.id) || targetCred;

      // Find user in userService or reconstruct UserSession
      const existingUser = userService.getByEmail(matchedCredential.email);
      let userSession: UserSession;

      if (existingUser) {
        userSession = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          institutionCode: existingUser.institutionCode,
          department: existingUser.department,
          employeeId: existingUser.employeeId,
          specialAccessGrants: existingUser.specialAccessGrants || [],
        };
      } else {
        userSession = {
          id: matchedCredential.userId,
          name: matchedCredential.name,
          email: matchedCredential.email,
          role: matchedCredential.role as any,
          institutionCode: '0000013',
          department: matchedCredential.department,
          employeeId: matchedCredential.employeeId || 'OB-BIO-001',
          specialAccessGrants: [],
        };
      }

      // Update last user
      localStorage.setItem(LAST_USER_KEY, matchedCredential.email);

      let redirectTab = 'MAKER_WORKSPACE';
      if (userSession.role === 'ADMIN') redirectTab = 'ADMIN_DASHBOARD';
      else if (userSession.role === 'CHECKER') redirectTab = 'CHECKER_INBOX';

      vibrate([30, 45, 35]);
      haptics.success();
      setIsAuthenticating(false);

      return {
        success: true,
        user: userSession,
        redirectTab,
      };
    } catch (err: any) {
      let friendlyMessage = 'Biometric authentication failed.';
      if (err.name === 'NotAllowedError') {
        friendlyMessage = 'Biometric scan was cancelled or timed out.';
      } else if (err.name === 'NotSupportedError') {
        friendlyMessage = 'Biometrics not supported on this platform.';
      } else if (err.message) {
        friendlyMessage = err.message;
      }
      setError(friendlyMessage);
      haptics.error();
      setIsAuthenticating(false);
      return { success: false, error: friendlyMessage };
    }
  };

  /**
   * Remove biometric credentials for a specific email or all accounts
   */
  const removeBiometric = (email?: string) => {
    if (email) {
      const remaining = getStoredCredentials().filter(
        (c) => c.email.toLowerCase() !== email.toLowerCase()
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAST_USER_KEY);
    }
    refreshEnrolledStatus();
    vibrate(20);
  };

  const resetError = () => setError(null);

  return {
    isSupported,
    isPlatformAvailable,
    isRegistered,
    registeredEmail,
    registeredUsers,
    isAuthenticating,
    isRegistering,
    error,
    registerBiometric,
    authenticateBiometric,
    removeBiometric,
    resetError,
    refreshEnrolledStatus,
  };
}
