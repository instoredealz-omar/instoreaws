import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Building2, Users } from "lucide-react";

interface ContactSalesDialogProps {
  children: React.ReactNode;
}

export function ContactSalesDialog({ children }: ContactSalesDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    businessType: "",
    estimatedRevenue: "",
    inquiry: "",
    message: ""
  });

  const businessTypes = [
    "Restaurant & Food Service",
    "Retail & Fashion",
    "Beauty & Wellness",
    "Electronics & Technology",
    "Fitness & Sports",
    "Entertainment & Events",
    "Professional Services",
    "Healthcare",
    "Other"
  ];

  const revenueRanges = [
    "Under ₹10 Lakhs",
    "₹10 - 50 Lakhs",
    "₹50 Lakhs - 2 Crores",
    "₹2 - 10 Crores",
    "Above ₹10 Crores"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a sales inquiry using the dedicated endpoint (no auth required)
      const salesInquiry = {
        businessName: formData.businessName,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        businessType: formData.businessType,
        estimatedRevenue: formData.estimatedRevenue,
        inquiry: formData.inquiry,
        message: formData.message
      };

      const response = await fetch('/api/sales/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(salesInquiry)
      });

      if (response.ok) {
        toast({
          title: "Sales Inquiry Submitted",
          description: "Our sales team will contact you within 24 hours. We'll reach out via email or phone.",
        });
        
        // Reset form
        setFormData({
          businessName: "",
          contactName: "",
          email: "",
          phone: "",
          businessType: "",
          estimatedRevenue: "",
          inquiry: "",
          message: ""
        });
        
        setIsOpen(false);
      } else {
        throw new Error('Failed to submit inquiry');
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact us directly at sales@instoredealz.com",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Contact Our Sales Team</DialogTitle>
          <p className="text-muted-foreground">
            Tell us about your business and we'll help you get started with our vendor program.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  placeholder="Your business name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Select value={formData.businessType} onValueChange={(value) => setFormData({...formData, businessType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="estimatedRevenue">Estimated Annual Revenue</Label>
              <Select value={formData.estimatedRevenue} onValueChange={(value) => setFormData({...formData, estimatedRevenue: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select revenue range" />
                </SelectTrigger>
                <SelectContent>
                  {revenueRanges.map((range) => (
                    <SelectItem key={range} value={range}>{range}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Contact Person *</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91-XXXXXXXXXX"
                  type="tel"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="your@email.com"
                type="email"
                required
              />
            </div>
          </div>

          {/* Inquiry Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">How Can We Help?</h3>
            
            <div>
              <Label htmlFor="inquiry">Type of Inquiry</Label>
              <Select value={formData.inquiry} onValueChange={(value) => setFormData({...formData, inquiry: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select inquiry type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor-onboarding">Vendor Onboarding</SelectItem>
                  <SelectItem value="custom-solutions">Custom Solutions</SelectItem>
                  <SelectItem value="enterprise-pricing">Enterprise Pricing</SelectItem>
                  <SelectItem value="marketing-support">Marketing Support</SelectItem>
                  <SelectItem value="technical-integration">Technical Integration</SelectItem>
                  <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Tell us about your needs</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Describe your business goals, current challenges, or specific questions..."
                rows={4}
              />
            </div>
          </div>

          {/* Sales Team Benefits */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">What to Expect:</h4>
            <div className="space-y-2 text-sm text-green-700 dark:text-green-400">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span>Sales call within 24 hours</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span>Personalized onboarding plan</span>
              </div>
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                <span>Custom pricing for your business size</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <span>Dedicated account manager</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.businessName || !formData.contactName || !formData.email}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Contact Sales Team"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}