import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { orderBy } from 'firebase/firestore';
import { Submission, User } from '@shared/schema';

export const AdminPage = () => {
  const { user } = useAuth();

  // Fetch all submissions
  const { data: submissions, loading: submissionsLoading } = useFirestoreCollection<Submission>(
    'submissions',
    [orderBy('createdAt', 'desc')]
  );

  // Fetch all users
  const { data: users, loading: usersLoading } = useFirestoreCollection<User>(
    'users',
    [orderBy('createdAt', 'desc')]
  );

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
      .reduce((sum, s) => sum + s.amount, 0);

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
          <p className="text-muted-foreground">Manage submissions, users, and system settings</p>
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
              <div className="mt-4 text-sm">
                <span className="text-primary">+12%</span>
                <span className="text-muted-foreground"> from last month</span>
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
              <div className="mt-4 text-sm">
                <span className="text-destructive">Needs attention</span>
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
              <div className="mt-4 text-sm">
                <span className="text-primary">+8%</span>
                <span className="text-muted-foreground"> from last month</span>
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
              <div className="mt-4 text-sm">
                <span className="text-primary">+15%</span>
                <span className="text-muted-foreground"> from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" data-testid="admin-tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions" data-testid="admin-tab-submissions">Submissions</TabsTrigger>
            <TabsTrigger value="users" data-testid="admin-tab-users">Users</TabsTrigger>
            <TabsTrigger value="messages" data-testid="admin-tab-messages">Messages</TabsTrigger>
            <TabsTrigger value="materials" data-testid="admin-tab-materials">Materials</TabsTrigger>
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
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status.replace('_', ' ')}
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
                      <span className="text-muted-foreground">Storage Used</span>
                      <span className="font-medium">2.4 GB / 10 GB</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Sessions</span>
                      <span className="font-medium">23</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Materials Pending</span>
                      <span className="font-medium text-destructive">5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Submissions</CardTitle>
                  <div className="flex space-x-3">
                    <select className="border border-border rounded-lg px-3 py-2 text-sm">
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="border border-border rounded-lg px-3 py-2 text-sm"
                      data-testid="admin-submissions-search"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
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
                      {submissions.slice(0, 10).map((submission) => (
                        <tr key={submission.id} className="border-b border-border">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">
                                {submission.requirements?.firstName} {submission.requirements?.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {submission.requirements?.email}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">{submission.type.replace('_', ' ')}</Badge>
                          </td>
                          <td className="p-4 max-w-xs truncate">{submission.title}</td>
                          <td className="p-4">
                            <Badge className={getStatusColor(submission.status)}>
                              {submission.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-4 font-medium">{formatCurrency(submission.amount)}</td>
                          <td className="p-4 text-muted-foreground">{formatDate(submission.createdAt!)}</td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" data-testid={`view-submission-${submission.id}`}>
                                <i className="fas fa-eye text-primary"></i>
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`edit-submission-${submission.id}`}>
                                <i className="fas fa-edit text-secondary"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <Button data-testid="export-users-csv">Export CSV</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-users text-4xl mb-4"></i>
                  <p>User management interface</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-comments text-4xl mb-4"></i>
                  <p>Messages management interface</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle>Materials Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-file-alt text-4xl mb-4"></i>
                  <p>Materials moderation interface</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-cog text-4xl mb-4"></i>
                  <p>System settings interface</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
