'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus,
  Receipt, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  PlusCircle,
  Menu,
  X,
  Wallet
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Sócios', icon: UserPlus, href: '/socios' },
    { label: 'Clientes', icon: Users, href: '/clientes' },
    { label: 'Despesas', icon: Receipt, href: '/despesas' },
    { label: 'Recebimentos', icon: ArrowDownCircle, href: '/recebimentos' },
    { label: 'Pagamentos', icon: ArrowUpCircle, href: '/pagamentos' },
    { label: 'Receitas Extras', icon: PlusCircle, href: '/receitas-extras' },
  ];

  return (
    <>
      <button 
        className="btn btn-ghost" 
        style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 101 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="md:hidden" />
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header flex-between">
          <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="ContHabeis Logo" style={{ maxHeight: '40px', maxWidth: '100%' }} />
          </div>
          <button className="btn btn-ghost md:hidden" onClick={() => setIsOpen(false)} style={{ display: 'none' }}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
