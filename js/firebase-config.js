// Firebase Configuration Module
export class FirebaseConfig {
    constructor() {
        this.config = {
            apiKey: this.getEnvVar('FIREBASE_API_KEY'),
            authDomain: `${this.getEnvVar('FIREBASE_PROJECT_ID')}.firebaseapp.com`,
            projectId: this.getEnvVar('FIREBASE_PROJECT_ID'),
            storageBucket: `${this.getEnvVar('FIREBASE_PROJECT_ID')}.firebasestorage.app`,
            appId: this.getEnvVar('FIREBASE_APP_ID')
        };
    }
    
    getEnvVar(name) {
        // Check window.ENV first (set by environment script)
        if (window.ENV && window.ENV[name]) {
            return window.ENV[name];
        }
        
        // Check environment variables
        if (typeof process !== 'undefined' && process.env && process.env[name]) {
            return process.env[name];
        }
        
        // Development fallback
        if (window.location.hostname === 'localhost') {
            const defaults = {
                FIREBASE_API_KEY: 'demo-key',
                FIREBASE_PROJECT_ID: 'zedwriter-dev',
                FIREBASE_APP_ID: 'demo-app-id'
            };
            return defaults[name];
        }
        
        throw new Error(`Environment variable ${name} is not defined`);
    }
    
    getConfig() {
        return this.config;
    }
    
    validate() {
        const required = ['apiKey', 'projectId', 'appId'];
        for (const key of required) {
            if (!this.config[key] || this.config[key] === 'demo-key') {
                console.warn(`Firebase ${key} is not properly configured`);
            }
        }
        return true;
    }
}

// Initialize and export configuration
export const firebaseConfig = new FirebaseConfig();
