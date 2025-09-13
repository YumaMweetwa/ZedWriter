// Dashboard Manager
export class DashboardManager {
    constructor(app) {
        this.app = app;
        this.currentTab = 'overview';
        this.stats = {};
        this.submissions = [];
        this.announcements = [];
        this.profile = {};
        this.unsubscribers = [];
    }
    
    async init(params = {}) {
        if (!this.app.currentUser) {
            this.app.navigate('home');
            return;
        }
        
        try {
            await this.renderDashboard();
            await this.loadData();
            this.setupEventListeners();
            
            // Navigate to specific tab if provided
            if (params.tab) {
                this.showTab(params.tab);
            }
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.app.showToast('Failed to load dashboard', 'error');
        }
    }
    
    async renderDashboard() {
        const container = document.getElementById('page-dashboard');
        
        container.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <!-- Dashboard Header -->
                <div class="mb-8">
                    <h1 class="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p class="text-muted-foreground">Welcome back, <span id="user-name">${this.app.getFirstName(this.app.currentUser.displayName)}!</span></p>
                </div>

                <!-- Dashboard Tabs -->
                <div class="border-b border-border mb-8">
                    <nav class="-mb-px flex space-x-8">
                        <button data-tab="overview" class="tab-button border-b-2 border-primary text-primary py-2 px-1 text-sm font-medium">
                            Overview
                        </button>
                        <button data-tab="submissions" class="tab-button border-b-2 border-transparent text-muted-foreground hover:text-foreground py-2 px-1 text-sm font-medium transition-colors">
                            Submissions
                        </button>
                        <button data-tab="payments" class="tab-button border-b-2 border-transparent text-muted-foreground hover:text-foreground py-2 px-1 text-sm font-medium transition-colors">
                            Payments
                        </button>
                        <button data-tab="chat" class="tab-button border-b-2 border-transparent text-muted-foreground hover:text-foreground py-2 px-1 text-sm font-medium transition-colors">
                            <span>Chat</span>
                            <span id="unread-count" class="ml-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
                        </button>
                        <button data-tab="referrals" class="tab-button border-b-2 border-transparent text-muted-foreground hover:text-foreground py-2 px-1 text-sm font-medium transition-colors">
                            Referrals
                        </button>
                        <button data-tab="profile" class="tab-button border-b-2 border-transparent text-muted-foreground hover:text-foreground py-2 px-1 text-sm font-medium transition-colors">
                            Profile
                        </button>
                    </nav>
                </div>

                <!-- Tab Content -->
                <div id="dashboard-content">
                    <!-- Content will be loaded here -->
                </div>
            </div>
        `;
    }
    
    async loadData() {
        try {
            // Load user stats
            await this.loadStats();
            
            // Load recent submissions
            await this.loadSubmissions();
            
            // Load announcements
            await this.loadAnnouncements();
            
            // Load user profile
            await this.loadProfile();
            
            // Set up real-time listeners
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.app.showToast('Failed to load some data', 'error');
        }
    }
    
    async loadStats() {
        try {
            // Get user's submissions for stats
            const submissions = await this.app.getCollection('submissions', {
                where: [{ field: 'uid', operator: '==', value: this.app.currentUser.uid }]
            });
            
            this.stats = {
                totalSubmissions: submissions.length,
                activeSubmissions: submissions.filter(s => ['pending', 'in_progress'].includes(s.status)).length,
                completedSubmissions: submissions.filter(s => s.status === 'completed').length,
                inProgressSubmissions: submissions.filter(s => s.status === 'in_progress').length,
                balance: this.app.currentUser.balance || 0,
                referralPoints: this.app.currentUser.points || 0
            };
        } catch (error) {
            console.error('Error loading stats:', error);
            this.stats = {
                totalSubmissions: 0,
                activeSubmissions: 0,
                completedSubmissions: 0,
                inProgressSubmissions: 0,
                balance: 0,
                referralPoints: 0
            };
        }
    }
    
    async loadSubmissions() {
        try {
            this.submissions = await this.app.getCollection('submissions', {
                where: [{ field: 'uid', operator: '==', value: this.app.currentUser.uid }],
                orderBy: { field: 'createdAt', direction: 'desc' },
                limit: 10
            });
        } catch (error) {
            console.error('Error loading submissions:', error);
            this.submissions = [];
        }
    }
    
    async loadAnnouncements() {
        try {
            // Get all announcements
            const allAnnouncements = await this.app.getCollection('announcements', {
                orderBy: { field: 'createdAt', direction: 'desc' },
                limit: 5
            });
            
            // Get user's read announcements
            const readAnnouncements = await this.app.getCollection('announcement_reads', {
                where: [{ field: 'uid', operator: '==', value: this.app.currentUser.uid }]
            });
            
            const readIds = new Set(readAnnouncements.map(r => r.announcementId));
            
            this.announcements = allAnnouncements.map(announcement => ({
                ...announcement,
                isRead: readIds.has(announcement.id)
            }));
        } catch (error) {
            console.error('Error loading announcements:', error);
            this.announcements = [];
        }
    }
    
    async loadProfile() {
        try {
            this.profile = this.app.currentUser;
        } catch (error) {
            console.error('Error loading profile:', error);
            this.profile = this.app.currentUser;
        }
    }
    
    setupRealtimeListeners() {
        // Listen for submission updates
        this.listenToSubmissions();
        
        // Listen for new announcements
        this.listenToAnnouncements();
        
        // Listen for user updates
        this.listenToUserUpdates();
    }
    
    async listenToSubmissions() {
        try {
            const { collection, query, where, orderBy, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const submissionsRef = collection(this.app.db, 'submissions');
            const q = query(
                submissionsRef,
                where('uid', '==', this.app.currentUser.uid),
                orderBy('createdAt', 'desc')
            );
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                this.submissions = [];
                snapshot.forEach((doc) => {
                    this.submissions.push({ id: doc.id, ...doc.data() });
                });
                
                // Update stats
                this.loadStats();
                
                // Refresh current view if needed
                if (this.currentTab === 'overview' || this.currentTab === 'submissions') {
                    this.renderCurrentTab();
                }
            });
            
            this.unsubscribers.push(unsubscribe);
        } catch (error) {
            console.error('Error setting up submissions listener:', error);
        }
    }
    
    async listenToAnnouncements() {
        try {
            const { collection, orderBy, onSnapshot, query, limit } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const announcementsRef = collection(this.app.db, 'announcements');
            const q = query(announcementsRef, orderBy('createdAt', 'desc'), limit(5));
            
            const unsubscribe = onSnapshot(q, async (snapshot) => {
                // Get read announcements
                const readAnnouncements = await this.app.getCollection('announcement_reads', {
                    where: [{ field: 'uid', operator: '==', value: this.app.currentUser.uid }]
                });
                
                const readIds = new Set(readAnnouncements.map(r => r.announcementId));
                
                this.announcements = [];
                snapshot.forEach((doc) => {
                    const announcement = { id: doc.id, ...doc.data() };
                    announcement.isRead = readIds.has(announcement.id);
                    this.announcements.push(announcement);
                });
                
                // Update unread count
                this.updateUnreadCount();
                
                // Refresh view if needed
                if (this.currentTab === 'overview') {
                    this.renderCurrentTab();
                }
            });
            
            this.unsubscribers.push(unsubscribe);
        } catch (error) {
            console.error('Error setting up announcements listener:', error);
        }
    }
    
    async listenToUserUpdates() {
        try {
            const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userRef = doc(this.app.db, 'users', this.app.currentUser.uid);
            
            const unsubscribe = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    const userData = doc.data();
                    this.app.currentUser = { ...this.app.currentUser, ...userData };
                    this.profile = this.app.currentUser;
                    
                    // Update stats
                    this.loadStats();
                    
                    // Refresh current view if needed
                    this.renderCurrentTab();
                }
            });
            
            this.unsubscribers.push(unsubscribe);
        } catch (error) {
            console.error('Error setting up user listener:', error);
        }
    }
    
    updateUnreadCount() {
        const unreadCount = this.announcements.filter(a => !a.isRead).length;
        const countEl = document.getElementById('unread-count');
        
        if (countEl) {
            if (unreadCount > 0) {
                countEl.textContent = unreadCount;
                countEl.classList.remove('hidden');
            } else {
                countEl.classList.add('hidden');
            }
        }
    }
    
    setupEventListeners() {
        // Tab switching
        document.addEventListener('click', (e) => {
            const tabButton = e.target.closest('[data-tab]');
            if (tabButton && tabButton.closest('#page-dashboard')) {
                e.preventDefault();
                const tab = tabButton.dataset.tab;
                this.showTab(tab);
            }
        });
        
        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#page-dashboard')) return;
            
            if (e.target.closest('#new-submission-btn')) {
                this.app.navigate('submit');
            }
            
            if (e.target.closest('#generate-topic-btn')) {
                this.app.navigate('topic-generator');
            }
            
            if (e.target.closest('#refer-friend-btn')) {
                this.showReferralModal();
            }
            
            if (e.target.closest('.view-submission-btn')) {
                const submissionId = e.target.closest('.view-submission-btn').dataset.submissionId;
                this.showSubmissionDetails(submissionId);
            }
            
            if (e.target.closest('.mark-read-btn')) {
                const announcementId = e.target.closest('.mark-read-btn').dataset.announcementId;
                this.markAnnouncementRead(announcementId);
            }
        });
    }
    
    showTab(tab) {
        // Update tab buttons
        document.querySelectorAll('#page-dashboard .tab-button').forEach(button => {
            const buttonTab = button.dataset.tab;
            if (buttonTab === tab) {
                button.classList.remove('border-transparent', 'text-muted-foreground');
                button.classList.add('border-primary', 'text-primary');
            } else {
                button.classList.add('border-transparent', 'text-muted-foreground');
                button.classList.remove('border-primary', 'text-primary');
            }
        });
        
        this.currentTab = tab;
        this.renderCurrentTab();
    }
    
    async renderCurrentTab() {
        const container = document.getElementById('dashboard-content');
        if (!container) return;
        
        try {
            switch (this.currentTab) {
                case 'overview':
                    container.innerHTML = this.renderOverviewTab();
                    break;
                case 'submissions':
                    container.innerHTML = this.renderSubmissionsTab();
                    break;
                case 'payments':
                    container.innerHTML = this.renderPaymentsTab();
                    break;
                case 'chat':
                    container.innerHTML = this.renderChatTab();
                    break;
                case 'referrals':
                    container.innerHTML = this.renderReferralsTab();
                    break;
                case 'profile':
                    container.innerHTML = this.renderProfileTab();
                    break;
                default:
                    container.innerHTML = this.renderOverviewTab();
            }
        } catch (error) {
            console.error('Error rendering tab:', error);
            container.innerHTML = '<div class="text-center text-destructive">Failed to load content</div>';
        }
    }
    
    renderOverviewTab() {
        const unreadAnnouncements = this.announcements.filter(a => !a.isRead).length;
        
        return `
            <div class="space-y-8">
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-card border border-border rounded-lg p-6">
                        <div class="flex items-center">
                            <div class="p-2 rounded-lg bg-primary/10">
                                <i class="fas fa-file-alt text-primary"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-muted-foreground">Total Submissions</p>
                                <p class="text-2xl font-bold text-foreground">${this.stats.totalSubmissions}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-card border border-border rounded-lg p-6">
                        <div class="flex items-center">
                            <div class="p-2 rounded-lg bg-secondary/10">
                                <i class="fas fa-clock text-secondary"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-muted-foreground">In Progress</p>
                                <p class="text-2xl font-bold text-foreground">${this.stats.inProgressSubmissions}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-card border border-border rounded-lg p-6">
                        <div class="flex items-center">
                            <div class="p-2 rounded-lg bg-green-100">
                                <i class="fas fa-check-circle text-green-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-muted-foreground">Completed</p>
                                <p class="text-2xl font-bold text-foreground">${this.stats.completedSubmissions}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-card border border-border rounded-lg p-6">
                        <div class="flex items-center">
                            <div class="p-2 rounded-lg bg-yellow-100">
                                <i class="fas fa-coins text-yellow-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-muted-foreground">Referral Points</p>
                                <p class="text-2xl font-bold text-foreground">${this.stats.referralPoints}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid lg:grid-cols-3 gap-8">
                    <!-- Recent Submissions -->
                    <div class="lg:col-span-2">
                        <div class="bg-card border border-border rounded-lg p-6">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-lg font-semibold">Recent Submissions</h3>
                                <button data-tab="submissions" class="text-primary hover:text-primary/80 text-sm font-medium">View All</button>
                            </div>
                            
                            <div class="space-y-4">
                                ${this.submissions.slice(0, 5).map(submission => `
                                    <div class="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                        <div class="flex items-center justify-between">
                                            <div class="flex-1">
                                                <div class="flex items-center space-x-3">
                                                    <h5 class="font-medium">${submission.title || submission.type}</h5>
                                                    <span class="status-badge ${submission.status}">
                                                        ${this.formatStatus(submission.status)}
                                                    </span>
                                                </div>
                                                <div class="text-sm text-muted-foreground mt-1">
                                                    <span>${this.formatType(submission.type)}</span> • 
                                                    <span>${this.app.formatRelativeTime(submission.updatedAt)}</span> • 
                                                    <span>${this.app.formatCurrency(submission.amount || 0)}</span>
                                                </div>
                                            </div>
                                            <button class="view-submission-btn text-primary hover:text-primary/80" data-submission-id="${submission.id}">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                                
                                ${this.submissions.length === 0 ? `
                                    <div class="text-center py-8">
                                        <i class="fas fa-file-alt text-4xl text-muted-foreground mb-4"></i>
                                        <p class="text-muted-foreground mb-4">No submissions yet</p>
                                        <button id="new-submission-btn" class="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                                            Create First Submission
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions & Announcements -->
                    <div class="space-y-6">
                        <!-- Quick Actions -->
                        <div class="bg-card border border-border rounded-lg p-6">
                            <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
                            <div class="space-y-3">
                                <button id="new-submission-btn" class="w-full bg-primary text-primary-foreground p-3 rounded-lg hover:bg-primary/90 transition-colors text-left">
                                    <i class="fas fa-plus mr-2"></i>
                                    New Submission
                                </button>
                                <button id="generate-topic-btn" class="w-full border border-border text-foreground p-3 rounded-lg hover:bg-muted transition-colors text-left">
                                    <i class="fas fa-lightbulb mr-2"></i>
                                    Generate Topic
                                </button>
                                <button id="refer-friend-btn" class="w-full border border-border text-foreground p-3 rounded-lg hover:bg-muted transition-colors text-left">
                                    <i class="fas fa-share mr-2"></i>
                                    Refer a Friend
                                </button>
                            </div>
                        </div>

                        <!-- Announcements -->
                        <div class="bg-card border border-border rounded-lg p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-semibold">Announcements</h3>
                                ${unreadAnnouncements > 0 ? `<span class="bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs">${unreadAnnouncements} New</span>` : ''}
                            </div>
                            
                            <div class="space-y-3">
                                ${this.announcements.slice(0, 3).map(announcement => `
                                    <div class="p-3 rounded-lg ${announcement.isRead ? 'bg-muted/30' : 'bg-accent/10'}">
                                        <div class="flex items-start justify-between">
                                            <div class="flex-1">
                                                <h4 class="font-medium text-sm">${announcement.title}</h4>
                                                <p class="text-xs text-muted-foreground mt-1">${announcement.body}</p>
                                                <p class="text-xs text-muted-foreground mt-2">${this.app.formatRelativeTime(announcement.createdAt)}</p>
                                            </div>
                                            ${!announcement.isRead ? `
                                                <button class="mark-read-btn text-xs text-primary hover:text-primary/80" data-announcement-id="${announcement.id}">
                                                    Mark Read
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                                
                                ${this.announcements.length === 0 ? `
                                    <p class="text-muted-foreground text-sm text-center py-4">No announcements</p>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSubmissionsTab() {
        return `
            <div class="bg-card border border-border rounded-lg overflow-hidden">
                <div class="p-6 border-b border-border">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold">My Submissions</h3>
                        <button id="new-submission-btn" class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                            <i class="fas fa-plus mr-2"></i>
                            New Submission
                        </button>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-muted/50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Updated</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody class="bg-card divide-y divide-border">
                            ${this.submissions.map(submission => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">#${submission.id.slice(-6).toUpperCase()}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">${this.formatType(submission.type)}</td>
                                    <td class="px-6 py-4 text-sm text-muted-foreground">${submission.title || 'Untitled'}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="status-badge ${submission.status}">${this.formatStatus(submission.status)}</span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">${this.app.formatCurrency(submission.amount || 0)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">${this.app.formatRelativeTime(submission.updatedAt)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button class="view-submission-btn text-primary hover:text-primary/80" data-submission-id="${submission.id}">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    ${this.submissions.length === 0 ? `
                        <div class="text-center py-12">
                            <i class="fas fa-file-alt text-4xl text-muted-foreground mb-4"></i>
                            <h3 class="text-lg font-medium text-foreground mb-2">No submissions yet</h3>
                            <p class="text-muted-foreground mb-6">Get started by creating your first submission</p>
                            <button id="new-submission-btn" class="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
                                Create First Submission
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    renderPaymentsTab() {
        return `
            <div class="space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="bg-card border border-border rounded-lg p-6">
                        <h4 class="text-sm font-medium text-muted-foreground mb-2">Current Balance</h4>
                        <p class="text-2xl font-bold text-foreground">${this.app.formatCurrency(this.stats.balance)}</p>
                    </div>
                    <div class="bg-card border border-border rounded-lg p-6">
                        <h4 class="text-sm font-medium text-muted-foreground mb-2">Total Paid</h4>
                        <p class="text-2xl font-bold text-foreground">${this.app.formatCurrency(this.profile.totalPaid || 0)}</p>
                    </div>
                    <div class="bg-card border border-border rounded-lg p-6">
                        <h4 class="text-sm font-medium text-muted-foreground mb-2">Amount Owed</h4>
                        <p class="text-2xl font-bold text-foreground">${this.app.formatCurrency(this.profile.totalOwed || 0)}</p>
                    </div>
                </div>
                
                <div class="bg-card border border-border rounded-lg">
                    <div class="p-6 border-b border-border flex justify-between items-center">
                        <h3 class="text-lg font-semibold">Payment History</h3>
                        <button id="make-payment-btn" class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                            Make Payment
                        </button>
                    </div>
                    
                    <div class="p-6">
                        <div class="text-center py-8">
                            <i class="fas fa-credit-card text-4xl text-muted-foreground mb-4"></i>
                            <p class="text-muted-foreground">Payment history will appear here</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderChatTab() {
        return `
            <div class="bg-card border border-border rounded-lg h-96 flex flex-col">
                <div class="p-4 border-b border-border">
                    <h3 class="text-lg font-semibold">Chat with Admin</h3>
                </div>
                <div class="flex-1 p-4 overflow-y-auto">
                    <div class="text-center py-8">
                        <i class="fas fa-comments text-4xl text-muted-foreground mb-4"></i>
                        <p class="text-muted-foreground">Start a conversation with our support team</p>
                    </div>
                </div>
                <div class="p-4 border-t border-border">
                    <div class="flex space-x-2">
                        <input type="text" placeholder="Type your message..." class="flex-1 px-3 py-2 border border-border rounded-lg bg-background">
                        <button class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderReferralsTab() {
        const withdrawThreshold = 200;
        const pointsNeeded = Math.max(0, withdrawThreshold - this.stats.referralPoints);
        
        return `
            <div class="space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-card border border-border rounded-lg p-6">
                        <h4 class="text-lg font-semibold mb-4">Your Referral Stats</h4>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">Current Points:</span>
                                <span class="font-medium text-foreground">${this.stats.referralPoints}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">People Referred:</span>
                                <span class="font-medium text-foreground">${this.profile.totalReferrals || 0}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">Total Earned:</span>
                                <span class="font-medium text-foreground">${this.app.formatCurrency(this.stats.referralPoints)}</span>
                            </div>
                            <div class="pt-2 border-t border-border">
                                ${pointsNeeded > 0 ? 
                                    `<p class="text-sm text-muted-foreground">You need <span class="font-medium">${pointsNeeded} more points</span> to withdraw (minimum ${withdrawThreshold} points)</p>` :
                                    `<p class="text-sm text-primary font-medium">You can withdraw your earnings!</p>`
                                }
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-card border border-border rounded-lg p-6">
                        <h4 class="text-lg font-semibold mb-4">Share Your Link</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-muted-foreground mb-2">Your Referral Link</label>
                                <div class="flex">
                                    <input type="text" readonly value="https://zedwriter.zm/signup?ref=${this.profile.referralCode}" class="flex-1 px-3 py-2 border border-border rounded-l-lg bg-muted text-muted-foreground text-sm">
                                    <button id="copy-referral-btn" class="bg-primary text-primary-foreground px-4 py-2 rounded-r-lg hover:bg-primary/90 transition-colors">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <p class="text-sm text-muted-foreground">Share this link and earn:</p>
                                <ul class="text-xs text-muted-foreground mt-2 space-y-1">
                                    <li>• 2 points for each signup</li>
                                    <li>• 25 points when they pay for proposal</li>
                                    <li>• 50 points when they pay for dissertation</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-card border border-border rounded-lg">
                    <div class="p-6 border-b border-border">
                        <h3 class="text-lg font-semibold">Referral History</h3>
                    </div>
                    <div class="p-6">
                        <div class="text-center py-8">
                            <i class="fas fa-users text-4xl text-muted-foreground mb-4"></i>
                            <p class="text-muted-foreground">Referral history will appear here</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderProfileTab() {
        return `
            <div class="bg-card border border-border rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-6">Profile Settings</h3>
                
                <form id="profile-form" class="space-y-6">
                    <!-- Avatar Upload -->
                    <div class="flex items-center space-x-6">
                        <div class="w-24 h-24 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold">
                            ${this.app.getInitials(this.profile.displayName)}
                        </div>
                        <div>
                            <h4 class="text-sm font-medium text-foreground">Profile Picture</h4>
                            <p class="text-sm text-muted-foreground">JPG or PNG, max 1MB</p>
                            <button type="button" id="upload-avatar-btn" class="mt-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                                Change Picture
                            </button>
                            <input type="file" id="avatar-input" accept="image/*" class="hidden">
                        </div>
                    </div>

                    <!-- Personal Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-foreground mb-2">First Name</label>
                            <input type="text" id="profile-first-name" value="${this.profile.firstName || ''}" class="w-full px-3 py-2 border border-border rounded-lg bg-background">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-foreground mb-2">Last Name</label>
                            <input type="text" id="profile-last-name" value="${this.profile.lastName || ''}" class="w-full px-3 py-2 border border-border rounded-lg bg-background">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-foreground mb-2">Email Address</label>
                        <input type="email" id="profile-email" value="${this.profile.email || ''}" class="w-full px-3 py-2 border border-border rounded-lg bg-muted" readonly>
                        <p class="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                        <input type="tel" id="profile-phone" value="${this.profile.phone || ''}" class="w-full px-3 py-2 border border-border rounded-lg bg-background" placeholder="+260 97 123 4567">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-foreground mb-2">School/University</label>
                        <input type="text" id="profile-school" value="${this.profile.school || ''}" class="w-full px-3 py-2 border border-border rounded-lg bg-background" placeholder="University of Zambia">
                    </div>

                    <div class="flex justify-end space-x-4">
                        <button type="button" id="cancel-profile-btn" class="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                            Cancel
                        </button>
                        <button type="submit" id="save-profile-btn" class="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        `;
    }
    
    formatStatus(status) {
        const statusMap = {
            pending: 'Pending',
            in_progress: 'In Progress',
            under_review: 'Under Review',
            completed: 'Completed'
        };
        return statusMap[status] || status;
    }
    
    formatType(type) {
        const typeMap = {
            proposal: 'Research Proposal',
            dissertation: 'Dissertation',
            assignment: 'Assignment',
            data_analysis: 'Data Analysis',
            data_collection: 'Data Collection'
        };
        return typeMap[type] || type;
    }
    
    async markAnnouncementRead(announcementId) {
        try {
            await this.app.createDocument('announcement_reads', {
                announcementId,
                uid: this.app.currentUser.uid
            });
            
            // Update local state
            const announcement = this.announcements.find(a => a.id === announcementId);
            if (announcement) {
                announcement.isRead = true;
                this.updateUnreadCount();
                this.renderCurrentTab();
            }
        } catch (error) {
            console.error('Error marking announcement as read:', error);
            this.app.showToast('Failed to mark announcement as read', 'error');
        }
    }
    
    async showSubmissionDetails(submissionId) {
        // Implementation for showing submission details modal
        this.app.showToast('Submission details feature coming soon', 'info');
    }
    
    showReferralModal() {
        // Implementation for referral sharing modal
        this.app.showToast('Referral sharing feature coming soon', 'info');
    }
    
    cleanup() {
        // Unsubscribe from all real-time listeners
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
    }
}
