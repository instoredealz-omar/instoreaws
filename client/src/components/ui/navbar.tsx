import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MapPin, User, LogOut, Home, ShoppingBag, CreditCard, Store, Settings, Users, BarChart3, HelpCircle, Tag, Wand2, Heart, Clock, Shield, FileText, PlusCircle, UserCheck, TrendingUp, Package, Building, ClipboardList, Search, Archive } from "lucide-react";
import { majorCities } from "@/lib/cities";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import InstoredeelzLogo from "@/components/ui/instoredealz-logo";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavbarProps {
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

export default function Navbar({ selectedCity, onCityChange }: NavbarProps) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    switch (user.role) {
      case "customer": return "/customer/deals";
      case "vendor": return "/vendor/dashboard";
      case "admin": return "/admin/dashboard";
      case "superadmin": return "/superadmin/dashboard";
      default: return "/";
    }
  };

  const getNavigationItems = () => {
    if (!isAuthenticated || !user) {
      return [
        { label: "Home", href: "/", icon: Home },
        { label: "Pricing", href: "/pricing", icon: CreditCard },
        { label: "For Vendors", href: "/vendor/benefits", icon: Store },
        { label: "Help", href: "/help", icon: HelpCircle },
      ];
    }

    // Role-specific navigation
    switch (user.role) {
      case 'vendor':
        return [
          { label: "Dashboard", href: "/vendor/dashboard", icon: Home },
          { label: "My Deals", href: "/vendor/deals", icon: Store },
          { label: "Create Deal", href: "/vendor/create-deal", icon: PlusCircle },
          { label: "Analytics", href: "/vendor/analytics", icon: BarChart3 },
          { label: "POS System", href: "/vendor/pos", icon: CreditCard },
          { label: "Profile", href: "/vendor/profile", icon: User },
          { label: "Help", href: "/help", icon: HelpCircle },
        ];
      case 'customer':
        return [
          { label: "Deals", href: "/customer/deals", icon: Tag },
          { label: "Deal Wizard", href: "/customer/deal-wizard", icon: Wand2 },
          { label: "Wishlist", href: "/customer/wishlist", icon: Heart },
          { label: "Claims", href: "/customer/claims", icon: Clock },
          { label: "Dashboard", href: "/customer/dashboard", icon: Home },
          { label: "Help", href: "/help", icon: HelpCircle },
        ];
      case 'admin':
        return [
          { label: "Dashboard", href: "/admin/dashboard", icon: Home },
          { label: "Users", href: "/admin/users", icon: Users },
          { label: "Vendors", href: "/admin/vendors", icon: Building },
          { label: "Deals", href: "/admin/deals", icon: Tag },
          { label: "Reports", href: "/admin/reports", icon: FileText },
          { label: "Analytics", href: "/admin/dashboard", icon: TrendingUp },
          { label: "Help", href: "/help", icon: HelpCircle },
        ];
      case 'superadmin':
        return [
          { label: "Dashboard", href: "/superadmin/dashboard", icon: Home },
          { label: "Admins", href: "/admin/users", icon: Shield },
          { label: "System Logs", href: "/superadmin/logs", icon: Archive },
          { label: "Analytics", href: "/admin/dashboard", icon: TrendingUp },
          { label: "Help", href: "/help", icon: HelpCircle },
        ];
      default:
        return [
          { label: "Home", href: "/", icon: Home },
          { label: "Pricing", href: "/pricing", icon: CreditCard },
          { label: "For Vendors", href: "/vendor/benefits", icon: Store },
          { label: "Help", href: "/help", icon: HelpCircle },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-background shadow-sm border-b sticky top-0 z-50 dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link to="/" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}>
                <InstoredeelzLogo size="md" className="cursor-pointer" />
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}
                    className={`flex items-center space-x-1 text-foreground hover:text-primary transition-colors ${
                      location === item.href ? "text-primary font-medium" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* City Selector */}
            <Select value={selectedCity} onValueChange={onCityChange}>
              <SelectTrigger className="w-32 sm:w-40">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <SelectValue placeholder="City" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {majorCities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    <div className="flex justify-between items-center w-full">
                      <span>{city.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {city.dealCount} deals
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Auth Buttons */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-primary capitalize">{user.membershipPlan} Member</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardLink()} className="flex items-center" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}>
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="outline" asChild>
                  <Link to="/login" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}>Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}>Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0">
                <div className="flex flex-col h-full bg-background">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-lg font-semibold text-foreground">Menu</h2>
                    <ThemeToggle />
                  </div>
                  
                  {/* Navigation Items */}
                  <div className="flex-1 px-4 py-6 space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => {
                            setIsMenuOpen(false);
                            // Scroll to top when navigating
                            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                          }}
                          className={`flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                            location === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                  
                  {/* Auth Section for Mobile */}
                  {!isAuthenticated && (
                    <div className="p-4 border-t space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        asChild
                        onClick={() => {
                          setIsMenuOpen(false);
                          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                        }}
                      >
                        <Link to="/login">Login</Link>
                      </Button>
                      <Button 
                        className="w-full" 
                        asChild
                        onClick={() => {
                          setIsMenuOpen(false);
                          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                        }}
                      >
                        <Link to="/signup">Sign Up</Link>
                      </Button>
                    </div>
                  )}
                  
                  {/* User Profile Section */}
                  {isAuthenticated && user && (
                    <div className="mt-auto">
                      <div className="border-t">
                        <div className="p-4 bg-muted/30">
                          <div className="flex items-center space-x-3 mb-1">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {user.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              <p className="text-xs text-primary capitalize font-medium">
                                {user.membershipPlan || 'Basic'} {user.role === 'customer' ? 'Member' : user.role}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <Button 
                            variant="outline" 
                            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              handleLogout();
                              setIsMenuOpen(false);
                            }}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
