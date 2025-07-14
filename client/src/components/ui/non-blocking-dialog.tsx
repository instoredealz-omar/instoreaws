"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useNonBlockingModal } from "@/hooks/use-non-blocking-modal"

// Non-blocking Dialog that allows background interaction
const NonBlockingDialog = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>
>(({ open, onOpenChange, ...props }, ref) => {
  // Use non-blocking modal hook instead of modal lock
  useNonBlockingModal(open || false);
  
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      {...props}
    />
  );
});
NonBlockingDialog.displayName = "NonBlockingDialog";

const NonBlockingDialogTrigger = DialogPrimitive.Trigger

const NonBlockingDialogPortal = DialogPrimitive.Portal

const NonBlockingDialogClose = DialogPrimitive.Close

// Non-blocking overlay that allows clicks to pass through
const NonBlockingDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 pointer-events-none",
      className
    )}
    {...props}
  />
))
NonBlockingDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const NonBlockingDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <NonBlockingDialogPortal>
    <NonBlockingDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[60] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg pointer-events-auto",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </NonBlockingDialogPortal>
))
NonBlockingDialogContent.displayName = DialogPrimitive.Content.displayName

const NonBlockingDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
NonBlockingDialogHeader.displayName = "NonBlockingDialogHeader"

const NonBlockingDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
NonBlockingDialogFooter.displayName = "NonBlockingDialogFooter"

const NonBlockingDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
NonBlockingDialogTitle.displayName = DialogPrimitive.Title.displayName

const NonBlockingDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
NonBlockingDialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  NonBlockingDialog,
  NonBlockingDialogPortal,
  NonBlockingDialogOverlay,
  NonBlockingDialogClose,
  NonBlockingDialogTrigger,
  NonBlockingDialogContent,
  NonBlockingDialogHeader,
  NonBlockingDialogFooter,
  NonBlockingDialogTitle,
  NonBlockingDialogDescription,
}