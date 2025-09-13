// Authentication Manager
export class AuthManager {
    constructor(app) {
        this.app = app;
        this.auth = null;
        this.db = null;
    }
    
    async init() {
        this.auth = this.app.auth;
        this.db = this.app.db;
        
        // Set up auth state listener
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        
        onAuthStateChanged(this.auth, async (user) => {
            await this.handleAuthStateChange(user);
        });
        
        // Set up auth modal event listeners
        this.setupAuthModal();
        
        // Handle redirect result for Google sign-in
        await this.handleRedirectResult();
    }
    
    async handleAuthStateChange(user) {
        if (user) {
            // User is signed in
            const userDoc = await this.getUserDocument(user.uid);
            
            if (!userDoc) {
                // Create user document if it doesn't exist
                await this.createUserDocument(user);
            }
            
            // Update current user
            this.app.currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || userDoc?.displayName || 'User',
                role: userDoc?.role || 'user',
                ...userDoc
            };
            
            console.log('User signed in:', this.app.currentUser);
        } else {
            // User is signed out
            this.app.currentUser = null;
            console.log('User signed out');
        }
        
        // Update UI
        this.app.updateAuthUI();
        
        // Redirect to appropriate page
        if (user && this.app.currentPage === 'home') {
            this.app.navigate('dashboard');
        } else if (!user && this.app.requiresAuth(this.app.currentPage)) {
            this.app.navigate('home');
        }
    }
    
    async getUserDocument(uid) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userDoc = doc(this.db, 'users', uid);
            const userSnap = await getDoc(userDoc);
            
            if (userSnap.exists()) {
                return userSnap.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting user document:', error);
            return null;
        }
    }
    
    async createUserDocument(user, additionalData = {}) {
        try {
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userDoc = doc(this.db, 'users', user.uid);
            const referralCode = this.app.generateReferralCode(user.displayName || user.email, user.uid);
            
            // Check for referral code in URL
            const urlParams = new URLSearchParams(window.location.search);
            const referredBy = urlParams.get('ref');
            
            const userData = {
                displayName: user.displayName || additionalData.displayName || '',
                email: user.email,
                phone: additionalData.phone || '',
                school: additionalData.school || '',
                role: 'user',
                avatarUrl: user.photoURL || '',
                referralCode,
                referredBy: referredBy || null,
                points: 0,
                payoutMethod: '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                ...additionalData
            };
            
            await setDoc(userDoc, userData);
            
            // Award referral points if referred
            if (referredBy) {
                await this.awardReferralPoints(referredBy, 'signup', user.uid);
            }
            
            return userData;
        } catch (error) {
            console.error('Error creating user document:', error);
            throw error;
        }
    }
    
    async awardReferralPoints(referralCode, event, sourceUid) {
        try {
            // Find referrer by code
            const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('referralCode', '==', referralCode));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                console.log('Referrer not found:', referralCode);
                return;
            }
            
            const referrerDoc = querySnapshot.docs[0];
            const referrerUid = referrerDoc.id;
            
            // Point values
            const pointValues = {
                signup: 2,
                proposal_paid: 25,
                dissertation_paid: 50
            };
            
            const points = pointValues[event] || 0;
            
            if (points > 0) {
                // Check if already awarded for this event and user
                const { httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
                const awardReferralPoints = httpsCallable(this.app.functions, 'awardReferralPoints');
                
                await awardReferralPoints({
                    referrerUid,
                    event,
                    points,
                    sourceUid
                });
            }
        } catch (error) {
            console.error('Error awarding referral points:', error);
        }
    }
    
    setupAuthModal() {
        // Sign in button
        document.getElementById('sign-in-btn')?.addEventListener('click', () => {
            this.showSignInModal();
        });
        
        // Sign up button
        document.getElementById('sign-up-btn')?.addEventListener('click', () => {
            this.showSignUpModal();
        });
        
        // Modal toggle buttons
        document.getElementById('show-sign-up')?.addEventListener('click', () => {
            this.showSignUpForm();
        });
        
        document.getElementById('show-sign-in')?.addEventListener('click', () => {
            this.showSignInForm();
        });
        
        // Close modal
        document.getElementById('close-auth-modal')?.addEventListener('click', () => {
            this.hideAuthModal();
        });
        
        // Email sign in
        document.getElementById('email-sign-in-btn')?.addEventListener('click', () => {
            this.signInWithEmail();
        });
        
        // Email sign up
        document.getElementById('email-sign-up-btn')?.addEventListener('click', () => {
            this.signUpWithEmail();
        });
        
        // Google sign in
        document.getElementById('google-sign-in-btn')?.addEventListener('click', () => {
            this.signInWithGoogle();
        });
        
        // Google sign up
        document.getElementById('google-sign-up-btn')?.addEventListener('click', () => {
            this.signInWithGoogle(); // Same as sign in
        });
        
        // Sign out
        document.getElementById('sign-out-btn')?.addEventListener('click', () => {
            this.signOut();
        });
        
        // Close modal when clicking outside
        document.getElementById('auth-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'auth-modal') {
                this.hideAuthModal();
            }
        });
        
        // Enter key handling for forms
        document.getElementById('sign-in-email')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.signInWithEmail();
        });
        
        document.getElementById('sign-in-password')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.signInWithEmail();
        });
    }
    
    showSignInModal() {
        this.showSignInForm();
        this.showAuthModal();
    }
    
    showSignUpModal() {
        this.showSignUpForm();
        this.showAuthModal();
    }
    
    showAuthModal() {
        document.getElementById('auth-modal')?.classList.remove('hidden');
    }
    
    hideAuthModal() {
        document.getElementById('auth-modal')?.classList.add('hidden');
        this.clearFormErrors();
    }
    
    showSignInForm() {
        document.getElementById('sign-in-form')?.classList.remove('hidden');
        document.getElementById('sign-up-form')?.classList.add('hidden');
        this.clearFormErrors();
    }
    
    showSignUpForm() {
        document.getElementById('sign-in-form')?.classList.add('hidden');
        document.getElementById('sign-up-form')?.classList.remove('hidden');
        this.clearFormErrors();
    }
    
    async signInWithEmail() {
        const email = document.getElementById('sign-in-email')?.value;
        const password = document.getElementById('sign-in-password')?.value;
        
        if (!this.validateSignInForm(email, password)) return;
        
        try {
            this.app.showLoading('Signing in...', 'Please wait while we sign you in.');
            
            const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            await signInWithEmailAndPassword(this.auth, email, password);
            
            this.hideAuthModal();
            this.app.showToast('Successfully signed in!', 'success');
        } catch (error) {
            console.error('Sign in error:', error);
            this.showFormError('sign-in-password', this.getAuthErrorMessage(error.code));
        } finally {
            this.app.hideLoading();
        }
    }
    
    async signUpWithEmail() {
        const firstName = document.getElementById('sign-up-first-name')?.value;
        const lastName = document.getElementById('sign-up-last-name')?.value;
        const email = document.getElementById('sign-up-email')?.value;
        const password = document.getElementById('sign-up-password')?.value;
        
        if (!this.validateSignUpForm(firstName, lastName, email, password)) return;
        
        try {
            this.app.showLoading('Creating account...', 'Please wait while we create your account.');
            
            const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            // Update user profile
            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`
            });
            
            // Create user document
            await this.createUserDocument(user, {
                displayName: `${firstName} ${lastName}`,
                firstName,
                lastName
            });
            
            this.hideAuthModal();
            this.app.showToast('Account created successfully!', 'success');
        } catch (error) {
            console.error('Sign up error:', error);
            this.showFormError('sign-up-password', this.getAuthErrorMessage(error.code));
        } finally {
            this.app.hideLoading();
        }
    }
    
    async signInWithGoogle() {
        try {
            this.app.showLoading('Signing in with Google...', 'Redirecting to Google...');
            
            const { GoogleAuthProvider, signInWithRedirect } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            const provider = new GoogleAuthProvider();
            await signInWithRedirect(this.auth, provider);
        } catch (error) {
            console.error('Google sign in error:', error);
            this.app.showToast(this.getAuthErrorMessage(error.code), 'error');
            this.app.hideLoading();
        }
    }
    
    async handleRedirectResult() {
        try {
            const { getRedirectResult, GoogleAuthProvider } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            const result = await getRedirectResult(this.auth);
            if (result && result.user) {
                // This gives you a Google Access Token
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential?.accessToken;
                
                console.log('Google sign in successful', result.user);
                this.app.showToast('Successfully signed in with Google!', 'success');
            }
        } catch (error) {
            console.error('Redirect result error:', error);
            this.app.showToast(this.getAuthErrorMessage(error.code), 'error');
        }
    }
    
    async signOut() {
        try {
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            await signOut(this.auth);
            this.app.navigate('home');
            this.app.showToast('Successfully signed out', 'info');
        } catch (error) {
            console.error('Sign out error:', error);
            this.app.showToast('Failed to sign out', 'error');
        }
    }
    
    validateSignInForm(email, password) {
        this.clearFormErrors();
        
        let isValid = true;
        
        if (!email) {
            this.showFormError('sign-in-email', 'Email is required');
            isValid = false;
        } else if (!this.app.validateEmail(email)) {
            this.showFormError('sign-in-email', 'Please enter a valid email');
            isValid = false;
        }
        
        if (!password) {
            this.showFormError('sign-in-password', 'Password is required');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateSignUpForm(firstName, lastName, email, password) {
        this.clearFormErrors();
        
        let isValid = true;
        
        if (!firstName) {
            this.showFormError('sign-up-first-name', 'First name is required');
            isValid = false;
        }
        
        if (!lastName) {
            this.showFormError('sign-up-last-name', 'Last name is required');
            isValid = false;
        }
        
        if (!email) {
            this.showFormError('sign-up-email', 'Email is required');
            isValid = false;
        } else if (!this.app.validateEmail(email)) {
            this.showFormError('sign-up-email', 'Please enter a valid email');
            isValid = false;
        }
        
        if (!password) {
            this.showFormError('sign-up-password', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showFormError('sign-up-password', 'Password must be at least 6 characters');
            isValid = false;
        }
        
        return isValid;
    }
    
    showFormError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        // Remove existing error
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error styling to field
        field.style.borderColor = 'hsl(var(--destructive))';
        
        // Add error message
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message text-destructive text-sm mt-1';
        errorEl.textContent = message;
        field.parentNode.appendChild(errorEl);
    }
    
    clearFormErrors() {
        // Remove error styling
        document.querySelectorAll('#auth-modal input').forEach(input => {
            input.style.borderColor = '';
        });
        
        // Remove error messages
        document.querySelectorAll('.error-message').forEach(error => {
            error.remove();
        });
    }
    
    getAuthErrorMessage(errorCode) {
        const messages = {
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/email-already-in-use': 'An account already exists with this email.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/operation-not-allowed': 'This sign-in method is not enabled.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };
        
        return messages[errorCode] || 'An error occurred. Please try again.';
    }
}
