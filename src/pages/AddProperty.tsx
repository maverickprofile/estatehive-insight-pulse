import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  UploadCloud,
  X,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { propertiesService } from '@/services/database.service';
import { supabase } from '@/lib/supabaseClient';
import { Progress } from '@/components/ui/progress';

// Amenities list
const amenitiesList = [
  "Swimming Pool", "Gymnasium", "Reserved Parking", "Security", "Lift",
  "Clubhouse", "Power Backup", "Vaastu Compliant", "Private Terrace/Garden",
  "Intercom Facility", "Maintenance Staff", "Piped Gas", "RO Water System",
  "Park", "Kids Play Area", "Rainwater Harvesting", "Servant Quarters",
  "Wi-Fi", "CCTV", "Fire Safety", "Solar Panels", "EV Charging"
];

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [propertyData, setPropertyData] = useState({
    // Basic Information
    title: '',
    description: '',
    property_type: 'residential',
    property_subtype: 'apartment',
    category: 'sale',
    status: 'active',
    
    // Location
    address: '',
    unit_number: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    neighborhood: '',
    
    // Pricing
    price: '',
    original_price: '',
    price_negotiable: false,
    currency: 'INR',
    
    // For Rent
    rent_amount: '',
    rent_frequency: 'monthly',
    security_deposit: '',
    maintenance_fee: '',
    
    // Specifications
    area_sqft: '',
    plot_area: '',
    built_up_area: '',
    carpet_area: '',
    
    // Room Details
    bedrooms: '',
    bathrooms: '',
    balconies: '',
    total_rooms: '',
    
    // Parking & Floors
    parking_spaces: '',
    covered_parking: '',
    floor_number: '',
    total_floors: '',
    
    // Construction
    year_built: '',
    possession_date: '',
    furnishing_status: 'unfurnished',
    facing_direction: 'north',
    property_condition: 'new',
    
    // Marketing
    is_featured: false,
    meta_title: '',
    meta_description: '',
  });

  const handleInputChange = (field: string, value: any) => {
    setPropertyData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!validTypes.includes(file.type)) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a valid image file`,
            variant: "destructive"
          });
          return false;
        }
        
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive"
          });
          return false;
        }
        
        return true;
      });

      if (imageFiles.length + validFiles.length > 10) {
        toast({
          title: "Too many images",
          description: "Maximum 10 images allowed",
          variant: "destructive"
        });
        return;
      }

      setImageFiles(prev => [...prev, ...validFiles]);
      
      // Create previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return ['/placeholder.svg'];
    
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileName = `${user.id}/${Date.now()}_${file.name}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(data.path);
        
        uploadedUrls.push(publicUrl);
        setUploadProgress(((i + 1) / imageFiles.length) * 100);
      }
      
      return uploadedUrls;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload images: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!propertyData.title || !propertyData.city || !propertyData.area_sqft) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Title, City, Area)",
          variant: "destructive"
        });
        return;
      }
      
      // Upload images first
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        toast({
          title: "Uploading images...",
          description: "Please wait while we upload your property images"
        });
        imageUrls = await uploadImages();
      } else {
        imageUrls = ['/placeholder.svg'];
      }
      
      // Prepare data for submission
      const submitData: any = {
        ...propertyData,
        amenities: selectedAmenities,
        image_urls: imageUrls,
        // Convert string values to numbers where needed
        price: propertyData.price ? parseFloat(propertyData.price) : null,
        original_price: propertyData.original_price ? parseFloat(propertyData.original_price) : null,
        rent_amount: propertyData.rent_amount ? parseFloat(propertyData.rent_amount) : null,
        security_deposit: propertyData.security_deposit ? parseFloat(propertyData.security_deposit) : null,
        maintenance_fee: propertyData.maintenance_fee ? parseFloat(propertyData.maintenance_fee) : null,
        area_sqft: propertyData.area_sqft ? parseFloat(propertyData.area_sqft) : null,
        plot_area: propertyData.plot_area ? parseFloat(propertyData.plot_area) : null,
        built_up_area: propertyData.built_up_area ? parseFloat(propertyData.built_up_area) : null,
        carpet_area: propertyData.carpet_area ? parseFloat(propertyData.carpet_area) : null,
        bedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : null,
        bathrooms: propertyData.bathrooms ? parseInt(propertyData.bathrooms) : null,
        balconies: propertyData.balconies ? parseInt(propertyData.balconies) : null,
        total_rooms: propertyData.total_rooms ? parseInt(propertyData.total_rooms) : null,
        parking_spaces: propertyData.parking_spaces ? parseInt(propertyData.parking_spaces) : null,
        covered_parking: propertyData.covered_parking ? parseInt(propertyData.covered_parking) : null,
        floor_number: propertyData.floor_number ? parseInt(propertyData.floor_number) : null,
        total_floors: propertyData.total_floors ? parseInt(propertyData.total_floors) : null,
        year_built: propertyData.year_built ? parseInt(propertyData.year_built) : null,
      };
      
      // Remove empty string values
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });
      
      await propertiesService.createProperty(submitData);
      
      toast({
        title: "Success!",
        description: "Property has been added successfully"
      });
      
      navigate('/properties');
    } catch (error: any) {
      console.error('Error adding property:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add property",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/properties')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add New Property</h1>
            <p className="text-muted-foreground">Fill in the property details below</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || isUploading}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Create Property
            </>
          )}
        </Button>
      </div>

      {/* Main Form - Single Page */}
      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details of the property</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Modern 3BHK Apartment in Whitefield"
                  value={propertyData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the property features, location benefits, etc."
                  rows={4}
                  value={propertyData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select
                  value={propertyData.property_type}
                  onValueChange={(value) => handleInputChange('property_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Property Subtype</Label>
                <Select
                  value={propertyData.property_subtype}
                  onValueChange={(value) => handleInputChange('property_subtype', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="residential_plot">Residential Plot</SelectItem>
                    <SelectItem value="commercial_plot">Commercial Plot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={propertyData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                    <SelectItem value="lease">For Lease</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={propertyData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Images */}
        <Card>
          <CardHeader>
            <CardTitle>Property Images</CardTitle>
            <CardDescription>Upload images of the property (Maximum 10 images)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-2">Click to upload images</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB each</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isLoading || isUploading}
                />
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Uploading images... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Main Image
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Details */}
        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
            <CardDescription>Specify the property location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="e.g., 123 Main Street"
                  value={propertyData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_number">Unit/Flat Number</Label>
                <Input
                  id="unit_number"
                  placeholder="e.g., A-401"
                  value={propertyData.unit_number}
                  onChange={(e) => handleInputChange('unit_number', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Neighborhood/Area</Label>
                <Input
                  id="neighborhood"
                  placeholder="e.g., Whitefield"
                  value={propertyData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="e.g., Bangalore"
                  value={propertyData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="e.g., Karnataka"
                  value={propertyData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  placeholder="e.g., 560066"
                  maxLength={6}
                  value={propertyData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={propertyData.country}
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Property Specifications</CardTitle>
            <CardDescription>Enter the property dimensions and features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area_sqft">Area (sq ft) *</Label>
                <Input
                  id="area_sqft"
                  type="number"
                  placeholder="e.g., 1500"
                  value={propertyData.area_sqft}
                  onChange={(e) => handleInputChange('area_sqft', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  placeholder="e.g., 3"
                  value={propertyData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  placeholder="e.g., 2"
                  value={propertyData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="balconies">Balconies</Label>
                <Input
                  id="balconies"
                  type="number"
                  placeholder="e.g., 1"
                  value={propertyData.balconies}
                  onChange={(e) => handleInputChange('balconies', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parking_spaces">Parking Spaces</Label>
                <Input
                  id="parking_spaces"
                  type="number"
                  placeholder="e.g., 2"
                  value={propertyData.parking_spaces}
                  onChange={(e) => handleInputChange('parking_spaces', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor_number">Floor Number</Label>
                <Input
                  id="floor_number"
                  type="number"
                  placeholder="e.g., 5"
                  value={propertyData.floor_number}
                  onChange={(e) => handleInputChange('floor_number', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_floors">Total Floors</Label>
                <Input
                  id="total_floors"
                  type="number"
                  placeholder="e.g., 10"
                  value={propertyData.total_floors}
                  onChange={(e) => handleInputChange('total_floors', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year_built">Year Built</Label>
                <Input
                  id="year_built"
                  type="number"
                  placeholder="e.g., 2020"
                  value={propertyData.year_built}
                  onChange={(e) => handleInputChange('year_built', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Furnishing Status</Label>
                <Select
                  value={propertyData.furnishing_status}
                  onValueChange={(value) => handleInputChange('furnishing_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="furnished">Furnished</SelectItem>
                    <SelectItem value="semi_furnished">Semi Furnished</SelectItem>
                    <SelectItem value="unfurnished">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Facing Direction</Label>
                <Select
                  value={propertyData.facing_direction}
                  onValueChange={(value) => handleInputChange('facing_direction', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north">North</SelectItem>
                    <SelectItem value="south">South</SelectItem>
                    <SelectItem value="east">East</SelectItem>
                    <SelectItem value="west">West</SelectItem>
                    <SelectItem value="north_east">North East</SelectItem>
                    <SelectItem value="north_west">North West</SelectItem>
                    <SelectItem value="south_east">South East</SelectItem>
                    <SelectItem value="south_west">South West</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Property Condition</Label>
                <Select
                  value={propertyData.property_condition}
                  onValueChange={(value) => handleInputChange('property_condition', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="needs_renovation">Needs Renovation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Information</CardTitle>
            <CardDescription>Set the property pricing details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  {propertyData.category === 'sale' ? 'Sale Price (₹)' : 'Rent Amount (₹/month)'}
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 5000000"
                  value={propertyData.category === 'sale' ? propertyData.price : propertyData.rent_amount}
                  onChange={(e) => handleInputChange(
                    propertyData.category === 'sale' ? 'price' : 'rent_amount', 
                    e.target.value
                  )}
                />
              </div>

              {propertyData.category === 'sale' && (
                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price (₹)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    placeholder="e.g., 5500000"
                    value={propertyData.original_price}
                    onChange={(e) => handleInputChange('original_price', e.target.value)}
                  />
                </div>
              )}

              {propertyData.category === 'rent' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="security_deposit">Security Deposit (₹)</Label>
                    <Input
                      id="security_deposit"
                      type="number"
                      placeholder="e.g., 100000"
                      value={propertyData.security_deposit}
                      onChange={(e) => handleInputChange('security_deposit', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maintenance_fee">Maintenance Fee (₹/month)</Label>
                    <Input
                      id="maintenance_fee"
                      type="number"
                      placeholder="e.g., 5000"
                      value={propertyData.maintenance_fee}
                      onChange={(e) => handleInputChange('maintenance_fee', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="price_negotiable"
                  checked={propertyData.price_negotiable}
                  onCheckedChange={(checked) => handleInputChange('price_negotiable', checked)}
                />
                <Label htmlFor="price_negotiable">Price Negotiable</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={propertyData.is_featured}
                  onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                />
                <Label htmlFor="is_featured">Mark as Featured</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities & Features</CardTitle>
            <CardDescription>Select the amenities available in the property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {amenitiesList.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={selectedAmenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <Label
                    htmlFor={amenity}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}