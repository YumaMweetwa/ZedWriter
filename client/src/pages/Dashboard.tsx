import { useState } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../hooks/use-auth';
import { useUserSubmissions, useUserPayments, useAnnouncements } from '../hooks/use-firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Chat } from '../components/Chat';
import { Link } from 'wouter';
import type { Submission, Payment, Announcement } from '../types';

export const Dashboard = () => {
  const { user } = useAuth();
  const { data: submissions, loading: submissionsLoading } = useUserSubmissions(user?.id);
  const { data: payments, loading: paymentsLoading } = useUserPayments(user?.id);
  const { data: announcements } = useAnnouncements();
  
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) return null;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      in_progress: 'default',
      under_review: 'secondary',
      completed: 'default'
    };
    
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

  const stats = {
    activeSubmissions: submissions?.filter((s: Submission) => ['pending', 'in_progress'].includes(s.status)).length || 0,
    completedSubmissions: submissions?.filter((s: Submission) => s.status === 'completed').length || 0,
    totalPaid: payments?.filter((p: Payment) => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0) || 0,
    pendingAmount: payments?.filter((p: Payment) => p.status === 'initiated').reduce((sum, p) => sum + p.amount, 0) || 0
  };

  const unreadAnnouncements = announcements?.slice(0, 2) || [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 data-testid="text-dashboard-title" className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p data-testid="text-dashboard-welcome" className="text-muted-foreground">
                Welcome back, {user.displayName?.split(' ')[0] || 'Student'}!
              </p>
            </div>
            <Link href="/submit-work">
              <Button data-testid="button-new-submission">
                <i className="fas fa-plus mr-2"></i>
                New Submission
              </Button>
            </Link>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div data-testid="text-stat-active" className="text-2xl font-bold">
                          {stats.activeSubmissions}
                        </div>
                        <div className="text-sm text-muted-foreground">Active Projects</div>
                      </div>
                      <i className="fas fa-tasks text-2xl text-primary"></i>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div data-testid="text-stat-completed" className="text-2xl font-bold">
                          {stats.completedSubmissions}
                        </div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                      <i className="fas fa-check-circle text-2xl text-green-600"></i>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div data-testid="text-stat-points" className="text-2xl font-bold">
                          {user.points || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Referral Points</div>
                      </div>
                      <i className="fas fa-star text-2xl text-yellow-600"></i>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div data-testid="text-stat-paid" className="text-2xl font-bold">
                          K{stats.totalPaid}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Paid</div>
                      </div>
                      <i className="fas fa-wallet text-2xl text-blue-600"></i>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Submissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {submissionsLoading ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      ) : submissions && submissions.length > 0 ? (
                        <div className="space-y-4">
                          {submissions.slice(0, 5).map((submission: Submission) => (
                            <div key={submission.id} className="border border-border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <h5 className="font-medium">
                                      {submission.typeFields.researchTitle || 
                                       submission.typeFields.assignmentTopic || 
                                       `${submission.type} submission`}
                                    </h5>
                                    {getStatusBadge(submission.status)}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    <span>{submission.type}</span> • 
                                    <span> {new Date(submission.updatedAt).toLocaleDateString()}</span> • 
                                    <span> K{submission.amount}</span>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" data-testid={`button-view-submission-${submission.id}`}>
                                  <i className="fas fa-eye"></i>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <i className="fas fa-inbox text-4xl text-muted-foreground mb-4"></i>
                          <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                          <p className="text-muted-foreground mb-4">Start your academic journey with us</p>
                          <Link href="/submit-work">
                            <Button>Create Your First Submission</Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Link href="/submit-work">
                        <Button data-testid="button-quick-new-submission" className="w-full justify-start">
                          <i className="fas fa-plus mr-2"></i>
                          New Submission
                        </Button>
                      </Link>
                      <Link href="/topic-generator">
                        <Button data-testid="button-quick-topic-generator" variant="outline" className="w-full justify-start">
                          <i className="fas fa-lightbulb mr-2"></i>
                          Generate Topic
                        </Button>
                      </Link>
                      <Link href="/materials">
                        <Button data-testid="button-quick-materials" variant="outline" className="w-full justify-start">
                          <i className="fas fa-book mr-2"></i>
                          Browse Materials
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Announcements */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Announcements
                        {unreadAnnouncements.length > 0 && (
                          <Badge variant="destructive">{unreadAnnouncements.length} New</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {unreadAnnouncements.length > 0 ? (
                        <div className="space-y-4">
                          {unreadAnnouncements.map((announcement: Announcement) => (
                            <div key={announcement.id} className="p-3 border border-border rounded-lg">
                              <h6 className="font-medium text-sm">{announcement.title}</h6>
                              <p className="text-xs text-muted-foreground mt-1">
                                {announcement.body.slice(0, 100)}...
                              </p>
                              <div className="text-xs text-muted-foreground mt-2">
                                {new Date(announcement.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No new announcements</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {submissionsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse border border-border rounded-lg p-4">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : submissions && submissions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-medium">ID</th>
                            <th className="text-left p-4 font-medium">Type</th>
                            <th className="text-left p-4 font-medium">Title</th>
                            <th className="text-left p-4 font-medium">Status</th>
                            <th className="text-left p-4 font-medium">Amount</th>
                            <th className="text-left p-4 font-medium">Updated</th>
                            <th className="text-left p-4 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((submission: Submission) => (
                            <tr key={submission.id} className="border-b border-border">
                              <td className="p-4 font-mono text-sm">#{submission.id.slice(-6)}</td>
                              <td className="p-4 capitalize">{submission.type.replace('_', ' ')}</td>
                              <td className="p-4">
                                {submission.typeFields.researchTitle || 
                                 submission.typeFields.assignmentTopic || 
                                 'Untitled'}
                              </td>
                              <td className="p-4">{getStatusBadge(submission.status)}</td>
                              <td className="p-4 font-semibold">K{submission.amount}</td>
                              <td className="p-4 text-muted-foreground">
                                {new Date(submission.updatedAt).toLocaleDateString()}
                              </td>
                              <td className="p-4">
                                <Button variant="ghost" size="sm" data-testid={`button-view-${submission.id}`}>
                                  <i className="fas fa-eye"></i>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <i className="fas fa-inbox text-6xl text-muted-foreground mb-4"></i>
                      <h3 className="text-xl font-semibold mb-2">No submissions found</h3>
                      <p className="text-muted-foreground mb-6">Ready to start your first project?</p>
                      <Link href="/submit-work">
                        <Button>Submit Your First Work</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-medium text-muted-foreground mb-2">Total Paid</h4>
                    <p data-testid="text-payment-total" className="text-2xl font-bold text-foreground">K{stats.totalPaid}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-medium text-muted-foreground mb-2">Pending</h4>
                    <p data-testid="text-payment-pending" className="text-2xl font-bold text-yellow-600">K{stats.pendingAmount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Button data-testid="button-make-payment" className="w-full">
                      Make Payment
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse border border-border rounded-lg p-4">
                          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : payments && payments.length > 0 ? (
                    <div className="space-y-4">
                      {payments.map((payment: Payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <i className={`fas ${payment.method === 'mobile_money' ? 'fa-mobile-alt' : 'fa-university'} text-primary`}></i>
                            </div>
                            <div>
                              <div className="font-medium">
                                {payment.method === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(payment.createdAt).toLocaleDateString()} • Ref: {payment.providerRef}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">K{payment.amount}</div>
                            <Badge className={payment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-credit-card text-4xl text-muted-foreground mb-4"></i>
                      <h3 className="text-lg font-semibold mb-2">No payment history</h3>
                      <p className="text-muted-foreground">Your payment transactions will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat">
              <Card className="h-[600px]">
                <Chat />
              </Card>
            </TabsContent>

            <TabsContent value="referrals" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Referral Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div data-testid="text-referral-points" className="text-3xl font-bold text-primary">{user.points || 0}</div>
                      <div className="text-muted-foreground">Total Points</div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {user.points && user.points >= 200 ? (
                        <Button className="mt-4">Request Payout</Button>
                      ) : (
                        <p>{(200 - (user.points || 0))} points needed to withdraw (min. 200)</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Share Your Link</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Your Referral Link</Label>
                      <div className="flex mt-2">
                        <Input 
                          data-testid="input-referral-link"
                          readOnly 
                          value={`https://zedwriter.com/signup?ref=${user.referralCode}`} 
                          className="rounded-r-none" 
                        />
                        <Button 
                          data-testid="button-copy-referral"
                          variant="outline" 
                          className="rounded-l-none"
                          onClick={() => navigator.clipboard.writeText(`https://zedwriter.com/signup?ref=${user.referralCode}`)}
                        >
                          <i className="fas fa-copy"></i>
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Share this link and earn:</p>
                      <ul className="mt-2 space-y-1">
                        <li>• 2 points for each signup</li>
                        <li>• 25 points when they pay for proposal</li>
                        <li>• 50 points when they pay for dissertation</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="text-lg">
                        {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">Profile Picture</h4>
                      <p className="text-sm text-muted-foreground">JPG or PNG, max 1MB</p>
                      <Button data-testid="button-upload-avatar" variant="outline" size="sm" className="mt-2">
                        Change Picture
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input data-testid="input-display-name" id="displayName" defaultValue={user.displayName} />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input data-testid="input-email-profile" id="email" defaultValue={user.email} readOnly />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input data-testid="input-phone-profile" id="phone" defaultValue={user.phone} />
                    </div>
                    <div>
                      <Label htmlFor="school">School/University</Label>
                      <Input data-testid="input-school-profile" id="school" defaultValue={user.school} />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button variant="outline">Cancel</Button>
                    <Button data-testid="button-save-profile">Save Changes</Button>
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
