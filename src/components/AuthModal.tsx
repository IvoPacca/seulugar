/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, ChevronRight, Sparkles, Check } from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Determine if they should be system admin. The email 'ivoimbi5@gmail.com' or other admin criteria
      const isSystemAdmin = user.email === 'ivoimbi5@gmail.com' || user.email?.endsWith('@seulugar.ao');

      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Cliente Seu Lugar',
        photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        isAdmin: isSystemAdmin,
        created_at: new Date().toISOString()
      };

      // Save user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), profile, { merge: true });

      onAuthSuccess(profile);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError('Erro ao autenticar com o Google. Certifique-se de que as janelas de pop-up estão ativadas.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          id="auth-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl"
        >
          {/* Top Decorative bar */}
          <div className="h-2 bg-gradient-to-r from-blue-600 to-orange-500" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute p-1.5 transition-colors rounded-full top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-8">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                Seja bem-vindo
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Aceda à sua conta do <span className="font-semibold text-blue-600 text-[#2563EB]">Seu Lugar</span> para gerir compras e aceder a produtos digitais.
              </p>
            </div>

            {error && (
              <div className="p-3.5 mt-5 text-xs text-red-600 bg-red-50 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div className="mt-8 space-y-4">
              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center justify-center w-full px-5 py-3.5 text-sm font-medium text-gray-700 transition-[#2563EB] bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-98 shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.86 0 3.1 1.03 3.1 1.03l2.3-2.3C15.86 2.3 14 .96 12 .96c-4.44 0-8.22 2.64-9.83 6.47l2.84 2.2C5.9 6.8 8.7 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.52 12.27c0-.82-.07-1.61-.2-2.39H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.58l2.83 2.2c1.65-1.53 2.61-3.78 2.61-5.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.01 14.17c-.24-.72-.38-1.5-.01-2.33l-2.84-2.2C1.04 11.53.5 13.72.5 16s.54 4.47 1.67 6.36l2.84-2.2c-.37-.71-.5-1.5-.01-2.33s.37-.71.01-2.33z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.04c3.24 0 5.96-1.07 7.95-2.92l-2.83-2.2c-1.11.75-2.53 1.2-5.12 1.2-3.3 0-6.1-1.76-7.1-4.59l-2.84 2.2C3.78 20.4 7.56 23.04 12 23.04z"
                  />
                </svg>
                {loading ? 'A carregar...' : 'Entrar com o Google'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <span className="text-[11px] text-gray-400">
                Garantia de segurança Seu Lugar. Os seus dados estão encriptados.
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
