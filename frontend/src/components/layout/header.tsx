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
import { useSidebar } from '@/lib/sidebar-context';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, signOut } = useAuth();
  const { isCollapsed } = useSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 z-20 transition-all duration-300">
      <div className={cn(
        "h-full px-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isCollapsed ? "ml-[70px]" : "ml-[280px]"
      )}>
        <div className="flex h-full items-center justify-between">
          {/* Left side - Search (Logo moved to sidebar) */}
          <div className="flex items-center gap-6">
            {isCollapsed && (
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <svg
                    width="24"
                    height="24"
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
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  Zyra
                </span>
              </Link>
            )}
            
            <div className="hidden md:block flex-1 max-w-2xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-black group-focus-within:text-green-600 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search projects, datasets, or ask a question..."
                  className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 dark:border-gray-700 rounded-xl text-black placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 px-1.5 items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-white text-[10px] text-black dark:text-gray-400">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>
          
          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group">
              <Bell className="h-5 w-5 text-black dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-br from-green-400 to-green-600 text-white text-xs font-medium rounded-full flex items-center justify-center shadow-lg animate-pulse">
                3
              </span>
            </button>
            
            {user && (
              <div className="relative">
                <button 
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-black">
                      {user.full_name || user.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-black dark:text-gray-400">
                      {user.email}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-black transition-transform duration-200" style={{
                    transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }} />
                </button>
                
                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-black">
                            {user.full_name || user.email?.split('@')[0]}
                          </div>
                          <div className="text-sm text-black dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link 
                        href="/settings" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-black dark:text-gray-300 hover:bg-gray-100 rounded-xl transition-all duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        className="flex items-center gap-3 px-4 py-3 text-sm text-black dark:text-gray-300 hover:bg-gray-100 rounded-xl transition-all duration-200 w-full text-left"
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
              className="inline-flex items-center justify-center p-2 rounded-lg text-black hover:text-foreground hover:bg-accent transition-colors"
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
                <div className="text-xs text-black">
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