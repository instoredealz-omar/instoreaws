import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { 
  Store, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  IdCard,
  Camera,
  Upload,
  User,
  Calendar,
  Shield,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/ui/navbar';

// Validation schemas for each step
const businessInfoSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  businessType: z.string().min(1, 'Please select a business type'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

const contactInfoSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
});

const addressInfoSchema = z.object({
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits'),
});

const legalInfoSchema = z.object({
  gstNumber: z.string().optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number'),
  panCardFile: z.string().optional(),
});

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  validation: z.ZodSchema;
}

const VendorOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [formData, setFormData] = useState<any>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Business Information Step
  const BusinessInfoStep = () => {
    const form = useForm({
      resolver: zodResolver(businessInfoSchema),
      defaultValues: formData.businessInfo || {
        businessName: '',
        ownerName: user?.name || '',
        businessType: '',
        description: '',
      }
    });

    const handleNext = (data: any) => {
      setFormData(prev => ({ ...prev, businessInfo: data }));
      setCompletedSteps(prev => [...prev.filter(s => s !== 'business'), 'business']);
      setCurrentStep(1);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-500" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ABC Electronics Store" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner/Manager Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="retail">Retail Store</SelectItem>
                        <SelectItem value="restaurant">Restaurant/Cafe</SelectItem>
                        <SelectItem value="fashion">Fashion/Clothing</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="beauty">Beauty/Salon</SelectItem>
                        <SelectItem value="fitness">Fitness/Gym</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your business, products, and services..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Tell customers about your business, what you offer, and what makes you special.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" className="gap-2">
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };

  // Contact Information Step
  const ContactInfoStep = () => {
    const form = useForm({
      resolver: zodResolver(contactInfoSchema),
      defaultValues: formData.contactInfo || {
        email: user?.email || '',
        phone: '',
        website: '',
      }
    });

    const handleNext = (data: any) => {
      setFormData(prev => ({ ...prev, contactInfo: data }));
      setCompletedSteps(prev => [...prev.filter(s => s !== 'contact'), 'contact']);
      setCurrentStep(2);
    };

    const handleBack = () => {
      setCurrentStep(0);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-500" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="business@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      This email will be used for customer communications and notifications.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="9999888777" {...field} />
                    </FormControl>
                    <FormDescription>
                      10-digit mobile number for customer contact and verification.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.yourbusiness.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your business website or social media page.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="gap-2">
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };

  // Address Information Step
  const AddressInfoStep = () => {
    const form = useForm({
      resolver: zodResolver(addressInfoSchema),
      defaultValues: formData.addressInfo || {
        address: '',
        city: '',
        state: '',
        pincode: '',
      }
    });

    const handleNext = (data: any) => {
      setFormData(prev => ({ ...prev, addressInfo: data }));
      setCompletedSteps(prev => [...prev.filter(s => s !== 'address'), 'address']);
      setCurrentStep(3);
    };

    const handleBack = () => {
      setCurrentStep(1);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-500" />
            Business Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complete Address *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Shop/Building name, Street, Area, Landmark"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
              </div>

              <FormField
                control={form.control}
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

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="gap-2">
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };

  // Legal Information Step
  const LegalInfoStep = () => {
    const form = useForm({
      resolver: zodResolver(legalInfoSchema),
      defaultValues: formData.legalInfo || {
        gstNumber: '',
        panNumber: '',
        panCardFile: '',
      }
    });

    const registerMutation = useMutation({
      mutationFn: (data: any) => apiRequest('/api/vendors/register', { method: 'POST', body: data }),
      onSuccess: () => {
        setCompletedSteps(prev => [...prev.filter(s => s !== 'legal'), 'legal']);
        toast({
          title: "Registration Successful!",
          description: "Your vendor registration is submitted and pending approval.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/vendors/me'] });
        setCurrentStep(4); // Move to completion step
      },
      onError: (error: any) => {
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to submit registration",
          variant: "destructive",
        });
      },
    });

    const handleSubmit = (data: any) => {
      const completeData = {
        ...formData.businessInfo,
        ...formData.contactInfo,
        ...formData.addressInfo,
        ...data,
      };
      registerMutation.mutate(completeData);
    };

    const handleBack = () => {
      setCurrentStep(2);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5 text-amber-500" />
            Legal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="panNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN Number *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ABCDE1234F" 
                        style={{ textTransform: 'uppercase' }}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Permanent Account Number for business verification.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="22ABCDE1234F1Z5" 
                        style={{ textTransform: 'uppercase' }}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Goods and Services Tax identification number (if applicable).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-700 dark:text-blue-300">Verification Process</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Your documents will be securely verified by our admin team within 1-3 business days. 
                      You'll receive an email notification once your account is approved.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="gap-2"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Registration
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };

  // Completion Step
  const CompletionStep = () => {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Registration Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            Your vendor registration has been submitted successfully. Our admin team will review 
            your application and verify your documents within 1-3 business days.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">What happens next?</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Document verification by admin team</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Email notification upon approval</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Access to vendor dashboard and deal creation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button asChild>
              <Link to="/vendor/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/help">View Help Center</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const steps: OnboardingStep[] = [
    {
      id: 'business',
      title: 'Business Info',
      description: 'Basic business details',
      icon: Building,
      component: BusinessInfoStep,
      validation: businessInfoSchema,
    },
    {
      id: 'contact',
      title: 'Contact Info',
      description: 'Contact details',
      icon: Phone,
      component: ContactInfoStep,
      validation: contactInfoSchema,
    },
    {
      id: 'address',
      title: 'Address',
      description: 'Business location',
      icon: MapPin,
      component: AddressInfoStep,
      validation: addressInfoSchema,
    },
    {
      id: 'legal',
      title: 'Legal Info',
      description: 'Verification documents',
      icon: IdCard,
      component: LegalInfoStep,
      validation: legalInfoSchema,
    },
  ];

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData?.component;
  const progressPercentage = currentStep === 4 ? 100 : (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Store className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Vendor Registration</h1>
          <p className="text-muted-foreground mt-2">
            Join Instoredealz and start offering deals to thousands of customers
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = index === currentStep;
              const isAccessible = index <= currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2
                    ${isCompleted ? 'bg-green-500 text-white' : 
                      isCurrent ? 'bg-primary text-primary-foreground' : 
                      isAccessible ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground/50'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {step.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Step {currentStep + 1} of {steps.length}
              {currentStep === 4 && " - Complete!"}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 4 ? (
            <CompletionStep />
          ) : (
            StepComponent && <StepComponent />
          )}
        </div>

        {/* Help Section */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">Need Help?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Our support team is here to help you through the registration process.
                </p>
                <div className="flex space-x-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/help">Help Center</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/help">Contact Support</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorOnboarding;