import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MediaUpload } from "@/components/ui/media-upload";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, Upload, Eye, Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
}

// Default product image for new products without a custom image
const DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop";

// Initial mock products data - in a real app, this would come from GET /api/products
const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    name: "Smart Watch",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    name: "Coffee Maker",
    category: "Home & Kitchen",
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&h=300&fit=crop",
  },
  {
    id: "4",
    name: "Running Shoes",
    category: "Sports & Outdoors",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
  },
];

export default function ProductAdCreator() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Select Product
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductImage, setNewProductImage] = useState("");
  
  // Step 2: Upload Scene
  const [sceneImage, setSceneImage] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [scriptVoiceover, setScriptVoiceover] = useState("");
  
  const steps = [
    { number: 1, title: "Select Product", icon: Package },
    { number: 2, title: "Upload Scene", icon: Upload },
    { number: 3, title: "Review & Generate", icon: Eye },
  ];

  const handleAddProduct = () => {
    if (!newProductName.trim() || !newProductCategory.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in product name and category",
        variant: "destructive",
      });
      return;
    }

    const newProduct: Product = {
      id: `new-${Date.now()}`,
      name: newProductName,
      category: newProductCategory,
      image: newProductImage || DEFAULT_PRODUCT_IMAGE,
    };

    setProducts([...products, newProduct]);
    setSelectedProduct(newProduct);
    setShowAddProduct(false);
    setNewProductName("");
    setNewProductCategory("");
    setNewProductImage("");
    
    toast({
      title: "Product added",
      description: "Your new product has been added successfully",
    });
  };

  const canProceedToStep2 = selectedProduct !== null;
  const canProceedToStep3 = sceneImage.trim() && sceneDescription.trim() && scriptVoiceover.trim();

  const handleNext = () => {
    if (currentStep === 1 && !canProceedToStep2) {
      toast({
        title: "Select a product",
        description: "Please select a product before proceeding",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === 2 && !canProceedToStep3) {
      toast({
        title: "Complete all fields",
        description: "Please fill in all required fields before proceeding",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <Layout title="Product Ad Creator">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Create Product Video Ad
          </h1>
          <p className="text-muted-foreground mt-2">
            Build engaging product video ads in three simple steps
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                        isActive && "border-purple-500 bg-purple-500/20 text-purple-400",
                        isCompleted && "border-purple-500 bg-purple-500 text-white",
                        !isActive && !isCompleted && "border-gray-700 bg-gray-800/50 text-gray-400"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-sm font-medium",
                        isActive && "text-purple-400",
                        isCompleted && "text-purple-300",
                        !isActive && !isCompleted && "text-gray-400"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "absolute top-6 left-1/2 w-full h-0.5 -z-10",
                        isCompleted ? "bg-purple-500" : "bg-gray-700"
                      )}
                      style={{ transform: "translateY(-50%)" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[500px]">
          {/* Step 1: Select Product */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-400" />
                    Select Product
                  </CardTitle>
                  <CardDescription>
                    Choose a product for your video ad or add a new one
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Product Cards */}
                    {products.map((product) => (
                      <Card
                        key={product.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-lg hover:scale-105",
                          selectedProduct?.id === product.id
                            ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500"
                            : "border-gray-700 hover:border-purple-400"
                        )}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <CardContent className="p-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-md mb-3"
                          />
                          <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Add New Product Card */}
                    <Card
                      className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-dashed border-2 border-purple-500/50 hover:border-purple-400 bg-purple-500/5"
                      onClick={() => setShowAddProduct(!showAddProduct)}
                    >
                      <CardContent className="p-4 h-full flex flex-col items-center justify-center">
                        <Plus className="w-8 h-8 text-purple-400 mb-2" />
                        <h3 className="font-semibold text-sm text-purple-400">Add New Product</h3>
                        <p className="text-xs text-muted-foreground text-center mt-1">
                          Create a custom product
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Add Product Form */}
                  {showAddProduct && (
                    <Card className="mt-4 border-purple-500/30 bg-purple-500/5">
                      <CardHeader>
                        <CardTitle className="text-lg">Add New Product</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="productName">Product Name</Label>
                          <Input
                            id="productName"
                            placeholder="Enter product name"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="productCategory">Category</Label>
                          <Input
                            id="productCategory"
                            placeholder="Enter category"
                            value={newProductCategory}
                            onChange={(e) => setNewProductCategory(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="productImage">Image URL (optional)</Label>
                          <Input
                            id="productImage"
                            placeholder="https://example.com/image.jpg"
                            value={newProductImage}
                            onChange={(e) => setNewProductImage(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowAddProduct(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddProduct}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Upload Scene */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-purple-400" />
                    Upload Scene
                  </CardTitle>
                  <CardDescription>
                    Upload product photos or scene images and add context
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <MediaUpload
                    value={sceneImage}
                    onChange={setSceneImage}
                    accept="image"
                    label="Scene Image"
                    placeholder="Upload or enter image URL"
                    description="Upload a product photo or scene image for your video ad"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="sceneDescription">Scene Description</Label>
                    <Textarea
                      id="sceneDescription"
                      placeholder="Describe the scene or product shot you want to create..."
                      value={sceneDescription}
                      onChange={(e) => setSceneDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scriptVoiceover">Script/Voiceover</Label>
                    <Textarea
                      id="scriptVoiceover"
                      placeholder="Enter the script or voiceover text for your ad..."
                      value={scriptVoiceover}
                      onChange={(e) => setScriptVoiceover(e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Review & Generate */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-400" />
                    Review & Generate
                  </CardTitle>
                  <CardDescription>
                    Review your product ad details before generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Selected Product Summary */}
                  <div>
                    <h3 className="font-semibold text-sm mb-3 text-purple-400">Selected Product</h3>
                    {selectedProduct && (
                      <Card className="border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <img
                              src={selectedProduct.image}
                              alt={selectedProduct.name}
                              className="w-20 h-20 object-cover rounded-md"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold">{selectedProduct.name}</h4>
                              <p className="text-sm text-muted-foreground">{selectedProduct.category}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Uploaded Image Summary */}
                  <div>
                    <h3 className="font-semibold text-sm mb-3 text-purple-400">Uploaded Image</h3>
                    {sceneImage && (
                      <Card className="border-gray-700">
                        <CardContent className="p-4">
                          <img
                            src={sceneImage}
                            alt="Scene preview"
                            className="w-full h-48 object-cover rounded-md"
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Script Information Summary */}
                  <div>
                    <h3 className="font-semibold text-sm mb-3 text-purple-400">Script Information</h3>
                    <Card className="border-gray-700">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Scene Description</Label>
                          <p className="text-sm mt-1">{sceneDescription}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Script/Voiceover</Label>
                          <p className="text-sm mt-1">{scriptVoiceover}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Generate Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    size="lg"
                    disabled
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Ad (Coming Soon)
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    AI-powered ad generation will be connected in a future update
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-800">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < 3 && (
            <Button
              onClick={handleNext}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
