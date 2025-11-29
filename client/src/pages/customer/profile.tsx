import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, User, Save, Mail, Phone, MapPin, Camera, Upload, X, Check, Award, Users, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { indianStates, getCitiesByState } from "@/lib/cities";
import Navbar from "@/components/ui/navbar";
import { ImageUpload } from "@/components/ui/image-upload";
import { updateUserProfileSchema } from "@shared/schema";

const DEAL_CATEGORIES = [
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "electronics", label: "Electronics & Gadgets" },
  { value: "food", label: "Food & Dining" },
  { value: "travel", label: "Travel & Tourism" },
  { value: "home", label: "Home & Living" },
  { value: "fitness", label: "Health & Fitness" },
  { value: "beauty", label: "Beauty & Personal Care" },
  { value: "entertainment", label: "Entertainment" },
  { value: "services", label: "Services" },
  { value: "automotive", label: "Automotive" },
];

type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

interface UserData {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  phone?: string;
  city?: string;
  state?: string;
  gender?: string;
  dateOfBirth?: string;
  profileImage?: string;
  membershipPlan: string;
  totalSavings: string;
  dealsClaimed: number;
  householdSize?: number;
  maritalStatus?: string;
  occupation?: string;
  incomeRange?: string;
  interests?: string[];
  inferredInterests?: string[];
}

export default function CustomerProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Fetch current user data
  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ['/api/auth/me'],
  });

  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      name: "",
      phone: "",
      city: "",
      state: "",
      gender: undefined,
      dateOfBirth: "",
      profileImage: "",
      householdSize: undefined,
      maritalStatus: undefined,
      occupation: undefined,
      incomeRange: undefined,
      interests: undefined,
    },
  });



  // Update form defaults when user data loads
  useEffect(() => {
    if (user) {
      // Format dateOfBirth for input[type="date"]
      const formattedDate = user.dateOfBirth 
        ? new Date(user.dateOfBirth).toISOString().split('T')[0]
        : "";
      
      form.reset({
        name: user.name || "",
        phone: user.phone || "",
        city: user.city || "",
        state: user.state || "",
        gender: user.gender as "male" | "female" | "other" | "prefer_not_to_say" | undefined,
        dateOfBirth: formattedDate,
        profileImage: user.profileImage || "",
        householdSize: user.householdSize || undefined,
        maritalStatus: user.maritalStatus as "single" | "married" | "divorced" | "widowed" | "prefer_not_to_say" | undefined,
        occupation: user.occupation as "student" | "employed" | "self_employed" | "homemaker" | "retired" | "prefer_not_to_say" | undefined,
        incomeRange: user.incomeRange as "under_25k" | "25k_50k" | "50k_100k" | "100k_250k" | "above_250k" | "prefer_not_to_say" | undefined,
        interests: undefined,
      });
    }
  }, [user, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserProfile) => 
      apiRequest('/api/users/profile', 'PUT', data),
    onSuccess: () => {
      toast({
        title: "Profile updated successfully!",
        description: "Redirecting to home page...",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      // Redirect to home page after successful update
      setTimeout(() => {
        setLocation('/');
      }, 1500); // Small delay to show the success message
    },
    onError: (error: any) => {
      toast({
        title: "Error updating profile",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateUserProfile) => {
    // Filter out empty optional fields, but preserve profileImage even if empty to allow clearing
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => {
        if (key === 'profileImage') {
          return true; // Always include profileImage field
        }
        if (key === 'interests') {
          return false; // Never include interests - auto-tracked from browsing
        }
        if (key === 'householdSize') {
          return typeof value === 'number' && value > 0; // Include householdSize if valid
        }
        if (typeof value === 'string') {
          return value.trim() !== "";
        }
        return value !== undefined && value !== null;
      })
    );
    updateMutation.mutate(filteredData);
  };

  const selectedState = form.watch("state");
  const availableCities = selectedState ? getCitiesByState(selectedState) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            My Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Update your personal information and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Management
            </CardTitle>
            <CardDescription>
              Manage your personal information, location, and account settings
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger value="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Location</span>
                </TabsTrigger>
                <TabsTrigger value="demographics" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Demographics</span>
                </TabsTrigger>
                <TabsTrigger value="membership" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span className="hidden sm:inline">Membership</span>
                </TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  {/* Personal Information Tab */}
                  <TabsContent value="personal" className="space-y-6 mt-6">
                    {/* Profile Photo Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                        Profile Photo
                      </h3>
                      
                      <FormField
                        control={form.control}
                        name="profileImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <ImageUpload
                                value={field.value || ""}
                                onChange={field.onChange}
                                className="w-full"
                                allowCamera={true}
                                showPreview={true}
                                maxSizeInMB={5}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Basic Info Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                        Basic Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Full Name
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter your full name" 
                                  {...field} 
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Phone Number
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter your phone number" 
                                  {...field} 
                                  value={field.value || ""}
                                  data-testid="input-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-gender">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  value={field.value || ""}
                                  data-testid="input-date-of-birth"
                                  max={new Date().toISOString().split('T')[0]}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Read-only fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-foreground dark:text-gray-300 mb-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </label>
                          <Input 
                            value={user?.email || ""} 
                            disabled 
                            className="bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Email cannot be changed
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground dark:text-gray-300 mb-2 block">
                            Username
                          </label>
                          <Input 
                            value={user?.username || ""} 
                            disabled 
                            className="bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Username cannot be changed
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Location Tab */}
                  <TabsContent value="location" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Location Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue("city", ""); // Reset city when state changes
                                }} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
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
                              <FormLabel>City</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ""}
                                disabled={!selectedState}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={
                                      selectedState ? "Select city" : "Select state first"
                                    } />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableCities.map((city) => (
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
                    </div>
                  </TabsContent>

                  {/* Demographics Tab */}
                  <TabsContent value="demographics" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Demographic Information
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        This information helps us recommend deals that match your lifestyle. All fields are optional.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="householdSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Household Size</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                value={field.value?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-household-size">
                                    <SelectValue placeholder="Select household size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">1 person (Just me)</SelectItem>
                                  <SelectItem value="2">2 people</SelectItem>
                                  <SelectItem value="3">3 people</SelectItem>
                                  <SelectItem value="4">4 people</SelectItem>
                                  <SelectItem value="5">5+ people</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maritalStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marital Status</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-marital-status">
                                    <SelectValue placeholder="Select marital status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="single">Single</SelectItem>
                                  <SelectItem value="married">Married</SelectItem>
                                  <SelectItem value="divorced">Divorced</SelectItem>
                                  <SelectItem value="widowed">Widowed</SelectItem>
                                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="occupation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Occupation</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-occupation">
                                    <SelectValue placeholder="Select occupation" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="student">Student</SelectItem>
                                  <SelectItem value="employed">Employed</SelectItem>
                                  <SelectItem value="self_employed">Self Employed</SelectItem>
                                  <SelectItem value="homemaker">Homemaker</SelectItem>
                                  <SelectItem value="retired">Retired</SelectItem>
                                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="incomeRange"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Annual Income Range</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-income-range">
                                    <SelectValue placeholder="Select income range" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="under_25k">Under ₹2.5 Lakhs</SelectItem>
                                  <SelectItem value="25k_50k">₹2.5 - 5 Lakhs</SelectItem>
                                  <SelectItem value="50k_100k">₹5 - 10 Lakhs</SelectItem>
                                  <SelectItem value="100k_250k">₹10 - 25 Lakhs</SelectItem>
                                  <SelectItem value="above_250k">Above ₹25 Lakhs</SelectItem>
                                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Your Interests
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        We automatically learn your interests based on deals you browse and claim.
                      </p>
                      
                      {user?.inferredInterests && user.inferredInterests.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                          {user.inferredInterests.map((interest) => {
                            const category = DEAL_CATEGORIES.find(c => c.value === interest);
                            return (
                              <div
                                key={interest}
                                className="flex items-center space-x-2 p-3 rounded-lg bg-primary/10 border border-primary"
                                data-testid={`inferred-interest-${interest}`}
                              >
                                <Check className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">{category?.label || interest}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                          <p className="text-sm text-muted-foreground">
                            Start browsing and claiming deals to personalize your recommendations!
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Membership Tab */}
                  <TabsContent value="membership" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                        Membership Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground dark:text-gray-300 mb-2 block">
                            Current Plan
                          </label>
                          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-border">
                            <span className="font-semibold text-blue-900 dark:text-blue-300 capitalize">
                              {user?.membershipPlan || "Basic"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground dark:text-gray-300 mb-2 block">
                            Total Savings
                          </label>
                          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-border">
                            <span className="font-semibold text-green-900 dark:text-green-300">
                              ₹{parseFloat(user?.totalSavings || "0").toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground dark:text-gray-300 mb-2 block">
                            Deals Claimed
                          </label>
                          <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-border">
                            <span className="font-semibold text-orange-900 dark:text-orange-300">
                              {user?.dealsClaimed || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Save Button - Always visible */}
                  <div className="flex justify-end pt-6 border-t mt-6">
                    <Button 
                      type="submit" 
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}