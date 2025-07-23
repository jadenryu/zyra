'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { 
  Bell, 
  Menu,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="professional-header">
      <div className="max-w-full px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Logo and Search */}
          <div className="flex items-center gap-8 ml-64">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M8 6h16v4H8V6zM6 12h20v4H6v-4zM4 18h24v4H4v-4zM6 24h20v2H6v-2z"
                    fill="currentColor"
                  />
                  <circle cx="26" cy="8" r="2" fill="currentColor" opacity="0.7" />
                  <circle cx="28" cy="14" r="2" fill="currentColor" opacity="0.7" />
                  <circle cx="30" cy="20" r="2" fill="currentColor" opacity="0.7" />
                </svg>
              </div>
              <span className="logo text-xl">Zyra</span>
            </Link>
            
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted" />
                </div>
                <input
                  type="text"
                  placeholder="Search projects, datasets..."
                  className="block w-96 pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-accent transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            
            {user && (
              <div className="relative">
                <button 
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-foreground">
                      {user.full_name || user.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-muted">
                      {user.email}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-brand-600" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted" />
                </button>
                
                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-brand-600" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {user.full_name || user.email?.split('@')[0]}
                          </div>
                          <div className="text-sm text-muted">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link 
                        href="/settings" 
                        className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors w-full text-left"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="inline-flex items-center justify-center p-2 rounded-lg text-muted hover:text-foreground hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                <User className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {user?.full_name || user?.email?.split('@')[0]}
                </div>
                <div className="text-xs text-muted">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-2 space-y-1">
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors w-full text-left"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
} 