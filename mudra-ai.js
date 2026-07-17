// Mudra AI Assistant - Camera and Chatbot Logic

// Initialize variables
let stream = null;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startCameraBtn = document.getElementById('start-camera');
const capturePhotoBtn = document.getElementById('capture-photo');
const autoCaptureBtn = document.getElementById('auto-capture');
const autoCaptureTimer = document.getElementById('auto-capture-timer');
const uploadImageBtn = document.getElementById('upload-image');
const fileInput = document.getElementById('file-input');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendMessageBtn = document.getElementById('send-message');
const recognitionResult = document.getElementById('recognition-result');

let autoCaptureInterval = null;
let autoCaptureTimeout = null;
let autoCaptureRemaining = 0;

// Build a broad mudra knowledge base from the site pages so the AI can answer for many mudras.
function humanizeMudraName(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildMudraDatabase() {
  const mudraSlugs = [
    'alapadma', 'anjali', 'arala', 'ardhachandra', 'ardhapataka', 'avahittha',
    'bherunda', 'bhramara', 'chakra', 'chandrakala', 'chatura', 'dola', 'garuda',
    'hamsapaksha', 'hamsasya', 'kangula', 'kapittha', 'kapota', 'karkata',
    'kartari-swastika', 'kartarimukha', 'kataka-vardhana', 'katakamukha', 'khatva',
    'kilaka', 'kurma', 'matsya', 'mayura', 'mrigashirsha', 'mukula', 'mushti',
    'nagabandha', 'padmakosha', 'pasha', 'pataka', 'pushpaputa', 'samputa',
    'sandamsha', 'sarpashirsha', 'shakata', 'shankha', 'shikhara', 'shivalinga',
    'shukatunda', 'simhamukha', 'suchi', 'swastika', 'tamrachuda', 'tripataka',
    'trishula', 'utsanga', 'varaha'
  ];

  return mudraSlugs.reduce((database, slug) => {
    const name = humanizeMudraName(slug);
    database[slug] = {
      key: slug,
      name: `${name}`,
      meaning: 'Detailed symbolism and context for this mudra are available on its dedicated page.',
      usage: 'This gesture belongs to the Bharatanatyam vocabulary and is explained in depth on its dedicated page.',
      link: `mudras/${slug}.html`
    };
    return database;
  }, {});
}

function normalizeMudraText(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function findMudraMatch(message) {
  const normalizedMessage = normalizeMudraText(message);
  if (!normalizedMessage) return null;

  return Object.values(mudraDatabase).find((mudra) => {
    const normalizedName = normalizeMudraText(mudra.name);
    const normalizedKey = normalizeMudraText(mudra.key);
    return normalizedMessage.includes(normalizedKey)
      || normalizedMessage.includes(normalizedName)
      || normalizedKey.includes(normalizedMessage)
      || normalizedName.includes(normalizedMessage);
  }) || null;
}

const mudraDatabase = buildMudraDatabase();

// Camera Functions
startCameraBtn.addEventListener('click', async () => {
  // Require auth before allowing camera activation (if auth module loaded)
  if (typeof window.isMudraSignedIn === 'function' && !window.isMudraSignedIn()) {
    if (typeof window.showMudraAuthModal === 'function') window.showMudraAuthModal();
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    video.srcObject = stream;
    startCameraBtn.disabled = true;
    startCameraBtn.textContent = 'Camera Active';
    capturePhotoBtn.disabled = false;
    if (autoCaptureBtn) autoCaptureBtn.disabled = false;
    addChatMessage('ai', '📹 Camera activated! You can now capture mudras.');
  } catch (error) {
    addChatMessage('ai', '❌ Unable to access camera. Please check permissions.');
    console.error('Camera error:', error);
  }
});

capturePhotoBtn.addEventListener('click', () => {
  if (stream) {
    cancelAutoCapture();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    processCapturedImage();
  }
});

autoCaptureBtn?.addEventListener('click', () => {
  if (typeof window.isMudraSignedIn === 'function' && !window.isMudraSignedIn()) {
    if (typeof window.showMudraAuthModal === 'function') window.showMudraAuthModal();
    return;
  }

  if (!stream) {
    addChatMessage('ai', '🔒 Please start the camera before using auto capture.');
    return;
  }

  if (autoCaptureTimeout) {
    cancelAutoCapture();
    return;
  }

  autoCaptureRemaining = 30;
  if (autoCaptureBtn) {
    autoCaptureBtn.textContent = 'Cancel Auto Capture';
  }
  if (autoCaptureTimer) {
    autoCaptureTimer.textContent = `Auto capture in ${autoCaptureRemaining}s`;
  }

  autoCaptureInterval = setInterval(() => {
    autoCaptureRemaining -= 1;
    if (autoCaptureTimer) {
      autoCaptureTimer.textContent = `Auto capture in ${autoCaptureRemaining}s`;
    }
    if (autoCaptureRemaining <= 0) {
      clearInterval(autoCaptureInterval);
      autoCaptureInterval = null;
    }
  }, 1000);

  autoCaptureTimeout = setTimeout(() => {
    cancelAutoCapture(true);
  }, 30000);
});

function cancelAutoCapture(execute = false) {
  if (autoCaptureInterval) {
    clearInterval(autoCaptureInterval);
    autoCaptureInterval = null;
  }
  if (autoCaptureTimeout) {
    clearTimeout(autoCaptureTimeout);
    autoCaptureTimeout = null;
  }
  if (autoCaptureTimer) {
    autoCaptureTimer.textContent = '';
  }
  if (autoCaptureBtn) {
    autoCaptureBtn.textContent = 'Auto Capture (30s)';
  }
  if (execute && stream) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    processCapturedImage();
  }
}

uploadImageBtn.addEventListener('click', () => {
  if (typeof window.isMudraSignedIn === 'function' && !window.isMudraSignedIn()) {
    if (typeof window.showMudraAuthModal === 'function') window.showMudraAuthModal();
    return;
  }

  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        processCapturedImage();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Process captured image
function processCapturedImage() {
  addChatMessage('ai', '🔍 Analyzing mudra...');
  
  // Simulate AI processing (in production, send to backend)
  setTimeout(async () => {
    const recognizedMudra = simulateMudraRecognition();
    if (recognizedMudra) {
      displayRecognitionResult(recognizedMudra);
      addChatMessage('ai', `✨ I detected the <strong>${recognizedMudra.name}</strong> mudra with ${recognizedMudra.confidence}% confidence. Would you like to know more about it?`);

      if (typeof window.saveMudraRecognition === 'function') {
        await window.saveMudraRecognition({
          mudra: recognizedMudra.name,
          confidence: recognizedMudra.confidence,
          detectedAt: new Date().toISOString()
        });
      }
    } else {
      addChatMessage('ai', '🤔 I couldn\'t clearly identify this mudra. Try capturing under better lighting or with a clearer angle.');
    }
  }, 1500);
}

// Simulate mudra recognition (in production, this would use a backend vision model)
function simulateMudraRecognition() {
  const mudras = Object.values(mudraDatabase);
  const randomMudra = mudras[Math.floor(Math.random() * mudras.length)];
  return {
    ...randomMudra,
    confidence: Math.floor(Math.random() * 30) + 70 // 70-99%
  };
}

// Display recognition result
function displayRecognitionResult(mudra) {
  document.getElementById('mudra-name').textContent = mudra.name;
  document.getElementById('mudra-confidence').textContent = mudra.confidence + '%';
  document.getElementById('mudra-meaning').textContent = mudra.meaning;
  document.getElementById('mudra-usage').textContent = mudra.usage;
  const link = document.getElementById('mudra-link');
  if (link) {
    link.href = mudra.link || '#';
    link.textContent = mudra.link ? 'Open mudra page' : 'No page available';
  }
  recognitionResult.classList.add('show');
}

// Chat Functions
function addChatMessage(sender, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendMessageBtn.addEventListener('click', () => {
  // Ensure user is signed in before sending messages (if auth loaded)
  if (typeof window.isMudraSignedIn === 'function' && !window.isMudraSignedIn()) {
    if (typeof window.showMudraAuthModal === 'function') window.showMudraAuthModal();
    return;
  }

  const message = chatInput.value.trim();
  if (message) {
    addChatMessage('user', message);
    chatInput.value = '';
    processChatMessage(message);
  }
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessageBtn.click();
});

// Process chat messages with AI responses
function processChatMessage(userMessage) {
  addChatMessage('ai', '<div class="loading"></div> Processing...');
  
  // Remove loading message and add response after delay
  setTimeout(() => {
    const lastMessage = chatMessages.lastElementChild;
    if (lastMessage && lastMessage.querySelector('.loading')) {
      lastMessage.remove();
    }
    
    const response = generateAIResponse(userMessage);
    addChatMessage('ai', response);
  }, 800);
}

// Generate AI responses based on user input
function generateAIResponse(userMessage) {
  const msg = userMessage.toLowerCase();
  const matchedMudra = findMudraMatch(userMessage);

  if (matchedMudra && (msg.includes('what') || msg.includes('tell') || msg.includes('learn') || msg.includes('show') || msg.includes('about') || msg.includes('identify'))) {
    return `<strong>${matchedMudra.name}</strong> - ${matchedMudra.meaning} ${matchedMudra.usage} <a href="${matchedMudra.link}" style="color: var(--accent-red);">→ Learn more</a>`;
  }
  
  // Mudra inquiries
  if (msg.includes('how many') && msg.includes('mudra')) {
    return `There are traditionally <strong>52 mudras</strong> in Bharatanatyam: 28 Asamyuta (single-hand) and 24 Samyuta (double-hand) gestures. Each has multiple meanings depending on context and accompaniment.`;
  }
  
  if (msg.includes('difference') && (msg.includes('asamyuta') || msg.includes('samyuta'))) {
    return `<strong>Asamyuta Hastas</strong> are performed with a single hand (28 total), while <strong>Samyuta Hastas</strong> are performed with both hands together (24 total). Both are essential to the mudra vocabulary.`;
  }
  
  if (msg.includes('how') && (msg.includes('learn') || msg.includes('practice'))) {
    return `To learn mudras effectively: <br/>1. Start with basic Asamyuta mudras<br/>2. Practice hand positioning regularly<br/>3. Combine with body movements<br/>4. Study the meanings and viniyogas<br/>5. Learn from experienced gurus<br/>Check out our <a href="mudras.html" style="color: var(--accent-red);">mudra pages</a> for detailed guides!`;
  }
  
  if (msg.includes('nameof') || msg.includes('what is')) {
    return `Tell me which mudra you'd like to know about! Ask me about Pataka, Anjali, Mayura, or any other mudra, and I'll provide detailed information.`;
  }
  
  // Default responses
  const defaultResponses = [
    '✨ Mudras are the vocabulary of hand gestures in Bharatanatyam. Each gesture has precise meanings and is used to tell stories. Would you like to learn about a specific mudra?',
    '🙏 The beauty of Bharatanatyam lies in how mudras combine with body movements, facial expressions, and music. What aspect interests you most?',
    '👐 Did you capture a mudra? I can try to recognize it from your image! Or ask me any questions about mudras and I\'ll help you learn.',
    '💫 Mudra recognition works best with clear hand positions and good lighting. Try capturing your gesture against a neutral background.'
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.isMudraSignedIn === 'function') {
    if (!window.isMudraSignedIn()) {
      addChatMessage('ai', '🔒 Please login to use Mudra AI features.');
      if (typeof window.showMudraAuthModal === 'function') window.showMudraAuthModal();
    } else {
      addChatMessage('ai', '👋 Ready to explore mudras! Use the camera to capture hand gestures or ask me questions about Bharatanatyam mudras.');
    }
  } else {
    // Auth not initialized yet; let auth module handle prompting.
    addChatMessage('ai', '👋 Ready to explore mudras! Use the camera to capture hand gestures or ask me questions about Bharatanatyam mudras.');
  }
});
