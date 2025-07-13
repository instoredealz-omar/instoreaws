import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { 
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit,
  Save,
  Upload,
  Camera,
  Star,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  Store,
  Calendar,
  TrendingUp,
  Package,
  Users,
  Award,
  Settings,
  FileText,
  IdCard,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/ui/navbar';

const profileUpdateSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  companyWebsite: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode'),
  gstNumber: z.string().optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number'),
});

const VendorProfile = () => {
  const [editMode, setEditMode] = useState(false);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendor data
  const { data: vendor, isLoading } = useQuery({
    queryKey: ['/api/vendors/me'],
    enabled: !!user && user.role === 'vendor',
  });

  // Fetch vendor deals for statistics
  const { data: deals = [] } = useQuery({
    queryKey: ['/api/vendors/deals'],
    enabled: !!user && user.role === 'vendor',
  });

  const form = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      businessName: vendor?.businessName || '',
      description: vendor?.description || '',
      companyWebsite: vendor?.companyWebsite || '',
      address: vendor?.address || '',
      city: vendor?.city || '',
      state: vendor?.state || '',
      pincode: vendor?.pincode || '',
      gstNumber: vendor?.gstNumber || '',
      panNumber: vendor?.panNumber || '',
    },
  });

  // Reset form when vendor data loads
  React.useEffect(() => {
    if (vendor) {
      form.reset({
        businessName: vendor.businessName || '',
        description: vendor.description || '',
        companyWebsite: vendor.companyWebsite || '',
        address: vendor.address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        pincode: vendor.pincode || '',
        gstNumber: vendor.gstNumber || '',
        panNumber: vendor.panNumber || '',
      });
    }
  }, [vendor, form]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/vendors/profile', { method: 'PUT', body: data }),
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your vendor profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/me'] });
      setEditMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  const getApprovalBadge = () => {
    if (!vendor) return null;
    
    if (vendor.isApproved) {
      return (
        <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3" />
          Verified
        </Badge>
      );
    } else {
      return (
        <Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          <Clock className="h-3 w-3" />
          Pending Approval
        </Badge>
      );
    }
  };

  // Calculate vendor statistics
  const stats = {
    totalDeals: deals.length,
    activeDeals: deals.filter((deal: any) => deal.isActive && deal.isApproved).length,
    pendingDeals: deals.filter((deal: any) => !deal.isApproved).length,
    totalViews: deals.reduce((sum: number, deal: any) => sum + (deal.viewCount || 0), 0),
    totalClaims: deals.reduce((sum: number, deal: any) => sum + (deal.currentRedemptions || 0), 0),
    rating: vendor?.rating || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
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
            <h1 className="text-3xl font-bold text-foreground">Vendor Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your business information and settings
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getApprovalBadge()}
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? "outline" : "default"}
              className="gap-2"
            >
              {editMode ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="business">Business Info</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={vendor?.logoUrl} alt={vendor?.businessName} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                          {vendor?.businessName?.charAt(0) || 'V'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">{vendor?.businessName}</CardTitle>
                        <p className="text-muted-foreground">{vendor?.city}, {vendor?.state}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">{stats.rating.toFixed(1)}</span>
                          </div>
                          {getApprovalBadge()}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Camera className="h-4 w-4 mr-2" />
                      Update Logo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">About Business</Label>
                      <p className="text-sm mt-1 text-foreground">{vendor?.description || 'No description provided'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                        <p className="text-sm mt-1 text-foreground">{user?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="text-sm mt-1 text-foreground">{user?.email}</p>
                      </div>
                    </div>

                    {vendor?.companyWebsite && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                        <a 
                          href={vendor.companyWebsite} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline mt-1 block"
                        >
                          {vendor.companyWebsite}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Total Deals</span>
                    </div>
                    <span className="font-medium text-foreground">{stats.totalDeals}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Active Deals</span>
                    </div>
                    <span className="font-medium text-foreground">{stats.activeDeals}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Total Views</span>
                    </div>
                    <span className="font-medium text-foreground">{stats.totalViews}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-muted-foreground">Total Claims</span>
                    </div>
                    <span className="font-medium text-foreground">{stats.totalClaims}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deals.slice(0, 5).map((deal: any) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{deal.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {deal.viewCount || 0} views • {deal.currentRedemptions || 0} claims
                          </p>
                        </div>
                      </div>
                      <Badge variant={deal.isApproved ? "default" : "secondary"}>
                        {deal.isApproved ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                  {deals.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No deals created yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Info Tab */}
          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <p className="text-muted-foreground">
                  Update your business details to improve customer trust and visibility.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!editMode} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="companyWebsite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!editMode} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              disabled={!editMode}
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Describe your business, products, and services to attract customers.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-foreground">Address Information</h4>
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complete Address</FormLabel>
                            <FormControl>
                              <Textarea {...field} disabled={!editMode} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!editMode} />
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
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!editMode} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="pincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pincode</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!editMode} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-foreground">Legal Information</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                          className="gap-2"
                        >
                          {showSensitiveInfo ? (
                            <>
                              <EyeOff className="h-4 w-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Show
                            </>
                          )}
                        </Button>
                      </div>

                      {showSensitiveInfo && (
                        <div className="grid lg:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="panNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PAN Number</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    disabled={!editMode}
                                    style={{ textTransform: 'uppercase' }}
                                  />
                                </FormControl>
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
                                    {...field} 
                                    disabled={!editMode}
                                    style={{ textTransform: 'uppercase' }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {editMode && (
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditMode(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="gap-2"
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Clock className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Deals</p>
                      <p className="text-2xl font-bold">{stats.totalDeals}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Active Deals</p>
                      <p className="text-2xl font-bold">{stats.activeDeals}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Views</p>
                      <p className="text-2xl font-bold">{stats.totalViews}</p>
                    </div>
                    <Eye className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Claims</p>
                      <p className="text-2xl font-bold">{stats.totalClaims}</p>
                    </div>
                    <Users className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Detailed analytics coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Account Status</h4>
                    <p className="text-sm text-muted-foreground">
                      Your verification and approval status
                    </p>
                  </div>
                  {getApprovalBadge()}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Business Rating</h4>
                    <p className="text-sm text-muted-foreground">
                      Average customer rating for your business
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{stats.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Member Since</h4>
                    <p className="text-sm text-muted-foreground">
                      Registration date with Instoredealz
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {vendor?.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorProfile;