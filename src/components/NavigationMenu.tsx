// src/components/NavigationMenu.tsx
import React, { useState } from 'react';
import {
  Home,
  MessageSquare,
  FolderOpen,
  Settings,
  LogOut,
  User,
  Menu as MenuIcon,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../hooks/useSettings';
import { useNavigate } from 'react-router-dom';

interface NavigationMenuProps {
  currentView: 'home' | 'chat' | 'settings';
  onOpenSettings: () => void;
  onLogout?: () => void;
  userName: string;
}

const FALLBACK_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  currentView,
  onOpenSettings,
  onLogout,
  userName,
}) => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoUrl = settings?.logoUrl || FALLBACK_LOGO;

  const navItems = [
    { icon: Home, label: 'Home', path: '/', view: 'home' },
    { icon: MessageSquare, label: 'Chat', path: '/chat', view: 'chat' },
    { icon: FolderOpen, label: 'Projects', path: '/projects', view: 'projects' },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Logo" className="h-9 w-9 rounded-lg object-contain" />
          <h1 className="text-xl font-bold">xAI Coder</h1>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2">
          <MenuIcon size={28} />
        </button>
      </header>

      {/* Sidebar — Slide-out on mobile, fixed on desktop */}
      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : window.innerWidth >= 1024 ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col lg:relative lg:translate-x-0 lg:z-auto"
      >
        {/* Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 dark:border-gray-800 lg:h-auto lg:py-6">
          <img
            src={logoUrl}
            alt="xAI Coder"
            className="h-10 w-10 rounded-lg object-contain bg-gray-100"
            onError={(e) => (e.currentTarget.src = FALLBACK_LOGO)}
          />
          <h1 className="text-2xl font-bold hidden lg:block">xAI Coder</h1>
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden">
            <X size={28} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.view;
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-8 bg-blue-600 rounded-full" />}
              </button>
            );
          })}

          <div className="h-px bg-gray-200 dark:bg-gray-800 my-6" />

          <button
            onClick={() => {
              onOpenSettings();
              setMobileOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>

          {onLogout && (
            <button
              onClick={() => {
                onLogout();
                setMobileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{userName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Developer</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile top padding */}
      <div className="h-16 lg:hidden" />
    </>
  );
};