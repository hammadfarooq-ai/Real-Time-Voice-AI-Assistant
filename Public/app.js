const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const statusText = document.getElementById('statusText');
const userTextEl = document.getElementById('userText');
const assistantTextEl = document.getElementById('assistantText');

let recognition;
let isRecognizing = false;

function supportsSpeechRecognition() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

if (!supportsSpeechRecognition()) {
  statusText.innerText = 'SpeechRecognition not supported in this browser. Use Chrome/Edge.';
  btnStart.disabled = true;
} else {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US'; // change to 'ur-PK' or other if you want Urdu
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isRecognizing = true;
    statusText.innerText = 'listening...';
    btnStart.disabled = true;
    btnStop.disabled = false;
  };

  recognition.onerror = (e) => {
    console.error('Speech error', e);
    statusText.innerText = 'error: ' + (e.error || e.message);
  };

  recognition.onend = () => {
    isRecognizing = false;
    statusText.innerText = 'idle';
    btnStart.disabled = false;
    btnStop.disabled = true;
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    userTextEl.innerText = transcript;
    statusText.innerText = 'sending to server...';

    try {
      const resp = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript })
      });
      const data = await resp.json();
      if (resp.ok) {
        assistantTextEl.innerText = data.reply;
        speakText(data.reply);
        statusText.innerText = 'done';
      } else {
        assistantTextEl.innerText = 'Error: ' + (data.error || 'unknown');
        statusText.innerText = 'error';
      }
    } catch (err) {
      console.error(err);
      assistantTextEl.innerText = 'Network/server error';
      statusText.innerText = 'error';
    }
  };
}

btnStart.addEventListener('click', () => {
  if (recognition && !isRecognizing) {
    // continuous short interaction: start recognition for one phrase
    recognition.start();
  }
});

btnStop.addEventListener('click', () => {
  if (recognition && isRecognizing) recognition.stop();
});

// Simple TTS
function speakText(text) {
  if (!window.speechSynthesis) {
    console.warn('SpeechSynthesis not available.');
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  // choose voice / lang if desired:
  // utter.lang = 'en-US'; // or 'ur-PK' for Urdu (if available)
  // optional: pick a specific voice from speechSynthesis.getVoices()
  const voices = window.speechSynthesis.getVoices();
  // pick a voice that matches lang if possible
  const match = voices.find(v => v.lang.startsWith('en')) || voices[0];
  if (match) utter.voice = match;
  utter.rate = 1; // adjust speed 0.8 - 1.2
  window.speechSynthesis.cancel(); // stop any current speech
  window.speechSynthesis.speak(utter);
}
