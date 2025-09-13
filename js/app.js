// Main application controller
class ZedwriterApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.pages = {};
        this.auth = null;
        this.db = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Wait for Firebase to be ready
            await this.waitForFirebase();
            
            // Initialize Firebase services
            this.auth = window.auth;
            this.db = window.db;
            this.storage = window.storage;
            this.functions = window.functions;
            
            // Initialize auth system
            await this.initAuth();
            
            // Initialize page managers
            this.initPages();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize navigation
            this.initNavigation();
            
            // Handle initial route
            this.handleInitialRoute();
            
            console.log('Zedwriter app initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showToast('Failed to initialize application', 'error');
        }
    }
    
    async waitForFirebase() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        while (!window.auth && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.auth) {
            throw new Error('Firebase failed to initialize');
        }
    }
    
    async initAuth() {
        const { AuthManager } = await import('./auth.js');
        this.authManager = new AuthManager(this);
        await this.authManager.init();
    }
    
    async initPages() {
        // Initialize page managers
        const modules = await Promise.all([
            import('./dashboard.js'),
            import('./submissions.js'),
            import('./materials.js'),
            import('./admin.js'),
            import('./chat.js'),
            import('./payments.js'),
            import('./referrals.js'),
            import('./topic-generator.js')
        ]);
        
        const [
            { DashboardManager },
            { SubmissionsManager },
            { MaterialsManager },
            { AdminManager },
            { ChatManager },
            { PaymentsManager },
            { ReferralsManager },
            { TopicGeneratorManager }
        ] = modules;
        
        this.pages = {
            dashboard: new DashboardManager(this),
            submit: new SubmissionsManager(this),
            materials: new MaterialsManager(this),
            admin: new AdminManager(this),
            chat: new ChatManager(this),
            payments: new PaymentsManager(this),
            referrals: new ReferralsManager(this),
            'topic-generator': new TopicGeneratorManager(this)
        };
    }
    
    setupEventListeners() {
        // Navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigate(page);
            }
        });
        
        // Pricing CTAs
        document.addEventListener('click', (e) => {
            const cta = e.target.closest('.pricing-cta');
            if (cta) {
                e.preventDefault();
                const type = cta.dataset.type;
                this.navigate('submit', { preselectedType: type });
            }
        });
        
        // Hero buttons
        document.getElementById('hero-get-started')?.addEventListener('click', () => {
            if (this.currentUser) {
                this.navigate('submit');
            } else {
                this.authManager.showSignUpModal();
            }
        });
        
        document.getElementById('hero-view-pricing')?.addEventListener('click', () => {
            this.navigate('pricing');
        });
        
        // Mobile menu toggle
        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        // User menu toggle
        document.getElementById('user-menu-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleUserMenu();
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || this.getPageFromHash();
            this.navigate(page, null, false);
        });
    }
    
    initNavigation() {
        // Update nav links based on current page
        this.updateNavigation();
    }
    
    handleInitialRoute() {
        const page = this.getPageFromHash() || 'home';
        this.navigate(page, null, false);
    }
    
    getPageFromHash() {
        const hash = window.location.hash.slice(1);
        return hash || 'home';
    }
    
    async navigate(page, params = null, updateHistory = true) {
        try {
            // Show loading if navigating to a complex page
            if (['dashboard', 'admin', 'materials'].includes(page)) {
                this.showLoading('Loading...');
            }
            
            // Hide current page
            document.querySelectorAll('.page-content').forEach(el => {
                el.classList.add('hidden');
            });
            
            // Check authentication requirements
            if (this.requiresAuth(page) && !this.currentUser) {
                this.authManager.showSignInModal();
                return;
            }
            
            // Check admin requirements
            if (this.requiresAdmin(page) && !this.isAdmin()) {
                this.showToast('Access denied. Admin privileges required.', 'error');
                this.navigate('dashboard');
                return;
            }
            
            // Show target page
            const pageElement = document.getElementById(`page-${page}`);
            if (pageElement) {
                pageElement.classList.remove('hidden');
            }
            
            // Initialize page manager if exists
            if (this.pages[page]) {
                await this.pages[page].init(params);
            }
            
            // Update current page
            this.currentPage = page;
            
            // Update navigation
            this.updateNavigation();
            
            // Update URL
            if (updateHistory) {
                const url = page === 'home' ? '#' : `#${page}`;
                window.history.pushState({ page }, '', url);
            }
            
            // Update page title
            this.updatePageTitle(page);
            
            this.hideLoading();
            
        } catch (error) {
            console.error('Navigation error:', error);
            this.showToast('Failed to load page', 'error');
            this.hideLoading();
        }
    }
    
    requiresAuth(page) {
        return ['dashboard', 'submit', 'chat', 'payments', 'referrals', 'topic-generator'].includes(page);
    }
    
    requiresAdmin(page) {
        return ['admin'].includes(page);
    }
    
    isAdmin() {
        return this.currentUser?.role === 'admin';
    }
    
    updateNavigation() {
        // Update nav link active states
        document.querySelectorAll('.nav-link').forEach(link => {
            const page = link.dataset.page;
            if (page === this.currentPage) {
                link.classList.add('active');
                link.classList.remove('text-muted-foreground');
                link.classList.add('text-primary');
            } else {
                link.classList.remove('active');
                link.classList.add('text-muted-foreground');
                link.classList.remove('text-primary');
            }
        });
        
        // Show/hide admin link based on user role
        const adminLinks = document.querySelectorAll('[data-page="admin"]');
        adminLinks.forEach(link => {
            if (this.isAdmin()) {
                link.classList.remove('hidden');
            } else {
                link.classList.add('hidden');
            }
        });
    }
    
    updatePageTitle(page) {
        const titles = {
            home: 'Zedwriter - Student Research Assistance Platform for Zambia',
            pricing: 'Pricing - Zedwriter',
            submit: 'Submit Work - Zedwriter',
            dashboard: 'Dashboard - Zedwriter',
            materials: 'Study Materials - Zedwriter',
            admin: 'Admin Panel - Zedwriter',
            chat: 'Chat Support - Zedwriter',
            'topic-generator': 'Topic Generator - Zedwriter'
        };
        
        document.title = titles[page] || 'Zedwriter';
    }
    
    toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }
    
    toggleUserMenu() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }
    
    closeAllDropdowns() {
        document.getElementById('user-dropdown')?.classList.add('hidden');
        document.getElementById('mobile-menu')?.classList.add('hidden');
    }
    
    updateAuthUI() {
        const signedOutEl = document.getElementById('auth-signed-out');
        const signedInEl = document.getElementById('auth-signed-in');
        const userAvatarEl = document.getElementById('user-avatar');
        const userGreetingEl = document.getElementById('user-greeting');
        
        if (this.currentUser) {
            signedOutEl?.classList.add('hidden');
            signedInEl?.classList.remove('hidden');
            
            // Update user info
            if (userAvatarEl) {
                userAvatarEl.textContent = this.getInitials(this.currentUser.displayName);
            }
            if (userGreetingEl) {
                userGreetingEl.textContent = `Hi, ${this.getFirstName(this.currentUser.displayName)}`;
            }
        } else {
            signedOutEl?.classList.remove('hidden');
            signedInEl?.classList.add('hidden');
        }
        
        this.updateNavigation();
    }
    
    getInitials(name) {
        if (!name) return 'U';
        const parts = name.split(' ');
        return parts.map(part => part.charAt(0).toUpperCase()).join('').slice(0, 2);
    }
    
    getFirstName(name) {
        if (!name) return 'User';
        return name.split(' ')[0];
    }
    
    showLoading(title = 'Loading...', message = 'Please wait...') {
        const overlay = document.getElementById('loading-overlay');
        const titleEl = document.getElementById('loading-title');
        const messageEl = document.getElementById('loading-message');
        
        if (overlay) {
            overlay.classList.remove('hidden');
            if (titleEl) titleEl.textContent = title;
            if (messageEl) messageEl.textContent = message;
        }
    }
    
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
    
    showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
        
        toast.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas ${icon} mr-3"></i>
                    <span>${message}</span>
                </div>
                <button class="ml-4 opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    }
    
    // Utility methods for Firebase operations
    async createDocument(collection, data, id = null) {
        try {
            const { doc, setDoc, addDoc, collection: firestoreCollection, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const docData = {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            if (id) {
                const docRef = doc(this.db, collection, id);
                await setDoc(docRef, docData);
                return { id, ...docData };
            } else {
                const colRef = firestoreCollection(this.db, collection);
                const docRef = await addDoc(colRef, docData);
                return { id: docRef.id, ...docData };
            }
        } catch (error) {
            console.error('Error creating document:', error);
            throw error;
        }
    }
    
    async updateDocument(collection, id, data) {
        try {
            const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const docRef = doc(this.db, collection, id);
            const updateData = {
                ...data,
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(docRef, updateData);
            return updateData;
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    }
    
    async getDocument(collection, id) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const docRef = doc(this.db, collection, id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting document:', error);
            throw error;
        }
    }
    
    async getCollection(collectionName, queryOptions = {}) {
        try {
            const { collection, getDocs, query, where, orderBy, limit } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            let q = collection(this.db, collectionName);
            
            // Apply query options
            if (queryOptions.where) {
                for (const condition of queryOptions.where) {
                    q = query(q, where(condition.field, condition.operator, condition.value));
                }
            }
            
            if (queryOptions.orderBy) {
                q = query(q, orderBy(queryOptions.orderBy.field, queryOptions.orderBy.direction || 'asc'));
            }
            
            if (queryOptions.limit) {
                q = query(q, limit(queryOptions.limit));
            }
            
            const querySnapshot = await getDocs(q);
            const results = [];
            
            querySnapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() });
            });
            
            return results;
        } catch (error) {
            console.error('Error getting collection:', error);
            throw error;
        }
    }
    
    // File upload utility
    async uploadFile(file, path) {
        try {
            const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
            
            const storageRef = ref(this.storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            return {
                path: snapshot.ref.fullPath,
                name: file.name,
                size: file.size,
                contentType: file.type,
                downloadURL
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
    
    // Validation utilities
    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    validateZambiaPhone(phone) {
        // Zambia phone numbers start with +260
        const regex = /^\+260[0-9]{9}$|^0[0-9]{9}$/;
        return regex.test(phone);
    }
    
    formatCurrency(amount) {
        return `K${amount.toLocaleString()}`;
    }
    
    formatDate(date) {
        if (!date) return '';
        
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    formatRelativeTime(date) {
        if (!date) return '';
        
        const d = date.toDate ? date.toDate() : new Date(date);
        const now = new Date();
        const diff = now - d;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }
    
    // Generate referral code
    generateReferralCode(name, id) {
        const nameCode = name.replace(/\s+/g, '').toUpperCase().slice(0, 3);
        const idCode = id.slice(-4);
        return `${nameCode}${idCode}`;
    }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.zedwriterApp = new ZedwriterApp();
    });
} else {
    window.zedwriterApp = new ZedwriterApp();
}

export { ZedwriterApp };
