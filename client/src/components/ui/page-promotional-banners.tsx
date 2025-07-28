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

  return (
    <div className={`space-y-4 ${className}`}>
      {banners.map((banner) => (
        <PromotionalLaunchBanner
          key={banner.id}
          variant={banner.variant}
          title={banner.title}
          description={banner.description}
          videoUrl={banner.videoUrl}
          videoTitle={banner.videoTitle}
          socialMediaLinks={banner.socialMediaLinks}
          showVideo={!!banner.videoUrl}
        />
      ))}
    </div>
  );
}