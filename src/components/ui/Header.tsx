import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-backdrop sticky top-0 z-10">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
      </div>

      {/* Right side actions can go here later */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {/* Model selector, settings, etc. */}
      </div>
    </header>
  );
}
