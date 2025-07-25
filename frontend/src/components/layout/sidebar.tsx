'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Database,
  BarChart2,
  Brain,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/sidebar-context';

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const dataAnalysisItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/projects', label: 'Projects', icon: FileText },
    { href: '/datasets', label: 'Datasets', icon: Database },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/models', label: 'Models', icon: Brain },
    { href: '/team', label: 'Team', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const navItems = dataAnalysisItems;

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-30 shadow-lg",
        isCollapsed ? "w-[70px]" : "w-[280px]"
      )}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className={cn(
            "flex items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed && (
              <div className={cn(
                "flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                !isCollapsed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              )}>
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
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
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  Zyra
                </span>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 active:scale-95",
                "text-black hover:text-gray-700 hover:shadow-md"
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  "hover:bg-gray-100 hover:scale-105",
                  active ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 shadow-sm scale-105" : "text-black hover:text-gray-900",
                  isCollapsed ? "justify-center" : "justify-start"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  "flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  active ? "text-green-600" : "text-black group-hover:text-gray-600",
                  !isCollapsed && "mr-3",
                  "w-5 h-5",
                  active && "scale-110 rotate-3"
                )} />
                {!isCollapsed && (
                  <span className={cn(
                    "font-medium transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0 translate-x-2",
                    !isCollapsed && "opacity-100 translate-x-0",
                    active && "font-semibold"
                  )}>
                    {item.label}
                  </span>
                )}
                {!isCollapsed && active && (
                  <div className="ml-auto w-1 h-4 bg-green-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

      </div>
    </div>
  );
} 