import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Store, 
  Clock, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';

interface VendorRegistrationStatusProps {
  showTitle?: boolean;
  className?: string;
}

export default function VendorRegistrationStatus({ 
  showTitle = true, 
  className = "" 
}: VendorRegistrationStatusProps) {
  const { user } = useAuth();

  const { data: vendor } = useQuery({
    queryKey: ["/api/vendors/me"],
    enabled: !!user && user.role === 'vendor',
  });

  if (!user || user.role !== 'vendor') return null;

  const isApproved = vendor?.isApproved;

  // No vendor profile exists - show registration prompt
  if (!vendor) {
    return (
      <Card className={`border-primary bg-primary/5 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Store className="h-6 w-6 text-primary" />
              <div>
                {showTitle && (
                  <h3 className="font-semibold text-foreground">Complete Your Registration</h3>
                )}
                <p className="text-muted-foreground">
                  Register your business to start offering deals to customers
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to="/vendor/register">
                Register Now
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vendor exists but pending approval
  if (vendor && isApproved === false) {
    return (
      <Card className={`border-warning bg-warning/5 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-warning" />
              <div>
                {showTitle && (
                  <h3 className="font-semibold text-foreground">Account Under Review</h3>
                )}
                <p className="text-muted-foreground">
                  Your vendor account is currently being reviewed. You'll be able to create deals once approved.
                </p>
              </div>
            </div>
            <AlertCircle className="h-8 w-8 text-warning" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vendor approved - show success message (optional, can be hidden in some contexts)
  if (vendor && isApproved === true && showTitle) {
    return (
      <Card className={`border-success bg-success/5 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <h3 className="font-semibold text-foreground">Account Approved!</h3>
              <p className="text-muted-foreground">
                Welcome to Instoredealz! Your vendor account is active and you can now create deals.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't render anything for approved vendors when showTitle is false
  return null;
}