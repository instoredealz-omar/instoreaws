import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Eye, 
  Calendar,
  Target,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
  MapPin,
  Navigation,
  Crosshair,
  Copy
} from "lucide-react";
import ImageUpload from "@/components/ui/image-upload";
import PinTracker from "@/components/ui/pin-tracker";
import RotatingPinDisplay from "@/components/ui/rotating-pin-display";
import MultiStoreLocationManager from "@/components/MultiStoreLocationManager";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { indianStates, getCitiesByState } from "@/lib/cities";

const dealSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  subcategory: z.string().optional(),
  customCategory: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")),
  discountPercentage: z.number().min(1, "Discount must be at least 1%").max(90, "Discount cannot exceed 90%"),
  verificationPin: z.string().min(6, "Verification code must be 6 characters").max(6, "Verification code must be 6 characters"),
  validUntil: z.string().min(1, "Please select an end date"),
  maxRedemptions: z.number().optional(),
  requiredMembership: z.enum(["basic", "premium", "ultimate"]),
  address: z.string().min(1, "Address is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  useCurrentLocation: z.boolean().optional(),
  dealAvailability: z.enum(["all-stores", "selected-locations"]).default("all-stores"),
  dealType: z.enum(['offline', 'online']).default('offline'),
  affiliateLink: z.string().optional(),
  state: z.string().min(1, "Please select a state"),
  city: z.string().min(1, "Please select a city"),
  sublocation: z.string().optional(),
  pincode: z.string().min(1, "Pincode is required"),
  contactPhone: z.string().min(1, "Contact number is required"),
}).refine(
  (data) => {
    // Validate phone number for India (10 digits)
    const phoneDigits = data.contactPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return false;
    }
    return true;
  },
  {
    message: 'Contact number must be 10 digits',
    path: ['contactPhone'],
  }
).refine(
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

type DealForm = z.infer<typeof dealSchema>;

export default function VendorDeals() {
  const [location, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showSubcategory, setShowSubcategory] = useState(false);
  const [storeLocations, setStoreLocations] = useState<Array<{
    id: string;
    storeName: string;
    address: string;
    city: string;
    state: string;
    sublocation: string;
    pincode: string;
    phone: string;
  }>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Scroll to top when component mounts and check if create dialog should be open
  useEffect(() => {
    window.scrollTo(0, 0);
    // Open create dialog if accessed from /vendor/create-deal
    if (location === "/vendor/create-deal") {
      setIsCreateOpen(true);
      // Optionally change URL to /vendor/deals to keep it clean
      setLocation("/vendor/deals");
    }
  }, [location, setLocation]);

  // Services subcategories structure
  const servicesSubcategories = {
    "cleaning": {
      name: "Cleaning Services",
      subcategories: [
        "House cleaning",
        "Deep cleaning",
        "Carpet cleaning",
        "Window cleaning"
      ]
    },
    "repair-maintenance": {
      name: "Repair & Maintenance",
      subcategories: [
        "Plumbing",
        "Electrical repairs",
        "HVAC maintenance",
        "Appliance repair"
      ]
    },
    "home-improvement": {
      name: "Home Improvement",
      subcategories: [
        "Painting",
        "Flooring installation",
        "Kitchen remodeling",
        "Bathroom renovation"
      ]
    },
    "lawn-garden": {
      name: "Lawn & Garden",
      subcategories: [
        "Lawn mowing",
        "Landscaping",
        "Tree trimming",
        "Pest control"
      ]
    },
    "moving-storage": {
      name: "Moving & Storage",
      subcategories: [
        "Local moving",
        "Long-distance moving",
        "Packing services",
        "Storage solution"
      ]
    },
    "ride-services": {
      name: "Ride Services",
      subcategories: [
        "Economy rides",
        "Premium rides",
        "Shared rides",
        "Airport transfers"
      ]
    },
    "delivery": {
      name: "Delivery Services",
      subcategories: [
        "Food delivery",
        "Grocery delivery",
        "Package delivery",
        "Courier services"
      ]
    },
    "event-services": {
      name: "Event Services",
      subcategories: [
        "Event planning",
        "Catering",
        "Photography",
        "DJ or entertainment"
      ]
    },
    "pet-services": {
      name: "Pet Services",
      subcategories: [
        "Pet grooming",
        "Dog walking",
        "Pet sitting"
      ]
    },
    "rental-services": {
      name: "Rental Services",
      subcategories: [
        "Equipment rentals (e.g., cameras, tools)",
        "Clothing rentals",
        "Furniture rentals",
        "Vehicle rentals"
      ]
    },
    "local-experiences": {
      name: "Local Experiences",
      subcategories: [
        "Guided tours",
        "Adventure activities",
        "Cultural workshops",
        "Food tours"
      ]
    },
    "cooking-classes": {
      name: "Cooking Classes",
      subcategories: [
        "Online cooking lessons",
        "In-person workshops",
        "Baking classes",
        "International cuisine lessons"
      ]
    }
  };

  const { data: vendor } = useQuery({
    queryKey: ["/api/vendors/me"],
  });

  const { data: deals = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/vendors/deals"],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<DealForm>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      subcategory: "",
      customCategory: "",
      imageUrl: "",
      discountPercentage: 10,
      verificationPin: "",
      validUntil: "",
      dealAvailability: "all-stores",
      dealType: "offline",
      affiliateLink: "",
      maxRedemptions: undefined,
      requiredMembership: "basic",
      address: "",
      latitude: undefined,
      longitude: undefined,
      useCurrentLocation: false,
      state: "",
      city: "",
      sublocation: "",
      pincode: "",
      contactPhone: "",
    },
  });

  // Watch category selection to show/hide custom category field and subcategories
  const watchedCategory = form.watch("category");
  
  // Show custom category field when "others" is selected
  // Show subcategory field when "services" is selected
  React.useEffect(() => {
    setShowCustomCategory(watchedCategory === "others");
    setShowSubcategory(watchedCategory === "services");
    
    // Clear subcategory when not services
    if (watchedCategory !== "services") {
      form.setValue("subcategory", "");
    }
  }, [watchedCategory, form]);

  // Geolocation function
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue("latitude", latitude);
        form.setValue("longitude", longitude);
        form.setValue("useCurrentLocation", true);
        setIsGettingLocation(false);
        toast({
          title: "Location updated",
          description: "Your current location has been set for this deal.",
        });
      },
      (error) => {
        setLocationError(error.message);
        setIsGettingLocation(false);
        toast({
          title: "Location Error",
          description: "Could not get your current location.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const createDealMutation = useMutation({
    mutationFn: async (data: DealForm) => {
      // Use custom category if "others" is selected and transform data types
      const finalData = {
        ...data,
        category: data.category === "others" && data.customCategory ? data.customCategory : data.category,
        subcategory: data.subcategory || null,
        validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : undefined,
        latitude: data.latitude ? data.latitude.toString() : undefined,
        longitude: data.longitude ? data.longitude.toString() : undefined,
        locations: data.dealAvailability === "selected-locations" ? storeLocations : []
      };
      return apiRequest('/api/vendors/deals', {
        method: 'POST',
        body: finalData
      });
    },
    onSuccess: () => {
      toast({
        title: "Deal created successfully!",
        description: "Your deal has been submitted for admin approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/deals"] });
      setIsCreateOpen(false);
      form.reset();
      setShowCustomCategory(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create deal",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async (data: DealForm) => {
      if (!editingDeal) throw new Error("No deal selected for editing");
      
      // Use custom category if "others" is selected and transform data types
      const finalData = {
        ...data,
        category: data.category === "others" && data.customCategory ? data.customCategory : data.category,
        subcategory: data.subcategory || null,
        validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : undefined,
        latitude: data.latitude ? data.latitude.toString() : undefined,
        longitude: data.longitude ? data.longitude.toString() : undefined,
      };
      return apiRequest(`/api/vendors/deals/${editingDeal.id}`, {
        method: 'PUT',
        body: finalData
      });
    },
    onSuccess: () => {
      toast({
        title: "Deal updated successfully!",
        description: "Your changes have been submitted and require admin approval before going live.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/deals"] });
      setEditingDeal(null);
      form.reset();
      setShowCustomCategory(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update deal",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DealForm) => {
    if (editingDeal) {
      updateDealMutation.mutate(data);
    } else {
      createDealMutation.mutate(data);
    }
  };

  const handleEdit = (deal: any) => {
    const isOthersCategory = !categories.find((cat: any) => cat.id === deal.category);
    const isServicesCategory = deal.category === "services";
    
    form.reset({
      title: deal.title,
      description: deal.description,
      category: isOthersCategory ? "others" : deal.category,
      subcategory: deal.subcategory || "",
      customCategory: isOthersCategory ? deal.category : "",
      imageUrl: deal.imageUrl || "",
      discountPercentage: deal.discountPercentage,
      verificationPin: deal.verificationPin || "",
      validUntil: new Date(deal.validUntil).toISOString().split('T')[0],
      maxRedemptions: deal.maxRedemptions,
      requiredMembership: deal.requiredMembership,
      address: deal.address,
      latitude: deal.latitude ? parseFloat(deal.latitude) : undefined,
      longitude: deal.longitude ? parseFloat(deal.longitude) : undefined,
      useCurrentLocation: false,
    });
    
    setShowCustomCategory(isOthersCategory);
    setShowSubcategory(isServicesCategory);
    setEditingDeal(deal);
  };

  const handleCloseDialog = () => {
    setIsCreateOpen(false);
    setEditingDeal(null);
    form.reset();
    setShowCustomCategory(false);
    setShowSubcategory(false);
    setStoreLocations([]);
  };

  const getDealStatusBadge = (deal: any) => {
    if (!deal.isApproved) {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    if (!deal.isActive) {
      return <Badge variant="outline">Inactive</Badge>;
    }
    if (new Date(deal.validUntil) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge className="bg-success text-white">Active</Badge>;
  };

  const stats = [
    {
      title: "Total Deals",
      value: deals.length,
      icon: Target,
      change: "+12%",
      changeType: "increase" as const,
    },
    {
      title: "Active Deals",
      value: deals.filter((deal: any) => deal.isActive && deal.isApproved).length,
      icon: TrendingUp,
      change: "+8%",
      changeType: "increase" as const,
    },
    {
      title: "Total Views",
      value: deals.reduce((acc: number, deal: any) => acc + (deal.viewCount || 0), 0),
      icon: Eye,
      change: "+15%",
      changeType: "increase" as const,
    },
    {
      title: "Total Claims",
      value: deals.reduce((acc: number, deal: any) => acc + (deal.currentRedemptions || 0), 0),
      icon: Calendar,
      change: "+22%",
      changeType: "increase" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Deals</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage your deals
              </p>
            </div>
            <Dialog open={isCreateOpen || !!editingDeal} onOpenChange={(open) => {
              if (!open) handleCloseDialog();
              else setIsCreateOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    {editingDeal ? "Edit Deal" : "Create New Deal"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {editingDeal 
                      ? "Update your deal information. Changes will need admin approval before going live."
                      : "Create a new deal for your customers. Fill in all required fields marked with *."
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    {/* Row 1: Title and Discount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Deal Title *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Enter deal title"
                                className="h-12 text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="discountPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Discount % *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                placeholder="10"
                                className="h-12 text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Row 2: Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Describe your deal"
                              className="min-h-[80px] text-base resize-none"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Row 3: Category and PIN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Category *</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setShowCustomCategory(value === "others");
                                setShowSubcategory(value === "services");
                                if (value !== "services") {
                                  form.setValue("subcategory", "");
                                }
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                                {!categories.find((cat: any) => cat.id === "others") && (
                                  <SelectItem key="others-custom" value="others">Others</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="verificationPin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Verification Code *</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  {...field}
                                  type="text"
                                  placeholder="6-character code"
                                  maxLength={6}
                                  pattern="[A-Za-z0-9]{6}"
                                  className="h-12 text-base text-center font-mono uppercase"
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-12 px-3"
                                onClick={() => {
                                  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                                  let code = '';
                                  for (let i = 0; i < 6; i++) {
                                    code += chars.charAt(Math.floor(Math.random() * chars.length));
                                  }
                                  field.onChange(code);
                                  toast({
                                    title: "Code Generated",
                                    description: `Your verification code: ${code}`,
                                  });
                                }}
                                data-testid="button-generate-pin"
                              >
                                Generate
                              </Button>
                            </div>
                            <FormDescription className="text-xs">
                              Enter your own 6-character code or click Generate to auto-create one
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Conditional: Service Type */}
                    {showSubcategory && (
                      <FormField
                        control={form.control}
                        name="subcategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Service Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(servicesSubcategories).map(([key, category]) => (
                                  <div key={key}>
                                    <div className="px-2 py-1 text-sm font-semibold text-gray-700 bg-gray-100 border-b">
                                      {category.name}
                                    </div>
                                    {category.subcategories.map((subcategory) => (
                                      <SelectItem 
                                        key={`${key}-${subcategory}`} 
                                        value={`${key}:${subcategory}`}
                                        className="pl-4"
                                      >
                                        {subcategory}
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Conditional: Custom Category */}
                    {showCustomCategory && (
                      <FormField
                        control={form.control}
                        name="customCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Custom Category</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Enter custom category name"
                                className="h-12 text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Row 4: Valid Until and Max Redemptions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="validUntil"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Valid Until</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field}
                                className="h-12 text-base"
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
                            <FormLabel className="text-sm">Max Redemptions</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                placeholder="Unlimited"
                                className="h-12 text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Row 5: Required Membership */}
                    <FormField
                      control={form.control}
                      name="requiredMembership"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Required Membership</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="ultimate">Ultimate</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Deal Type */}
                    <FormField
                      control={form.control}
                      name="dealType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Deal Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12" data-testid="select-deal-type">
                                <SelectValue placeholder="Select deal type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="offline">Offline Deal (In-Store)</SelectItem>
                              <SelectItem value="online">Online Deal (Affiliate Link)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Choose whether customers redeem this deal in your store or online
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Affiliate Link - Only show for online deals */}
                    {form.watch('dealType') === 'online' && (
                      <FormField
                        control={form.control}
                        name="affiliateLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Affiliate Link *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="https://yourwebsite.com/deal-page"
                                className="h-12 text-base"
                                data-testid="input-affiliate-link"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Enter the URL where customers can redeem this online deal
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Row 6: Address */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Enter full address"
                              className="min-h-[60px] text-base resize-none"
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Location Button */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="h-10 text-sm"
                        size="sm"
                      >
                        {isGettingLocation ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Navigation className="h-4 w-4 mr-2" />
                        )}
                        Use Current Location
                      </Button>
                      
                      {locationError && (
                        <p className="text-xs text-red-600">{locationError}</p>
                      )}
                    </div>

                    {/* Deal Availability Options */}
                    <FormField
                      control={form.control}
                      name="dealAvailability"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base">Deal Availability</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all-stores" id="all-stores" />
                                <label htmlFor="all-stores" className="text-sm font-medium">
                                  All Stores
                                </label>
                              </div>
                              <p className="text-xs text-muted-foreground ml-6">
                                Available at all your business locations
                              </p>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="selected-locations" id="selected-locations" />
                                <label htmlFor="selected-locations" className="text-sm font-medium">
                                  Selected Locations Only
                                </label>
                              </div>
                              <p className="text-xs text-muted-foreground ml-6">
                                Choose specific store locations for this deal
                              </p>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Multi-Store Location Manager */}
                    {form.watch("dealAvailability") === "selected-locations" && (
                      <MultiStoreLocationManager
                        locations={storeLocations}
                        onChange={setStoreLocations}
                      />
                    )}

                    {/* All Stores Location Fields - Only show for All Stores */}
                    {form.watch("dealAvailability") === "all-stores" && (
                      <>
                        {/* State and City */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">State *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-12">
                                      <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {indianStates.map((state) => (
                                      <SelectItem key={state.name} value={state.name}>
                                        {state.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">City *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-12">
                                      <SelectValue placeholder="Select city" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {form.watch("state") && getCitiesByState(form.watch("state") || "").map((city) => (
                                      <SelectItem key={city} value={city}>
                                        {city}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Sublocation and Pincode */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="sublocation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Sublocation</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="e.g., Dadar, Bandra"
                                    className="h-12 text-base"
                                  />
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
                                <FormLabel className="text-sm">Pincode *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="400001"
                                    className="h-12 text-base"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Contact Number */}
                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Contact Number *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="9876543210"
                                  className="h-12 text-base"
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                10-digit Indian phone number
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Row 7: Image Upload */}
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Deal Image</FormLabel>
                          <FormControl>
                            <ImageUpload
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Upload deal image or enter URL"
                              maxSizeInMB={5}
                              allowCamera={true}
                              showPreview={true}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseDialog}
                        className="h-12 text-base flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createDealMutation.isPending || updateDealMutation.isPending}
                        className="h-12 text-base flex-1"
                      >
                        {(createDealMutation.isPending || updateDealMutation.isPending) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {editingDeal ? "Update Deal" : "Create Deal"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Deals List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Deals</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading deals...</p>
              </div>
            ) : deals.length > 0 ? (
              <div className="space-y-4">
                {deals.map((deal: any) => (
                  <div key={deal.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {deal.title}
                            </h3>
                            {getDealStatusBadge(deal)}
                          </div>
                          <p className="text-muted-foreground mb-3">{deal.description}</p>
                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Target className="h-4 w-4 text-gray-400" />
                              <span>Category: {deal.category}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-4 w-4 text-gray-400" />
                              <span>Discount: {deal.discountPercentage}%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="h-4 w-4 text-gray-400" />
                              <span>Views: {deal.viewCount || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>Claims: {deal.currentRedemptions || 0}</span>
                            </div>
                          </div>
                          
                          {/* Online Deal Information */}
                          {deal.dealType === 'online' && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-blue-600 text-white">
                                  Online Deal
                                </Badge>
                              </div>
                              {deal.affiliateLink && (
                                <div className="text-sm">
                                  <p className="text-muted-foreground mb-2">Affiliate Link:</p>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 break-all">
                                      {deal.affiliateLink}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        navigator.clipboard.writeText(deal.affiliateLink);
                                        toast({
                                          title: "Copied!",
                                          description: "Affiliate link copied to clipboard",
                                        });
                                      }}
                                      className="h-6 px-2 flex-shrink-0"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                                    Customers will use their claim codes on this link to get {deal.discountPercentage}% off
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="mt-2">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>Valid until: {new Date(deal.validUntil).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(deal)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      
                      {/* Static Verification PIN Section - Always visible for all deals */}
                      <div className="border-t pt-6">
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Deal Verification Code
                          </h4>
                          <p className="text-xs text-muted-foreground mb-3">
                            This is your deal's verification code. Use it to verify customers or provide to customers for claiming.
                          </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                              {deal.verificationPin}
                            </span>
                            <Badge variant="outline" className="text-xs bg-white dark:bg-gray-900">
                              Static Code
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Valid until: {new Date(deal.validUntil).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                              <AlertCircle className="h-3 w-3" />
                              Code expires with deal on {new Date(deal.validUntil).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Active Claim Codes Section */}
                      {deal.isActive && deal.isApproved && deal.claimCodes && deal.claimCodes.length > 0 && (
                        <div className="border-t pt-6">
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                              <Target className="h-4 w-4 text-primary" />
                              Active Claim Codes ({deal.activeClaimsCount || 0})
                            </h4>
                            <p className="text-xs text-muted-foreground mb-3">
                              These are claim codes from customers who have claimed this deal. 
                              Verify these codes when customers visit your store.
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {deal.claimCodes.filter((claim: any) => {
                              const isExpired = claim.isExpired || (claim.expiresAt && new Date(claim.expiresAt) < new Date());
                              return !isExpired;
                            }).slice(0, 6).map((claim: any, index: number) => (
                              <div 
                                key={index} 
                                className="border rounded-lg p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                data-testid={`claim-code-${index}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-lg font-mono font-bold text-green-600 dark:text-green-400">
                                    {claim.code}
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs bg-green-100 dark:bg-green-900"
                                  >
                                    Active
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Claimed: {new Date(claim.claimedAt).toLocaleDateString()}
                                  </div>
                                  {claim.expiresAt && (
                                    <div className="flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      Expires: {new Date(claim.expiresAt).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {deal.claimCodes.length > 6 && (
                            <p className="text-xs text-muted-foreground mt-3 text-center">
                              +{deal.claimCodes.length - 6} more claim codes. 
                              Use POS dashboard to view all claims.
                            </p>
                          )}
                          {deal.totalClaimsCount > 0 && (
                            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center text-sm">
                              <div>
                                <div className="text-2xl font-bold text-primary">{deal.activeClaimsCount || 0}</div>
                                <div className="text-xs text-muted-foreground">Active Claims</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-green-600">{deal.verifiedClaimsCount || 0}</div>
                                <div className="text-xs text-muted-foreground">Verified</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-gray-600">{deal.totalClaimsCount || 0}</div>
                                <div className="text-xs text-muted-foreground">Total Claims</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Rotating PIN Display */}
                      {deal.isActive && deal.isApproved && (
                        <div className="border-t pt-6">
                          <RotatingPinDisplay 
                            dealId={deal.id} 
                            dealTitle={deal.title}
                            dealImage={deal.imageUrl}
                            dealDescription={deal.description}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No deals yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first deal to start attracting customers
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Deal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}