import React from 'react';
import { usePromotionalBanners } from '@/hooks/usePromotionalBanners';
import { PromotionalLaunchBanner } from '@/components/ui/promotional-launch-banner';

interface PagePromotionalBannersProps {
  page: string;
  className?: string;
}

export function PagePromotionalBanners({ page, className = '' }: PagePromotionalBannersProps) {
  const { data: banners = [], isLoading } = usePromotionalBanners(page);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  // Show only the first active banner
  const activeBanner = banners[0];
  
  if (!activeBanner) {
    return null;
  }

  return (
    <div className={className}>
      <PromotionalLaunchBanner
        key={activeBanner.id}
        variant={activeBanner.variant}
        title={activeBanner.title}
        description={activeBanner.description}
        videos={activeBanner.videos || []}
        socialMediaLinks={activeBanner.socialMediaLinks}
        showVideo={activeBanner.videos && activeBanner.videos.length > 0}
      />
    </div>
  );
}