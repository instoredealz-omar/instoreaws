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
  Loader2,
  Camera,
  Image,
  User,
  Phone,
  Mail,
  Lock,
  Tag
} from "lucide-react";
import { TermsDialog } from "@/components/ui/terms-dialog";

// Company types
const companyTypes = [
  { id: "proprietorship", name: "Proprietorship" },
  { id: "public_limited", name: "Public Limited" },
  { id: "private_limited", name: "Private Limited" },
  { id: "partnership", name: "Partnership" },
  { id: "llp", name: "LLP (Limited Liability Partnership)" },
];

const vendorRegistrationSchema = z.object({
  businessName: z.string().min(2, "Business/Store name must be at least 2 characters"),
  companyType: z.string().min(1, "Please select a company type"),
  contactPersonName: z.string().min(2, "Contact person name must be at least 2 characters"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
  emailAddress: z.string().email("Please enter a valid email address"),
  companyWebsite: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  address: z.string().min(5, "Business/Store address must be at least 5 characters"),
  state: z.string().min(1, "Please select a state"),
  city: z.string().min(1, "Please select a city"),
  pincode: z.string().min(6, "Pin code must be 6 digits").max(6, "Pin code must be 6 digits"),
  hasGst: z.enum(["yes", "no"]),
  gstNumber: z.string().optional(),
  panNumber: z.string().min(10, "PAN number must be 10 characters").max(10, "PAN number must be 10 characters"),
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

export default function VendorRegisterEnhanced() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [panCardFile, setPanCardFile] = useState<File | null>(null);

  const form = useForm<VendorRegistrationForm>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      businessName: "",
      companyType: "",
      contactPersonName: "",
      mobileNumber: "",
      contactNumber: "",
      emailAddress: "",
      companyWebsite: "",
      address: "",
      state: "",
      city: "",
      pincode: "",
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
        // Map new fields to existing backend fields for compatibility
        ownerName: data.contactPersonName,
        email: data.emailAddress,
      };
      return apiRequest('/api/vendors/register', 'POST', payload);
    },
    onSuccess: () => {
      toast({
        title: "Vendor registration submitted!",
        description: "Your application is under review. You'll be notified once approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/me"] });
      navigate("/vendor/dashboard");
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

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // In a real app, you would upload this to a storage service
      // For now, we'll create a placeholder URL
      const placeholderUrl = `https://via.placeholder.com/200x120/007bff/ffffff?text=${encodeURIComponent(form.getValues('businessName') || 'Logo')}`;
      form.setValue('logoUrl', placeholderUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <p className="text-sm text-muted-foreground">Quick registration process with comprehensive business details</p>
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

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <FileText className="h-6 w-6 mr-2" />
              Complete Business Registration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Business Information Section */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Business Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business / Store Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your business or store name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select company type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companyTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-6">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business / Store Address *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter complete business address with landmark"
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mt-6">
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

                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pin Code *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter 6-digit pin code"
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
                          <FormLabel>Company Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.yourcompany.com (Optional)" {...field} />
                          </FormControl>
                          <FormDescription>
                            Optional: Enter your company website URL
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Person Information Section */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Contact Person Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="contactPersonName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact person's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter mobile number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter landline/alternate number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emailAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email address" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Tax Information Section */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Tax Information
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="hasGst"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>GST Registration *</FormLabel>
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

                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    {hasGst === "yes" && (
                      <FormField
                        control={form.control}
                        name="gstNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST Number *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter GST number (e.g., 27AABCU9603R1ZX)"
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
                              placeholder="Enter PAN number (e.g., AABCU9603R)"
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
                  </div>

                  {/* PAN Card Upload */}
                  <div className="mt-6">
                    <FormField
                      control={form.control}
                      name="panCardFile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Upload PAN Card *</FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                              <div className="text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-4">
                                  <Label
                                    htmlFor="pan-upload"
                                    className="cursor-pointer rounded-md bg-card font-medium text-primary hover:text-primary/80"
                                  >
                                    <span>Upload PAN Card</span>
                                    <Input
                                      id="pan-upload"
                                      type="file"
                                      accept="image/*,.pdf"
                                      className="sr-only"
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
                                          setPanCardFile(file);
                                          field.onChange(file);
                                        }
                                      }}
                                    />
                                  </Label>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 1MB</p>
                                {panCardFile && (
                                  <div className="mt-2 text-sm text-green-600">
                                    Selected: {panCardFile.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>



                {/* Business Logo Upload Section */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <Image className="h-5 w-5 mr-2" />
                    Business Logo (Optional)
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> business logo
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x400px)</p>
                        </div>
                        <input 
                          id="logo-upload" 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                      </label>
                    </div>
                    
                    {logoFile && (
                      <div className="text-sm text-green-600">
                        Logo uploaded: {logoFile.name}
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <Button type="button" variant="outline" size="sm" className="flex items-center">
                        <Image className="h-4 w-4 mr-2" />
                        Upload from Gallery
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="flex items-center">
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="border rounded-lg p-6">
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
                            {" "}*
                          </FormLabel>
                          <FormDescription>
                            By checking this box, you agree to our terms of service and privacy policy.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormMessage />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Registration for Approval
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Requirements Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <AlertCircle className="h-5 w-5 mr-2 text-warning" />
              Required Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-2">Business Documents:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Valid PAN Card number</li>
                  <li>• GST Certificate (if applicable)</li>
                  <li>• Business registration proof</li>
                  <li>• Address verification</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Contact Information:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Active business phone number</li>
                  <li>• Valid email address</li>
                  <li>• Complete business address</li>
                  <li>• Owner identification details</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}