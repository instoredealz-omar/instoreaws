import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Rocket, Play, ExternalLink, X } from 'lucide-react';

// ===== VIDEO CONFIGURATION =====
// You can easily change your video URL here without modifying the database
// Supported platforms: YouTube, Vimeo, Google Drive, or any platform with iframe embedding
// 
// Examples:
// YouTube: https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1&rel=0&modestbranding=1
// Vimeo: https://player.vimeo.com/video/YOUR_VIDEO_ID?autoplay=1
// Google Drive: https://drive.google.com/file/d/YOUR_FILE_ID/preview
// 
const DEFAULT_VIDEO_CONFIG = {
  url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1',
  title: 'Instoredealz Launch Demo'
};
// ===== END CONFIGURATION =====

interface PromotionalLaunchBannerProps {
  variant?: 'hero' | 'compact' | 'video';
  className?: string;
  showVideo?: boolean;
  videoUrl?: string;
  videoTitle?: string;
  title?: string;
  description?: string;
  socialMediaLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
    whatsapp?: string;
  };
}

export function PromotionalLaunchBanner({ 
  variant = 'hero', 
  className = '',
  showVideo = true,
  videoUrl = DEFAULT_VIDEO_CONFIG.url,
  videoTitle = DEFAULT_VIDEO_CONFIG.title,
  title = "🚀 Instoredealz Launching Soon!",
  description = "Revolutionary deal discovery platform",
  socialMediaLinks = {}
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
      <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg banner-responsive text-white shadow-lg ${className}`}>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 text-center sm:text-left">
              <Rocket className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
              <div>
                <h3 className="responsive-text font-bold">{title}</h3>
                <p className="text-xs sm:text-sm opacity-90">{description}</p>
              </div>
            </div>
            {showVideo && !videoUrl && (
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
          
          {/* Embedded Video for Compact */}
          {showVideo && videoUrl && (
            <div className="bg-black/20 rounded-lg overflow-hidden">
              <div className="aspect-video w-full">
                <iframe
                  src={videoUrl}
                  title={videoTitle}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'video') {
    return (
      <div className={`bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-2xl banner-responsive text-white shadow-2xl ${className}`}>
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center space-y-2">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              Coming Soon
            </Badge>
            <h2 className="responsive-heading font-bold flex flex-col sm:flex-row items-center justify-center">
              <Rocket className="h-6 w-6 sm:h-8 sm:w-8 mr-0 sm:mr-3 mb-2 sm:mb-0 animate-bounce" />
              {title}
            </h2>
            <p className="responsive-text opacity-90">
              {description}
            </p>
          </div>

          {/* Embedded Video */}
          {showVideo && videoUrl && (
            <div className="bg-black/20 rounded-xl overflow-hidden backdrop-blur-sm">
              <div className="aspect-video w-full">
                <iframe
                  src={videoUrl}
                  title={videoTitle}
                  className="w-full h-full rounded-lg"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold mb-2">{videoTitle}</h3>
                <p className="text-sm opacity-80 mb-4">
                  See how Instoredealz will revolutionize the way you discover and claim deals
                </p>
                <Button 
                  onClick={handleVisitWebsite}
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6 py-2"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Website
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Hero variant (default)
  return (
    <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl banner-responsive text-white shadow-xl ${className}`}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="space-y-3 text-center lg:text-left lg:flex-1">
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-2 sm:space-y-0 sm:space-x-3">
              <Rocket className="h-6 w-6 sm:h-8 sm:w-8 animate-bounce" />
              <Badge className="bg-white/20 text-white border-white/30">
                Coming Soon
              </Badge>
            </div>
            <h2 className="responsive-heading font-bold">
              {title}
            </h2>
            <p className="responsive-text opacity-90 max-w-md">
              {description}
            </p>
          </div>
          
          {showVideo && !videoUrl && (
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

        {/* Embedded Video for Hero */}
        {showVideo && videoUrl && (
          <div className="bg-black/20 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="aspect-video w-full">
              <iframe
                src={videoUrl}
                title={videoTitle}
                className="w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 text-center">
              <h3 className="text-lg font-semibold mb-2">{videoTitle}</h3>
              <Button 
                onClick={handleVisitWebsite}
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6 py-2"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Website
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVisitWebsite: () => void;
  videoUrl: string;
  videoTitle: string;
}

function VideoModal({ isOpen, onClose, onVisitWebsite, videoUrl, videoTitle }: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="responsive-modal p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-foreground">
                🚀 {videoTitle}
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
              src={videoUrl}
              title={videoTitle}
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