import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { generateCustomerClaimQR } from "@/lib/qr-code";
import QRScanner from "@/components/ui/qr-scanner";
import {
  QrCode,
  Scan,
  TestTube,
  CheckCircle,
  User,
  Camera
} from "lucide-react";

export default function QRTest() {
  const [generatedQR, setGeneratedQR] = useState<string>("");
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateTestQR = async () => {
    setIsGenerating(true);
    try {
      const testCustomerData = {
        userId: 4,
        userName: "Test Customer",
        email: "demo@demo.com",
        membershipPlan: "premium",
        membershipId: "ISD-00000004",
        totalSavings: "1250"
      };

      const qrDataUrl = await generateCustomerClaimQR(testCustomerData);
      setGeneratedQR(qrDataUrl);
      
      toast({
        title: "QR Code Generated",
        description: "Test QR code is ready for scanning",
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "QR Generation Failed",
        description: "Failed to generate test QR code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScanSuccess = (data: any) => {
    setScannedData(data);
    setShowScanner(false);
    toast({
      title: "Scan Successful!",
      description: `Found customer: ${data.userName}`,
    });
  };

  const handleScanError = (error: string) => {
    toast({
      title: "Scan Failed",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <TestTube className="h-8 w-8" />
              QR Code Test Environment
            </h1>
            <p className="text-muted-foreground">Test QR code generation and mobile camera scanning</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* QR Generation Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    Generate Test QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Generate a test QR code with sample customer data to test mobile camera scanning.
                  </p>
                  
                  <Button 
                    onClick={generateTestQR} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate Test QR Code
                      </>
                    )}
                  </Button>

                  {generatedQR && (
                    <div className="text-center space-y-4">
                      <Separator />
                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                        <img
                          src={generatedQR}
                          alt="Test QR Code"
                          className="w-64 h-64 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        📱 Try scanning this QR code with your mobile camera using the scanner below
                      </p>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Test Customer - Premium Member
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* QR Scanning Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scan className="h-5 w-5 mr-2" />
                    Mobile Camera Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showScanner ? (
                    <div className="text-center space-y-4">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-muted-foreground mb-4">
                          Test your mobile camera QR scanning
                        </p>
                        <Button onClick={() => setShowScanner(true)}>
                          <Scan className="h-4 w-4 mr-2" />
                          Open QR Scanner
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <QRScanner
                      onScanSuccess={handleScanSuccess}
                      onScanError={handleScanError}
                      onClose={() => setShowScanner(false)}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Scan Results */}
              {scannedData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-700">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Scan Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>
                          <p className="text-gray-900 dark:text-gray-100">{scannedData.userName}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">User ID:</span>
                          <p className="text-gray-900 dark:text-gray-100">{scannedData.userId}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span>
                          <p className="text-gray-900 dark:text-gray-100 text-xs">{scannedData.email}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Membership:</span>
                          <Badge variant="secondary" className="capitalize">
                            {scannedData.membershipPlan}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Member ID:</span>
                          <p className="text-gray-900 dark:text-gray-100">{scannedData.membershipId}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Total Savings:</span>
                          <p className="text-gray-900 dark:text-gray-100">₹{scannedData.totalSavings}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-gray-600 dark:text-gray-400">QR Type:</span>
                          <p className="text-gray-900 dark:text-gray-100">{scannedData.type}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => setScannedData(null)}
                      variant="outline"
                      size="sm"
                    >
                      Clear Results
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Step 1: Generate QR Code</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Click "Generate Test QR Code" to create a sample QR code</li>
                    <li>The QR code contains test customer data</li>
                    <li>You can see the QR code displayed on screen</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Step 2: Test Mobile Scanning</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Click "Open QR Scanner" to start the camera</li>
                    <li>Allow camera access when prompted by your browser</li>
                    <li>Point your camera at the generated QR code</li>
                    <li>The scanner should automatically detect and process the QR code</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> If camera scanning doesn't work, try the "Manual" tab in the scanner and use the "Test" button to populate sample data.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}