import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { Submission, User, Announcement, Material, PricingService } from '@shared/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { uploadFile } from '@/lib/storage';

// Announcements Management Component
const AnnouncementsManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
  });

  const announcementSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    type: z.string().default('general'),
  });

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'general',
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: z.infer<typeof announcementSchema>) => {
      const response = await apiRequest('POST', '/api/announcements', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Announcement created successfully' });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: `Failed to create announcement: ${error.message}`, variant: 'destructive' });
    },
  });

  const onSubmit = (data: z.infer<typeof announcementSchema>) => {
    createAnnouncementMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Create Announcement Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Announcement title" data-testid="input-announcement-title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-announcement-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Announcement content" 
                        className="min-h-[100px]"
                        data-testid="textarea-announcement-content"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={createAnnouncementMutation.isPending}
                data-testid="button-create-announcement"
              >
                {createAnnouncementMutation.isPending ? 'Creating...' : 'Create Announcement'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>All Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div 
                  key={announcement.id}
                  className="border border-border rounded-lg p-4"
                  data-testid={`announcement-${announcement.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{announcement.title}</h4>
                        <Badge variant="secondary">{announcement.type}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{announcement.content}</p>
                      <div className="text-sm text-muted-foreground">
                        Created: {formatDate(announcement.createdAt!)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No announcements yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Users Management Component
const UsersManagement = () => {
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const handleWhatsAppRedirect = (user: User) => {
    const message = `Hello ${user.firstName}, this is support from Zedwriter. How can we help you today?`;
    const phoneNumber = user.phone?.replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.school || 'N/A'}</TableCell>
                      <TableCell>{user.phone || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(user.totalPaid || 0)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {user.phone && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleWhatsAppRedirect(user)}
                              data-testid={`whatsapp-${user.id}`}
                            >
                              <i className="fab fa-whatsapp mr-1"></i>
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Materials Management Component
const MaterialsManagement = () => {
  const { toast } = useToast();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ['/api/admin/materials'],
  });

  // Separate pending and approved materials
  const pendingMaterials = materials.filter(m => !m.isApproved);
  const approvedMaterials = materials.filter(m => m.isApproved);

  const materialsByProgram = approvedMaterials.reduce((acc, material) => {
    const program = material.program || 'Uncategorized';
    if (!acc[program]) {
      acc[program] = [];
    }
    acc[program].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  // Material upload form schema
  const uploadSchema = z.object({
    description: z.string().optional(),
    program: z.string().min(1, 'Program is required'),
    year: z.string().min(1, 'Year is required'),
    type: z.string().min(1, 'Type is required'),
    file: z.any().refine((file) => file?.length === 1, 'File is required'),
  });

  const uploadForm = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      description: '',
      program: '',
      year: '',
      type: '',
    },
  });

  // Upload material mutation
  const uploadMaterialMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/materials/upload', {
        method: 'POST',
        body: data,
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Material uploaded successfully and pending approval' });
      uploadForm.reset();
      setShowUploadForm(false);
      setUploadingFile(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/materials'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: `Upload failed: ${error.message}`, variant: 'destructive' });
      setUploadingFile(false);
    },
  });

  // Approve/Reject material mutations
  const approveMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const response = await apiRequest('PUT', `/api/admin/materials/${materialId}`, { isApproved: true });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Material approved successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/materials'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: `Failed to approve material: ${error.message}`, variant: 'destructive' });
    },
  });

  const rejectMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/materials/${materialId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Material rejected and removed' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/materials'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: `Failed to reject material: ${error.message}`, variant: 'destructive' });
    },
  });

  const onUploadSubmit = async (data: z.infer<typeof uploadSchema>) => {
    setUploadingFile(true);
    const formData = new FormData();
    
    // Use the filename without extension as the title
    const file = data.file[0];
    const fileName = file.name;
    const title = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    formData.append('title', title);
    formData.append('description', data.description || '');
    formData.append('program', data.program);
    formData.append('year', data.year);
    formData.append('type', data.type);
    formData.append('file', file);
    
    uploadMaterialMutation.mutate(formData);
  };

  const handleApproveMaterial = (materialId: string) => {
    approveMaterialMutation.mutate(materialId);
  };

  const handleRejectMaterial = (materialId: string) => {
    if (window.confirm('Are you sure you want to reject this material? This action cannot be undone.')) {
      rejectMaterialMutation.mutate(materialId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Materials Management</CardTitle>
          <Button 
            onClick={() => setShowUploadForm(!showUploadForm)}
            data-testid="button-toggle-upload"
          >
            {showUploadForm ? 'Cancel Upload' : 'Upload Material'}
          </Button>
        </CardHeader>
        {showUploadForm && (
          <CardContent>
            <Form {...uploadForm}>
              <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={uploadForm.control}
                    name="program"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Computer Science" data-testid="input-material-program" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={uploadForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Year 1, 2023" data-testid="input-material-year" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={uploadForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-material-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="study_notes">Study Notes</SelectItem>
                            <SelectItem value="past_papers_theory">Past Papers (Theory)</SelectItem>
                            <SelectItem value="past_papers_practical">Past Papers (Practical)</SelectItem>
                            <SelectItem value="assignment">Assignment</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={uploadForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Brief description of the material" data-testid="input-material-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={uploadForm.control}
                  name="file"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <Input
                          {...fieldProps}
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                          onChange={(event) =>
                            onChange(event.target.files)
                          }
                          data-testid="input-material-file"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  disabled={uploadingFile}
                  data-testid="button-upload-material"
                >
                  {uploadingFile ? 'Uploading...' : 'Upload Material'}
                </Button>
              </form>
            </Form>
          </CardContent>
        )}
      </Card>

      {/* Pending Materials for Approval */}
      {pendingMaterials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approval ({pendingMaterials.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingMaterials.map((material) => (
                <div 
                  key={material.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`pending-material-${material.id}`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{material.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {material.program} • {material.year} • {material.type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {material.fileName} ({Math.round(material.fileSize / 1024)} KB)
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApproveMaterial(material.id)}
                      disabled={approveMaterialMutation.isPending}
                      data-testid={`button-approve-${material.id}`}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleRejectMaterial(material.id)}
                      disabled={rejectMaterialMutation.isPending}
                      data-testid={`button-reject-${material.id}`}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved Materials by Program */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Materials by Program</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(materialsByProgram).map(([program, programMaterials]) => (
                <Card key={program} data-testid={`program-${program}`}>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {programMaterials.length}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {program}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Approved Materials
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Program Settings Component
const ProgramSettings = () => {
  const { toast } = useToast();
  const [newProgram, setNewProgram] = useState('');

  const { data: programs = [], isLoading } = useQuery<string[]>({
    queryKey: ['/api/admin/programs'],
  });

  const addProgramMutation = useMutation({
    mutationFn: async (program: string) => {
      const response = await apiRequest('POST', '/api/admin/programs', { name: program });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Program added successfully' });
      setNewProgram('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/programs'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: `Failed to add program: ${error.message}`, variant: 'destructive' });
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (program: string) => {
      const response = await apiRequest('DELETE', `/api/admin/programs/${encodeURIComponent(program)}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Program deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/programs'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: `Failed to delete program: ${error.message}`, variant: 'destructive' });
    },
  });

  const handleAddProgram = () => {
    if (newProgram.trim()) {
      addProgramMutation.mutate(newProgram.trim());
    }
  };

  const handleDeleteProgram = (program: string) => {
    if (window.confirm(`Are you sure you want to delete the program "${program}"? This will also remove all associated materials.`)) {
      deleteProgramMutation.mutate(program);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Program</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Program name (e.g., Computer Science, Business Administration)"
              value={newProgram}
              onChange={(e) => setNewProgram(e.target.value)}
              data-testid="input-new-program"
            />
            <Button 
              onClick={handleAddProgram} 
              disabled={!newProgram.trim() || addProgramMutation.isPending}
              data-testid="button-add-program"
            >
              {addProgramMutation.isPending ? 'Adding...' : 'Add Program'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Programs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : programs.length > 0 ? (
            <div className="space-y-2">
              {programs.map((program) => (
                <div 
                  key={program}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                  data-testid={`program-item-${program}`}
                >
                  <span className="font-medium">{program}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteProgram(program)}
                    disabled={deleteProgramMutation.isPending}
                    data-testid={`delete-program-${program}`}
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No programs created yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Pricing Management Component
const PricingManagement = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { data: pricingServices = [], isLoading } = useQuery<PricingService[]>({
    queryKey: ['/api/admin/pricing'],
  });

  const pricingSchema = z.object({
    name: z.string().min(1, 'Service name is required'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be positive'),
    features: z.array(z.string()).min(1, 'At least one feature is required'),
    category: z.enum(['main', 'additional', 'free']).default('main'),
    isFeatured: z.boolean().default(false),
    orderIndex: z.number().default(0),
  });

  const form = useForm<z.infer<typeof pricingSchema>>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      features: [''],
      category: 'main',
      isFeatured: false,
      orderIndex: 0,
    },
  });

  const createPricingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof pricingSchema>) => {
      const response = await apiRequest('POST', '/api/admin/pricing', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Pricing service created successfully' });
      form.reset();
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: `Failed to create pricing service: ${error.message}`, variant: 'destructive' });
    },
  });

  const deletePricingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/pricing/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Pricing service deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: `Failed to delete pricing service: ${error.message}`, variant: 'destructive' });
    },
  });

  const onSubmit = (data: z.infer<typeof pricingSchema>) => {
    // Filter out empty features
    const cleanedData = {
      ...data,
      features: data.features.filter(f => f.trim() !== ''),
    };
    createPricingMutation.mutate(cleanedData);
  };

  const handleDeleteService = (service: PricingService) => {
    if (window.confirm(`Are you sure you want to delete "${service.name}"?`)) {
      deletePricingMutation.mutate(service.id);
    }
  };

  const addFeatureField = () => {
    const currentFeatures = form.getValues('features');
    form.setValue('features', [...currentFeatures, '']);
  };

  const removeFeatureField = (index: number) => {
    const currentFeatures = form.getValues('features');
    form.setValue('features', currentFeatures.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Create New Service */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pricing Services Management</CardTitle>
          <Button 
            onClick={() => setIsCreating(!isCreating)}
            data-testid="button-toggle-create-pricing"
          >
            {isCreating ? 'Cancel' : 'Add New Service'}
          </Button>
        </CardHeader>
        {isCreating && (
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Research Proposal" data-testid="input-service-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (K)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="0" 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-service-price" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Brief description of the service" data-testid="input-service-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-service-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="main">Main Service</SelectItem>
                            <SelectItem value="additional">Additional Service</SelectItem>
                            <SelectItem value="free">Free Service</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="orderIndex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="0" 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-service-order" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Featured Service</FormLabel>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            data-testid="checkbox-service-featured"
                            className="rounded border-gray-300"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormLabel>Features</FormLabel>
                  <div className="space-y-2 mt-2">
                    {form.watch('features').map((_, index) => (
                      <div key={index} className="flex gap-2">
                        <FormField
                          control={form.control}
                          name={`features.${index}`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Feature description" 
                                  data-testid={`input-feature-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeFeatureField(index)}
                          disabled={form.watch('features').length <= 1}
                          data-testid={`button-remove-feature-${index}`}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addFeatureField}
                      data-testid="button-add-feature"
                    >
                      Add Feature
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={createPricingMutation.isPending}
                  data-testid="button-create-service"
                >
                  {createPricingMutation.isPending ? 'Creating...' : 'Create Service'}
                </Button>
              </form>
            </Form>
          </CardContent>
        )}
      </Card>

      {/* Existing Services */}
      <Card>
        <CardHeader>
          <CardTitle>Current Pricing Services</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : pricingServices.length === 0 ? (
            <p className="text-muted-foreground">No pricing services configured yet.</p>
          ) : (
            <div className="space-y-4">
              {pricingServices.map((service) => (
                <div 
                  key={service.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                  data-testid={`pricing-service-${service.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{service.name}</h3>
                      {service.isFeatured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {service.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    <div className="text-lg font-bold text-primary mt-1">
                      {service.price === 0 ? 'Free' : formatCurrency(service.price)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Features: {Array.isArray(service.features) ? service.features.length : 0} | Order: {service.orderIndex}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteService(service)}
                      data-testid={`button-delete-service-${service.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main AdminPage Component
export const AdminPage = () => {
  const { user } = useAuth();

  // Fetch all data for overview
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ['/api/admin/submissions'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.role === 'admin',
  });

  // Check admin access
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-lock text-4xl text-muted-foreground mb-4"></i>
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const getAdminStats = () => {
    const totalSubmissions = submissions.length;
    const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
    const activeUsers = users.filter(u => u.isActive).length;
    const totalRevenue = submissions
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    return {
      totalSubmissions,
      pendingSubmissions,
      activeUsers,
      totalRevenue
    };
  };

  const stats = getAdminStats();

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage submissions, users, materials, and system settings</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="admin-stat-total-submissions">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.totalSubmissions}</div>
                  <div className="text-sm text-muted-foreground">Total Submissions</div>
                </div>
                <div className="bg-primary/10 text-primary rounded-full p-3">
                  <i className="fas fa-file-alt text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="admin-stat-pending-review">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-destructive">{stats.pendingSubmissions}</div>
                  <div className="text-sm text-muted-foreground">Pending Review</div>
                </div>
                <div className="bg-yellow-100 text-yellow-600 rounded-full p-3">
                  <i className="fas fa-clock text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="admin-stat-active-users">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.activeUsers}</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="bg-blue-100 text-blue-600 rounded-full p-3">
                  <i className="fas fa-users text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="admin-stat-monthly-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
                <div className="bg-green-100 text-green-600 rounded-full p-3">
                  <i className="fas fa-chart-line text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" data-testid="admin-tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="announcements" data-testid="admin-tab-announcements">Announcements</TabsTrigger>
            <TabsTrigger value="users" data-testid="admin-tab-users">Users</TabsTrigger>
            <TabsTrigger value="materials" data-testid="admin-tab-materials">Materials</TabsTrigger>
            <TabsTrigger value="programs" data-testid="admin-tab-programs">Programs</TabsTrigger>
            <TabsTrigger value="pricing" data-testid="admin-tab-pricing">Pricing</TabsTrigger>
            <TabsTrigger value="settings" data-testid="admin-tab-settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Submissions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {submissionsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submissions.slice(0, 5).map((submission) => (
                        <div 
                          key={submission.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          data-testid={`admin-submission-${submission.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                              {submission.type.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{submission.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {submission.type.replace('_', ' ')} • {formatDate(submission.createdAt!)}
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(submission.status ?? 'pending')}>
                            {(submission.status ?? 'pending').replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>System Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Users</span>
                      <span className="font-medium">{stats.activeUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending Submissions</span>
                      <span className="font-medium text-destructive">{stats.pendingSubmissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Revenue</span>
                      <span className="font-medium">{formatCurrency(stats.totalRevenue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <AnnouncementsManagement />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <MaterialsManagement />
          </TabsContent>

          {/* Programs Tab */}
          <TabsContent value="programs">
            <ProgramSettings />
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <PricingManagement />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Pricing management and other general settings will be implemented here.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};