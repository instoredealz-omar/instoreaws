import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Rocket, Play, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Video {
  url: string;
  title: string;
  thumbnail?: string;
  duration?: string;
}

interface PromotionalLaunchBannerProps {
  variant?: 'hero' | 'compact' | 'video';
  className?: string;
  showVideo?: boolean;
  videos?: Video[];
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
  videos = [],
  title = "🚀 Instoredealz Launching Soon!",
  description = "Revolutionary deal discovery platform",
  socialMediaLinks = {}
}: PromotionalLaunchBannerProps) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  const handleWatchVideo = (index: number = 0) => {
    setSelectedVideoIndex(index);
    setIsVideoModalOpen(true);
  };

  const handleVisitWebsite = () => {
    window.open('https://instoredealz.com', '_blank');
  };

  const nextVideo = () => {
    setSelectedVideoIndex((prev) => (prev + 1) % videos.length);
  };

  const prevVideo = () => {
    setSelectedVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  // Video Grid Component for multiple videos
  const VideoGrid = ({ embedded = false }: { embedded?: boolean }) => {
    if (!videos || videos.length === 0) return null;

    if (videos.length === 1) {
      // Single video display
      const video = videos[0];
      return (
        <div className={`${embedded ? 'bg-black/20 rounded-lg overflow-hidden' : ''}`}>
          <div className="aspect-video w-full">
            <iframe
              src={video.url}
              title={video.title}
              className="w-full h-full rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {!embedded && (
            <div className="p-4 text-center">
              <h3 className="text-lg font-semibold mb-2">{video.title}</h3>
            </div>
          )}
        </div>
      );
    }

    // Multiple videos - show grid with thumbnails and play buttons
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">Watch Our Videos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video, index) => (
            <div 
              key={index}
              className="relative group cursor-pointer bg-black/20 rounded-lg overflow-hidden hover:bg-black/30 transition-all"
              onClick={() => handleWatchVideo(index)}
            >
              <div className="aspect-video relative">
                {video.thumbnail ? (
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white/80" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium truncate">{video.title}</h4>
              </div>
            </div>
          ))}
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
            {showVideo && videos.length > 0 && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => handleWatchVideo(0)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Play className="h-3 w-3 mr-1" />
                Watch Videos ({videos.length})
              </Button>
            )}
          </div>
          
          {/* Single embedded video for compact variant */}
          {showVideo && videos.length === 1 && (
            <VideoGrid embedded />
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

          {/* Video content */}
          {showVideo && videos.length > 0 && (
            <div className="bg-black/20 rounded-xl overflow-hidden backdrop-blur-sm">
              <div className="p-4">
                <VideoGrid />
              </div>
              <div className="p-4 text-center border-t border-white/10">
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

          <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
            {showVideo && videos.length > 0 && (
              <Button 
                variant="secondary" 
                onClick={() => handleWatchVideo(0)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 touch-target"
              >
                <Play className="h-4 w-4 mr-2" />
                Watch Videos ({videos.length})
              </Button>
            )}
            <Button 
              onClick={handleVisitWebsite}
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold touch-target"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Website
            </Button>
          </div>
        </div>

        {/* Embedded video content for hero */}
        {showVideo && videos.length > 0 && (
          <div className="bg-black/20 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-4">
              <VideoGrid />
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="responsive-modal max-w-4xl w-full bg-gradient-to-br from-blue-900 to-purple-900 text-white border-blue-600">
          <DialogHeader className="pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                {videos[selectedVideoIndex]?.title || 'Video'}
              </DialogTitle>
              <div className="flex items-center space-x-2">
                {videos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevVideo}
                      className="text-white hover:bg-white/10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {selectedVideoIndex + 1} / {videos.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextVideo}
                      className="text-white hover:bg-white/10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
            {videos[selectedVideoIndex] && (
              <iframe
                src={videos[selectedVideoIndex].url}
                title={videos[selectedVideoIndex].title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>

          {videos.length > 1 && (
            <div className="flex justify-center space-x-2">
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedVideoIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedVideoIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="flex justify-center pt-4 border-t border-white/10">
            <Button 
              onClick={handleVisitWebsite}
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-2"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Instoredealz
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PromotionalLaunchBanner;