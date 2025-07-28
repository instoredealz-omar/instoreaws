import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Rocket, Play, ExternalLink, X } from 'lucide-react';

interface PromotionalLaunchBannerProps {
  variant?: 'hero' | 'compact' | 'video';
  className?: string;
  showVideo?: boolean;
}

export function PromotionalLaunchBanner({ 
  variant = 'hero', 
  className = '',
  showVideo = true 
}: PromotionalLaunchBannerProps) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleWatchVideo = () => {
    setIsVideoModalOpen(true);
  };

  const handleVisitWebsite = () => {
    window.open('https://instoredealz.com', '_blank');
  };

  if (variant === 'compact') {
    return (
      <>
        <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white shadow-lg ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Rocket className="h-5 w-5 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm">🚀 Instoredealz Launching Soon!</h3>
                <p className="text-xs opacity-90">Revolutionary deal discovery platform</p>
              </div>
            </div>
            {showVideo && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleWatchVideo}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 animate-pulse"
              >
                <Play className="h-3 w-3 mr-1" />
                Watch Demo
              </Button>
            )}
          </div>
        </div>

        {/* Video Modal */}
        {showVideo && (
          <VideoModal 
            isOpen={isVideoModalOpen}
            onClose={() => setIsVideoModalOpen(false)}
            onVisitWebsite={handleVisitWebsite}
          />
        )}
      </>
    );
  }

  if (variant === 'video') {
    return (
      <>
        <div className={`bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 text-white shadow-2xl ${className}`}>
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <Badge className="bg-white/20 text-white border-white/30 mb-4">
                Coming Soon
              </Badge>
              <h2 className="text-3xl font-bold flex items-center justify-center">
                <Rocket className="h-8 w-8 mr-3 animate-bounce" />
                🚀 Instoredealz Launching Soon!
              </h2>
              <p className="text-xl opacity-90">
                The future of deal discovery is almost here
              </p>
            </div>

            <div className="bg-black/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Play className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Watch Our Launch Demo</h3>
              <p className="text-sm opacity-80 mb-4">
                See how Instoredealz will revolutionize the way you discover and claim deals
              </p>
              <Button 
                onClick={handleWatchVideo}
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6 py-2 animate-pulse"
              >
                <Play className="h-4 w-4 mr-2" />
                Watch Launch Video
              </Button>
            </div>
          </div>
        </div>

        {/* Video Modal */}
        <VideoModal 
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          onVisitWebsite={handleVisitWebsite}
        />
      </>
    );
  }

  // Hero variant (default)
  return (
    <>
      <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl ${className}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Rocket className="h-8 w-8 animate-bounce" />
              <Badge className="bg-white/20 text-white border-white/30">
                Coming Soon
              </Badge>
            </div>
            <h2 className="text-3xl font-bold">
              🚀 Instoredealz Launching Soon!
            </h2>
            <p className="text-lg opacity-90 max-w-md">
              Revolutionary deal discovery platform connecting you with amazing local offers through advanced technology
            </p>
          </div>
          
          {showVideo && (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
                <Play className="h-8 w-8 text-white" />
              </div>
              <Button 
                onClick={handleWatchVideo}
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6 py-3 animate-pulse"
              >
                <Play className="h-4 w-4 mr-2" />
                Watch Launch Demo
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <VideoModal 
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          onVisitWebsite={handleVisitWebsite}
        />
      )}
    </>
  );
}

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVisitWebsite: () => void;
}

function VideoModal({ isOpen, onClose, onVisitWebsite }: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-foreground">
                🚀 Instoredealz Launch Demo
              </DialogTitle>
              <p className="text-muted-foreground">
                See how our platform will revolutionize deal discovery
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Video Container */}
        <div className="relative bg-black">
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1"
              title="Instoredealz Launch Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Ready to Experience Instoredealz?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Join thousands of early adopters who are already transforming their deal discovery experience
            </p>
            <div className="flex justify-center space-x-3">
              <Button onClick={onVisitWebsite} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Website
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PromotionalLaunchBanner;