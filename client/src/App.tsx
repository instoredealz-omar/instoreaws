import { useLocation, useRoute } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "./lib/auth";
import { ScrollToTop } from "@/components/scroll-to-top";

// Import pages
import Home from "@/pages/shared/home";
import Login from "@/pages/shared/login";
import Signup from "@/pages/shared/signup";
import Pricing from "@/pages/shared/pricing";
import Terms from "@/pages/shared/terms";
import Privacy from "@/pages/shared/privacy";
import Help from "@/pages/shared/help";
import ResponsiveTest from "@/pages/shared/responsive-test";

// Customer pages
import CustomerDashboard from "@/pages/customer/dashboard";
import CustomerDeals from "@/pages/customer/deals";
import NearbyDeals from "@/pages/customer/nearby-deals";
import SecureDeals from "@/pages/customer/secure-deals";
import ClaimHistory from "@/pages/customer/claim-history";
import CustomerWishlist from "@/pages/customer/wishlist";
import MembershipCard from "@/pages/customer/membership-card";
import DealDetail from "@/pages/customer/deal-detail";
import UpgradeMembership from "@/pages/customer/upgrade-membership";
import CustomerProfile from "@/pages/customer/profile";
import DealWizard from "@/pages/customer/deal-wizard";

// Vendor pages
import VendorBenefits from "@/pages/vendor/benefits";
import VendorRegister from "@/pages/vendor/register-enhanced";
import VendorDashboard from "@/pages/vendor/dashboard";
import VendorDeals from "@/pages/vendor/deals";
import VendorAnalytics from "@/pages/vendor/analytics";
import PosDashboard from "@/pages/vendor/pos-dashboard";
import PosTransactions from "@/pages/vendor/pos-transactions";
import VendorProfile from "@/pages/vendor/profile";
import VendorProcess from "@/pages/vendor/VendorProcess";
import VendorOnboarding from "@/pages/vendor/VendorOnboarding";
import VendorDealCreation from "@/pages/vendor/VendorDealCreation";
import VendorLocationAnalytics from "@/pages/vendor/location-analytics";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminVendors from "@/pages/admin/vendors";
import AdminDeals from "@/pages/admin/deals";
import AdminReports from "@/pages/admin/reports";
import AdminDealDistribution from "@/pages/admin/deal-distribution";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminLocationAnalytics from "@/pages/admin/location-analytics";
import PromotionalBanners from "@/pages/admin/promotional-banners";

// Super Admin pages
import SuperAdminDashboard from "@/pages/superadmin/dashboard";
import SystemLogs from "@/pages/superadmin/logs";

import NotFound from "@/pages/not-found";
import AccessDenied from "@/pages/access-denied";
import TestFlows from "@/pages/test-flows";
import QRTest from "@/pages/qr-test";
import DealList from "@/components/DealList";
import SubscriptionButton from "@/components/Subscription";
import VendorPortal from "@/components/VendorPortal";
import MagicAdminDashboard from "@/components/AdminDashboard";
import BannerList from "@/components/BannerList";


// Role-based route protection component with TypeScript
interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  fallbackPath = "/login" 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Debug logging
  console.log('RoleProtectedRoute Debug:', {
    isAuthenticated,
    isLoading,
    user: user ? { id: user.id, role: user.role, name: user.name } : null,
    allowedRoles,
    fallbackPath
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('Redirecting to fallback path:', fallbackPath);
      navigate(fallbackPath);
    } else if (!isLoading && user && !allowedRoles.includes(user.role)) {
      console.log('User role not allowed, redirecting to access denied');
      navigate("/access-denied");
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, fallbackPath, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    console.log('Blocking access - not authenticated or wrong role');
    return null;
  }

  console.log('Access granted, rendering children');
  return <>{children}</>;
};

function Router() {
  // Public routes
  const [matchHome] = useRoute("/");
  const [matchLogin] = useRoute("/login");
  const [matchSignup] = useRoute("/signup");
  const [matchPricing] = useRoute("/pricing");
  const [matchTerms] = useRoute("/terms");
  const [matchPrivacy] = useRoute("/privacy");
  const [matchHelp] = useRoute("/help");
  const [matchResponsiveTest] = useRoute("/responsive-test");
  const [matchTest] = useRoute("/test");
  const [matchQRTest] = useRoute("/qr-test");
  const [matchDeals] = useRoute("/deals");
  const [matchDealDetail, dealParams] = useRoute("/deals/:id");
  const [matchBanners] = useRoute("/banners");


  // Customer routes
  const [matchCustomer] = useRoute("/customer");
  const [matchCustomerSubscription] = useRoute("/customer/subscription");
  const [matchCustomerDashboard] = useRoute("/customer/dashboard");
  const [matchCustomerDeals] = useRoute("/customer/deals");
  const [matchCustomerNearbyDeals] = useRoute("/customer/nearby-deals");
  const [matchCustomerSecureDeals] = useRoute("/customer/secure-deals");
  const [matchCustomerClaims] = useRoute("/customer/claims");
  const [matchCustomerWishlist] = useRoute("/customer/wishlist");
  const [matchCustomerMembershipCard] = useRoute("/customer/membership-card");
  const [matchCustomerUpgrade] = useRoute("/customer/upgrade");
  const [matchCustomerProfile] = useRoute("/customer/profile");
  const [matchCustomerDealWizard] = useRoute("/customer/deal-wizard");

  // Vendor routes
  const [matchVendor] = useRoute("/vendor");
  const [matchVendorPortal] = useRoute("/vendor/portal");
  const [matchVendorBenefits] = useRoute("/vendor/benefits");
  const [matchVendorRegister] = useRoute("/vendor/register");
  const [matchVendorOnboarding] = useRoute("/vendor/onboarding");
  const [matchVendorProcess] = useRoute("/vendor/process");
  const [matchVendorDashboard] = useRoute("/vendor/dashboard");
  const [matchVendorDeals] = useRoute("/vendor/deals");
  const [matchVendorCreateDeal] = useRoute("/vendor/create-deal");
  const [matchVendorDealCreation] = useRoute("/vendor/deals/create");
  const [matchVendorAnalytics] = useRoute("/vendor/analytics");
  const [matchVendorLocationAnalytics] = useRoute("/vendor/location-analytics");
  const [matchVendorPos] = useRoute("/vendor/pos");
  const [matchVendorPosTransactions] = useRoute("/vendor/pos/transactions");
  const [matchVendorProfile] = useRoute("/vendor/profile");

  // Admin routes
  const [matchAdmin] = useRoute("/admin");
  const [matchAdminMagic] = useRoute("/admin/magic");
  const [matchAdminDashboard] = useRoute("/admin/dashboard");
  const [matchAdminUsers] = useRoute("/admin/users");
  const [matchAdminVendors] = useRoute("/admin/vendors");
  const [matchAdminDeals] = useRoute("/admin/deals");
  const [matchAdminReports] = useRoute("/admin/reports");
  const [matchAdminAnalytics] = useRoute("/admin/analytics");
  const [matchAdminLocationAnalytics] = useRoute("/admin/location-analytics");
  const [matchAdminPromotionalBanners] = useRoute("/admin/promotional-banners");

  // Super Admin routes
  const [matchSuperAdmin] = useRoute("/superadmin");
  const [matchSuperAdminDashboard] = useRoute("/superadmin/dashboard");
  const [matchSuperAdminLogs] = useRoute("/superadmin/logs");

  // Special routes
  const [matchUnauthorized] = useRoute("/unauthorized");
  const [matchAccessDenied] = useRoute("/access-denied");

  // Public routes - Deal detail must be checked first to avoid conflicts
  if (matchDealDetail) return <DealDetail params={dealParams} />;
  if (matchHome) return <Home />;
  if (matchLogin) return <Login />;
  if (matchSignup) return <Signup />;
  if (matchPricing) return <Pricing />;
  if (matchTerms) return <Terms />;
  if (matchPrivacy) return <Privacy />;
  if (matchHelp) return <Help />;
  if (matchResponsiveTest) return <ResponsiveTest />;
  if (matchTest) return <TestFlows />;
  if (matchQRTest) return <QRTest />;
  if (matchDeals) return <DealList />;
  if (matchBanners) return <BannerList />;

  // Customer routes with role protection
  if (matchCustomer) {
    return (
      <RoleProtectedRoute allowedRoles={['customer']}>
        <DealList />
      </RoleProtectedRoute>
    );
  }
  if (matchCustomerSubscription) {
    return (
      <RoleProtectedRoute allowedRoles={['customer']}>
        <SubscriptionButton />
      </RoleProtectedRoute>
    );
  }
  if (matchCustomerDashboard) {
    return (
      <RoleProtectedRoute allowedRoles={['customer']}>
        <CustomerDashboard />
      </RoleProtectedRoute>
    );
  }
  if (matchCustomerDeals) {
    return (
      <RoleProtectedRoute allowedRoles={['customer']}>
        <CustomerDeals />
      </RoleProtectedRoute>
    );
  }
  if (matchCustomerNearbyDeals) {
    return (
      <RoleProtectedRoute allowedRoles={['customer']}>
        <NearbyDeals />
      </RoleProtectedRoute>
    );
  }
  if (matchCustomerSecureDeals) {
    return (
      <RoleProtectedRoute allowedRoles={['customer']}>
        <SecureDeals />
      </RoleProtectedRoute>
    );
  }
  if (matchCustomerClaims) {
    return (
      <RoleProtectedRoute allowedRoles={['customer']}>
        <ClaimHistory />
      </RoleProtectedRoute>
    );
  }
  if (matchCustomerWishlist) {
    return (
      <RoleProtectedRoute allowedRoles={['customer']}>
        <CustomerWishlist />
      </RoleProtectedRoute>
    );
  }
  if (matchCustomerMembershipCard) {
    return (
      <RoleProtectedRoute allowedRoles={['customer']}>
        <MembershipCard />
      </RoleProtectedRoute>
    );
  }
  if (matchCustomerUpgrade) {
    return (
      <RoleProtectedRoute allowedRoles={['customer']}>
        <UpgradeMembership />
      </RoleProtectedRoute>
    );
  }
  if (matchCustomerProfile) {
    return (
      <RoleProtectedRoute allowedRoles={['customer']}>
        <CustomerProfile />
      </RoleProtectedRoute>
    );
  }
  if (matchCustomerDealWizard) {
    return (
      <RoleProtectedRoute allowedRoles={['customer']}>
        <DealWizard />
      </RoleProtectedRoute>
    );
  }

  // Vendor routes with role protection
  if (matchVendor) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor', 'customer']} fallbackPath="/vendor/portal">
        <VendorPortal />
      </RoleProtectedRoute>
    );
  }
  if (matchVendorPortal) return <VendorPortal />;
  if (matchVendorBenefits) return <VendorBenefits />;
  if (matchVendorRegister) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor']}>
        <VendorRegister />
      </RoleProtectedRoute>
    );
  }
  if (matchVendorDashboard) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor']}>
        <VendorDashboard />
      </RoleProtectedRoute>
    );
  }
  if (matchVendorDeals) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor']}>
        <VendorDeals />
      </RoleProtectedRoute>
    );
  }
  if (matchVendorCreateDeal) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor']}>
        <VendorDeals />
      </RoleProtectedRoute>
    );
  }
  if (matchVendorDealCreation) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor']}>
        <VendorDealCreation />
      </RoleProtectedRoute>
    );
  }
  if (matchVendorAnalytics) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor']}>
        <VendorAnalytics />
      </RoleProtectedRoute>
    );
  }
  if (matchVendorLocationAnalytics) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor']}>
        <VendorLocationAnalytics />
      </RoleProtectedRoute>
    );
  }
  if (matchVendorPos) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor']}>
        <PosDashboard />
      </RoleProtectedRoute>
    );
  }
  if (matchVendorPosTransactions) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor']}>
        <PosTransactions />
      </RoleProtectedRoute>
    );
  }
  if (matchVendorProfile) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor']}>
        <VendorProfile />
      </RoleProtectedRoute>
    );
  }
  if (matchVendorOnboarding) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor']}>
        <VendorOnboarding />
      </RoleProtectedRoute>
    );
  }
  if (matchVendorProcess) {
    return (
      <RoleProtectedRoute allowedRoles={['vendor']}>
        <VendorProcess />
      </RoleProtectedRoute>
    );
  }

  // Admin routes with role protection
  if (matchAdminDashboard) {
    return (
      <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
        <AdminDashboard />
      </RoleProtectedRoute>
    );
  }
  if (matchAdmin) {
    return (
      <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
        <AdminDashboard />
      </RoleProtectedRoute>
    );
  }
  if (matchAdminMagic) {
    return (
      <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
        <MagicAdminDashboard />
      </RoleProtectedRoute>
    );
  }
  if (matchAdminUsers) {
    return (
      <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
        <AdminUsers />
      </RoleProtectedRoute>
    );
  }
  if (matchAdminVendors) {
    return (
      <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
        <AdminVendors />
      </RoleProtectedRoute>
    );
  }
  if (matchAdminDeals) {
    return (
      <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
        <AdminDeals />
      </RoleProtectedRoute>
    );
  }
  if (matchAdminReports) {
    return (
      <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
        <AdminReports />
      </RoleProtectedRoute>
    );
  }
  if (matchAdminAnalytics) {
    return (
      <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
        <AdminAnalytics />
      </RoleProtectedRoute>
    );
  }
  if (matchAdminLocationAnalytics) {
    return (
      <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
        <AdminLocationAnalytics />
      </RoleProtectedRoute>
    );
  }
  if (matchAdminPromotionalBanners) {
    return (
      <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
        <PromotionalBanners />
      </RoleProtectedRoute>
    );
  }

  // Super Admin routes with role protection
  if (matchSuperAdmin) {
    return (
      <RoleProtectedRoute allowedRoles={['superadmin']}>
        <SuperAdminDashboard />
      </RoleProtectedRoute>
    );
  }
  if (matchSuperAdminDashboard) {
    return (
      <RoleProtectedRoute allowedRoles={['superadmin']}>
        <SuperAdminDashboard />
      </RoleProtectedRoute>
    );
  }
  if (matchSuperAdminLogs) {
    return (
      <RoleProtectedRoute allowedRoles={['superadmin']}>
        <SystemLogs />
      </RoleProtectedRoute>
    );
  }

  // Unauthorized page (legacy support)
  if (matchUnauthorized) {
    return <AccessDenied />;
  }

  // Access denied page
  if (matchAccessDenied) {
    return <AccessDenied />;
  }

  // Fallback to 404
  return <NotFound />;
}

function App() {
  const { user, updateToken, checkAuth } = useAuth();

  useEffect(() => {
    // Check authentication on app load
    checkAuth();
  }, [checkAuth]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="instoredealz-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ScrollToTop />
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;