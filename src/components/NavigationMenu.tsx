'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import { Menu as MenuIcon, X, ChevronDown, Search, User } from 'lucide-react';
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
  className?: string;
}

const defaultItems: MenuItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Products',
    children: [
      { label: 'Product One', href: '/products/one' },
      { label: 'Product Two', href: '/products/two' },
      { label: 'Product Three', href: '/products/three' },
    ],
  },
  {
    label: 'Services',
    children: [
      { label: 'Consulting', href: '/services/consulting' },
      { label: 'Support', href: '/services/support' },
      { label: 'Training', href: '/services/training' },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navigation({
  items = defaultItems,
  logo = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
        <span className="text-white font-bold text-xl">G</span>
      </div>
      <span className="text-xl font-bold text-gray-900 hidden md:block">Grok Chat</span>
    </div>
  ),
  className = '',
}: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent<Document>) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside as any);
    return () => document.removeEventListener('mousedown', handleClickOutside as any);
  }, []);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(prev => (prev === label ? null : label));
  };

  const NavLink = ({ item }: { item: MenuItem }) => (
    <a
      href={item.href || '#'}
      className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-2"
      onClick={() => setMobileOpen(false)}
    >
      {item.icon}
      {item.label}
    </a>
  );

  return (
    <>
      <nav className={`bg-white border-b border-gray-200 sticky top-0 z-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">{logo}</div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8 flex-1 justify-center" ref={dropdownRef}>
              {items.map((item) => (
                <div key={item.label} className="relative">
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className="flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                        aria-haspopup="true"
                        aria-expanded={openDropdown === item.label}
                      >
                        {item.label}
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`}
                        />
                      </button>

                      <AnimatePresence>
                        {openDropdown === item.label && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                          >
                            <div className="py-2">
                              {item.children.map((child) => (
                                <a
                                  key={child.label}
                                  href={child.href}
                                  className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3"
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

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <AnimatePresence>
                  {searchOpen ? (
                    <motion.input
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 240, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : null}
                </AnimatePresence>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Toggle search"
                >
                  <Search size={20} className="text-gray-600" />
                </button>
              </div>

              {/* User Profile */}
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="User menu">
                <User size={20} className="text-gray-600" />
              </button>

              {/* Mobile menu button */}
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
                        <button className="w-full text-left px-4 py-3 font-medium text-gray-900 flex items-center justify-between">
                          {item.label}
                          <ChevronDown size={18} />
                        </button>
                        <div className="pl-6 space-y-1">
                          {item.children.map((child) => (
                            <a
                              key={child.label}
                              href={child.href}
                              className="block px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                        className="block px-4 py-3 text-gray-900 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}