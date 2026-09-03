
// Optional Firebase adapter.
// This project runs fully on localStorage so it can deploy instantly to GitHub + Netlify.
// If you want true real-time sync:
// 1. Create a Firebase project.
// 2. Add your config below.
// 3. Replace state reads/writes with Firestore listeners.
// This placeholder keeps the app backend-free for immediate deployment.
window.TAGLISAYAHAN_FIREBASE = {
  enabled: false,
  config: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  }
};
