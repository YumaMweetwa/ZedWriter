// Main application entry point
import { initializeFirebase } from './firebase/config.js';
import { AuthManager } from './firebase/auth.js';
import { Navigation } from './components/Navigation.js';
import { SubmissionWizard } from './components/SubmissionWizard.js';
import { Dashboard } from './components/Dashboard.js';
import { MaterialsLibrary } from './components/MaterialsLibrary.js';
import { AdminPanel } from './components/AdminPanel.js';
import { Chat } from './components/Chat.js';
import { TopicGenerator } from './components/TopicGenerator.js';
import { showToast, showLoading, hideLoading } from './utils/ui.js';

class ZedwriterApp {
  constructor() {
    this.currentUser = null;
    this.currentPage = 'home';
    this.components = {};
    
    this.init();
  }

  async init() {
    try {
      showLoading('Initializing application...');
      
      // Initialize Firebase
      await initializeFirebase();
      
      // Initialize auth manager
      this.authManager = new AuthManager();
      this.authManager.onAuthStateChanged((user) => {
        this.handleAuthStateChange(user);
      });
      
      // Initialize components
      this.initializeComponents();
      
      // Setup routing
      this.setupRouting();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Handle initial route
      this.handleRoute();
      
      hideLoading();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      showToast('Failed to initialize application. Please refresh the page.', 'error');
      hideLoading();
    }
  }

  initializeComponents() {
    // Initialize navigation
    this.components.navigation = new Navigation();
    this.components.navigation.render();

    // Initialize other components
    this.components.submissionWizard = new SubmissionWizard();
    this.components.dashboard = new Dashboard();
    this.components.materialsLibrary = new MaterialsLibrary();
    this.components.adminPanel = new AdminPanel();
    this.components.chat = new Chat();
    this.components.topicGenerator = new TopicGenerator();
  }

  setupRouting() {
    // Handle browser navigation
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });

    // Handle hash changes
    window.addEventListener('hashchange', () => {
      this.handleRoute();
    });
  }

  setupEventListeners() {
    // Get started buttons
    document.addEventListener('click', (e) => {
      if (e.target.id === 'get-started-btn' || e.target.closest('#get-started-btn')) {
        this.navigateTo('submit');
      }

      // Pricing cards
      if (e.target.dataset.type) {
        this.navigateTo('submit', { type: e.target.dataset.type });
      }

      // Navigation links
      if (e.target.dataset.nav) {
        this.navigateTo(e.target.dataset.nav);
      }
    });

    // Form submissions
    document.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmission(e);
    });
  }

  handleRoute() {
    const hash = window.location.hash.slice(1);
    const [page, ...params] = hash.split('/');
    
    this.navigateTo(page || 'home', this.parseParams(params));
  }

  parseParams(params) {
    const result = {};
    params.forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        result[key] = decodeURIComponent(value);
      }
    });
    return result;
  }

  navigateTo(page, params = {}) {
    // Update URL
    const paramStr = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('/');
    
    const hash = paramStr ? `#${page}/${paramStr}` : `#${page}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }

    // Check authentication for protected routes
    const protectedRoutes = ['dashboard', 'submit'];
    const adminRoutes = ['admin'];

    if (protectedRoutes.includes(page) && !this.currentUser) {
      this.showAuthModal();
      return;
    }

    if (adminRoutes.includes(page) && (!this.currentUser || this.currentUser.role !== 'admin')) {
      showToast('Access denied. Admin privileges required.', 'error');
      this.navigateTo('home');
      return;
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

    // Show target page
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
      targetPage.classList.remove('hidden');
      this.currentPage = page;

      // Render component if needed
      this.renderPageComponent(page, params);
    } else {
      // Default to home
      document.getElementById('home-page').classList.remove('hidden');
      this.currentPage = 'home';
    }

    // Update navigation
    this.components.navigation.updateActiveState(page);
  }

  renderPageComponent(page, params) {
    switch (page) {
      case 'submit':
        this.components.submissionWizard.render(params);
        break;
      case 'dashboard':
        this.components.dashboard.render();
        break;
      case 'materials':
        this.components.materialsLibrary.render();
        break;
      case 'admin':
        this.components.adminPanel.render();
        break;
      case 'topic-generator':
        this.components.topicGenerator.render();
        break;
    }
  }

  handleAuthStateChange(user) {
    this.currentUser = user;
    
    // Update navigation
    this.components.navigation.updateAuthState(user);

    // Redirect if needed
    if (!user && ['dashboard', 'submit', 'admin'].includes(this.currentPage)) {
      this.navigateTo('home');
    }

    // Show chat widget for authenticated users
    if (user) {
      this.components.chat.showWidget();
    } else {
      this.components.chat.hideWidget();
    }
  }

  showAuthModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content bg-card border border-border rounded-xl p-8 max-w-md w-full mx-4">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-foreground mb-2">Sign In Required</h2>
          <p class="text-muted-foreground">Please sign in to access this feature</p>
        </div>
        
        <div class="space-y-4">
          <button id="google-signin" class="w-full btn btn-primary">
            <i class="fab fa-google mr-2"></i>
            Sign in with Google
          </button>
          
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>
          
          <form id="email-signin" class="space-y-4">
            <div>
              <input type="email" id="signin-email" placeholder="Email" required 
                     class="form-input" />
            </div>
            <div>
              <input type="password" id="signin-password" placeholder="Password" required 
                     class="form-input" />
            </div>
            <button type="submit" class="w-full btn btn-outline">
              Sign in with Email
            </button>
          </form>
          
          <div class="text-center">
            <button id="show-signup" class="text-primary hover:text-primary/80 text-sm">
              Don't have an account? Sign up
            </button>
          </div>
        </div>
        
        <button id="close-modal" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Event listeners
    modal.querySelector('#google-signin').addEventListener('click', () => {
      this.authManager.signInWithGoogle();
      modal.remove();
    });

    modal.querySelector('#email-signin').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = modal.querySelector('#signin-email').value;
      const password = modal.querySelector('#signin-password').value;
      
      try {
        await this.authManager.signInWithEmail(email, password);
        modal.remove();
        showToast('Signed in successfully!', 'success');
      } catch (error) {
        showToast(error.message, 'error');
      }
    });

    modal.querySelector('#close-modal').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  }

  async handleFormSubmission(e) {
    const form = e.target;
    const formType = form.dataset.type;

    switch (formType) {
      case 'submission':
        await this.components.submissionWizard.handleSubmission(form);
        break;
      case 'contact':
        await this.handleContactForm(form);
        break;
      default:
        console.log('Unknown form type:', formType);
    }
  }

  async handleContactForm(form) {
    try {
      showLoading('Sending message...');
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      // Here you would typically send to a contact endpoint
      console.log('Contact form data:', data);
      
      hideLoading();
      showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
      form.reset();
    } catch (error) {
      hideLoading();
      showToast('Failed to send message. Please try again.', 'error');
    }
  }
}

// Utility functions for UI
export function showToast(message, type = 'info', duration = 5000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle',
    warning: 'fas fa-exclamation-triangle'
  };

  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <i class="${icons[type]} mr-3"></i>
        <span>${message}</span>
      </div>
      <button class="ml-4 opacity-70 hover:opacity-100">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  toast.querySelector('button').addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, duration);
}

export function showLoading(message = 'Loading...') {
  const overlay = document.getElementById('loading-overlay');
  const title = document.getElementById('loading-title');
  const msg = document.getElementById('loading-message');
  
  title.textContent = 'Processing...';
  msg.textContent = message;
  overlay.classList.remove('hidden');
}

export function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('hidden');
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
