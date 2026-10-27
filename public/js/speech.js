/**
 * WorkRight Voice & Web Speech API Utilities
 * Built-in browser speech recognition (STT) and synthesis (TTS)
 * Works in Tamil, Hindi, and English with zero external API keys.
 */

const VoiceAssistant = {
  recognition: null,
  isListening: false,
  synth: window.speechSynthesis || null,
  currentUtterance: null,

  // Language mapping for Web Speech API
  langMap: {
    en: 'en-IN',
    ta: 'ta-IN',
    hi: 'hi-IN'
  },

  /**
   * Keyword Dictionary for Multilingual Hazard Auto-Categorization
   */
  categoryKeywords: {
    Fire: [
      'fire', 'smoke', 'burn', 'burning', 'spark', 'flame', 'heat', 'explosion',
      'தீ', 'நெருப்பு', 'புகை', 'எரியும்', 'வெடிப்பு',
      'आग', 'धुआं', 'जलना', 'लपट', 'धमाका'
    ],
    Electrical: [
      'electric', 'wire', 'shock', 'spark', 'cable', 'short circuit', 'current', 'high voltage',
      'மின்சாரம்', 'மின்', 'வயர்', 'கம்பிகள்', 'ஷாக்', 'மின்னதிர்ச்சி',
      'बिजली', 'तार', 'करंट', 'शॉर्ट सर्किट', 'करंट लगना'
    ],
    Chemical: [
      'chemical', 'acid', 'spill', 'leak', 'toxic', 'poison', 'fumes', 'solvent',
      'வேதிப்பொருள்', 'கசிவு', 'அமிலம்', 'நச்சு', 'ரசாயனம்',
      'रसायन', 'अम्ल', 'एसिड', 'रिसाव', 'जहरीला', 'गैस'
    ],
    Biological: [
      'infection', 'blood', 'needle', 'syringe', 'waste', 'bio', 'medical waste', 'biohazard',
      'இரத்தம்', 'ஊசி', 'மருத்துவ கழிவு', 'கிருமி', 'நோய்த்தொற்று',
      'रक्त', 'खून', 'सुई', 'संक्रमण', 'बायोमेडिकल', 'कचरा'
    ],
    Fall: [
      'fall', 'slip', 'trip', 'height', 'ladder', 'scaffold', 'scaffolding', 'floor slippery', 'hole',
      'விழுதல்', 'வழுக்கல்', 'ஏணி', 'சாரம்', 'உயரம்', 'பள்ளம்',
      'गिरना', 'फिसलना', 'सीढ़ी', 'ऊंचाई', 'गड्ढा', 'पाड़'
    ],
    Structural: [
      'crack', 'ceiling', 'wall', 'collapse', 'concrete', 'beam', 'pillar', 'roof',
      'விரிசல்', 'சுவர்', 'இடிவு', 'கூரை', 'தூண்', 'கட்டுமானம்',
      'दरार', 'दीवार', 'गिरना', 'छत', 'खंभा', 'ढहना'
    ],
    Machinery: [
      'machine', 'crane', 'blade', 'gear', 'engine', 'cut', 'equipment', 'jammed',
      'இயந்திரம்', 'கிரேன்', 'கருவி', 'பிளேடு', 'மெஷின்',
      'मशीन', 'क्रेन', 'उपकरण', 'ब्लेड', 'इंजन'
    ],
    Sanitation: [
      'clean', 'sanitation', 'toilet', 'drain', 'drainage', 'garbage', 'smell', 'odor', 'overflow',
      'துப்புரவு', 'சாக்கடை', 'குப்பை', 'துர்நாற்றம்', 'கழிவுநீர்', 'கழிப்பறை',
      'सफाई', 'शौचालय', 'नाली', 'कचरा', 'बदबू', 'गंदगी'
    ]
  },

  /**
   * Suggest Hazard Category based on transcribed text in en, ta, or hi
   */
  suggestCategory(text) {
    if (!text || typeof text !== 'string') return null;
    const lower = text.toLowerCase();

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      for (const kw of keywords) {
        if (lower.includes(kw.toLowerCase())) {
          return category;
        }
      }
    }
    return null;
  },

  /**
   * Start Speech-to-Text Recognition
   */
  startListening({ lang = 'en', onStart, onResult, onError, onEnd }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (typeof onError === 'function') {
        onError(new Error('Speech recognition is not supported in this browser. Please use Chrome or Edge.'));
      }
      return;
    }

    if (this.isListening && this.recognition) {
      this.recognition.abort();
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.langMap[lang] || 'en-IN';
    this.recognition.interimResults = true;
    this.recognition.continuous = false;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (typeof onStart === 'function') onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      const detectedCategory = this.suggestCategory(text);

      if (typeof onResult === 'function') {
        onResult({
          text,
          isFinal: Boolean(finalTranscript),
          suggestedCategory: detectedCategory
        });
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (typeof onError === 'function') {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (typeof onEnd === 'function') {
        onEnd();
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      this.isListening = false;
      if (typeof onError === 'function') onError(e);
    }
  },

  /**
   * Stop Speech Recognition
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  },

  /**
   * Speak text out loud using Web Speech Synthesis
   */
  speakText(text, lang = 'en', onStart, onEnd, onError) {
    if (!this.synth) {
      if (typeof onError === 'function') onError(new Error('Speech synthesis not supported'));
      return;
    }

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = this.langMap[lang] || 'en-IN';
    utterance.lang = targetLang;
    utterance.rate = 0.95; // Slightly slower for clear accessibility comprehension

    // Pick best voice matching language
    const voices = this.synth.getVoices();
    const matchedVoice = voices.find(v => v.lang === targetLang || v.lang.startsWith(lang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      if (typeof onStart === 'function') onStart();
    };

    utterance.onend = () => {
      if (typeof onEnd === 'function') onEnd();
    };

    utterance.onerror = (e) => {
      if (typeof onError === 'function') onError(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  },

  /**
   * Stop Speech Synthesis
   */
  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }
};
