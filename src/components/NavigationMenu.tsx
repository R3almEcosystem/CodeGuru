// src/components/Navigation/Navigation.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Menu as MenuIcon, 
  X, 
  Settings, 
  LogOut, 
  User, 
  Search,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationProps {
  userName?: string;
  onSettingsClick?: () => void;
  onLogout?: () => void;
}

export default function Navigation({ 
  userName = 'Developer',
  onSettingsClick,
  onLogout
}: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside as any);
    return () => document.removeEventListener('mousedown', handleClickOutside as any);
  }, []);

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <span className="text-xl font-bold text-white hidden md:block">xAI Coder</span>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <AnimatePresence>
                {searchOpen ? (
                  <motion.input
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '100%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    type="text"
                    placeholder="Search projects, code, chat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:border-indigo-500 transition text-white placeholder-gray-500"
                    autoFocus
                  />
                ) : null}
              </AnimatePresence>
              <Search 
                size={18} 
                className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" 
              />
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="absolute right-2 top-1.5 p-1.5 hover:bg-gray-700 rounded-full transition"
              >
                {searchOpen ? <X size={18} className="text-gray-400" /> : <Search size={18} className="text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onSettingsClick}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition text-sm font-medium"
            >
              <Settings size={18} />
              Settings
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-300">{userName}</span>
              </div>
              <button
                onClick={onLogout}
                className="text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-1.5 transition"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition"
          >
            {mobileOpen ? <X size={24} className="text-white" /> : <MenuIcon size={24} className="text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-gray-800 bg-gray-900"
          >
            <div className="px-4 py-6 space-y-6">
              {/* Mobile Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
              </div>

              {/* Mobile Actions */}
              <div className="space-y-3">
                <button
                  onClick={onSettingsClick}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-left"
                >
                  <Settings size={20} className="text-gray-400" />
                  <span className="text-gray-300 font-medium">Settings</span>
                </button>

                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <User size={18} className="text-white" />
                    </div>
                    <span className="font-medium text-gray-300">{userName}</span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="text-red-400 hover:text-red-300 font-medium flex items-center gap-2"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}