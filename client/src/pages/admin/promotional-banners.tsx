import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Power, 
  PowerOff,
  ImageIcon,
  Play,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PromotionalLaunchBanner } from '@/components/ui/promotional-launch-banner';
import { apiRequest } from '@/lib/queryClient';

interface PromotionalBanner {
  id: number;
  title: string;
  description: string;
  videoUrl?: string;
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
  viewCount?: number;
  clickCount?: number;
  socialClickCount?: number;
}

export default function PromotionalBanners() {
  const [selectedBanner, setSelectedBanner] = useState<PromotionalBanner | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewVariant, setPreviewVariant] = useState<'hero' | 'compact' | 'video'>('hero');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    socialMediaLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      website: '',
      whatsapp: ''
    },
    variant: 'hero' as 'hero' | 'compact' | 'video',
    isActive: true,
    displayPages: ['all'] as string[]
  });

  // Fetch banners
  const { data: banners = [], isLoading, error } = useQuery<PromotionalBanner[]>({
    queryKey: ['/api/admin/promotional-banners'],
    retry: false,
  });

  // Fetch analytics stats
  const { data: allBannerStats = [], isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/admin/banners/stats'],
    retry: false,
  });

  // Fetch individual banner analytics
  const { data: bannerAnalytics = null, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['/api/admin/banners/analytics', selectedBanner?.id],
    enabled: !!selectedBanner?.id,
    retry: false,
  });

  // Create banner mutation
  const createBannerMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/promotional-banners', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promotional-banners'] });
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      toast({
        title: "Success",
        description: "Global promotional banner created successfully",
      });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create banner",
        variant: "destructive",
      });
    }
  });

  // Update banner mutation
  const updateBannerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/admin/promotional-banners/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promotional-banners'] });
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      toast({
        title: "Success",
        description: "Global promotional banner updated successfully",
      });
      setIsEditOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update banner",
        variant: "destructive",
      });
    }
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/promotional-banners/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promotional-banners'] });
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      toast({
        title: "Success",
        description: "Global promotional banner deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete banner",
        variant: "destructive",
      });
    }
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: (banner: PromotionalBanner) => apiRequest(`/api/admin/promotional-banners/${banner.id}`, 'PUT', { ...banner, isActive: !banner.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promotional-banners'] });
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      toast({
        title: "Success",
        description: "Banner status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update banner status",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      socialMediaLinks: {
        facebook: '',
        instagram: '',
        twitter: '',
        website: '',
        whatsapp: ''
      },
      variant: 'hero',
      isActive: true,
      displayPages: ['all']
    });
    setSelectedBanner(null);
  };

  const openEditDialog = (banner: PromotionalBanner) => {
    setSelectedBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description,
      videoUrl: banner.videoUrl || '',
      socialMediaLinks: {
        facebook: banner.socialMediaLinks.facebook || '',
        instagram: banner.socialMediaLinks.instagram || '',
        twitter: banner.socialMediaLinks.twitter || '',
        website: banner.socialMediaLinks.website || '',
        whatsapp: banner.socialMediaLinks.whatsapp || ''
      },
      variant: banner.variant,
      isActive: banner.isActive,
      displayPages: ['all']
    });
    setIsEditOpen(true);
  };

  const hasValidContent = () => {
    const hasVideo = formData.videoUrl.trim() !== '';
    const hasSocialLinks = Object.values(formData.socialMediaLinks).some(link => link.trim() !== '');
    const hasDescription = formData.description.trim() !== '';
    // Banner is valid if it has any content: description, video, or social links
    return hasDescription || hasVideo || hasSocialLinks;
  };

  const handleSubmit = () => {
    if (selectedBanner) {
      updateBannerMutation.mutate({
        id: selectedBanner.id,
        data: formData
      });
    } else {
      createBannerMutation.mutate(formData);
    }
  };

  const handleDelete = (banner: PromotionalBanner) => {
    if (confirm('Are you sure you want to delete this global promotional banner?')) {
      deleteBannerMutation.mutate(banner.id);
    }
  };

  const handleToggleActive = (banner: PromotionalBanner) => {
    toggleActiveMutation.mutate(banner);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Promotional Banners</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage promotional banners that display across your website with video and social media support
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Banner
          </Button>
          {banners.length > 0 && (
            <Button 
              onClick={() => openEditDialog(banners[0])}
              variant="outline"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Existing Banner
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Analytics Dashboard */}
      {banners.length > 0 && (
        <div className="space-y-6">
          {/* Overall Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {allBannerStats.map((stats: any) => {
              const totalClicks = stats.clicks + stats.socialClicks;
              return (
                <Card key={stats.bannerId} className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Views</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.views}</p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Clicks:</span>
                        <span className="font-medium">{totalClicks}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CTR:</span>
                        <span className="font-medium text-green-600">{stats.ctr}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Social Clicks:</span>
                        <span className="font-medium text-purple-600">{stats.socialClicks}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Badge variant={banners.find(b => b.id === stats.bannerId)?.isActive ? "default" : "secondary"}>
                        {banners.find(b => b.id === stats.bannerId)?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Analytics Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : allBannerStats.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">Total Views</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {allBannerStats.reduce((sum: number, stat: any) => sum + stat.views, 0)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Total Clicks</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {allBannerStats.reduce((sum: number, stat: any) => sum + stat.clicks + stat.socialClicks, 0)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium">Average CTR</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {allBannerStats.length > 0 
                          ? (allBannerStats.reduce((sum: number, stat: any) => sum + stat.ctr, 0) / allBannerStats.length).toFixed(2)
                          : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Performance Breakdown */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-4">Performance Breakdown</h4>
                    <div className="space-y-3">
                      {allBannerStats.map((stats: any) => {
                        const banner = banners.find(b => b.id === stats.bannerId);
                        const totalClicks = stats.clicks + stats.socialClicks;
                        const viewsPercent = Math.max((stats.views / Math.max(...allBannerStats.map((s: any) => s.views))) * 100, 5);
                        const clicksPercent = totalClicks > 0 ? Math.max((totalClicks / Math.max(...allBannerStats.map((s: any) => s.clicks + s.socialClicks))) * 100, 5) : 0;
                        
                        return (
                          <div key={stats.bannerId} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <h5 className="font-medium">{banner?.title || `Banner ${stats.bannerId}`}</h5>
                                <Badge variant={banner?.isActive ? "default" : "secondary"}>
                                  {banner?.variant || 'Unknown'}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                CTR: {stats.ctr}%
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Views: {stats.views}</span>
                                <div className="flex-1 mx-3">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full" 
                                      style={{ width: `${viewsPercent}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span>Clicks: {totalClicks}</span>
                                <div className="flex-1 mx-3">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full" 
                                      style={{ width: `${clicksPercent}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Direct Clicks: {stats.clicks}</span>
                                <span>Social Clicks: {stats.socialClicks}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No analytics data available yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Analytics will appear once users interact with your banners
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Banners List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Banners</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No global banner yet</h3>
              <p className="text-muted-foreground mb-4">
                Create the global promotional banner that will display across all pages
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Global Banner
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold">{banner.title}</h3>
                        <Badge className={banner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{banner.variant}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">{banner.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {banner.viewCount || 0} views
                        </span>
                        <span>|</span>
                        <span className="flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {(banner.clickCount || 0) + (banner.socialClickCount || 0)} clicks
                        </span>
                        {banner.videoUrl && (
                          <>
                            <span>|</span>
                            <span className="flex items-center">
                              <Play className="h-3 w-3 mr-1" />
                              Video
                            </span>
                          </>
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
                        onClick={() => handleToggleActive(banner)}
                        className={banner.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {banner.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(banner)}
                        className="text-red-600 hover:text-red-700"
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
              {selectedBanner ? 'Edit Global Banner' : 'Create Global Banner'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter banner title"
                />
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
                <p className="text-xs text-muted-foreground">
                  Add a description, video URL, or social media links to activate the Create Button
                </p>
              </div>

              <div className="space-y-2">
                <Label>Display Location</Label>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Global Banner:</strong> This banner will be displayed on all pages across the entire website automatically.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant">Banner Style</Label>
                <Select value={formData.variant} onValueChange={(value: 'hero' | 'compact' | 'video') => 
                  setFormData({ ...formData, variant: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero (Large, prominent)</SelectItem>
                    <SelectItem value="compact">Compact (Small, minimal)</SelectItem>
                    <SelectItem value="video">Video (Video-focused)</SelectItem>
                  </SelectContent>
                </Select>
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

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://vimeo.com/VIDEO_ID"
                />
                <p className="text-xs text-muted-foreground">
                  Videos will display directly on the banner once uploaded. YouTube and Vimeo URLs are automatically converted to embed format.
                </p>
              </div>

              <div className="space-y-4">
                <Label>Social Media Links</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={formData.socialMediaLinks.facebook}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMediaLinks: { ...formData.socialMediaLinks, facebook: e.target.value }
                      })}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.socialMediaLinks.instagram}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMediaLinks: { ...formData.socialMediaLinks, instagram: e.target.value }
                      })}
                      placeholder="https://instagram.com/yourprofile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={formData.socialMediaLinks.twitter}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMediaLinks: { ...formData.socialMediaLinks, twitter: e.target.value }
                      })}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.socialMediaLinks.website}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMediaLinks: { ...formData.socialMediaLinks, website: e.target.value }
                      })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.socialMediaLinks.whatsapp}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMediaLinks: { ...formData.socialMediaLinks, whatsapp: e.target.value }
                      })}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Preview Style:</Label>
                  <Select value={previewVariant} onValueChange={(value: 'hero' | 'compact' | 'video') => 
                    setPreviewVariant(value)
                  }>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border rounded-lg p-4 bg-muted/50">
                  <PromotionalLaunchBanner
                    variant={previewVariant}
                    title={formData.title || "Preview Title"}
                    description={formData.description || "Preview description"}
                    videoUrl={formData.videoUrl}
                    socialMediaLinks={formData.socialMediaLinks}
                    showVideo={!!formData.videoUrl}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
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
                (!hasValidContent()) ||
                createBannerMutation.isPending || 
                updateBannerMutation.isPending
              }
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-50"
            >
              {createBannerMutation.isPending || updateBannerMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              {selectedBanner ? 'Update Banner' : 'Create Banner'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Banner Preview - {selectedBanner?.title}</DialogTitle>
          </DialogHeader>
          {selectedBanner && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Preview Style:</Label>
                <Select value={previewVariant} onValueChange={(value: 'hero' | 'compact' | 'video') => 
                  setPreviewVariant(value)
                }>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/50">
                <PromotionalLaunchBanner
                  variant={previewVariant}
                  title={selectedBanner.title}
                  description={selectedBanner.description}
                  videoUrl={selectedBanner.videoUrl}
                  socialMediaLinks={selectedBanner.socialMediaLinks}
                  showVideo={!!selectedBanner.videoUrl}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}