import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Store, Plus, CheckCircle, Building, Phone, Mail, Globe, MapPin, Calendar, Tag, DollarSign, Percent } from 'lucide-react';

// Vendor registration schema
const vendorRegistrationSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  businessType: z.string().min(1, 'Please select a business type'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Pincode must be 6 digits'),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
});

// Deal creation schema
const dealCreationSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  originalPrice: z.string().min(1, 'Original price is required'),
  discountedPrice: z.string().min(1, 'Discounted price is required'),
  discountPercentage: z.number().min(1).max(99),
  validUntil: z.string().min(1, 'Expiry date is required'),
  maxRedemptions: z.string().optional(),
  terms: z.string().min(10, 'Terms and conditions are required'),
  requiredMembership: z.string().min(1, 'Please select required membership'),
});

type VendorRegistrationForm = z.infer<typeof vendorRegistrationSchema>;
type DealCreationForm = z.infer<typeof dealCreationSchema>;

interface VendorResponse {
  id: number;
  businessName: string;
  status: string;
  message: string;
}

interface DealResponse {
  id: number;
  title: string;
  status: string;
  message: string;
}

const BUSINESS_TYPES = [
  'Restaurant', 'Retail Store', 'Fashion & Apparel', 'Electronics', 'Home & Garden',
  'Health & Beauty', 'Sports & Fitness', 'Travel & Tourism', 'Education', 'Healthcare',
  'Automotive', 'Entertainment', 'Professional Services', 'Other'
];

const DEAL_CATEGORIES = [
  'restaurants', 'fashion', 'electronics', 'travel', 'health', 'education',
  'home-garden', 'sports', 'entertainment', 'automotive', 'beauty', 'other'
];

const MEMBERSHIP_LEVELS = [
  { value: 'basic', label: 'Basic (Free Users)' },
  { value: 'premium', label: 'Premium Members' },
  { value: 'ultimate', label: 'Ultimate Members' }
];

// Mock auth hook - replace with actual implementation
const useAuth = () => {
  const user = {
    id: 1,
    email: 'vendor@example.com',
    name: 'Test Vendor',
    role: 'vendor',
    isAuthenticated: true
  };
  
  return {
    user,
    isAuthenticated: user.isAuthenticated,
    isLoading: false
  };
};

const VendorPortal = () => {
  const [activeTab, setActiveTab] = useState('register');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [dealSuccess, setDealSuccess] = useState(false);
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Vendor registration form
  const vendorForm = useForm<VendorRegistrationForm>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      email: '',
      phone: '',
      businessType: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      website: '',
      description: '',
      gstNumber: '',
      panNumber: '',
    }
  });

  // Deal creation form
  const dealForm = useForm<DealCreationForm>({
    resolver: zodResolver(dealCreationSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      originalPrice: '',
      discountedPrice: '',
      discountPercentage: 0,
      validUntil: '',
      maxRedemptions: '',
      terms: '',
      requiredMembership: 'basic',
    }
  });

  // Vendor registration mutation
  const registerVendorMutation = useMutation({
    mutationFn: async (vendorData: VendorRegistrationForm): Promise<VendorResponse> => {
      const response = await fetch('/api/register-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: JSON.stringify(vendorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register vendor');
      }

      const result: VendorResponse = await response.json();
      return result;
    },
    onSuccess: (data) => {
      setRegistrationSuccess(true);
      vendorForm.reset();
      toast({
        title: "Vendor Registration Successful! 🎉",
        description: `${data.businessName} has been registered. Awaiting admin approval.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Deal creation mutation
  const createDealMutation = useMutation({
    mutationFn: async (dealData: DealCreationForm): Promise<DealResponse> => {
      const response = await fetch('/api/create-deal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: JSON.stringify(dealData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create deal');
      }

      const result: DealResponse = await response.json();
      return result;
    },
    onSuccess: (data) => {
      setDealSuccess(true);
      dealForm.reset();
      toast({
        title: "Deal Created Successfully! 🚀",
        description: `${data.title} has been created and is pending approval.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
    },
    onError: (error: any) => {
      toast({
        title: "Deal Creation Failed",
        description: error.message || "Failed to create deal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate discount percentage automatically
  const handlePriceChange = () => {
    const original = parseFloat(dealForm.getValues('originalPrice'));
    const discounted = parseFloat(dealForm.getValues('discountedPrice'));
    
    if (original && discounted && original > discounted) {
      const percentage = Math.round(((original - discounted) / original) * 100);
      dealForm.setValue('discountPercentage', percentage);
    }
  };

  const onVendorSubmit = (data: VendorRegistrationForm) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to register as a vendor.",
        variant: "destructive",
      });
      return;
    }
    registerVendorMutation.mutate(data);
  };

  const onDealSubmit = (data: DealCreationForm) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create deals.",
        variant: "destructive",
      });
      return;
    }
    createDealMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Loading vendor portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[90vw] sm:max-w-4xl lg:max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          🏪 Vendor Portal
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Join our platform as a vendor and start creating amazing deals for customers
        </p>
      </div>

      {/* Authentication Notice */}
      {!isAuthenticated && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Store className="h-6 w-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  Login Required
                </h3>
                <p className="text-amber-700 dark:text-amber-300">
                  Please log in to access the vendor portal and manage your business
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor Portal Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 max-w-md mx-auto gap-1 sm:gap-0">
          <TabsTrigger value="register" className="flex items-center justify-center space-x-1 sm:space-x-2 text-sm">
            <Building className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Register Business</span>
            <span className="xs:hidden">Register</span>
          </TabsTrigger>
          <TabsTrigger value="create-deal" className="flex items-center justify-center space-x-1 sm:space-x-2 text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Create Deal</span>
            <span className="xs:hidden">Create</span>
          </TabsTrigger>
        </TabsList>

        {/* Vendor Registration Tab */}
        <TabsContent value="register" className="space-y-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                <Building className="h-6 w-6 text-green-600" />
                <span>Business Registration</span>
              </CardTitle>
              <CardDescription>
                Register your business to start offering deals on our platform
              </CardDescription>
            </CardHeader>

            <CardContent>
              {registrationSuccess ? (
                <div className="text-center space-y-4 py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <h3 className="text-2xl font-semibold text-green-600">Registration Successful!</h3>
                  <p className="text-muted-foreground">
                    Your business registration has been submitted for review. 
                    You'll receive an email once approved.
                  </p>
                  <Button 
                    onClick={() => {
                      setRegistrationSuccess(false);
                      setActiveTab('create-deal');
                    }}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    Create Your First Deal
                  </Button>
                </div>
              ) : (
                <Form {...vendorForm}>
                  <form onSubmit={vendorForm.handleSubmit(onVendorSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Business Information */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold flex items-center space-x-2">
                          <Store className="h-5 w-5 text-blue-500" />
                          <span>Business Information</span>
                        </h4>

                        <FormField
                          control={vendorForm.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your business name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={vendorForm.control}
                          name="businessType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Type *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select business type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {BUSINESS_TYPES.map((type) => (
                                    <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, '-')}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={vendorForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Description *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe your business and services..."
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold flex items-center space-x-2">
                          <Phone className="h-5 w-5 text-green-500" />
                          <span>Contact Information</span>
                        </h4>

                        <FormField
                          control={vendorForm.control}
                          name="ownerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Owner Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter owner/manager name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={vendorForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="business@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={vendorForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="+91 9876543210" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={vendorForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://yourbusiness.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-purple-500" />
                        <span>Business Address</span>
                      </h4>

                      <FormField
                        control={vendorForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complete Address *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter complete business address..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={vendorForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input placeholder="Mumbai" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={vendorForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State *</FormLabel>
                              <FormControl>
                                <Input placeholder="Maharashtra" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={vendorForm.control}
                          name="pincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pincode *</FormLabel>
                              <FormControl>
                                <Input placeholder="400001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Optional Tax Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-muted-foreground">
                        Tax Information (Optional)
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={vendorForm.control}
                          name="gstNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GST Number</FormLabel>
                              <FormControl>
                                <Input placeholder="22AAAAA0000A1Z5" {...field} />
                              </FormControl>
                              <FormDescription>
                                Required for businesses with GST registration
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={vendorForm.control}
                          name="panNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PAN Number</FormLabel>
                              <FormControl>
                                <Input placeholder="ABCDE1234F" {...field} />
                              </FormControl>
                              <FormDescription>
                                PAN number of business owner
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={!isAuthenticated || registerVendorMutation.isPending}
                      className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                      size="lg"
                    >
                      {registerVendorMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Registering Business...
                        </>
                      ) : (
                        <>
                          <Building className="h-5 w-5 mr-2" />
                          Register Business
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deal Creation Tab */}
        <TabsContent value="create-deal" className="space-y-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                <Plus className="h-6 w-6 text-blue-600" />
                <span>Create New Deal</span>
              </CardTitle>
              <CardDescription>
                Create attractive deals to attract customers to your business
              </CardDescription>
            </CardHeader>

            <CardContent>
              {dealSuccess ? (
                <div className="text-center space-y-4 py-8">
                  <CheckCircle className="h-16 w-16 text-blue-500 mx-auto" />
                  <h3 className="text-2xl font-semibold text-blue-600">Deal Created Successfully!</h3>
                  <p className="text-muted-foreground">
                    Your deal has been submitted for review. 
                    It will be live once approved by our team.
                  </p>
                  <Button 
                    onClick={() => setDealSuccess(false)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    Create Another Deal
                  </Button>
                </div>
              ) : (
                <Form {...dealForm}>
                  <form onSubmit={dealForm.handleSubmit(onDealSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Deal Information */}
                      <div className="space-y-3">
                        <h4 className="text-lg font-semibold flex items-center space-x-2">
                          <Tag className="h-5 w-5 text-blue-500" />
                          <span>Deal Information</span>
                        </h4>

                        <FormField
                          control={dealForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Deal Title *</FormLabel>
                              <FormControl>
                                <Input placeholder="50% Off on All Products" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={dealForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {DEAL_CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' & ')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={dealForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Deal Description *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe your deal in detail..."
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Pricing Information */}
                      <div className="space-y-3">
                        <h4 className="text-lg font-semibold flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-green-500" />
                          <span>Pricing Details</span>
                        </h4>

                        <FormField
                          control={dealForm.control}
                          name="originalPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Original Price (₹) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="1000" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handlePriceChange();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={dealForm.control}
                          name="discountedPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discounted Price (₹) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="500" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handlePriceChange();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                          <Percent className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 dark:text-green-300 font-semibold text-sm">
                            Discount: {dealForm.watch('discountPercentage')}% OFF
                          </span>
                        </div>

                        <FormField
                          control={dealForm.control}
                          name="requiredMembership"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Required Membership *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select membership level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {MEMBERSHIP_LEVELS.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                      {level.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs">
                                Minimum membership level required to claim this deal
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Deal Validity */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <span>Deal Validity & Limits</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={dealForm.control}
                          name="validUntil"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valid Until *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={dealForm.control}
                          name="maxRedemptions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Redemptions (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="100" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Leave empty for unlimited redemptions
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="space-y-3">
                      <FormField
                        control={dealForm.control}
                        name="terms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Terms and Conditions *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter terms and conditions for this deal..."
                                className="min-h-[70px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Include any restrictions, usage conditions, or special terms
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={!isAuthenticated || createDealMutation.isPending}
                      className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      size="lg"
                    >
                      {createDealMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Creating Deal...
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 mr-2" />
                          Create Deal
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorPortal;