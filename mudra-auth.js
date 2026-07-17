// Mudra AI Authentication Module
// Include this file in mudra-ai.html to enable login/signup.

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function createAuthUI() {
  const parent = document.getElementById('auth-actions');
  if (parent) {
    const button = document.createElement('button');
    button.id = 'auth-button';
    button.className = 'btn-auth';
    button.type = 'button';
    button.textContent = 'Login / Signup';
    parent.appendChild(button);
  }

  if (document.body.classList.contains('auth-page')) {
    return;
  }

  if (document.getElementById('auth-modal')) {
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.className = 'modal hidden';
  modal.setAttribute('aria-hidden', 'true');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="modal-dialog">
      <button id="modal-close" class="modal-close" aria-label="Close authentication dialog">×</button>
      <div class="modal-header">
        <h2>Login or Sign Up</h2>
        <p>Sign in to unlock Mudra AI recognition and chat features. You can also create a new account instantly.</p>
      </div>
      <form id="auth-form">
        <label>
          Email
          <input type="email" id="auth-email" placeholder="you@example.com" required />
        </label>
        <label>
          Password
          <input type="password" id="auth-password" placeholder="At least 6 characters" minlength="6" required />
        </label>
        <div class="modal-actions">
          <button type="submit" class="btn-send">Login</button>
          <button type="button" class="btn-camera btn-secondary" id="toggle-auth-mode">Switch to Sign Up</button>
        </div>
        <p class="auth-feedback" id="auth-feedback"></p>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

function showAuthModal() {
  const modal = document.getElementById('auth-modal');
  const emailInput = document.getElementById('auth-email');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  emailInput?.focus();
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function setAuthMode(mode) {
  const toggle = document.getElementById('toggle-auth-mode');
  const submit = document.querySelector('#auth-form button[type="submit"]');
  if (!toggle || !submit) return;
  toggle.textContent = mode === 'login' ? 'Switch to Sign Up' : 'Switch to Login';
  submit.textContent = mode === 'login' ? 'Login' : 'Sign Up';
  submit.dataset.mode = mode;
}

function updateAiAccess(user) {
  const signedIn = Boolean(user);
  const startCameraBtn = document.getElementById('start-camera');
  const capturePhotoBtn = document.getElementById('capture-photo');
  const uploadImageBtn = document.getElementById('upload-image');
  const fileInput = document.getElementById('file-input');
  const chatInput = document.getElementById('chat-input');
  const sendMessageBtn = document.getElementById('send-message');
  const authButton = document.getElementById('auth-button');

  if (startCameraBtn) startCameraBtn.disabled = !signedIn;
  if (capturePhotoBtn) capturePhotoBtn.disabled = !signedIn;
  if (uploadImageBtn) uploadImageBtn.disabled = !signedIn;
  if (fileInput) fileInput.disabled = !signedIn;
  if (chatInput) chatInput.disabled = !signedIn;
  if (sendMessageBtn) sendMessageBtn.disabled = !signedIn;

  if (!authButton) return;

  if (signedIn) {
    authButton.textContent = 'Sign Out';
    if (typeof addChatMessage === 'function') {
      addChatMessage('ai', `✅ Logged in as ${user.email}. Mudra AI is ready.`);
    }
  } else {
    authButton.textContent = 'Login / Signup';
    if (typeof addChatMessage === 'function') {
      addChatMessage('ai', '🔒 Please login or sign up to use Mudra AI features.');
    }

    if (!localStorage.getItem('mudraAuthReminderShown')) {
      localStorage.setItem('mudraAuthReminderShown', '1');
      setTimeout(showAuthModal, 500);
    }
  }
}

async function initAuth() {
  createAuthUI();

  await loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
  await loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js');
  await loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js');

  const authConfig = window.firebaseConfig || {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  if (!authConfig.apiKey || authConfig.apiKey.startsWith('YOUR_')) {
    console.error('Firebase configuration is missing or not set. Please create firebase-config.js with your project values.');
    const authFeedback = document.getElementById('auth-feedback');
    if (authFeedback) {
      authFeedback.textContent = 'Firebase configuration is missing. Check firebase-config.js and refresh the page.';
    }
    return;
  }

  firebase.initializeApp(authConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Expose helpers so other modules can check auth state and open the auth modal
  window.isMudraSignedIn = () => Boolean(auth.currentUser);
  window.showMudraAuthModal = showAuthModal;
  window.getMudraAuthUser = () => auth.currentUser;
  window.getMudraFirestore = () => db;

  async function saveUserProfile(user) {
    if (!user) return;
    try {
      await db.collection('users').doc(user.uid).set(
        {
          email: user.email,
          displayName: user.displayName || null,
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          loginCount: firebase.firestore.FieldValue.increment(1),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('Unable to save user profile:', error);
    }
  }

  async function saveRecognitionEvent(user, eventData) {
    if (!user) return;
    try {
      await db
        .collection('users')
        .doc(user.uid)
        .collection('recognitions')
        .add({
          ...eventData,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      console.warn('Unable to save recognition event:', error);
    }
  }

  window.saveMudraRecognition = async (eventData) => {
    const user = auth.currentUser;
    if (!user) return;
    await saveRecognitionEvent(user, eventData);
  };

  const authButton = document.getElementById('auth-button');
  const modalClose = document.getElementById('modal-close');
  const authModal = document.getElementById('auth-modal');
  const authForm = document.getElementById('auth-form');
  const authToggleBtn = document.getElementById('toggle-auth-mode');
  const authFeedback = document.getElementById('auth-feedback');

  authButton?.addEventListener('click', () => {
    if (auth.currentUser) {
      auth.signOut();
    } else {
      showAuthModal();
    }
  });

  modalClose?.addEventListener('click', closeAuthModal);
  authModal?.addEventListener('click', (event) => {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });

  authToggleBtn?.addEventListener('click', () => {
    const submit = document.querySelector('#auth-form button[type="submit"]');
    if (!submit) return;
    const currentMode = submit.dataset.mode || 'login';
    setAuthMode(currentMode === 'login' ? 'signup' : 'login');
  });

  authForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!authForm) return;

    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const submit = authForm.querySelector('button[type="submit"]');
    const mode = submit?.dataset.mode || 'login';

    if (!email || !password) {
      authFeedback.textContent = 'Please enter your email and password.';
      return;
    }

    authFeedback.textContent = 'Please wait...';

    try {
      if (mode === 'login') {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        await auth.createUserWithEmailAndPassword(email, password);
      }
      closeAuthModal();
    } catch (error) {
      authFeedback.textContent = error.message || 'Login failed. Please try again.';
    }
  });

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await saveUserProfile(user);
    }
    updateAiAccess(user);

    if (user && window.location.pathname.endsWith('login.html')) {
      window.location.href = 'mudra-ai.html';
    }
  });

  updateAiAccess(null);
  setAuthMode('login');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
