import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Clock, 
  Shield, 
  Copy,
  CheckCircle
} from "lucide-react";

interface RotatingPinDisplayProps {
  dealId: number;
  dealTitle: string;
  dealImage?: string;
  dealDescription?: string;
}

export default function RotatingPinDisplay({ dealId, dealTitle, dealImage, dealDescription }: RotatingPinDisplayProps) {
  const [showPin, setShowPin] = useState(true); // Show PIN by default for vendors
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Fetch current rotating PIN
  const { data: pinData, isLoading, error, refetch } = useQuery({
    queryKey: ['rotatingPin', dealId],
    queryFn: async () => {
      const response = await apiRequest(`/api/vendors/deals/${dealId}/current-pin`, 'GET');
      const data = await response.json();
      console.log('Rotating PIN API Response:', data); // Debug log
      console.log('Current PIN:', data?.currentPin);
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!dealId
  });

  // Calculate time remaining until next rotation
  useEffect(() => {
    if (!pinData?.nextRotationAt) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const nextRotation = new Date(pinData.nextRotationAt);
      const diff = nextRotation.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Rotating now...");
        refetch(); // Refresh to get new PIN
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [pinData?.nextRotationAt, refetch]);

  const handleCopyPin = async () => {
    if (!pinData?.currentPin) return;

    try {
      await navigator.clipboard.writeText(pinData.currentPin);
      setCopied(true);
      toast({
        title: "PIN Copied!",
        description: "The current PIN has been copied to your clipboard.",
        duration: 2000
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy PIN to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "PIN information has been updated.",
      duration: 2000
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current PIN
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading current PIN...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current PIN
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Failed to load PIN information</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Current PIN
          <Badge variant="secondary" className="ml-auto">
            Auto-Rotating
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Deal Information Section */}
        {(dealImage || dealDescription) && (
          <div className="flex items-start gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            {dealImage && (
              <div className="flex-shrink-0">
                <img 
                  src={dealImage} 
                  alt={dealTitle}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 truncate">
                {dealTitle}
              </h4>
              {dealDescription && (
                <p className="text-xs text-blue-700 dark:text-blue-200 mt-1 line-clamp-2">
                  {dealDescription}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Next rotation in:</span>
          </div>
          <Badge variant="outline" className="font-mono">
            {timeLeft}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Current PIN:</span>
            <div className="font-mono text-xl font-bold tracking-wider">
              {showPin ? (pinData?.currentPin || "Loading...") : "••••"}
            </div>
            {/* Debug info - remove in production */}
            <div className="text-xs text-gray-500 ml-2">
              {pinData ? `(${showPin ? 'visible' : 'hidden'})` : '(no data)'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPin(!showPin)}
              title={showPin ? "Hide PIN" : "Show PIN"}
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPin}
              title="Copy PIN"
              disabled={!pinData?.currentPin}
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Rotates every {pinData?.rotationInterval || 10} minutes
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>How it works:</strong> This PIN automatically changes every 10 minutes for enhanced security. 
            Share the current PIN with customers when they visit your store to claim their deals.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}