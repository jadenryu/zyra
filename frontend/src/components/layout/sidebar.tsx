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
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/projects', label: 'Projects', icon: FileText },
    { href: '/datasets', label: 'Datasets', icon: Database },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/models', label: 'Models', icon: Brain },
    { href: '/team', label: 'Team', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="professional-sidebar">
      <div className="p-6">
        <div className="logo mb-8">Zyra</div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 