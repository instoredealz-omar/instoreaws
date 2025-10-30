import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield } from "lucide-react";

interface ClaimDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealTitle: string;
  discountPercentage: number;
  onSubmit: (billAmount: number, pin: string) => void;
  isLoading?: boolean;
}

export function ClaimDealDialog({
  open,
  onOpenChange,
  dealTitle,
  discountPercentage,
  onSubmit,
  isLoading = false,
}: ClaimDealDialogProps) {
  const [billAmount, setBillAmount] = useState("");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = () => {
    setError("");

    const amount = parseFloat(billAmount);
    if (!billAmount || isNaN(amount) || amount <= 0) {
      setError("Please enter a valid bill amount");
      return;
    }

    const fullPin = pin.join("");
    if (fullPin.length !== 6) {
      setError("Please enter the complete 6-digit PIN");
      return;
    }

    onSubmit(amount, fullPin);
  };

  const handleClose = () => {
    if (!isLoading) {
      setBillAmount("");
      setPin(["", "", "", "", "", ""]);
      setError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            {dealTitle}
          </DialogTitle>
          <DialogDescription>
            <span className="text-green-600 font-semibold">
              {discountPercentage}% OFF
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Bill Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="billAmount" className="text-base font-semibold">
              Total billed amount
            </Label>
            <p className="text-sm text-muted-foreground">
              Enter your total bill amount before discount.
            </p>
            <Input
              id="billAmount"
              type="number"
              placeholder="₹ 0.00"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              className="text-lg"
              disabled={isLoading}
              data-testid="input-bill-amount"
            />
            {billAmount && parseFloat(billAmount) > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <span className="font-semibold">Your Savings: </span>
                  ₹{(parseFloat(billAmount) * discountPercentage / 100).toFixed(2)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  You'll pay ₹{(parseFloat(billAmount) * (100 - discountPercentage) / 100).toFixed(2)} after discount
                </p>
              </div>
            )}
          </div>

          {/* PIN Input */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Enter 6 digits Pin</Label>
            <p className="text-sm text-muted-foreground">
              Please ask the merchant to enter the 6 digit pin.
            </p>
            <div className="flex gap-2 justify-center">
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  id={`pin-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  className="w-14 h-14 text-center text-2xl font-bold"
                  disabled={isLoading}
                  data-testid={`input-pin-${index}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-900/20 rounded-lg py-2">
              {error}
            </div>
          )}

          {/* Proceed Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-base"
            data-testid="button-proceed-claim"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Proceed"
            )}
          </Button>

          {/* Terms Link */}
          <div className="text-center">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
              data-testid="link-terms"
            >
              Terms and Conditions
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
