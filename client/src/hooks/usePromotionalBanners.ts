import { useQuery } from '@tanstack/react-query';

interface PromotionalBanner {
  id: number;
  title: string;
  description: string;
  videos: Array<{
    url: string;
    title: string;
    thumbnail?: string;
    duration?: string;
  }>;
  socialMediaLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
    whatsapp?: string;
  };
  variant: 'hero' | 'compact' | 'video';
  isActive: boolean;
  displayPages: string[];
  createdAt: string;
  updatedAt: string;
}

export function usePromotionalBanners(page?: string) {
  const endpoint = page 
    ? `/api/promotional-banners/active/${page}`
    : '/api/promotional-banners/active';

  return useQuery<PromotionalBanner[]>({
    queryKey: ['promotional-banners', page || 'all'],
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch promotional banners');
      }
      return response.json();
    },
    retry: false,
  });
}