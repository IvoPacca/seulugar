/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShoppingCart, Search, LogIn, User, LogOut, ClipboardList, ShieldAlert, Sparkles, HelpCircle 
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  cartCount: number;
  onOpenCart: () => void;
  onToggleAdmin: () => void;
  isAdminView: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenMyOrders: () => void;
}

export default function Navbar({
  user,
  onOpenAuth,
  onLogout,
  cartCount,
  onOpenCart,
  onToggleAdmin,
  isAdminView,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onOpenMyOrders
}: NavbarProps) {
  return (
    <nav id="app-navbar" className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      {/* Top micro brand ticker */}
      <div className="bg-[#1F2937] text-white py-2 px-4 text-center text-[11px] font-semibold tracking-wider flex items-center justify-center gap-1.5 uppercase">
        <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
        <span>Grande Inauguração • Entregas exclusivas em Luanda e downloads imediatos</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand Logo Identity */}
          <div className="flex items-center justify-between">
            <div 
              onClick={() => {
                onSelectCategory('Todos');
                if (isAdminView) onToggleAdmin();
              }}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              {/* SVG Reconstructing the Brand Icon (blue box inside white cart + orange orbit) */}
              <div className="relative w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100 p-1.5 transition-transform group-hover:scale-105">
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Cart Body */}
                  <path d="M15 30H30L45 65H75L85 40H35" stroke="#2563EB" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Cart Wheels */}
                  <circle cx="45" cy="78" r="8" fill="#1F2937"/>
                  <circle cx="72" cy="78" r="8" fill="#1F2937"/>
                  {/* Orange Gift/Box inside */}
                  <path d="M42 32H68V48H42V32Z" fill="#F97316"/>
                  <path d="M38 32L55 18L72 32" stroke="#F97316" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Swirling Orbit */}
                  <path d="M10 60C18 35 70 25 88 52" stroke="#F97316" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-[#2563EB] transition-colors leading-none flex items-center gap-1">
                  Seu <span className="text-[#F97316]">Lugar</span>
                </h1>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide block mt-1">
                  " Tudo o que procuras, num só lugar. "
                </span>
              </div>
            </div>

            {/* Mobile quick cart and menu controls */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={onOpenCart}
                className="relative p-2 text-gray-650 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#F97316] px-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar Block */}
          {!isAdminView && (
            <div className="flex-1 max-w-lg md:mx-6">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Pesquisar eletrónicos, templates, cursos, café..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition-all text-gray-800"
                />
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-end gap-3 shrink-0">
            {/* Orders log history link */}
            {user && (
              <button
                onClick={onOpenMyOrders}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
              >
                <ClipboardList className="w-4 h-4 text-gray-500" />
                <span className="hidden sm:inline">Os Meus Pedidos</span>
              </button>
            )}

            {/* Admin toggle pivot */}
            {user?.isAdmin && (
              <button
                onClick={onToggleAdmin}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  isAdminView 
                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-inner' 
                    : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-[#F97316]" />
                <span>{isAdminView ? 'Ver Loja' : 'Painel Admin'}</span>
              </button>
            )}

            {/* Cart trigger desk */}
            <button
              onClick={onOpenCart}
              className="hidden md:flex relative items-center justify-center p-2.5 text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
              title="Ver Carrinho"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F97316] px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth Button */}
            {user ? (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl pl-2 pr-3 py-1.5">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-6 h-6 rounded-lg object-cover border border-white"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-[10px] font-bold text-gray-800 line-clamp-1">{user.displayName}</div>
                  <div className="text-[9px] text-gray-400 font-medium line-clamp-1">{user.email}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors ml-1.5"
                  title="Sair da Conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-90 rounded-xl shadow-md transition-all active:scale-97"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
