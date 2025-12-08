import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  Home, 
  Tag, 
  User, 
  Heart, 
  Store, 
  BarChart3, 
  Users, 
  Settings,
  CreditCard,
  Clock
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const getNavItems = (): NavItem[] => {
    if (!isAuthenticated || !user) {
      return [
        { icon: Home, label: "Home", href: "/" },
        { icon: Tag, label: "Deals", href: "/deals" },
        { icon: CreditCard, label: "Pricing", href: "/pricing" },
        { icon: Store, label: "Vendors", href: "/vendor/benefits" },
      ];
    }

    switch (user.role) {
      case 'customer':
        return [
          { icon: Home, label: "Home", href: "/" },
          { icon: Tag, label: "Deals", href: "/customer/deals" },
          { icon: Heart, label: "Wishlist", href: "/customer/wishlist" },
          { icon: Clock, label: "Claims", href: "/customer/claims" },
          { icon: User, label: "Profile", href: "/customer/profile" },
        ];
      case 'vendor':
        return [
          { icon: Home, label: "Dashboard", href: "/vendor/dashboard" },
          { icon: Store, label: "Deals", href: "/vendor/deals" },
          { icon: BarChart3, label: "Analytics", href: "/vendor/analytics" },
          { icon: CreditCard, label: "POS", href: "/vendor/pos-dashboard" },
          { icon: User, label: "Profile", href: "/vendor/profile" },
        ];
      case 'admin':
        return [
          { icon: Home, label: "Dashboard", href: "/admin/dashboard" },
          { icon: Users, label: "Users", href: "/admin/users" },
          { icon: Store, label: "Vendors", href: "/admin/vendors" },
          { icon: Tag, label: "Deals", href: "/admin/deals" },
          { icon: BarChart3, label: "Reports", href: "/admin/reports" },
        ];
      case 'superadmin':
        return [
          { icon: Home, label: "Dashboard", href: "/superadmin/dashboard" },
          { icon: Users, label: "Users", href: "/admin/users" },
          { icon: Store, label: "Vendors", href: "/admin/vendors" },
          { icon: Tag, label: "Deals", href: "/admin/deals" },
          { icon: Settings, label: "Logs", href: "/superadmin/logs" },
        ];
      default:
        return [
          { icon: Home, label: "Home", href: "/" },
          { icon: Tag, label: "Deals", href: "/deals" },
          { icon: CreditCard, label: "Pricing", href: "/pricing" },
          { icon: Store, label: "Vendors", href: "/vendor/benefits" },
        ];
    }
  };

  const navItems = getNavItems();

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden safe-area-bottom"
      data-testid="mobile-bottom-nav"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[64px] touch-target transition-colors ${
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`h-5 w-5 mb-1 ${active ? "text-primary" : ""}`} />
              <span className={`text-xs font-medium ${active ? "text-primary" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}