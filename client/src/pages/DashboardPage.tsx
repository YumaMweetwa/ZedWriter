import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { where, orderBy } from 'firebase/firestore';
import { Submission } from '@shared/schema';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [unreadCount] = useState(2);

  // Fetch user's submissions
  const { data: submissions, loading: submissionsLoading } = useFirestoreCollection<Submission>(
    'submissions',
    user ? [where('userId', '==', user.id), orderBy('createdAt', 'desc')] : []
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access your dashboard.</p>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getSubmissionStats = () => {
    const total = submissions.length;
    const active = submissions.filter(s => s.status === 'in_progress' || s.status === 'pending').length;
    const completed = submissions.filter(s => s.status === 'completed').length;
    
    return { total, active, completed };
  };

  const stats = getSubmissionStats();

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.firstName}!</p>
          </div>
          <Link href="/submit">
            <Button data-testid="new-submission-button">
              <i className="fas fa-plus mr-2"></i>New Submission
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card data-testid="stat-active-projects">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.active}</div>
                  <div className="text-sm text-muted-foreground">Active Projects</div>
                </div>
                <i className="fas fa-tasks text-2xl text-primary"></i>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-completed">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <i className="fas fa-check-circle text-2xl text-green-600"></i>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-referral-points">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{user.referralPoints || 0}</div>
                  <div className="text-sm text-muted-foreground">Referral Points</div>
                </div>
                <i className="fas fa-star text-2xl text-yellow-600"></i>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-balance">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(user.totalOwed - user.totalPaid)}</div>
                  <div className="text-sm text-muted-foreground">Account Balance</div>
                </div>
                <i className="fas fa-wallet text-2xl text-blue-600"></i>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions" data-testid="tab-submissions">Submissions</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat">Chat</TabsTrigger>
            <TabsTrigger value="referrals" data-testid="tab-referrals">Referrals</TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Recent Submissions */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Submissions</CardTitle>
                      <Link href="#" className="text-primary hover:text-primary/80 text-sm">
                        View All
                      </Link>
                    </div>
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
                    ) : submissions.length > 0 ? (
                      <div className="space-y-4">
                        {submissions.slice(0, 3).map((submission) => (
                          <div 
                            key={submission.id} 
                            className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                            data-testid={`submission-${submission.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <h5 className="font-medium">{submission.title}</h5>
                                  <Badge className={getStatusColor(submission.status)}>
                                    {submission.status.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  <span>{submission.type.replace('_', ' ')}</span> • 
                                  <span> {formatDate(submission.createdAt!)}</span> • 
                                  <span> {formatCurrency(submission.amount)}</span>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" data-testid={`view-submission-${submission.id}`}>
                                <i className="fas fa-eye"></i>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <i className="fas fa-file-alt text-4xl mb-4"></i>
                        <p>No submissions yet</p>
                        <Link href="/submit">
                          <Button className="mt-4">Create Your First Submission</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Announcements */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/submit">
                      <Button className="w-full justify-start" data-testid="quick-action-new-submission">
                        <i className="fas fa-plus mr-2"></i>New Submission
                      </Button>
                    </Link>
                    <Link href="/topic-generator">
                      <Button variant="outline" className="w-full justify-start" data-testid="quick-action-generate-topic">
                        <i className="fas fa-lightbulb mr-2"></i>Generate Topic
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full justify-start" data-testid="quick-action-refer-friend">
                      <i className="fas fa-share mr-2"></i>Refer a Friend
                    </Button>
                  </CardContent>
                </Card>

                {/* Announcements */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Announcements</CardTitle>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" data-testid="unread-announcements-count">
                          {unreadCount} New
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                      <h5 className="font-medium text-sm">Special Pricing Extended!</h5>
                      <p className="text-xs text-muted-foreground mt-1">
                        Our dissertation discount has been extended until January 31st.
                      </p>
                      <div className="text-xs text-muted-foreground mt-2">January 10, 2024</div>
                    </div>
                    
                    <Button variant="ghost" className="w-full text-sm" data-testid="view-all-announcements">
                      View All Announcements
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Other tabs content would be implemented similarly */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>My Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Submissions table implementation */}
                <div className="text-center py-8 text-muted-foreground">
                  <p>Submissions management interface</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Payment management interface</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Chat with Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chat interface</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Referral management interface</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-6 mb-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user.profilePicture || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {getUserInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{user.firstName} {user.lastName}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    <Button variant="outline" size="sm" className="mt-2" data-testid="change-avatar-button">
                      Change Picture
                    </Button>
                  </div>
                </div>
                
                <div className="text-center py-8 text-muted-foreground">
                  <p>Profile management interface</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
