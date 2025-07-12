import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Save, Mail, Phone, MapPin, Camera, Upload, X, Check, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { indianStates, getCitiesByState } from "@/lib/cities";
import Navbar from "@/components/ui/navbar";

const updateUserProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  profileImage: z.string().optional(),
});

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
  profileImage?: string;
  membershipPlan: string;
  totalSavings: string;
  dealsClaimed: number;
}

export default function CustomerProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Photo upload state
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadMethod, setUploadMethod] = useState<"file" | "camera" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      profileImage: "",
    },
  });

  // Photo upload helpers
  const handlePhotoChange = (file: File) => {
    setProfilePhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      form.setValue("profileImage", result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a photo smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      handlePhotoChange(file);
    }
  };

  const handleUrlSubmit = () => {
    const imageUrl = form.getValues("profileImage");
    if (imageUrl) {
      setPhotoPreview(imageUrl);
      setProfilePhoto(null);
      toast({
        title: "Photo URL set",
        description: "Profile photo has been updated",
      });
    }
  };

  const clearPhoto = () => {
    setProfilePhoto(null);
    setPhotoPreview("");
    form.setValue("profileImage", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Update form defaults when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        phone: user.phone || "",
        city: user.city || "",
        state: user.state || "",
        profileImage: user.profileImage || "",
      });
      // Set photo preview if user has existing profile image
      if (user.profileImage) {
        setPhotoPreview(user.profileImage);
      }
    }
  }, [user, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserProfile) => 
      apiRequest('/api/users/profile', 'PUT', data),
    onSuccess: () => {
      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
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
    // Filter out empty optional fields
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value && value.trim() !== "")
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </TabsTrigger>
                <TabsTrigger value="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </TabsTrigger>
                <TabsTrigger value="membership" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Membership
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
                      
                      {/* Upload Method Selection */}
                      <div className="flex space-x-2 mb-3">
                        <Button
                          type="button"
                          variant={uploadMethod === "file" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setUploadMethod("file")}
                          className="text-xs"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Upload
                        </Button>
                        <Button
                          type="button"
                          variant={uploadMethod === "camera" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setUploadMethod("camera")}
                          className="text-xs"
                        >
                          <Camera className="h-3 w-3 mr-1" />
                          Camera
                        </Button>
                        <Button
                          type="button"
                          variant={uploadMethod === "url" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setUploadMethod("url")}
                          className="text-xs"
                        >
                          URL
                        </Button>
                      </div>

                      {/* Photo Preview */}
                      {photoPreview && (
                        <div className="relative inline-block">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                            <img
                              src={photoPreview}
                              alt="Profile preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={clearPhoto}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Upload Controls */}
                      {uploadMethod === "file" && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full text-sm"
                            disabled={updateMutation.isPending}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose Photo File
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG or GIF (max 5MB)
                          </p>
                        </div>
                      )}

                      {uploadMethod === "camera" && (
                        <div>
                          <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => cameraInputRef.current?.click()}
                            className="w-full text-sm"
                            disabled={updateMutation.isPending}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Take Photo
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use your device camera to take a photo
                          </p>
                        </div>
                      )}

                      {uploadMethod === "url" && (
                        <FormField
                          control={form.control}
                          name="profileImage"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="space-y-2">
                                  <div className="flex space-x-2">
                                    <Input
                                      type="url"
                                      placeholder="Enter image URL"
                                      {...field}
                                      value={field.value || ""}
                                      className="flex-1 text-sm"
                                      disabled={updateMutation.isPending}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handleUrlSubmit}
                                      size="sm"
                                      disabled={!field.value || updateMutation.isPending}
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Enter a direct link to your profile photo
                                  </p>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
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