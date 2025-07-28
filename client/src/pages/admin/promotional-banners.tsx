import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Upload, 
  Link, 
  Youtube, 
  Facebook,
  Instagram,
  Twitter,
  Globe,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Image as ImageIcon,
  Save,
  RefreshCw,
  MessageCircle
} from 'lucide-react';
import PromotionalLaunchBanner from '@/components/ui/promotional-launch-banner';

interface PromotionalBanner {
  id: number;
  title: string;
  description: string;
  videoUrl?: string;
  videoTitle?: string;
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

const SUPPORTED_PLATFORMS = [
  {
    name: 'YouTube',
    icon: Youtube,
    format: 'Any YouTube URL format works:',
    examples: [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    ],
    description: 'Just copy the URL from YouTube - we will auto-convert it!'
  },
  {
    name: 'Vimeo',
    icon: PlayCircle,
    format: 'Any Vimeo URL format works:',
    examples: [
      'https://vimeo.com/123456789',
      'https://player.vimeo.com/video/123456789'
    ],
    description: 'Copy the video URL from Vimeo'
  },
  {
    name: 'Google Drive',
    icon: Globe,
    format: 'Google Drive video file URL:',
    examples: [
      'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view'
    ],
    description: 'Upload video to Google Drive and get shareable link'
  }
];

const PAGE_OPTIONS = [
  { value: 'home', label: 'Home Page' },
  { value: 'dashboard', label: 'Customer Dashboard' },
  { value: 'pricing', label: 'Pricing Page' },
  { value: 'vendor-benefits', label: 'Vendor Benefits' },
  { value: 'all', label: 'All Pages' }
];

export default function PromotionalBanners() {
  const [selectedBanner, setSelectedBanner] = useState<PromotionalBanner | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewVariant, setPreviewVariant] = useState<'hero' | 'compact' | 'video'>('hero');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    videoTitle: '',
    socialMediaLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      website: '',
      whatsapp: ''
    },
    variant: 'hero' as 'hero' | 'compact' | 'video',
    isActive: true,
    displayPages: [] as string[]
  });

  const { data: banners = [], isLoading } = useQuery<PromotionalBanner[]>({
    queryKey: ['/api/admin/promotional-banners'],
    retry: false,
  });

  const createBannerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/admin/promotional-banners', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Banner Created",
        description: "Promotional banner has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promotional-banners'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create banner.",
        variant: "destructive",
      });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/admin/promotional-banners/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: "Banner Updated",
        description: "Promotional banner has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promotional-banners'] });
      setIsEditOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Banner update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || error.error || "Failed to update banner. Please check your input data.",
        variant: "destructive",
      });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/promotional-banners/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Banner Deleted",
        description: "Promotional banner has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promotional-banners'] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete banner.",
        variant: "destructive",
      });
    },
  });

  const toggleBannerStatus = async (banner: PromotionalBanner) => {
    updateBannerMutation.mutate({
      id: banner.id,
      data: { ...banner, isActive: !banner.isActive }
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      videoTitle: '',
      socialMediaLinks: {
        facebook: '',
        instagram: '',
        twitter: '',
        website: '',
        whatsapp: ''
      },
      variant: 'hero',
      isActive: true,
      displayPages: []
    });
    setSelectedBanner(null);
  };

  const openEditDialog = (banner: PromotionalBanner) => {
    setSelectedBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description,
      videoUrl: banner.videoUrl || '',
      videoTitle: banner.videoTitle || '',
      socialMediaLinks: {
        facebook: banner.socialMediaLinks.facebook || '',
        instagram: banner.socialMediaLinks.instagram || '',
        twitter: banner.socialMediaLinks.twitter || '',
        website: banner.socialMediaLinks.website || '',
        whatsapp: banner.socialMediaLinks.whatsapp || ''
      },
      variant: banner.variant,
      isActive: banner.isActive,
      displayPages: banner.displayPages
    });
    setIsEditOpen(true);
  };

  const handleSubmit = () => {
    // Convert video URL to embed format before submitting
    const submissionData = {
      ...formData,
      videoUrl: formData.videoUrl ? convertToEmbedUrl(formData.videoUrl) : formData.videoUrl
    };
    
    if (selectedBanner) {
      updateBannerMutation.mutate({ id: selectedBanner.id, data: submissionData });
    } else {
      createBannerMutation.mutate(submissionData);
    }
  };

  const convertToEmbedUrl = (url: string): string => {
    if (!url) return url;

    // YouTube watch URL to embed URL
    const youtubeWatchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeWatchMatch) {
      return `https://www.youtube.com/embed/${youtubeWatchMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
    }

    // YouTube embed URL (already correct format)
    if (/youtube\.com\/embed\//.test(url)) {
      return url;
    }

    // Vimeo watch URL to embed URL
    const vimeoWatchMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoWatchMatch) {
      return `https://player.vimeo.com/video/${vimeoWatchMatch[1]}?autoplay=1`;
    }

    // Vimeo embed URL (already correct format)
    if (/player\.vimeo\.com\/video\//.test(url)) {
      return url;
    }

    // Google Drive file URL to preview URL
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    // Google Drive preview URL (already correct format)
    if (/drive\.google\.com\/file\/d\/.*\/preview/.test(url)) {
      return url;
    }

    return url;
  };

  const validateVideoUrl = (url: string) => {
    if (!url) return true;
    
    // Check for YouTube URLs (both watch and embed formats)
    const youtubePatterns = [
      /youtube\.com\/watch\?v=/,
      /youtu\.be\//,
      /youtube\.com\/embed\//
    ];
    
    // Check for Vimeo URLs (both watch and embed formats)
    const vimeoPatterns = [
      /vimeo\.com\/\d+/,
      /player\.vimeo\.com\/video\//
    ];
    
    // Check for Google Drive URLs
    const drivePatterns = [
      /drive\.google\.com\/file\/d\//
    ];
    
    const allPatterns = [...youtubePatterns, ...vimeoPatterns, ...drivePatterns];
    return allPatterns.some(pattern => pattern.test(url));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Promotional Banners</h1>
          <p className="text-muted-foreground mt-1">
            Manage promotional banners, videos, and social media links
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Banner
        </Button>
      </div>

      {/* Video Platform Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2" />
            Step-by-Step Video Upload Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {SUPPORTED_PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              return (
                <div key={platform.name} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{platform.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{platform.description}</p>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">{platform.format}</Label>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Examples:</Label>
                    <div className="space-y-1">
                      {platform.examples.map((example, index) => (
                        <code key={index} className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded block overflow-x-auto">
                          {example}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Banners List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Banners</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading banners...</span>
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No banners yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first promotional banner to start engaging users
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Banner
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">{banner.title}</h3>
                        <Badge variant={banner.isActive ? "default" : "secondary"}>
                          {banner.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{banner.variant}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{banner.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Pages: {banner.displayPages.join(', ')}</span>
                        {banner.videoUrl && (
                          <span className="flex items-center">
                            <PlayCircle className="h-3 w-3 mr-1" />
                            Video included
                          </span>
                        )}
                        {Object.values(banner.socialMediaLinks).some(link => link) && (
                          <span className="flex items-center">
                            <Link className="h-3 w-3 mr-1" />
                            Social links
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBanner(banner);
                          setPreviewVariant(banner.variant);
                          setIsPreviewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(banner)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBannerStatus(banner)}
                      >
                        {banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBannerMutation.mutate(banner.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBanner ? 'Edit' : 'Create'} Promotional Banner
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="video">Video & Media</TabsTrigger>
              <TabsTrigger value="social">Social Links</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Banner Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Instoredealz Launch"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variant">Banner Variant *</Label>
                  <Select value={formData.variant} onValueChange={(value: any) => setFormData({ ...formData, variant: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero (Large)</SelectItem>
                      <SelectItem value="compact">Compact (Small)</SelectItem>
                      <SelectItem value="video">Video (Focus)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the promotional banner"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Display Pages *</Label>
                <p className="text-xs text-muted-foreground">Select at least one page where this banner will appear</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAGE_OPTIONS.map((page) => (
                    <label key={page.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.displayPages.includes(page.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              displayPages: [...formData.displayPages, page.value]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              displayPages: formData.displayPages.filter(p => p !== page.value)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{page.label}</span>
                    </label>
                  ))}
                </div>
                {formData.displayPages.length === 0 && (
                  <p className="text-sm text-red-500 flex items-center mt-2">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Please select at least one page to display this banner
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active (visible to users)</Label>
              </div>
            </TabsContent>

            {/* Video & Media Tab */}
            <TabsContent value="video" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => {
                      const inputUrl = e.target.value;
                      setFormData({ ...formData, videoUrl: inputUrl });
                    }}
                    onBlur={(e) => {
                      // Auto-convert URL when user finishes typing
                      const inputUrl = e.target.value;
                      if (inputUrl && validateVideoUrl(inputUrl)) {
                        const convertedUrl = convertToEmbedUrl(inputUrl);
                        if (convertedUrl !== inputUrl) {
                          setFormData({ ...formData, videoUrl: convertedUrl });
                        }
                      }
                    }}
                    placeholder="Paste any YouTube, Vimeo, or Google Drive video URL here..."
                  />
                  <p className="text-xs text-muted-foreground">
                    📺 You can paste regular YouTube URLs (like youtube.com/watch?v=...) - they'll be automatically converted to the correct format
                  </p>
                  {formData.videoUrl && !validateVideoUrl(formData.videoUrl) && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Unsupported video URL. Please use YouTube, Vimeo, or Google Drive links.
                    </p>
                  )}
                  {formData.videoUrl && validateVideoUrl(formData.videoUrl) && (
                    <p className="text-sm text-green-500 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Valid video URL {formData.videoUrl !== convertToEmbedUrl(formData.videoUrl) ? '(will be auto-converted)' : ''}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoTitle">Video Title</Label>
                  <Input
                    id="videoTitle"
                    value={formData.videoTitle}
                    onChange={(e) => setFormData({ ...formData, videoTitle: e.target.value })}
                    placeholder="e.g., Instoredealz Launch Demo"
                  />
                </div>
              </div>

              {formData.videoUrl && validateVideoUrl(formData.videoUrl) && (
                <div className="border rounded-lg p-4 space-y-2">
                  <Label>Video Preview</Label>
                  <div className="aspect-video bg-black rounded overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      src={convertToEmbedUrl(formData.videoUrl)}
                      title={formData.videoTitle || "Video Preview"}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Social Links Tab */}
            <TabsContent value="social" className="space-y-4">
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> All social media links are optional. You can provide just one platform or as many as you want. 
                  At least one contact method (any social platform or WhatsApp) is recommended for better user engagement.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center">
                    <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                    Facebook URL (Optional)
                  </Label>
                  <Input
                    id="facebook"
                    value={formData.socialMediaLinks.facebook}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMediaLinks: { ...formData.socialMediaLinks, facebook: e.target.value }
                    })}
                    placeholder="https://facebook.com/your-page"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center">
                    <Instagram className="h-4 w-4 mr-2 text-pink-600" />
                    Instagram URL (Optional)
                  </Label>
                  <Input
                    id="instagram"
                    value={formData.socialMediaLinks.instagram}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMediaLinks: { ...formData.socialMediaLinks, instagram: e.target.value }
                    })}
                    placeholder="https://instagram.com/your-account"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center">
                    <Twitter className="h-4 w-4 mr-2 text-blue-400" />
                    Twitter URL (Optional)
                  </Label>
                  <Input
                    id="twitter"
                    value={formData.socialMediaLinks.twitter}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMediaLinks: { ...formData.socialMediaLinks, twitter: e.target.value }
                    })}
                    placeholder="https://twitter.com/your-account"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-green-600" />
                    Website URL (Optional)
                  </Label>
                  <Input
                    id="website"
                    value={formData.socialMediaLinks.website}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMediaLinks: { ...formData.socialMediaLinks, website: e.target.value }
                    })}
                    placeholder="https://your-website.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                    WhatsApp Number (Optional)
                  </Label>
                  <Input
                    id="whatsapp"
                    value={formData.socialMediaLinks.whatsapp}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMediaLinks: { ...formData.socialMediaLinks, whatsapp: e.target.value }
                    })}
                    placeholder="+91 9876543210"
                  />
                  <p className="text-xs text-muted-foreground">
                    💬 WhatsApp number with country code (e.g., +91 9876543210). This creates a direct chat link for customers.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false);
              setIsEditOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={
                !formData.title || 
                (!formData.displayPages.length) ||
                (formData.videoUrl && !validateVideoUrl(formData.videoUrl)) ||
                createBannerMutation.isPending || 
                updateBannerMutation.isPending
              }
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {selectedBanner ? 'Update' : 'Create'} Banner
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Banner Preview</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label>Preview Variant:</Label>
              <Select value={previewVariant} onValueChange={(value: any) => setPreviewVariant(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedBanner && (
              <PromotionalLaunchBanner
                variant={previewVariant}
                videoUrl={selectedBanner.videoUrl}
                videoTitle={selectedBanner.videoTitle}
                showVideo={!!selectedBanner.videoUrl}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}