import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Sparkles } from "lucide-react";

interface Actor {
  id: string;
  name: string;
  ageRange: string;
  ethnicity: string;
  gender: string;
  style: string[];
}

// Sample data: 12 hardcoded actors
const SAMPLE_ACTORS: Actor[] = [
  {
    id: "1",
    name: "Marcus Johnson",
    ageRange: "26-35",
    ethnicity: "African American",
    gender: "Male",
    style: ["Professional", "Energetic"]
  },
  {
    id: "2",
    name: "Sofia Rodriguez",
    ageRange: "18-25",
    ethnicity: "Hispanic",
    gender: "Female",
    style: ["Casual", "Lifestyle"]
  },
  {
    id: "3",
    name: "Alex Chen",
    ageRange: "26-35",
    ethnicity: "Asian",
    gender: "Non-binary",
    style: ["Professional", "Casual"]
  },
  {
    id: "4",
    name: "Emma Williams",
    ageRange: "36-45",
    ethnicity: "Caucasian",
    gender: "Female",
    style: ["Professional", "Lifestyle"]
  },
  {
    id: "5",
    name: "David Kim",
    ageRange: "18-25",
    ethnicity: "Asian",
    gender: "Male",
    style: ["Energetic", "Casual"]
  },
  {
    id: "6",
    name: "Jasmine Patel",
    ageRange: "26-35",
    ethnicity: "South Asian",
    gender: "Female",
    style: ["Professional", "Energetic"]
  },
  {
    id: "7",
    name: "Michael Brown",
    ageRange: "46+",
    ethnicity: "African American",
    gender: "Male",
    style: ["Professional", "Lifestyle"]
  },
  {
    id: "8",
    name: "Olivia Martinez",
    ageRange: "36-45",
    ethnicity: "Hispanic",
    gender: "Female",
    style: ["Casual", "Lifestyle"]
  },
  {
    id: "9",
    name: "Jordan Taylor",
    ageRange: "18-25",
    ethnicity: "Caucasian",
    gender: "Non-binary",
    style: ["Energetic", "Casual"]
  },
  {
    id: "10",
    name: "Raj Sharma",
    ageRange: "36-45",
    ethnicity: "South Asian",
    gender: "Male",
    style: ["Professional", "Energetic"]
  },
  {
    id: "11",
    name: "Isabella Thompson",
    ageRange: "46+",
    ethnicity: "Caucasian",
    gender: "Female",
    style: ["Professional", "Lifestyle"]
  },
  {
    id: "12",
    name: "Jamal Washington",
    ageRange: "26-35",
    ethnicity: "African American",
    gender: "Male",
    style: ["Casual", "Energetic"]
  }
];

export default function UGCActorLibrary() {
  const [genderFilter, setGenderFilter] = useState<string>("All");
  const [ageFilter, setAgeFilter] = useState<string>("All");
  const [styleFilter, setStyleFilter] = useState<string>("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    ethnicity: "",
    style: "",
    description: ""
  });

  // Filter actors based on selected filters
  const filteredActors = SAMPLE_ACTORS.filter(actor => {
    const matchesGender = genderFilter === "All" || actor.gender === genderFilter;
    const matchesAge = ageFilter === "All" || actor.ageRange === ageFilter;
    const matchesStyle = styleFilter === "All" || actor.style.includes(styleFilter);
    return matchesGender && matchesAge && matchesStyle;
  });

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      gender: "",
      ethnicity: "",
      style: "",
      description: ""
    });
  };

  return (
    <Layout title="UGC Actor Library">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight">UGC Actor Library</h1>
            <p className="text-muted-foreground mt-1">
              Browse and manage AI-generated user-generated content actors
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate New Actor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Generate New Actor</DialogTitle>
                <DialogDescription>
                  Fill in the details below to generate a new AI-powered UGC actor
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter actor name"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={(e) => handleFormChange("age", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleFormChange("gender", value)}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Non-binary">Non-binary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ethnicity">Ethnicity</Label>
                  <Input
                    id="ethnicity"
                    placeholder="Enter ethnicity"
                    value={formData.ethnicity}
                    onChange={(e) => handleFormChange("ethnicity", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Select value={formData.style} onValueChange={(value) => handleFormChange("style", value)}>
                    <SelectTrigger id="style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Energetic">Energetic</SelectItem>
                      <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter actor description"
                    value={formData.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled
                  title="AI image generation will be wired later"
                >
                  Generate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Section */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Age Range</Label>
                <Select value={ageFilter} onValueChange={setAgeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="18-25">18-25</SelectItem>
                    <SelectItem value="26-35">26-35</SelectItem>
                    <SelectItem value="36-45">36-45</SelectItem>
                    <SelectItem value="46+">46+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={styleFilter} onValueChange={setStyleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="Energetic">Energetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actor Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {filteredActors.map((actor) => (
            <Card key={actor.id} className="border-none shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <User className="w-20 h-20 text-slate-500" strokeWidth={1} />
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg">{actor.name}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Age: {actor.ageRange}</p>
                  <p>Ethnicity: {actor.ethnicity}</p>
                  <p>Gender: {actor.gender}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {actor.style.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No results message */}
        {filteredActors.length === 0 && (
          <Card className="border-none shadow-sm">
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No actors found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to see more results
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
