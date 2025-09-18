import { useState } from 'react';
import * as React from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { PaymentInfo } from '@/components/PaymentInfo';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Submission, User } from '@shared/types';
import { Navigation } from '../components/Navigation';
import { z } from 'zod';
import { CONTACT_INFO } from '@/utils/constants';
import { BackButton } from '@/components/BackButton';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();

  const { toast } = useToast();

  // Fetch user's submissions
  const { data: submissions = [], isLoading: submissionsLoading, error: submissionsError } = useQuery<Submission[]>({
    queryKey: ['/api/submissions'],
    enabled: !!user,
  });

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: ['/api/payments', user?.id],
    enabled: !!user,
  });

  // Fetch referrals
  const { data: referrals = [], isLoading: referralsLoading } = useQuery<any[]>({
    queryKey: ['/api/referrals', user?.id],
    enabled: !!user,
  });

  // Fetch announcements
  const { data: announcements = [], isLoading: announcementsLoading } = useQuery<any[]>({
    queryKey: ['/api/announcements'],
  });

  // Profile form schema
  const profileFormSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
    school: z.string().optional(),
  });

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      phone: profile?.phone || '',
      school: profile?.school || '',
    },
  });

  // Update form when profile loads
  React.useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
        school: profile.school || '',
      });
    }
  }, [profile]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      return await updateProfile({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || undefined,
        school: data.school || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Profile updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: `Failed to update profile: ${error.message}`, variant: 'destructive' });
    },
  });

  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };

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
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';
  };

  const getSubmissionStats = () => {
    const total = submissions.length;
    const active = submissions.filter((s: Submission) => s.status === 'in_progress' || s.status === 'pending').length;
    const completed = submissions.filter((s: Submission) => s.status === 'completed').length;
    
    return { total, active, completed };
  };

  const stats = getSubmissionStats();

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton />
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'User'}!
            </p>
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
                  <div className="text-2xl font-bold">0</div>
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
                  <div className="text-2xl font-bold">{formatCurrency(0)}</div>
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
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="submissions" data-testid="tab-submissions">Submissions</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat">Chat</TabsTrigger>
            <TabsTrigger value="referrals" data-testid="tab-referrals">Referrals</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Profile Details Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials(profile?.first_name, profile?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {profile?.first_name && profile?.last_name 
                        ? `${profile.first_name} ${profile.last_name}`
                        : user?.email || 'User'
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium" data-testid="profile-email">
                      {user?.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">School</Label>
                    <p className="font-medium" data-testid="profile-school">
                      {profile?.school || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p className="font-medium" data-testid="profile-phone">
                      {profile?.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Member Since</Label>
                    <p className="font-medium" data-testid="profile-member-since">
                      {formatDate(user?.created_at || new Date())}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href="#" onClick={(e) => {e.preventDefault(); const tabsElement = document.querySelector('[data-testid="tab-profile"]') as HTMLElement; tabsElement?.click();}}>
                    <Button variant="outline" size="sm" data-testid="edit-profile-button">
                      <i className="fas fa-edit mr-2"></i>Edit Profile
                    </Button>
                  </Link>
                  {user?.email === 'admin@zedwriter.com' && (
                    <Link href="/admin">
                      <Button variant="outline" size="sm" data-testid="admin-panel-button">
                        <i className="fas fa-cog mr-2"></i>Admin Panel
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

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
                                  <Badge className={getStatusColor(submission.status ?? 'pending')}>
                                    {(submission.status ?? 'pending').replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  <span>{submission.type.replace('_', ' ')}</span> • 
                                  <span> {formatDate(submission.createdAt ?? new Date())}</span> • 
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
                      {announcements.filter(a => !a.isRead).length > 0 && (
                        <Badge variant="destructive" data-testid="unread-announcements-count">
                          {announcements.filter(a => !a.isRead).length} New
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {announcementsLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-16 bg-muted rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : announcements.length > 0 ? (
                      <>
                        {announcements.slice(0, 2).map((announcement) => (
                          <div key={announcement.id} className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                            <h5 className="font-medium text-sm">{announcement.title}</h5>
                            <p className="text-xs text-muted-foreground mt-1">
                              {announcement.content}
                            </p>
                            <div className="text-xs text-muted-foreground mt-2">
                              {formatDate(announcement.createdAt!)}
                            </div>
                          </div>
                        ))}
                        
                        <Button variant="ghost" className="w-full text-sm" data-testid="view-all-announcements">
                          View All Announcements
                        </Button>
                      </>
                    ) : (
                      <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                        <h5 className="font-medium text-sm">Welcome to Zedwriter!</h5>
                        <p className="text-xs text-muted-foreground mt-1">
                          Get started by creating your first submission.
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatDate(new Date())}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Submissions</CardTitle>
                  <Link href="/submit">
                    <Button data-testid="create-new-submission">
                      <i className="fas fa-plus mr-2"></i>New Submission
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : submissions.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission) => (
                          <TableRow key={submission.id} data-testid={`submission-row-${submission.id}`}>
                            <TableCell className="font-medium">{submission.title || 'Untitled'}</TableCell>
                            <TableCell className="capitalize">{submission.type.replace('_', ' ')}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(submission.status ?? 'pending')}>
                                {(submission.status ?? 'pending').replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(submission.amount)}</TableCell>
                            <TableCell>{formatDate(submission.createdAt ?? new Date())}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" data-testid={`view-submission-details-${submission.id}`}>
                                  <i className="fas fa-eye mr-1"></i>View
                                </Button>
                                {((submission.amount || 0) - (submission.paidAmount || 0)) > 0 && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" data-testid={`pay-submission-${submission.id}`}>
                                        <i className="fas fa-credit-card mr-1"></i>Pay
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>Payment for: {submission.title || 'Submission'}</DialogTitle>
                                      </DialogHeader>
                                      <PaymentInfo
                                        workType={submission.type}
                                        paymentArrangement={submission.paymentArrangement || '50_50'}
                                        totalAmount={submission.amount || 0}
                                        paidAmount={submission.paidAmount || 0}
                                        submissionId={submission.id}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <i className="fas fa-file-alt text-6xl mb-4 text-muted-foreground/50"></i>
                    <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                    <p className="mb-4">Start by creating your first academic submission</p>
                    <Link href="/submit">
                      <Button data-testid="create-first-submission">
                        <i className="fas fa-plus mr-2"></i>Create First Submission
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History & Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(user?.totalPaid || 0)}</div>
                        <div className="text-sm text-muted-foreground">Total Paid</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(user?.totalOwed || 0)}</div>
                        <div className="text-sm text-muted-foreground">Total Owed</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(((user?.totalOwed ?? 0) - (user?.totalPaid ?? 0)))}
                        </div>
                        <div className="text-sm text-muted-foreground">Balance</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {paymentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : payments.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment, index) => (
                          <TableRow key={payment.id || index} data-testid={`payment-row-${payment.id || index}`}>
                            <TableCell>{formatDate(payment.createdAt!)}</TableCell>
                            <TableCell>{payment.description || 'Payment'}</TableCell>
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>
                              <Badge className={payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {payment.status?.toUpperCase() || 'PENDING'}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">{payment.method || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-credit-card text-4xl mb-4 text-muted-foreground/50"></i>
                    <p>No payment history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Chat with Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <i className="fab fa-whatsapp text-6xl mb-4 text-green-500"></i>
                  <h3 className="text-lg font-semibold mb-2">Connect with Admin</h3>
                  <p className="mb-4 text-muted-foreground">Get instant support through WhatsApp</p>
                  <a 
                    href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/[^\d]/g, '')}?text=Hello%20zedwriter%20`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button className="bg-green-500 hover:bg-green-600 text-white" data-testid="whatsapp-chat-button">
                      <i className="fab fa-whatsapp mr-2"></i>
                      Chat on WhatsApp
                    </Button>
                  </a>
                  <p className="text-sm text-muted-foreground mt-4">
                    Click to start a conversation with "Hello zedwriter" and add your message
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Referral Code Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Your Referral Code</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                        <code className="flex-1 text-lg font-mono" data-testid="referral-code">
                          {user?.referralCode || 'ZEDWRITER-' + user?.id?.slice(0, 8)}
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(user?.referralCode || '')}
                          data-testid="copy-referral-code"
                        >
                          <i className="fas fa-copy"></i>
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Share this code with friends to earn referral points!
                      </p>
                    </CardContent>
                  </Card>

                  {/* Referral Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Your Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Referral Points:</span>
                          <span className="font-bold text-primary" data-testid="referral-points">
                            {user?.referralPoints || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>People Referred:</span>
                          <span className="font-bold" data-testid="people-referred">
                            {referrals.length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Referred Users List */}
                {referralsLoading ? (
                  <div className="mt-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : referrals.length > 0 ? (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Referred Users</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Joined Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Points Earned</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referrals.map((referral, index) => (
                            <TableRow key={referral.id || index} data-testid={`referral-row-${referral.id || index}`}>
                              <TableCell>{referral.referredUserName || 'N/A'}</TableCell>
                              <TableCell>{referral.referredUserEmail || 'N/A'}</TableCell>
                              <TableCell>{formatDate(referral.createdAt!)}</TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800">
                                  {referral.status?.toUpperCase() || 'ACTIVE'}
                                </Badge>
                              </TableCell>
                              <TableCell>{referral.pointsEarned || 50}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 text-center py-8 text-muted-foreground">
                    <i className="fas fa-users text-4xl mb-4 text-muted-foreground/50"></i>
                    <p>No referrals yet - start sharing your code!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-6 mb-8">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {getUserInitials(profile?.first_name, profile?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {profile?.first_name && profile?.last_name 
                        ? `${profile.first_name} ${profile.last_name}`
                        : user?.email || 'User'
                      }
                    </h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <Button variant="outline" size="sm" className="mt-2" data-testid="change-avatar-button">
                      Change Picture
                    </Button>
                  </div>
                </div>
                
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter first name" {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter last name" {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+260 XXXXXXXXX" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="school"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School/University</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter school/university name" {...field} data-testid="input-school" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => profileForm.reset()}
                        data-testid="button-reset-profile"
                      >
                        Reset
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save mr-2"></i>
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>

                {/* Account Information */}
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email Address</Label>
                      <Input value={user?.email || ''} disabled className="mt-1" />
                      <p className="text-sm text-muted-foreground mt-1">
                        Email cannot be changed here. Contact support if needed.
                      </p>
                    </div>
                    <div>
                      <Label>Account Status</Label>
                      <div className="mt-1">
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Member Since</Label>
                      <Input value={formatDate(user?.created_at || new Date())} disabled className="mt-1" />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Input value="Student" disabled className="mt-1 capitalize" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
