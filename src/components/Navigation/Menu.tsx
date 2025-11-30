// src/components/Navigation/Menu.tsx
'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import { Menu as MenuIcon, X, ChevronDown, Search, Settings, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MenuItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
}

interface NavigationProps {
  items?: MenuItem[];
  logo?: React.ReactNode;
  onSettingsClick?: () => void;
  onLogout?: () => void;
  userName?: string;
  className?: string;
}

const defaultItems: MenuItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Chat', href: '/chat' },
  { label: 'Docs', href: '/docs' },
  { label: 'API', href: '/api' },
];

export default function Navigation({
  items = defaultItems,
  logo = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
        <span className="text-white font-bold text-xl">G</span>
      </div>
      <span className="text-xl font-bold text-gray-900 hidden md:block">xAI Coder</span>
    </div>
  ),
  onSettingsClick,
  onLogout,
  userName = 'Developer',
  className = '',
}: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(prev => (prev === label ? null : label));
  };

  const NavLink = ({ item, onClick }: { item: MenuItem; onClick?: () => void }) => (
    <a
      href={item.href || '#'}
      onClick={(e) => {
        if (onClick) onClick();
        if (item.href?.startsWith('/')) {
          e.preventDefault();
          // Let React Router handle navigation
          window.location.href = item.href;
        }
      }}
      className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2 font-medium"
    >
      {item.icon}
      {item.label}
    </a>
  );

  return (
    <nav className={`bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            {logo}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8 flex-1 justify-center" ref={dropdownRef}>
            {items.map((item) => (
              <div key={item.label} className="relative">
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className="flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
                      aria-haspopup="true"
                      aria-expanded={openDropdown === item.label}
                    >
                      {item.label}
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <AnimatePresence>
                      {openDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
                        >
                          <div className="py-3">
                            {item.children.map((child) => (
                              <a
                                key={child.label}
                                href={child.href}
                                className="block px-6 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-3"
                                onClick={() => setOpenDropdown(null)}
                              >
                                {child.icon}
                                {child.label}
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <NavLink item={item} />
                )}
              </div>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Search */}
            <div className="hidden md:flex items-center relative">
              <AnimatePresence>
                {searchOpen && (
                  <motion.input
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    type="text"
                    placeholder="Search projects, chats, docs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    autoFocus
                  />
                )}
              </AnimatePresence>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-2"
                aria-label="Toggle search"
              >
                <Search size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Settings & User */}
            <div className="hidden md:flex items-center gap-4 pl-6 border-l border-gray-300">
              <button
                onClick={onSettingsClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                aria-label="Open settings"
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{userName}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
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
            className="lg:hidden border-t border-gray-200 bg-white"
          >
            <div className="px-4 py-4 space-y-1">
              {items.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <>
                      <button className="w-full text-left px-4 py-3 font-medium text-gray-900 flex items-center justify-between hover:bg-gray-50 rounded-lg">
                        {item.label}
                        <ChevronDown size={18} className="text-gray-500" />
                      </button>
                      <div className="pl-8 space-y-1">
                        {item.children.map((child) => (
                          <a
                            key={child.label}
                            href={child.href}
                            className="block px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.label}
                          </a>
                        ))}
                      </div>
                    </>
                  ) : (
                    <a
                      href={item.href}
                      className="block px-4 py-3 text-gray-900 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </a>
                  )}
                </div>
              ))}

              <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                <button
                  onClick={onSettingsClick}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                >
                  <Settings size={18} />
                  Settings
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}