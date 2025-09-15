import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMaterials } from '../hooks/use-firestore';
import { uploadMaterial, createFileRequest } from '../lib/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Material } from '../types';

export const Materials = () => {
  const [filters, setFilters] = useState({
    program: '',
    year: '',
    type: '',
    search: ''
  });
  const [selectedProgram, setSelectedProgram] = useState('medicine');
  
  const { data: materials, loading } = useMaterials(filters);
  const { user } = useAuth();
  const { toast } = useToast();

  const programs = [
    { id: 'medicine', name: 'Medicine & Surgery', count: 156 },
    { id: 'engineering', name: 'Engineering', count: 89 },
    { id: 'business', name: 'Business Studies', count: 73 },
    { id: 'agriculture', name: 'Agriculture', count: 45 }
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDownload = async (material: Material) => {
    // In a real implementation, this would handle file download
    // For now, we'll just open the file URL
    window.open(material.file.url, '_blank');
  };

  const handleRequestFile = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to request files',
        variant: 'destructive',
      });
      return;
    }

    // This would open a modal to request a file
    toast({
      title: 'File request feature',
      description: 'File request functionality would be implemented here',
    });
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return 'fas fa-file-pdf text-red-500';
    if (contentType.includes('word')) return 'fas fa-file-word text-blue-500';
    if (contentType.includes('powerpoint')) return 'fas fa-file-powerpoint text-orange-500';
    if (contentType.includes('excel')) return 'fas fa-file-excel text-green-500';
    return 'fas fa-file text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 data-testid="text-materials-title" className="text-3xl font-bold text-foreground">Study Materials</h1>
          <p data-testid="text-materials-subtitle" className="text-muted-foreground">Access study notes, past papers, and resources for your program</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Input
                  data-testid="input-search-materials"
                  placeholder="Search materials..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div>
                <Select value={filters.program} onValueChange={(value) => handleFilterChange('program', value)}>
                  <SelectTrigger data-testid="select-program-filter">
                    <SelectValue placeholder="All Programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="medicine">Medicine & Surgery</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={filters.year} onValueChange={(value) => handleFilterChange('year', value)}>
                  <SelectTrigger data-testid="select-year-filter">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="111">111</SelectItem>
                    <SelectItem value="121">121</SelectItem>
                    <SelectItem value="211">211</SelectItem>
                    <SelectItem value="221">221</SelectItem>
                    <SelectItem value="311">311</SelectItem>
                    <SelectItem value="321">321</SelectItem>
                    <SelectItem value="421">421</SelectItem>
                    <SelectItem value="422">422</SelectItem>
                    <SelectItem value="511">511</SelectItem>
                    <SelectItem value="521">521</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger data-testid="select-type-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="study_notes">Study Notes</SelectItem>
                    <SelectItem value="past_papers_theory">Past Papers (Theory)</SelectItem>
                    <SelectItem value="past_papers_practical">Past Papers (Practical/OSCE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Button data-testid="button-request-file" variant="outline" onClick={handleRequestFile}>
                <i className="fas fa-plus mr-2"></i>
                Request a file
              </Button>
              <Button data-testid="button-upload-material">
                <i className="fas fa-upload mr-2"></i>
                Upload Material
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Program Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {programs.map((program) => (
            <Card 
              key={program.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${selectedProgram === program.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => {
                setSelectedProgram(program.id);
                handleFilterChange('program', program.id);
              }}
              data-testid={`card-program-${program.id}`}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className={`fas ${program.id === 'medicine' ? 'fa-user-md' : 
                                      program.id === 'engineering' ? 'fa-cogs' : 
                                      program.id === 'business' ? 'fa-briefcase' : 'fa-seedling'} text-2xl text-primary`}></i>
                </div>
                <h3 className="font-semibold mb-2">{program.name}</h3>
                <p className="text-sm text-muted-foreground">{program.count} materials</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Materials Grid */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Available Materials</CardTitle>
              <div className="text-sm text-muted-foreground">
                Showing {materials?.length || 0} materials
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse border border-border rounded-lg p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : materials && materials.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.map((material: Material) => (
                  <div key={material.id} data-testid={`material-${material.id}`} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">{material.title}</h5>
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge variant="outline">{material.year}</Badge>
                          <Badge variant="secondary">{material.type.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                      <i className={getFileIcon(material.file.contentType)}></i>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {material.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(material.createdAt).toLocaleDateString()}
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => handleDownload(material)}
                        data-testid={`button-download-${material.id}`}
                      >
                        <i className="fas fa-download mr-1"></i>
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="fas fa-search text-6xl text-muted-foreground mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">No materials found</h3>
                <p className="text-muted-foreground mb-6">
                  {filters.program || filters.year || filters.type || filters.search 
                    ? 'Try adjusting your search filters'
                    : 'No materials have been uploaded yet'
                  }
                </p>
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" onClick={() => setFilters({ program: '', year: '', type: '', search: '' })}>
                    Clear Filters
                  </Button>
                  <Button onClick={handleRequestFile}>
                    Request Material
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
