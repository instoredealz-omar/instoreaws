import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  CheckCircle, 
  Search, 
  Heart, 
  Tag, 
  MapPin, 
  Star,
  Users,
  Store,
  BarChart3,
  Plus,
  MousePointer2,
  Calculator,
  Eye,
  Clock,
  HelpCircle,
  BookOpen,
  Target,
  Gift,
  CreditCard,
  Bell,
  Shield,
  QrCode,
  Scan,
  Camera,
  Lock,
  DollarSign,
  TrendingUp,
  Wallet,
  ShoppingCart,
  Link as LinkIcon
} from "lucide-react";

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  content: string;
  action?: string;
}

interface TutorialProps {
  type: 'customer' | 'vendor';
  onComplete?: () => void;
}

export default function Tutorial({ type, onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const customerSteps: TutorialStep[] = [
    {
      id: 1,
      title: "Welcome to Instoredealz",
      description: "Discover amazing deals from local vendors",
      icon: Gift,
      content: "Welcome to Instoredealz! This platform connects you with incredible deals from local businesses. You can browse deals by category, location, and membership level.",
      action: "Get Started"
    },
    {
      id: 2,
      title: "Browse Deals",
      description: "Find deals using search and filters",
      icon: Search,
      content: "Use the search bar to find specific deals or browse by categories like Fashion, Electronics, Food, and more. Filter by location to find deals near you with adjustable search radius (1-25km). You can also filter by deal type: In-Store Deals (redeemed at physical locations with PIN verification) or Online Deals (shop via affiliate links).",
      action: "Try Searching"
    },
    {
      id: 3,
      title: "View Deal Details",
      description: "Click 'View Deal Details' for complete information",
      icon: Eye,
      content: "Each deal card shows basic info, but click 'View Deal Details' to see complete information including vendor details, terms, and exclusive discount codes.",
      action: "View a Deal"
    },
    {
      id: 4,
      title: "Membership Benefits",
      description: "Upgrade for exclusive discount codes",
      icon: Star,
      content: "Basic members can browse deals, but Premium and Ultimate members get access to exclusive discount codes and special offers. Upgrade to unlock more savings!",
      action: "Check Membership"
    },
    {
      id: 5,
      title: "Claim Offline Deals",
      description: "Reserve in-store deals for redemption",
      icon: Store,
      content: "For offline (in-store) deals, click 'Claim Deal' to reserve it. You'll receive a unique claim code that stays valid for 24 hours. Visit the vendor's physical location and verify your purchase using QR code or PIN backup to complete the redemption.",
      action: "Try Claiming"
    },
    {
      id: 6,
      title: "Claim Online Deals",
      description: "Shop instantly via affiliate links",
      icon: ShoppingCart,
      content: "For online deals, click 'Shop Now' to instantly access the vendor's affiliate link and your unique claim code (valid for 30 days). The affiliate link opens automatically, and you can use your discount code at checkout. No store visit needed - shop from anywhere!",
      action: "Try Online Shopping"
    },
    {
      id: 7,
      title: "Secure Claim Codes",
      description: "Unique codes for every claim",
      icon: Lock,
      content: "Every time you claim a deal, you receive a secure, unique claim code. These codes use enhanced cryptographic security to protect your transactions. Offline deal codes expire in 24 hours, while online deal codes stay valid for 30 days, giving you plenty of time to shop!",
      action: "View Claim Code"
    },
    {
      id: 8,
      title: "Generate Your QR Code",
      description: "Get your digital membership QR code",
      icon: Target,
      content: "Access your membership card from the dashboard to generate your personal QR code. This QR code contains your complete customer data including membership level, savings history, and verification tokens with 24-hour validity.",
      action: "View Membership Card"
    },
    {
      id: 9,
      title: "Visit Store & Show QR Code",
      description: "Present your QR code for instant verification",
      icon: Shield,
      content: "For offline deals, visit the vendor's store and show your membership QR code at checkout. The vendor can scan it with their POS system for instant customer verification and deal redemption. No internet needed for basic verification code backup!",
      action: "Learn QR Process"
    },
    {
      id: 10,
      title: "PIN Verification Backup", 
      description: "Alternative verification without QR code",
      icon: QrCode,
      content: "If QR scanning isn't available, you can still use PIN verification backup. Ask the vendor for their 6-character alphanumeric verification code (e.g., K9M3X7), then enter it in the app to verify your purchase. This works even without internet and ensures secure deal redemption!",
      action: "Learn PIN Process"
    },
    {
      id: 11,
      title: "Add Your Bill Amount",
      description: "Calculate exact savings from your purchase",
      icon: Calculator,
      content: "After verification (QR or PIN) for offline deals, you can enter your actual bill amount to see your precise savings. This helps track your real spending and gives you accurate insights into your deal benefits.",
      action: "Try Bill Entry"
    },
    {
      id: 12,
      title: "Track Your Savings",
      description: "Monitor your deals and savings dashboard",
      icon: BarChart3,
      content: "View your claimed deals, total savings, and deal history in your dashboard. Track which deals are pending, completed, and see your overall savings progress with QR code usage analytics. See separate tracking for offline and online deals!",
      action: "View Dashboard"
    },
    {
      id: 13,
      title: "Save Favorites",
      description: "Heart icon to save deals for later",
      icon: Heart,
      content: "Click the heart icon on any deal to save it to your favorites. Access your saved deals anytime from your profile to never miss a great offer.",
      action: "Save a Deal"
    },
    {
      id: 14,
      title: "Location-Based Deals",
      description: "Find deals near you with smart geolocation",
      icon: MapPin,
      content: "Set your location to discover deals from nearby vendors. The platform uses advanced geolocation with distance calculation (Haversine formula), showing deals within your chosen radius (1-25km). See distance, direction hints, and relevance scores to find the best deals in your area for easy redemption.",
      action: "Set Location"
    },
    {
      id: 15,
      title: "Stay Updated with Notifications",
      description: "Receive email and WhatsApp alerts",
      icon: Bell,
      content: "Get instant notifications about new deals, deal claims, and exclusive offers! You'll receive welcome emails upon registration, deal confirmation emails, and WhatsApp messages for new deals in your area (if enabled). Manage your notification preferences in your profile settings.",
      action: "Setup Notifications"
    },
    {
      id: 16,
      title: "Get Support",
      description: "Help is always available",
      icon: HelpCircle,
      content: "Need help? Contact our support team through the help section. We're here to assist with any questions about deals, memberships, or platform usage.",
      action: "Contact Support"
    }
  ];

  const vendorSteps: TutorialStep[] = [
    {
      id: 1,
      title: "Welcome Vendor Partner",
      description: "Start reaching customers with great deals",
      icon: Store,
      content: "Welcome to the Instoredealz vendor platform! Here you can create and manage deals to attract customers, track performance, and grow your business.",
      action: "Get Started"
    },
    {
      id: 2,
      title: "Complete Your Profile",
      description: "Set up your business information",
      icon: Users,
      content: "Complete your vendor profile with business details, logo, description, and location. A complete profile builds trust and attracts more customers to your deals.",
      action: "Edit Profile"
    },
    {
      id: 3,
      title: "Create Your First Deal",
      description: "Add offline or online deals",
      icon: Plus,
      content: "Click 'Create New Deal' to add your first offer. Choose between Offline Deals (in-store redemption with PIN verification) or Online Deals (affiliate marketing with commission tracking). Include attractive images, clear descriptions, discount percentages, and validity periods. For offline deals, set a unique 6-character alphanumeric verification code (e.g., K9M3X7) or click 'Generate' to auto-create one. For online deals, provide your affiliate link where customers can shop and earn commissions!",
      action: "Create Deal"
    },
    {
      id: 4,
      title: "Understanding Deal Claims",
      description: "How customers claim your deals",
      icon: MousePointer2,
      content: "Customers can claim your deals online. For offline deals, this creates a 'pending' status and customers must visit your store within 24 hours for redemption. For online deals, customers receive your affiliate link immediately (valid for 30 days) and can shop online. Each claim generates a secure, unique code using enhanced cryptographic security for maximum protection.",
      action: "Learn Claims"
    },
    {
      id: 5,
      title: "POS System Integration",
      description: "Use the Point of Sale system for transactions",
      icon: Target,
      content: "Access your POS dashboard to manage in-store transactions. Start a POS session, scan customer QR codes, and process deal redemptions directly through the integrated system.",
      action: "Learn POS System"
    },
    {
      id: 6,
      title: "QR Code Scanner",
      description: "Scan customer membership QR codes",
      icon: Camera,
      content: "Use the built-in QR scanner to instantly verify customers. Scan their membership QR codes using three methods: live camera scanning, image upload, or manual data entry. Customer details appear immediately with membership status, contact information, and savings history. QR codes include 24-hour security tokens for enhanced protection.",
      action: "Try QR Scanner"
    },
    {
      id: 7,
      title: "Customer Verification",
      description: "Verify customers and process transactions",
      icon: Shield,
      content: "When customers show their QR codes, scan them to see complete customer profiles including membership level, contact details, and total savings. This enables personalized service and secure deal redemption.",
      action: "Learn Verification"
    },
    {
      id: 8,
      title: "PIN Verification Backup",
      description: "Alternative verification without QR scanner", 
      icon: Lock,
      content: "If QR scanning isn't available, use PIN verification backup. Give customers your deal's 6-character alphanumeric verification code (e.g., K9M3X7) so they can verify their purchase in the app. This confirms the sale, works offline, and ensures secure deal redemption without internet connectivity.",
      action: "Learn PIN Process"
    },
    {
      id: 9,
      title: "Transaction Processing",
      description: "Complete deals through POS system",
      icon: Calculator,
      content: "Process verified customer transactions through the POS system. Track bill amounts, payment methods, and automatic savings calculations with receipt generation and inventory management.",
      action: "Learn Transactions"
    },
    {
      id: 10,
      title: "Deal Management",
      description: "Edit, activate, and monitor your deals",
      icon: Plus,
      content: "Manage all your deals from the dashboard. Edit details, activate/deactivate deals, set redemption limits, and monitor which offers perform best with QR code usage analytics.",
      action: "Manage Deals"
    },
    {
      id: 11,
      title: "Analytics Dashboard",
      description: "Track performance and QR code insights",
      icon: BarChart3,
      content: "View detailed analytics about your deals including views, claims, QR code scans, conversion rates, and revenue. Track customer verification methods and optimize future offers. For online deals, see click-through rates and commission earnings!",
      action: "View Analytics"
    },
    {
      id: 12,
      title: "Commission Tracking System",
      description: "Earn from online deal performance",
      icon: DollarSign,
      content: "For online deals, our commission tracking system automatically monitors your performance. Earn commissions when customers click your affiliate links (default 5% click commission) and when they complete purchases (default 10% conversion commission). All tracking is handled automatically - no payment gateway integration needed!",
      action: "View Commissions"
    },
    {
      id: 13,
      title: "Online Deal Performance",
      description: "Monitor clicks, conversions, and earnings",
      icon: TrendingUp,
      content: "Access your Online Deal Performance page to see detailed analytics: total clicks on your affiliate links, conversion rates, estimated commissions (from clicks), and confirmed commissions (from completed sales). Track performance by individual deal to see which offers drive the most revenue.",
      action: "Check Performance"
    },
    {
      id: 14,
      title: "Commission Rates & Payouts",
      description: "Understand your earning potential",
      icon: Wallet,
      content: "Commission rates can be customized per vendor. By default, you earn on clicks (5%) and conversions (10%). Admins confirm conversions manually and process payouts in batches. View your pending, confirmed, and paid commission amounts in your vendor dashboard.",
      action: "View Settings"
    },
    {
      id: 15,
      title: "Approval Process",
      description: "Admin review ensures quality",
      icon: CheckCircle,
      content: "New deals require admin approval to maintain platform quality. This typically takes 24-48 hours. Approved deals appear immediately to customers.",
      action: "Check Status"
    },
    {
      id: 16,
      title: "Email & WhatsApp Notifications",
      description: "Automated communication with vendors",
      icon: Bell,
      content: "You'll receive email notifications for important events: registration confirmation, deal approval/rejection by admin, commission updates, and account changes. Customers receive WhatsApp messages about new deals, deal claims, and marketing campaigns (if they opt-in). Email notifications are powered by SendGrid for reliable delivery.",
      action: "Check Notifications"
    },
    {
      id: 17,
      title: "Geolocation Strategy",
      description: "Optimize deals for nearby customers",
      icon: MapPin,
      content: "Add accurate location data to your deals to appear in nearby deals searches. Customers can discover your offers within their chosen radius (1-25km) using advanced geolocation. The system shows distance, direction hints, and relevance scores to help customers find your store easily.",
      action: "Set Location"
    }
  ];

  const steps = type === 'customer' ? customerSteps : vendorSteps;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const markStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const completeTutorial = () => {
    markStepComplete(steps[currentStep].id);
    setIsOpen(false);
    onComplete?.();
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>{type === 'customer' ? 'Customer Tutorial' : 'Vendor Tutorial'}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>{type === 'customer' ? 'Customer Tutorial' : 'Vendor Tutorial'}</span>
              <Badge variant="outline" className="ml-auto">
                {currentStep + 1} of {steps.length}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Step */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <StepIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{currentStepData.content}</p>
                
                {currentStepData.action && (
                  <div className="mt-4">
                    <Button
                      onClick={() => markStepComplete(currentStepData.id)}
                      className="w-full"
                      variant={completedSteps.includes(currentStepData.id) ? "outline" : "default"}
                    >
                      {completedSteps.includes(currentStepData.id) ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          {currentStepData.action}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Step Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <div className="flex space-x-1">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentStep
                        ? 'bg-primary'
                        : index < currentStep
                        ? 'bg-primary/50'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {currentStep === steps.length - 1 ? (
                <Button onClick={completeTutorial} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete Tutorial</span>
                </Button>
              ) : (
                <Button onClick={nextStep} className="flex items-center space-x-2">
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Quick Overview */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm">Tutorial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-center space-x-2 p-2 rounded text-xs transition-all duration-200 ${
                        index === currentStep
                          ? 'bg-primary/10 text-primary'
                          : completedSteps.includes(step.id)
                          ? 'bg-green-50 text-green-700'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {completedSteps.includes(step.id) ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <step.icon className="h-3 w-3" />
                      )}
                      <span className="truncate">{step.title}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}