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

// Enhanced deal creation schema
const dealCreationSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  customCategory: z.string().optional(),
  subcategory: z.string().optional(),
  discountPercentage: z.number().min(1, 'Discount must be at least 1%').max(90, 'Discount cannot exceed 90%'),
  originalPrice: z.number().min(1, 'Original price must be greater than 0').optional(),
  validUntil: z.string().min(1, 'Please select a valid until date'),
  maxRedemptions: z.number().min(1, 'Maximum redemptions must be at least 1').optional(),
  requiredMembership: z.enum(['basic', 'premium', 'ultimate']),
  terms: z.string().min(10, 'Terms and conditions must be at least 10 characters').optional(),
  imageUrl: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
  verificationPin: z.string().regex(/^[0-9]{4}$/, 'PIN must be exactly 4 digits'),
});

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
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    form.setValue('verificationPin', pin);
  };

  const watchedValues = form.watch();
  const discountedPrice = watchedValues.originalPrice 
    ? (watchedValues.originalPrice * (100 - watchedValues.discountPercentage) / 100).toFixed(2)
    : 0;

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Vendor Profile Required</h2>
              <p className="text-muted-foreground mb-4">
                You need to complete your vendor registration before creating deals.
              </p>
              <Button asChild>
                <Link to="/vendor/onboarding">Complete Registration</Link>
              </Button>
            </CardContent>
          </Card>
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
                                  placeholder="Describe your deal in detail..."
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
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                                    placeholder="1234"
                                    maxLength={4}
                                    {...field}
                                    disabled={previewMode}
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={generateRandomPin}
                                  disabled={previewMode}
                                >
                                  Generate
                                </Button>
                              </div>
                              <FormDescription>
                                4-digit PIN for customers to verify their purchase at your store
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