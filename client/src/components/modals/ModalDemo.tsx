import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { 
  NonBlockingDialog, 
  NonBlockingDialogContent, 
  NonBlockingDialogDescription, 
  NonBlockingDialogHeader, 
  NonBlockingDialogTitle, 
  NonBlockingDialogTrigger 
} from '@/components/ui/non-blocking-dialog';

export function ModalDemo() {
  const [counter, setCounter] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNonBlockingDialogOpen, setIsNonBlockingDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Modal Background Interaction Demo</CardTitle>
          <CardDescription>
            Test the difference between blocking and non-blocking modals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Background Interaction Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Background Interaction Test</h3>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setCounter(counter + 1)}
              >
                Counter: {counter}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCounter(0)}
              >
                Reset
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Try clicking these buttons when different modals are open
            </p>
          </div>

          {/* Regular Blocking Dialog */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Regular Blocking Dialog</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Open Blocking Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Blocking Dialog</DialogTitle>
                  <DialogDescription>
                    This dialog blocks background interaction. Try clicking the counter button - it won't work.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p>Background is blocked from interaction.</p>
                </div>
              </DialogContent>
            </Dialog>
            <p className="text-sm text-muted-foreground">
              When open, this dialog prevents background interaction and scrolling
            </p>
          </div>

          {/* Non-blocking Dialog */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Non-blocking Dialog</h3>
            <NonBlockingDialog open={isNonBlockingDialogOpen} onOpenChange={setIsNonBlockingDialogOpen}>
              <NonBlockingDialogTrigger asChild>
                <Button variant="secondary">Open Non-blocking Dialog</Button>
              </NonBlockingDialogTrigger>
              <NonBlockingDialogContent>
                <NonBlockingDialogHeader>
                  <NonBlockingDialogTitle>Non-blocking Dialog</NonBlockingDialogTitle>
                  <NonBlockingDialogDescription>
                    This dialog allows background interaction. Try clicking the counter button - it will work!
                  </NonBlockingDialogDescription>
                </NonBlockingDialogHeader>
                <div className="py-4">
                  <p>Background remains interactive.</p>
                </div>
              </NonBlockingDialogContent>
            </NonBlockingDialog>
            <p className="text-sm text-muted-foreground">
              When open, this dialog allows background interaction and scrolling
            </p>
          </div>

          {/* Regular Dialog with allowBackgroundInteraction prop */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dialog with allowBackgroundInteraction Prop</h3>
            <Dialog allowBackgroundInteraction={true}>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog (Background Allowed)</Button>
              </DialogTrigger>
              <DialogContent allowBackgroundInteraction={true}>
                <DialogHeader>
                  <DialogTitle>Dialog with Background Interaction</DialogTitle>
                  <DialogDescription>
                    This regular dialog has allowBackgroundInteraction=true. Background should be interactive.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p>Background interaction is enabled via prop.</p>
                </div>
              </DialogContent>
            </Dialog>
            <p className="text-sm text-muted-foreground">
              Regular dialog component with the allowBackgroundInteraction prop set to true
            </p>
          </div>

          {/* Alert Dialog Examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Alert Dialog Examples</h3>
            <div className="flex space-x-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Blocking Alert</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Blocking Alert Dialog</AlertDialogTitle>
                    <AlertDialogDescription>
                      This alert dialog blocks background interaction.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog allowBackgroundInteraction={true}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">Non-blocking Alert</Button>
                </AlertDialogTrigger>
                <AlertDialogContent allowBackgroundInteraction={true}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Non-blocking Alert Dialog</AlertDialogTitle>
                    <AlertDialogDescription>
                      This alert dialog allows background interaction.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">How to Test</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Open a blocking dialog/alert and try clicking the counter button - it won't work</li>
              <li>Open a non-blocking dialog/alert and try clicking the counter button - it will work</li>
              <li>Notice the different overlay opacity (blocking: darker, non-blocking: lighter)</li>
              <li>Try scrolling the page when different modals are open</li>
            </ol>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}