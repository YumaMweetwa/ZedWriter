import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PROGRAMS, MEDICINE_YEARS, MATERIAL_TYPES } from '@/utils/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

interface MaterialsFilter {
  search: string;
  program: string;
  year: string;
  type: string;
}

export const MaterialsPage = () => {
  const { user } = useAuth();
  const { showToast } = useApp();
  const [filters, setFilters] = useState<MaterialsFilter>({
    search: '',
    program: '',
    year: '',
    type: ''
  });

  const updateFilter = (key: keyof MaterialsFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDownload = (materialId: string, title: string) => {
    showToast({
      type: 'info',
      title: 'Download Started',
      message: `Downloading ${title}...`
    });
  };

  const handleRequestFile = () => {
    if (!user) {
      showToast({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please sign in to request files.'
      });
      return;
    }
    
    showToast({
      type: 'info',
      title: 'Request Submitted',
      message: 'Your file request has been submitted. We will contact you shortly.'
    });
  };

  // Mock materials data - in real app this would come from Firestore
  const materials = [
    {
      id: '1',
      title: 'Anatomy Study Notes - Cardiovascular System',
      description: 'Comprehensive notes covering heart anatomy and physiology',
      program: 'medicine',
      year: '211',
      type: 'study_notes',
      uploadedAt: '2 weeks ago',
      fileSize: '2.3 MB'
    },
    {
      id: '2',
      title: 'Pharmacology Past Paper 2023',
      description: 'End of year examination with answer key',
      program: 'medicine',
      year: '311',
      type: 'past_papers_theory',
      uploadedAt: '1 week ago',
      fileSize: '1.8 MB'
    },
    {
      id: '3',
      title: 'Clinical Skills OSCE Guide',
      description: 'Step-by-step guide for clinical examinations',
      program: 'medicine',
      year: '421',
      type: 'past_papers_practical',
      uploadedAt: '3 days ago',
      fileSize: '3.1 MB'
    }
  ];

  return (
    <div className="min-h-screen py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Study Materials</h1>
          <p className="text-muted-foreground">Access study notes, past papers, and resources for your program</p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">Search Materials</label>
              <Input
                id="search"
                placeholder="Search by title or description..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                data-testid="materials-search"
              />
            </div>
            <div>
              <label htmlFor="program-filter" className="block text-sm font-medium text-foreground mb-2">Program</label>
              <Select value={filters.program} onValueChange={(value) => updateFilter('program', value)}>
                <SelectTrigger id="program-filter" data-testid="program-filter">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Programs</SelectItem>
                  {PROGRAMS.map((program) => (
                    <SelectItem key={program.value} value={program.value}>
                      {program.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="year-filter" className="block text-sm font-medium text-foreground mb-2">Year</label>
              <Select value={filters.year} onValueChange={(value) => updateFilter('year', value)}>
                <SelectTrigger id="year-filter" data-testid="year-filter">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Years</SelectItem>
                  {MEDICINE_YEARS.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-foreground mb-2">Material Type</label>
              <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                <SelectTrigger id="type-filter" data-testid="type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {MATERIAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <Button 
              variant="outline" 
              onClick={handleRequestFile}
              data-testid="request-file-button"
            >
              <i className="fas fa-plus mr-2"></i>Request a file
            </Button>
            <Button data-testid="upload-material-button">
              <i className="fas fa-upload mr-2"></i>Upload Material
            </Button>
          </div>
        </Card>

        {/* Program Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Medicine Program (Featured) */}
          <div className="md:col-span-2 lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <div className="relative h-48">
              <img 
                src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200" 
                alt="Medical students studying in a clinical setting" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white mb-2">Medicine & Surgery</h3>
                <p className="text-white/90 text-sm">Complete study materials for medical students</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">150+ materials available</span>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="browse-medicine">
                  Browse <i className="fas fa-arrow-right ml-1"></i>
                </Button>
              </div>
            </div>
          </div>

          {/* Other Programs */}
          <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <div className="relative h-32">
              <img 
                src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300" 
                alt="Engineering students working on technical projects" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold mb-1">Engineering</h4>
              <p className="text-sm text-muted-foreground">50+ materials</p>
            </div>
          </div>
        </div>

        {/* Materials List */}
        <Card className="overflow-hidden">
          <CardHeader className="p-6 border-b border-border">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Available Materials</h3>
              <div className="text-sm text-muted-foreground">
                Showing <span data-testid="materials-count">3</span> of <span data-testid="total-materials">150</span> materials
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {materials.map((material) => (
                    <tr key={material.id} data-testid={`material-row-${material.id}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{material.title}</p>
                          <p className="text-xs text-muted-foreground">{material.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <Badge variant="secondary">Medicine</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{material.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {MATERIAL_TYPES.find(t => t.value === material.type)?.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{material.uploadedAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(material.id, material.title)}
                          data-testid={`download-material-${material.id}`}
                        >
                          <i className="fas fa-download text-primary"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing 1 to 3 of 3 results
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled data-testid="prev-page">
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
                <Button variant="outline" size="sm" data-testid="next-page">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
