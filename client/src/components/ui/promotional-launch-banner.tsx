import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Rocket, Play, ExternalLink, X } from 'lucide-react';

interface PromotionalLaunchBannerProps {
  variant?: 'hero' | 'compact' | 'video';
  className?: string;
  showVideo?: boolean;
  videoUrl?: string; // single video URL
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
  videoUrl,
  title = "🚀 Instoredealz Launching Soon!",
  description = "Revolutionary deal discovery platform",
  socialMediaLinks = {}
}: PromotionalLaunchBannerProps) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Function to convert YouTube URL to embed format
  const getEmbedUrl = (url: string): string => {
    if (!url) return url;
    
    // YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    // Vimeo URL patterns
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // Return original URL if it's already an embed URL or other format
    return url;
  };

  const handleWatchVideo = () => {
    setIsVideoModalOpen(true);
  };

  const handleVisitWebsite = () => {
    window.open('https://instoredealz.com', '_blank');
  };

  // Single Video Component with variant-specific sizing
  const VideoPlayer = ({ embedded = false, variant: videoVariant = variant }: { embedded?: boolean; variant?: 'hero' | 'compact' | 'video' }) => {
    if (!videoUrl) return null;
    
    const embedUrl = getEmbedUrl(videoUrl);
    
    // Define video container classes based on banner variant
    const getVideoContainerClass = () => {
      switch (videoVariant) {
        case 'compact':
          return 'banner-video-container banner-video-compact';
        case 'video':
          return 'banner-video-container banner-video-video';
        case 'hero':
        default:
          return 'banner-video-container banner-video-hero';
      }
    };

    return (
      <div className={`${embedded ? 'bg-black/20 rounded-lg overflow-hidden' : ''}`}>
        <div className={getVideoContainerClass()}>
          <iframe
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
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

          </div>
          
          {/* Single embedded video for compact variant */}
          {showVideo && videoUrl && (
            <VideoPlayer embedded variant="compact" />
          )}
        </div>
      </div>
    );
  }

  if (variant === 'video') {
    return (
      <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg banner-responsive text-white shadow-lg ${className}`}>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Rocket className="h-6 w-6 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
          </div>
          <p className="text-sm sm:text-base opacity-90 max-w-2xl mx-auto">{description}</p>
          
          {showVideo && videoUrl && (
            <div className="space-y-4">
              <VideoPlayer variant="video" />
              <div className="flex flex-wrap justify-center gap-2">
                {socialMediaLinks.website && (
                  <Button 
                    variant="secondary" 
                    onClick={handleVisitWebsite}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Hero variant (default)
  return (
    <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg banner-responsive text-white shadow-lg ${className}`}>
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Rocket className="h-8 w-8 sm:h-10 sm:w-10 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{title}</h1>
          </div>
          <p className="text-base sm:text-lg lg:text-xl opacity-90 max-w-3xl mx-auto">{description}</p>
        </div>

        {/* Display video directly inline */}
        {showVideo && videoUrl && (
          <div className="my-6">
            <VideoPlayer variant="hero" />
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          {socialMediaLinks.website && (
            <Button 
              variant="secondary" 
              size="lg"
              onClick={handleVisitWebsite}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 touch-target"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Visit Website
            </Button>
          )}
        </div>

        {/* Social Media Links */}
        {Object.values(socialMediaLinks).some(link => link) && (
          <div className="border-t border-white/20 pt-4">
            <p className="text-sm opacity-75 mb-3">Connect with us:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {socialMediaLinks.facebook && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(socialMediaLinks.facebook, '_blank')}
                  className="text-white hover:bg-white/10"
                >
                  Facebook
                </Button>
              )}
              {socialMediaLinks.instagram && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(socialMediaLinks.instagram, '_blank')}
                  className="text-white hover:bg-white/10"
                >
                  Instagram
                </Button>
              )}
              {socialMediaLinks.twitter && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(socialMediaLinks.twitter, '_blank')}
                  className="text-white hover:bg-white/10"
                >
                  Twitter
                </Button>
              )}
              {socialMediaLinks.whatsapp && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(`https://wa.me/${socialMediaLinks.whatsapp?.replace(/[^0-9]/g, '')}`, '_blank')}
                  className="text-white hover:bg-white/10"
                >
                  WhatsApp
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {videoUrl && (
        <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
          <DialogContent className="max-w-4xl w-full responsive-modal">
            <DialogHeader className="relative">
              <div className="absolute right-0 top-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogTitle className="text-xl font-bold pr-8">{title}</DialogTitle>
            </DialogHeader>
            
            <div className="aspect-video w-full max-h-96">
              <iframe
                src={getEmbedUrl(videoUrl)}
                title={title}
                className="w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="text-muted-foreground">{description}</p>
                </div>
                {socialMediaLinks.website && (
                  <Button 
                    onClick={handleVisitWebsite}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Export as default as well for backward compatibility
export default PromotionalLaunchBanner;