import { useState, useRef } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Input } from './input';
import { Label } from './label';
import { Upload, Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  onFileSelect?: (file: File) => void;
  accept?: string;
  maxSizeInMB?: number;
  placeholder?: string;
  showPreview?: boolean;
  allowCamera?: boolean;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  onFileSelect,
  accept = 'image/*',
  maxSizeInMB = 5,
  placeholder = 'Upload or capture image',
  showPreview = true,
  allowCamera = true,
  className = '',
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processedImageInfo, setProcessedImageInfo] = useState<{
    filename: string;
    size: number;
    dimensions: { width: number; height: number };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processImageFile = async (file: File): Promise<void> => {
    setProcessing(true);
    setError(null);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', file);
      
      // Send to backend for processing
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to process image');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update image URL and info
        onChange(result.data.url);
        setProcessedImageInfo({
          filename: result.data.filename,
          size: result.data.size,
          dimensions: result.data.dimensions,
        });
        
        toast({
          title: "Image processed successfully",
          description: `Image resized to ${result.data.dimensions.width}x${result.data.dimensions.height} and optimized for web.`,
        });
      } else {
        throw new Error(result.message || 'Failed to process image');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      setError(errorMessage);
      toast({
        title: "Image processing failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const processBase64Image = async (base64Data: string): Promise<void> => {
    setProcessing(true);
    setError(null);
    
    try {
      const response = await apiRequest('/api/process-base64-image', {
        method: 'POST',
        body: JSON.stringify({ base64Data }),
      });
      
      if (response.success) {
        // Update image URL and info
        onChange(response.data.url);
        setProcessedImageInfo({
          filename: response.data.filename,
          size: response.data.size,
          dimensions: response.data.dimensions,
        });
        
        toast({
          title: "Image processed successfully",
          description: `Image resized to ${response.data.dimensions.width}x${response.data.dimensions.height} and optimized for web.`,
        });
      } else {
        throw new Error(response.message || 'Failed to process image');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      setError(errorMessage);
      toast({
        title: "Image processing failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const processImageFromUrl = async (imageUrl: string): Promise<void> => {
    setProcessing(true);
    setError(null);
    
    try {
      const response = await apiRequest('/api/process-image-url', {
        method: 'POST',
        body: JSON.stringify({ imageUrl }),
      });
      
      if (response.success) {
        // Update image URL and info
        onChange(response.data.url);
        setProcessedImageInfo({
          filename: response.data.filename,
          size: response.data.size,
          dimensions: response.data.dimensions,
        });
        
        toast({
          title: "Image processed successfully",
          description: `Image resized to ${response.data.dimensions.width}x${response.data.dimensions.height} and optimized for web.`,
        });
      } else {
        throw new Error(response.message || 'Failed to process image');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      setError(errorMessage);
      toast({
        title: "Image processing failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      setError(`Image too large. Maximum size is ${maxSizeInMB}MB`);
      return;
    }

    try {
      // Call the onFileSelect callback if provided
      if (onFileSelect) {
        onFileSelect(file);
      }

      // Process image through backend
      await processImageFile(file);
    } catch (error) {
      setError('Failed to process image');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
    // Reset the input value to allow same file selection again
    e.target.value = '';
  };

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      // Clear any previous selection
      cameraInputRef.current.value = '';
      
      try {
        // Trigger camera immediately
        cameraInputRef.current.click();
      } catch (error) {
        // Camera access failed - silently fall back to file upload
        setError('Camera access not available. Please use file upload instead.');
      }
    } else {
      setError('Camera functionality not available on this device.');
    }
  };

  const isMobileDevice = () => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setError(null);
    
    // If URL is empty, just clear the image
    if (!url) {
      onChange('');
      setProcessedImageInfo(null);
      return;
    }
    
    // If URL looks like a valid image URL, process it
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      try {
        await processImageFromUrl(url);
      } catch (error) {
        // If processing fails, still allow the raw URL
        onChange(url);
      }
    } else {
      // For other URLs, just set them directly
      onChange(url);
    }
  };

  const clearImage = () => {
    onChange('');
    setError(null);
    setProcessedImageInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        {/* Image URL Input */}
        <div className="space-y-2">
          <Input
            placeholder="Enter image URL (optional)"
            value={value && !value.startsWith('data:') && !value.startsWith('/uploads/') ? value : ''}
            onChange={handleUrlChange}
            className="w-full p-3 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={processing}
          />
          <p className="text-xs sm:text-sm text-gray-500">
            Or upload/capture an image below
            {isMobileDevice() && " (Camera available on mobile)"}
            {processing && " • Processing..."}
          </p>
        </div>

        {/* Upload Area */}
        <Card
          className={`border-2 border-dashed transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CardContent className="p-6">
            {processing ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Processing image...
                  </p>
                  <p className="text-xs text-gray-500">
                    Resizing to 600x400, optimizing quality, and converting to WebP
                  </p>
                </div>
              </div>
            ) : value && showPreview ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={value}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                    disabled={processing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-green-600 font-medium text-center">
                    ✓ Image processed successfully
                  </p>
                  {processedImageInfo && (
                    <div className="text-xs text-gray-500 text-center space-y-1">
                      <p>Dimensions: {processedImageInfo.dimensions.width}x{processedImageInfo.dimensions.height}px</p>
                      <p>Size: {(processedImageInfo.size / 1024).toFixed(1)}KB</p>
                      <p>Format: WebP (optimized for deal cards)</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {placeholder}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to {maxSizeInMB}MB
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto py-3 text-sm sm:text-base"
                    disabled={processing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  
                  {allowCamera && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCameraClick}
                      className="w-full sm:w-auto py-3 text-sm sm:text-base hover:bg-blue-50 hover:border-blue-300"
                      disabled={processing}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {isMobileDevice() ? "Take Photo" : "Camera"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
        
        {allowCamera && (
          <>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
              className="hidden"
              aria-label="Take photo with camera"
              multiple={false}
            />
          </>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export { ImageUpload };