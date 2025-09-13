import { useState } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../hooks/use-auth';
import { useFirestoreCollection } from '../hooks/use-firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateSubmissionStatus, createAnnouncement, moderateMaterial } from '../lib/firestore';
import { where, orderBy } from 'firebase/firestore';
import type { Submission, User, Material, Announcement } from '../types';

export const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', body: '' });

  // Data queries
  const { data: submissions } = useFirestoreCollection<Submission>('submissions', [orderBy('createdAt', 'desc')]);
  const { data: users } = useFirestoreCollection<User>('users', [orderBy('createdAt', 'desc')]);
  const { data: pendingMaterials } = useFirestoreCollection<Material>('materials', [
    where('status', '==', 'in_review'),
    orderBy('createdAt', 'desc')
  ]);
  const { data: announcements } = useFirestoreCollection<Announcement>('announcements', [orderBy('createdAt', 'desc')]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <i className="fas fa-shield-alt text-4xl text-destructive mb-4"></i>
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    totalSubmissions: submissions?.length || 0,
    pendingSubmissions: submissions?.filter(s => s.status === 'pending').length || 0,
    activeUsers: users?.filter(u => u.role === 'user').length || 0,
    pendingMaterials: pendingMaterials?.length || 0,
    totalRevenue: submissions?.reduce((sum, s) => sum + s.amount, 0) || 0
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      under_review: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const handleStatusUpdate = async (submissionId: string, newStatus: string, notes?: string) => {
    try {
      await updateSubmissionStatus(submissionId, newStatus, notes);
      toast({
        title: 'Status updated',
        description: 'Submission status has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update submission status',
        variant: 'destructive',
      });
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.body) {
      toast({
        title: 'Required fields',
        description: 'Please fill in both title and body',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createAnnouncement({
        title: newAnnouncement.title,
        body: newAnnouncement.body,
        createdAt: new Date(),
        createdBy: user.id
      });
      setNewAnnouncement({ title: '', body: '' });
      toast({
        title: 'Announcement created',
        description: 'Your announcement has been published successfully',
      });
    } catch (error) {
      toast({
        title: 'Creation failed',
        description: 'Failed to create announcement',
        variant: 'destructive',
      });
    }
  };

  const handleMaterialModeration = async (materialId: string, status: 'published' | 'rejected', reason?: string) => {
    try {
      await moderateMaterial(materialId, status, reason);
      toast({
        title: 'Material moderated',
        description: `Material has been ${status}`,
      });
    } catch (error) {
      toast({
        title: 'Moderation failed',
        description: 'Failed to moderate material',
        variant: 'destructive',
      });
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 data-testid="text-admin-title" className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p data-testid="text-admin-subtitle" className="text-muted-foreground">Manage submissions, users, and system settings</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div data-testid="text-stat-total-submissions" className="text-2xl font-bold">{stats.totalSubmissions}</div>
                        <div className="text-sm text-muted-foreground">Total Submissions</div>
                      </div>
                      <i className="fas fa-file-alt text-2xl text-primary"></i>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div data-testid="text-stat-pending" className="text-2xl font-bold text-yellow-600">{stats.pendingSubmissions}</div>
                        <div className="text-sm text-muted-foreground">Pending Review</div>
                      </div>
                      <i className="fas fa-clock text-2xl text-yellow-600"></i>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div data-testid="text-stat-users" className="text-2xl font-bold">{stats.activeUsers}</div>
                        <div className="text-sm text-muted-foreground">Active Users</div>
                      </div>
                      <i className="fas fa-users text-2xl text-blue-600"></i>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div data-testid="text-stat-materials" className="text-2xl font-bold">{stats.pendingMaterials}</div>
                        <div className="text-sm text-muted-foreground">Materials Pending</div>
                      </div>
                      <i className="fas fa-book text-2xl text-purple-600"></i>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div data-testid="text-stat-revenue" className="text-2xl font-bold">K{stats.totalRevenue}</div>
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                      </div>
                      <i className="fas fa-chart-line text-2xl text-green-600"></i>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {submissions && submissions.length > 0 ? (
                      <div className="space-y-4">
                        {submissions.slice(0, 5).map((submission: Submission) => (
                          <div key={submission.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">
                                {submission.commonFields.firstName} {submission.commonFields.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {submission.type} • K{submission.amount}
                              </div>
                            </div>
                            {getStatusBadge(submission.status)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No submissions yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">System Health:</span>
                      <Badge className="bg-green-100 text-green-800">Operational</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Database:</span>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage:</span>
                      <Badge className="bg-green-100 text-green-800">Available</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment System:</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>All Submissions</CardTitle>
                    <div className="flex space-x-3">
                      <Select>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Search submissions..." className="w-64" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {submissions && submissions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-medium">Student</th>
                            <th className="text-left p-4 font-medium">Type</th>
                            <th className="text-left p-4 font-medium">Title</th>
                            <th className="text-left p-4 font-medium">Status</th>
                            <th className="text-left p-4 font-medium">Amount</th>
                            <th className="text-left p-4 font-medium">Date</th>
                            <th className="text-left p-4 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((submission: Submission) => (
                            <tr key={submission.id} className="border-b border-border">
                              <td className="p-4">
                                <div>
                                  <div className="font-medium">
                                    {submission.commonFields.firstName} {submission.commonFields.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {submission.commonFields.studentId}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 capitalize">{submission.type.replace('_', ' ')}</td>
                              <td className="p-4">
                                {submission.typeFields.researchTitle || 
                                 submission.typeFields.assignmentTopic || 
                                 'Untitled'}
                              </td>
                              <td className="p-4">{getStatusBadge(submission.status)}</td>
                              <td className="p-4 font-semibold">K{submission.amount}</td>
                              <td className="p-4 text-muted-foreground">
                                {new Date(submission.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm" data-testid={`button-view-submission-${submission.id}`}>
                                    <i className="fas fa-eye"></i>
                                  </Button>
                                  <Select 
                                    value={submission.status} 
                                    onValueChange={(value) => handleStatusUpdate(submission.id, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="under_review">Under Review</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-inbox text-4xl text-muted-foreground mb-4"></i>
                      <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
                      <p className="text-muted-foreground">Submissions will appear here when students submit work</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>User Management</CardTitle>
                    <div className="flex space-x-3">
                      <Button variant="outline">Export CSV</Button>
                      <Input placeholder="Search users..." className="w-64" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {users && users.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-medium">User</th>
                            <th className="text-left p-4 font-medium">Role</th>
                            <th className="text-left p-4 font-medium">School</th>
                            <th className="text-left p-4 font-medium">Points</th>
                            <th className="text-left p-4 font-medium">Joined</th>
                            <th className="text-left p-4 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((userItem: User) => (
                            <tr key={userItem.id} className="border-b border-border">
                              <td className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                                    {userItem.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                    <div className="font-medium">{userItem.displayName}</div>
                                    <div className="text-sm text-muted-foreground">{userItem.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge variant={userItem.role === 'admin' ? 'default' : 'outline'}>
                                  {userItem.role}
                                </Badge>
                              </td>
                              <td className="p-4">{userItem.school || 'Not specified'}</td>
                              <td className="p-4 font-semibold">{userItem.points || 0}</td>
                              <td className="p-4 text-muted-foreground">
                                {new Date(userItem.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm" data-testid={`button-view-user-${userItem.id}`}>
                                    <i className="fas fa-eye"></i>
                                  </Button>
                                  <Button variant="ghost" size="sm" data-testid={`button-edit-user-${userItem.id}`}>
                                    <i className="fas fa-edit"></i>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
                      <h3 className="text-lg font-semibold mb-2">No users found</h3>
                      <p className="text-muted-foreground">User accounts will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Materials Moderation</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingMaterials && pendingMaterials.length > 0 ? (
                    <div className="space-y-4">
                      {pendingMaterials.map((material: Material) => (
                        <div key={material.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-4 flex-1">
                            <i className="fas fa-file-pdf text-red-500 text-2xl"></i>
                            <div className="flex-1">
                              <h4 className="font-medium">{material.title}</h4>
                              <p className="text-sm text-muted-foreground mb-1">{material.description}</p>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span>{material.program}</span>
                                <span>•</span>
                                <span>{material.year}</span>
                                <span>•</span>
                                <span>{material.type.replace('_', ' ')}</span>
                                <span>•</span>
                                <span>{(material.file.size / 1024 / 1024).toFixed(2)} MB</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleMaterialModeration(material.id, 'published')}
                              data-testid={`button-approve-${material.id}`}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleMaterialModeration(material.id, 'rejected', 'Does not meet quality standards')}
                              data-testid={`button-reject-${material.id}`}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-check-circle text-4xl text-green-600 mb-4"></i>
                      <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                      <p className="text-muted-foreground">No materials pending moderation</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="announcements" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Create Announcement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        data-testid="input-announcement-title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Announcement title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="body">Message</Label>
                      <Textarea
                        id="body"
                        data-testid="textarea-announcement-body"
                        value={newAnnouncement.body}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, body: e.target.value }))}
                        placeholder="Announcement message"
                        rows={4}
                      />
                    </div>
                    <Button 
                      onClick={handleCreateAnnouncement} 
                      className="w-full"
                      data-testid="button-create-announcement"
                    >
                      Publish Announcement
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Announcements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {announcements && announcements.length > 0 ? (
                      <div className="space-y-4">
                        {announcements.map((announcement: Announcement) => (
                          <div key={announcement.id} className="p-4 border border-border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{announcement.title}</h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(announcement.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{announcement.body}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <i className="fas fa-bullhorn text-4xl text-muted-foreground mb-4"></i>
                        <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
                        <p className="text-muted-foreground">Create your first announcement to communicate with users</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input id="supportEmail" defaultValue="support@zedwriter.com" />
                    </div>
                    <div>
                      <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                      <Input id="whatsappNumber" defaultValue="+260 97 123 4567" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-4">Service Pricing</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="proposalPrice">Proposal Price (K)</Label>
                        <Input id="proposalPrice" type="number" defaultValue="500" />
                      </div>
                      <div>
                        <Label htmlFor="dissertationPrice">Dissertation Price (K)</Label>
                        <Input id="dissertationPrice" type="number" defaultValue="1000" />
                      </div>
                      <div>
                        <Label htmlFor="dataAnalysisPrice">Data Analysis Price (K)</Label>
                        <Input id="dataAnalysisPrice" type="number" defaultValue="400" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button data-testid="button-save-settings">Save Settings</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
};
