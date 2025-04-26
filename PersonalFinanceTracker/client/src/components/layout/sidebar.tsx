import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from "@/lib/utils";
import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  BarChart2, 
  User, 
  Menu, 
  X, 
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

type NavItemProps = {
  href: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
};

const NavItem = ({ href, icon, label, isActive, onClick }: NavItemProps) => (
  <Link href={href}>
    <a
      className={cn(
        "group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer",
        isActive 
          ? "bg-primary text-white" 
          : "text-gray-600 hover:bg-gray-100"
      )}
      onClick={onClick}
    >
      <div className="mr-3 h-6 w-6">{icon}</div>
      {label}
    </a>
  </Link>
);

export default function Sidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logoutMutation } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    { href: "/", icon: <Home className="stroke-current" />, label: "Dashboard" },
    { href: "/expenses", icon: <CreditCard className="stroke-current" />, label: "Expenses" },
    { href: "/goals", icon: <TrendingUp className="stroke-current" />, label: "Goals" },
    { href: "/insights", icon: <BarChart2 className="stroke-current" />, label: "Insights" },
    { href: "/profile", icon: <User className="stroke-current" />, label: "Profile" }
  ];

  const renderNavItems = (onItemClick?: () => void) => (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
          isActive={location === item.href}
          onClick={onItemClick}
        />
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden absolute top-0 left-0 z-50 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="text-gray-500 hover:text-gray-900"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-20 bg-gray-900 bg-opacity-50 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div 
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-primary text-white">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8" />
            <span className="text-xl font-semibold">BudgetBloom</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="text-white hover:bg-primary-dark"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        {renderNavItems(() => setMobileOpen(false))}
        
        {user && (
          <div className="px-4 py-2 border-t border-gray-200">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                {user.firstName ? user.firstName[0] : user.username[0]}
              </div>
              <div className="ml-2 truncate">
                <p className="text-sm font-medium">
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary text-white">
              <DollarSign className="h-8 w-8" />
              <span className="ml-2 text-xl font-semibold">BudgetBloom</span>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto">
              {renderNavItems()}
            </div>

            {user && (
              <div className="flex items-center p-4 border-t border-gray-200">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                  {user.firstName ? user.firstName[0] : user.username[0]}
                </div>
                <div className="ml-2 flex-1 truncate">
                  <p className="text-sm font-medium">
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                >
                  Sign out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
