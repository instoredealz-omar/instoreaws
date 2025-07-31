import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { indianStates, getCitiesByState } from "@/lib/cities";
import { 
  Building, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  FileText,
  CreditCard,
  MapPin,
  Loader2
} from "lucide-react";
import { TermsDialog } from "@/components/ui/terms-dialog";

const vendorRegistrationSchema = z.object({
  businessName: z.string().min(2, "Business/Store name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner full name must be at least 2 characters"),
  contactNumber: z.string().regex(/^[0-9]{10}$/, "Contact number must be exactly 10 digits"),
  address: z.string().min(5, "Business/Store address must be at least 5 characters"),
  email: z.string().email("Please enter a valid email address"),
  category: z.string().min(1, "Please select a category"),
  state: z.string().min(1, "Please select a state"),
  city: z.string().min(1, "Please select a city"),
  pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits"),
  companyWebsite: z.string().optional(),
  hasGst: z.enum(["yes", "no"]),
  gstNumber: z.string().optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "PAN number must be in format ABCDE1234F"),
  panCardFile: z.any().optional(),
  logoUrl: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions"),
}).refine((data) => {
  if (data.hasGst === "yes" && !data.gstNumber) {
    return false;
  }
  return true;
}, {
  message: "GST number is required when GST registration is selected",
  path: ["gstNumber"],
});

type VendorRegistrationForm = z.infer<typeof vendorRegistrationSchema>;

export default function VendorRegister() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<VendorRegistrationForm>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      businessName: "",
      ownerName: "",
      contactNumber: "",
      address: "",
      email: "",
      category: "",
      state: "",
      city: "",
      pincode: "",
      companyWebsite: "",
      hasGst: "no",
      gstNumber: "",
      panNumber: "",
      panCardFile: null,
      logoUrl: "",
      agreeToTerms: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: VendorRegistrationForm) => {
      const payload = {
        ...data,
        gstNumber: data.hasGst === "yes" ? data.gstNumber : null,
      };
      return apiRequest('/api/vendors/register', 'POST', payload);
    },
    onSuccess: () => {
      toast({
        title: "Vendor registration submitted!",
        description: "Your application is under review. You'll be notified once approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/me"] });
      setLocation("/vendor/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VendorRegistrationForm) => {
    registerMutation.mutate(data);
  };

  const selectedState = form.watch("state");
  const hasGst = form.watch("hasGst");
  const availableCities = selectedState ? getCitiesByState(selectedState) : [];

  // Sample vendor logos for inspiration
  const sampleLogos = [
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200&h=120&fit=crop",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=120&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=120&fit=crop"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Become a Vendor Partner
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join our growing network of businesses and start offering exclusive deals to thousands of customers across India.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Grow Your Business</h3>
              <p className="text-sm text-muted-foreground">Reach new customers and increase your sales with our platform</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Easy Setup</h3>
              <p className="text-sm text-muted-foreground">Quick registration process with minimal documentation required</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-6 w-6 text-warning" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No Hidden Fees</h3>
              <p className="text-sm text-muted-foreground">Transparent pricing with no setup or monthly fees</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Business Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your business and what you offer"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Help customers understand what makes your business special
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your complete business address"
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <FormLabel>City *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={!selectedState}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select city" />
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

                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter 6-digit pincode"
                            maxLength={6}
                            {...field} 
                          />
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
                        <FormLabel>Company Website (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://www.yourcompany.com"
                            type="url"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Your business website URL
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hasGst"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>GST Registration</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="gst-yes" />
                              <Label htmlFor="gst-yes">Yes, I have GST</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="gst-no" />
                              <Label htmlFor="gst-no">No GST</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {hasGst === "yes" && (
                    <FormField
                      control={form.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your GST number (e.g., 27AABCU9603R1ZX)"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            15-digit GST identification number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your PAN number (e.g., AABCU9603R)"
                            maxLength={10}
                            {...field}
                            onChange={(e) => {
                              // Convert to uppercase
                              const upperValue = e.target.value.toUpperCase();
                              field.onChange(upperValue);
                            }}
                            style={{ textTransform: 'uppercase' }}
                          />
                        </FormControl>
                        <FormDescription>
                          10-character PAN card number (automatically capitalized)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="panCardFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upload PAN Card *</FormLabel>
                        <FormControl>
                          <Input 
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 1024 * 1024) { // 1MB limit
                                  toast({
                                    title: "File too large",
                                    description: "PAN card file must be less than 1MB",
                                    variant: "destructive",
                                  });
                                  e.target.value = '';
                                  return;
                                }
                                field.onChange(file);
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Upload clear image of PAN card (JPG, PNG, PDF - Max 1MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Logo URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter logo image URL (optional)"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a URL to your business logo image (Max 250x150 pixels)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to the{" "}
                            <TermsDialog>
                              <Button variant="link" type="button" className="p-0 h-auto underline">
                                terms and conditions
                              </Button>
                            </TermsDialog>
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Registration
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <AlertCircle className="h-5 w-5 mr-2 text-warning" />
                  Required Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">PAN Card</p>
                    <p className="text-sm text-muted-foreground">Valid PAN number for tax purposes</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Business Address</p>
                    <p className="text-sm text-muted-foreground">Valid business address for verification</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-gray-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">GST Certificate</p>
                    <p className="text-sm text-muted-foreground">Optional but recommended for better visibility</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sample Logos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Upload className="h-5 w-5 mr-2 text-primary" />
                  Featured Vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {sampleLogos.map((logoUrl, index) => (
                    <img 
                      key={index}
                      src={logoUrl} 
                      alt={`Sample vendor ${index + 1}`}
                      className="w-full h-16 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Join these successful businesses already partnering with us
                </p>
              </CardContent>
            </Card>

            {/* What's Next */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="h-5 w-5 mr-2 text-royal" />
                  What Happens Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                  <p className="text-sm text-gray-700">We review your application (1-2 business days)</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                  <p className="text-sm text-gray-700">You receive approval notification via email</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                  <p className="text-sm text-gray-700">Start creating and managing your deals</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
