import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { 
  Package,
  Plus,
  Save,
  Eye,
  Calendar,
  MapPin,
  Users,
  Percent,
  Star,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Camera,
  Link as LinkIcon,
  FileText,
  Target,
  Tag,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Link } from 'wouter';
import Navbar from '@/components/ui/navbar';
import VendorRegistrationStatus from "@/components/vendor-registration-status";

// Enhanced deal creation schema
const dealCreationSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  customCategory: z.string().optional(),
  subcategory: z.string().optional(),
  discountPercentage: z.number().min(1, 'Discount must be at least 1%').max(90, 'Discount cannot exceed 90%').optional().refine(val => val !== undefined, 'Discount percentage is required'),
  originalPrice: z.number().min(1, 'Original price must be greater than 0').optional(),
  validUntil: z.string().min(1, 'Please select a valid until date'),
  maxRedemptions: z.number().min(1, 'Maximum redemptions must be at least 1').optional(),
  requiredMembership: z.enum(['basic', 'premium', 'ultimate']),
  terms: z.string().min(10, 'Terms and conditions must be at least 10 characters').optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  verificationPin: z.string().regex(/^[A-Z0-9]{6}$/, 'PIN must be exactly 6 alphanumeric characters'),
  dealType: z.enum(['offline', 'online']).default('offline'),
  affiliateLink: z.string().optional(),
}).refine(
  (data) => {
    if (data.dealType === 'online' && !data.affiliateLink) {
      return false;
    }
    return true;
  },
  {
    message: 'Affiliate link is required for online deals',
    path: ['affiliateLink'],
  }
);

type DealFormData = z.infer<typeof dealCreationSchema>;

const categories = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion & Clothing' },
  { id: 'restaurants', name: 'Restaurants & Food' },
  { id: 'beauty', name: 'Beauty & Wellness' },
  { id: 'fitness', name: 'Fitness & Sports' },
  { id: 'travel', name: 'Travel & Tourism' },
  { id: 'home', name: 'Home & Garden' },
  { id: 'automotive', name: 'Automotive' },
  { id: 'education', name: 'Education & Training' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'services', name: 'Professional Services' },
  { id: 'others', name: 'Others' },
];

const DEAL_DESCRIPTIONS: Record<string, string> = {
  electronics: "Example: Get 20% off on all smartphones. This offer includes: free screen protector, 1 year warranty, free installation. Valid on selected models. Terms: Valid on new purchases, cannot be combined with other offers.",
  fashion: "Example: Buy 2 get 1 free on all winter collection. Includes: shirts, pants, jackets from leading brands. Limited stock available. Terms: Must purchase 2 items to get 3rd free, applicable on equal or lesser value.",
  restaurants: "Example: Get 30% off on dine-in bills above ₹500. Include: starters, mains, beverages. Valid for lunch and dinner. Terms: Not applicable on alcohol, taxes extra, one offer per table.",
  beauty: "Example: Free facial treatment with every haircut package. Includes: professional haircut, shampoo, conditioning. Valid at all branches. Terms: Valid for new customers or after 3 months.",
  fitness: "Example: Get 3 months free gym membership with annual subscription. Includes: unlimited access, personal trainer consultation. Limited offer. Terms: Valid for new members only.",
  travel: "Example: Book and save 25% on domestic tour packages. Includes: hotel, transportation, meals, sightseeing. Popular destinations. Terms: Advance booking required, non-refundable offer.",
  home: "Example: Save 40% on all furniture items. Includes: beds, sofas, dining sets. Premium quality guaranteed. Terms: Free delivery for purchases above ₹10000, includes 1 year warranty.",
  automotive: "Example: Get 50% off on car servicing packages. Includes: oil change, filter replacement, inspection. Authentic parts only. Terms: Valid on first service, appointment required.",
  education: "Example: Enroll now and get 20% off on course fees. Includes: online classes, materials, certification. Various courses available. Terms: Valid for new enrollments, non-refundable.",
  healthcare: "Example: Get 30% off on health checkup packages. Includes: blood tests, health screening, doctor consultation. Modern lab facilities. Terms: Results within 24 hours, valid for walk-ins.",
  entertainment: "Example: Get 2 movie tickets for the price of 1. Valid on all shows except premieres. Premium theaters. Terms: Not applicable on special events, valid on weekdays.",
  services: "Example: Get 25% off on home cleaning service. Includes: deep cleaning, pest control, sanitization. Professional team. Terms: Minimum 2 visits required, advance booking essential.",
  others: "Example: Special discount on our products and services. Terms and conditions apply. Contact us for more details.",
};

const VendorDealCreation = () => {
  const [previewMode, setPreviewMode] = useState(false);
  const [imageUploadMethod, setImageUploadMethod] = useState<'upload' | 'camera' | 'url'>('url');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check vendor status
  const { data: vendor } = useQuery({
    queryKey: ['/api/vendors/me'],
    enabled: !!user && user.role === 'vendor',
  });

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealCreationSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      customCategory: '',
      subcategory: '',
      discountPercentage: 10,
      originalPrice: undefined,
      validUntil: '',
      maxRedemptions: undefined,
      requiredMembership: 'basic',
      terms: '',
      imageUrl: '',
      verificationPin: '',
      dealType: 'offline',
      affiliateLink: '',
    },
  });

  const createDealMutation = useMutation({
    mutationFn: (data: DealFormData) => {
      const dealData = {
        ...data,
        category: data.category === 'others' && data.customCategory ? data.customCategory : data.category,
        address: vendor?.address || '',
      };
      return apiRequest('/api/create-deal', { method: 'POST', body: dealData });
    },
    onSuccess: (data) => {
      toast({
        title: "Deal Created Successfully!",
        description: "Your deal has been submitted for admin approval.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/deals'] });
      form.reset();
      setPreviewMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Deal",
        description: error.message || "An error occurred while creating the deal.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DealFormData) => {
    createDealMutation.mutate(data);
  };

  const generateRandomPin = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const pin = Array.from({ length: 6 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    form.setValue('verificationPin', pin);
    toast({
      title: "PIN Generated",
      description: `Your verification PIN: ${pin}`,
    });
  };

  const watchedValues = form.watch();
  const selectedCategory = watchedValues.category;
  const discountedPrice = watchedValues.originalPrice 
    ? (watchedValues.originalPrice * (100 - watchedValues.discountPercentage) / 100).toFixed(2)
    : 0;

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <VendorRegistrationStatus showTitle={true} />
        </div>
      </div>
    );
  }

  if (!vendor.isApproved) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Approval Pending</h2>
              <p className="text-muted-foreground mb-4">
                Your vendor account is pending approval. You'll be able to create deals once approved.
              </p>
              <div className="flex justify-center space-x-4">
                <Button asChild variant="outline">
                  <Link to="/vendor/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/help">Contact Support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create New Deal</h1>
            <p className="text-muted-foreground mt-1">
              Create attractive deals to attract customers to your business
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={previewMode ? "default" : "outline"}
              onClick={() => setPreviewMode(!previewMode)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Deal Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Deal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <Tabs defaultValue="basic" className="space-y-6">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="pricing">Pricing</TabsTrigger>
                        <TabsTrigger value="media">Media</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </TabsList>

                      {/* Basic Information Tab */}
                      <TabsContent value="basic" className="space-y-6">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Deal Title *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., 50% Off Premium Electronics"
                                  {...field}
                                  disabled={previewMode}
                                />
                              </FormControl>
                              <FormDescription>
                                Create a catchy title that highlights your main offer
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={
                                    selectedCategory && DEAL_DESCRIPTIONS[selectedCategory]
                                      ? DEAL_DESCRIPTIONS[selectedCategory]
                                      : "Describe your deal in detail..."
                                  }
                                  className="min-h-[120px]"
                                  {...field}
                                  disabled={previewMode}
                                />
                              </FormControl>
                              <FormDescription>
                                Provide detailed information about your offer, what's included, and any special features
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category *</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                  disabled={previewMode}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {watchedValues.category === 'others' && (
                            <FormField
                              control={form.control}
                              name="customCategory"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Custom Category</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter custom category"
                                      {...field}
                                      disabled={previewMode}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        <FormField
                          control={form.control}
                          name="requiredMembership"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Required Membership *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={previewMode}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select membership level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="basic">Basic (All Members)</SelectItem>
                                  <SelectItem value="premium">Premium Members Only</SelectItem>
                                  <SelectItem value="ultimate">Ultimate Members Only</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select the minimum membership level required to claim this deal
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dealType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Deal Type *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={previewMode}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-deal-type">
                                    <SelectValue placeholder="Select deal type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="offline">Offline Deal (In-Store)</SelectItem>
                                  <SelectItem value="online">Online Deal (Affiliate Link)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Choose whether customers redeem this deal in your store or online
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {watchedValues.dealType === 'online' && (
                          <FormField
                            control={form.control}
                            name="affiliateLink"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Affiliate Link *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="https://yourwebsite.com/deal-page"
                                    {...field}
                                    disabled={previewMode}
                                    data-testid="input-affiliate-link"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Enter the URL where customers can redeem this online deal
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </TabsContent>

                      {/* Pricing Tab */}
                      <TabsContent value="pricing" className="space-y-6">
                        <FormField
                          control={form.control}
                          name="discountPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount Percentage *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="90"
                                  placeholder="25"
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '') {
                                      field.onChange(undefined);
                                    } else {
                                      const numValue = parseInt(value);
                                      if (!isNaN(numValue)) {
                                        field.onChange(numValue);
                                      }
                                    }
                                  }}
                                  disabled={previewMode}
                                />
                              </FormControl>
                              <FormDescription>
                                Enter the discount percentage (1-90%)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="originalPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Original Price (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  step="0.01"
                                  placeholder="1000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                  disabled={previewMode}
                                />
                              </FormControl>
                              <FormDescription>
                                If provided, discounted price will be calculated automatically
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {watchedValues.originalPrice && (
                          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Discounted Price</p>
                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                  ₹{discountedPrice}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">You Save</p>
                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                  ₹{(watchedValues.originalPrice - parseFloat(discountedPrice)).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="validUntil"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valid Until *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="datetime-local"
                                    {...field}
                                    disabled={previewMode}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="maxRedemptions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Redemptions (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="100"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                    disabled={previewMode}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Leave empty for unlimited redemptions
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>

                      {/* Media Tab */}
                      <TabsContent value="media" className="space-y-6">
                        <div>
                          <Label className="text-sm font-medium">Image Upload Method</Label>
                          <div className="flex space-x-2 mt-2">
                            <Button
                              type="button"
                              variant={imageUploadMethod === 'url' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setImageUploadMethod('url')}
                              disabled={previewMode}
                            >
                              <LinkIcon className="h-4 w-4 mr-1" />
                              URL
                            </Button>
                            <Button
                              type="button"
                              variant={imageUploadMethod === 'upload' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setImageUploadMethod('upload')}
                              disabled={previewMode}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Upload
                            </Button>
                            <Button
                              type="button"
                              variant={imageUploadMethod === 'camera' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setImageUploadMethod('camera')}
                              disabled={previewMode}
                            >
                              <Camera className="h-4 w-4 mr-1" />
                              Camera
                            </Button>
                          </div>
                        </div>

                        {imageUploadMethod === 'url' && (
                          <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Image URL</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="https://example.com/image.jpg"
                                    {...field}
                                    disabled={previewMode}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Enter a direct URL to your deal image
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {imageUploadMethod === 'upload' && (
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">File upload functionality coming soon</p>
                          </div>
                        )}

                        {imageUploadMethod === 'camera' && (
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">Camera capture functionality coming soon</p>
                          </div>
                        )}

                        {watchedValues.imageUrl && (
                          <div className="border rounded-lg p-4">
                            <Label className="text-sm font-medium mb-2 block">Image Preview</Label>
                            <img
                              src={watchedValues.imageUrl}
                              alt="Deal preview"
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </TabsContent>

                      {/* Advanced Tab */}
                      <TabsContent value="advanced" className="space-y-6">
                        <FormField
                          control={form.control}
                          name="verificationPin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Verification PIN *</FormLabel>
                              <div className="flex space-x-2">
                                <FormControl>
                                  <Input
                                    placeholder="K9M3X7"
                                    maxLength={6}
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                    className="font-mono uppercase"
                                    disabled={previewMode}
                                    data-testid="input-verification-pin"
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={generateRandomPin}
                                  disabled={previewMode}
                                  data-testid="button-generate-pin"
                                >
                                  Generate
                                </Button>
                              </div>
                              <FormDescription>
                                6-character alphanumeric code for deal verification (e.g., K9M3X7)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="terms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Terms & Conditions</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter terms and conditions for this deal..."
                                  className="min-h-[100px]"
                                  {...field}
                                  disabled={previewMode}
                                />
                              </FormControl>
                              <FormDescription>
                                Specify any conditions, restrictions, or requirements for this deal
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          <div className="flex items-start space-x-2">
                            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-700 dark:text-blue-300">
                                Deal Approval Process
                              </h4>
                              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                Your deal will be reviewed by our admin team before going live. 
                                This ensures quality and compliance with our platform guidelines.
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {!previewMode && (
                      <div className="flex justify-end space-x-2 pt-6 border-t">
                        <Button type="button" variant="outline" asChild>
                          <Link to="/vendor/deals">Cancel</Link>
                        </Button>
                        <Button
                          type="submit"
                          disabled={createDealMutation.isPending}
                          className="gap-2"
                        >
                          {createDealMutation.isPending ? (
                            <>
                              <Clock className="h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Create Deal
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Deal Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {watchedValues.imageUrl && (
                  <img
                    src={watchedValues.imageUrl}
                    alt="Deal preview"
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                
                <div>
                  <h3 className="font-semibold text-lg">
                    {watchedValues.title || 'Deal Title'}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {watchedValues.description || 'Deal description will appear here...'}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Percent className="h-3 w-3" />
                    {watchedValues.discountPercentage}% OFF
                  </Badge>
                  <Badge variant="secondary">
                    {watchedValues.requiredMembership}
                  </Badge>
                </div>

                {watchedValues.originalPrice && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Original Price:</span>
                      <span className="line-through text-muted-foreground">₹{watchedValues.originalPrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Deal Price:</span>
                      <span className="font-semibold text-green-600">₹{discountedPrice}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Valid until: {watchedValues.validUntil || 'Not set'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {vendor?.city}, {vendor?.state}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      PIN: {watchedValues.verificationPin || '****'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDealCreation;