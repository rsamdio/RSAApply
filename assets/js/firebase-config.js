/* Firebase Configuration - Shared across all pages */
// Replace these values with your Firebase project configuration
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDtk_C3UppJ0JsJwmuEf0l8k1K2bgUoc9E",
  authDomain: "rsaapply-30591.firebaseapp.com",
  projectId: "rsaapply-30591",
  storageBucket: "rsaapply-30591.firebasestorage.app",
  messagingSenderId: "652662148908",
  appId: "1:652662148908:web:d5e71bab72ea9d2aa0a689"
};

// Firebase instances (singleton pattern)
let firebaseApp = null;
let firebaseDb = null;
let firebaseAuth = null;

/**
 * Initialize Firebase - returns instances or null if not available
 * @returns {{app: Object|null, db: Object|null, auth: Object|null}}
 */
function initializeFirebase() {
  // Return existing instances if already initialized
  if (firebaseApp && firebaseDb && firebaseAuth) {
    return { app: firebaseApp, db: firebaseDb, auth: firebaseAuth };
  }

  // Check if Firebase SDK is loaded
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded yet');
    return { app: null, db: null, auth: null };
  }

  try {
    // Initialize only if not already initialized
    if (!firebaseApp) {
      firebaseApp = firebase.apps.length > 0 
        ? firebase.app() 
        : firebase.initializeApp(FIREBASE_CONFIG);
    }
    
    firebaseDb = firebase.firestore();
    firebaseAuth = firebase.auth();
    
    return { app: firebaseApp, db: firebaseDb, auth: firebaseAuth };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return { app: null, db: null, auth: null };
  }
}

// Auto-initialize when DOM is ready and Firebase SDK is loaded
(function() {
  function tryInit() {
    if (typeof firebase !== 'undefined') {
      initializeFirebase();
    }
  }

  // Try immediately if Firebase is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }
})();

