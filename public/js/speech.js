/**
 * WorkRight Voice & Web Speech API Utilities
 * Built-in browser speech recognition (STT) and synthesis (TTS)
 * Works in Tamil, Hindi, and English with 100% zero external paid API keys.
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
   * Check browser speech recognition support
   */
  isSupported() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  /**
   * Vocabulary for Client-side instant preview translation
   */
  translationRules: {
    ta: [
      { from: /ரசாயன கசிவு/gi, to: 'chemical spill' },
      { from: /வேதிப்பொருள் கசிவு/gi, to: 'chemical leak' },
      { from: /மின்சார கம்பி/gi, to: 'electrical wire' },
      { from: /மின்னதிர்ச்சி/gi, to: 'electric shock hazard' },
      { from: /தீ விபத்து/gi, to: 'fire incident' },
      { from: /மருத்துவ கழிவு/gi, to: 'biomedical waste' },
      { from: /கழிவுநீர் தேக்கம்/gi, to: 'drainage overflow' },
      { from: /சாக்கடை அடைப்பு/gi, to: 'drainage blockage' },
      { from: /சுவர் விரிசல்/gi, to: 'structural wall crack' },
      { from: /கூரை விரிசல்/gi, to: 'ceiling crack' },
      { from: /வழுக்கும் தரை/gi, to: 'slippery floor' },
      { from: /இரண்டாவது மாடி/gi, to: 'second floor' },
      { from: /முதல் மாடி/gi, to: 'first floor' },
      { from: /தரைத்தளம்/gi, to: 'ground floor' },
      { from: /நோயாளி வார்டு/gi, to: 'patient ward' },
      { from: /கழிப்பறை/gi, to: 'restroom / toilet' },
      { from: /நுழைவாயில்/gi, to: 'entrance' },
      { from: /அவசர சிகிச்சை/gi, to: 'emergency ICU' },
      { from: /ரசாயனம்/gi, to: 'chemical' },
      { from: /அமிலம்/gi, to: 'acid' },
      { from: /கசிவு/gi, to: 'leak / spill' },
      { from: /நெருப்பு|தீ/gi, to: 'fire' },
      { from: /புகை/gi, to: 'smoke' },
      { from: /மின்சாரம்|மின்/gi, to: 'electricity' },
      { from: /வயர்/gi, to: 'wire' },
      { from: /சாரம்/gi, to: 'scaffolding' },
      { from: /ஏணி/gi, to: 'ladder' },
      { from: /விரிசல்/gi, to: 'crack' },
      { from: /இடிவு/gi, to: 'collapse' },
      { from: /இயந்திரம்|மெஷின்/gi, to: 'machinery' },
      { from: /தூசு/gi, to: 'dust' },
      { from: /துர்நாற்றம்/gi, to: 'pungent odor' },
      { from: /குப்பை/gi, to: 'waste garbage' },
      { from: /ஊசி/gi, to: 'used syringe needles' },
      { from: /இரத்தம்/gi, to: 'blood spill' },
      { from: /ஆபத்து/gi, to: 'danger' },
      { from: /மற்றும்/gi, to: 'and' },
      { from: /அல்லது/gi, to: 'or' },
      { from: /உள்ளது/gi, to: 'detected' },
      { from: /அருகில்/gi, to: 'near' },
      { from: /கண்டேன்/gi, to: 'observed' }
    ],
    hi: [
      { from: /केमिकल रिसाव/gi, to: 'chemical spill' },
      { from: /केमिकल फैल गया/gi, to: 'chemical has leaked' },
      { from: /बिजली का तार/gi, to: 'electrical wire' },
      { from: /खुला तार/gi, to: 'exposed live wire' },
      { from: /शॉर्ट सर्किट/gi, to: 'short circuit' },
      { from: /करंट लग रहा/gi, to: 'electric shock risk' },
      { from: /बायोमेडिकल कचरा/gi, to: 'biomedical waste' },
      { from: /दीवार में दरार/gi, to: 'crack in the wall' },
      { from: /छत गिर रही/gi, to: 'ceiling collapsing risk' },
      { from: /नाली जाम/gi, to: 'drainage blockage' },
      { from: /गंदा पानी/gi, to: 'sewage water overflow' },
      { from: /दूसरी मंजिल/gi, to: 'second floor' },
      { from: /पहली मंजिल/gi, to: 'first floor' },
      { from: /ग्राउंड फ्लोर/gi, to: 'ground floor' },
      { from: /मरीज़ वार्ड/gi, to: 'patient ward' },
      { from: /शौचालय/gi, to: 'washroom' },
      { from: /मुख्य द्वार/gi, to: 'main entrance' },
      { from: /रसायन|केमिकल/gi, to: 'chemical' },
      { from: /अम्ल|एसिड/gi, to: 'acid' },
      { from: /आग/gi, to: 'fire' },
      { from: /धुआं/gi, to: 'smoke' },
      { from: /बिजली|करंट/gi, to: 'electricity' },
      { from: /तार/gi, to: 'wire' },
      { from: /पाड़/gi, to: 'scaffolding' },
      { from: /सीढ़ी/gi, to: 'ladder' },
      { from: /दरार/gi, to: 'crack' },
      { from: /मशीन|उपकरण/gi, to: 'machinery' },
      { from: /कचरा/gi, to: 'garbage waste' },
      { from: /सुई/gi, to: 'needles' },
      { from: /रक्त|खून/gi, to: 'blood' },
      { from: /खतरा/gi, to: 'hazard' },
      { from: /फिसलन/gi, to: 'slippery floor' },
      { from: /गिरना/gi, to: 'fall risk' },
      { from: /बदबू/gi, to: 'pungent smell' },
      { from: /और/gi, to: 'and' },
      { from: /या/gi, to: 'or' },
      { from: /में/gi, to: 'in' },
      { from: /पास/gi, to: 'near' },
      { from: /है/gi, to: 'reported' }
    ]
  },

  /**
   * Detect text language (Tamil, Hindi, or English)
   */
  detectLanguage(text) {
    if (!text) return 'en';
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    return 'en';
  },

  /**
   * Translate native text to English in real time
   */
  translateToEnglish(text) {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();
    const lang = this.detectLanguage(trimmed);
    if (lang === 'en') return trimmed;

    let res = trimmed;
    const rules = this.translationRules[lang] || [];
    let matched = false;

    for (const rule of rules) {
      if (rule.from.test(res)) {
        matched = true;
        res = res.replace(rule.from, rule.to);
      }
    }

    res = res.replace(/\s+/g, ' ').trim();
    if (!matched && res === trimmed) {
      const langName = lang === 'ta' ? 'Tamil' : 'Hindi';
      return `[Reported in ${langName}]: ${trimmed}`;
    }

    return res.charAt(0).toUpperCase() + res.slice(1);
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
   * Sample phrases for 1-click test simulation
   */
  samplePhrases: {
    ta: [
      { text: 'இரண்டாவது மாடியில் ரசாயன கசிவு உள்ளது மற்றும் வழுக்கும் தரை', category: 'Chemical' },
      { text: 'மின்சார கம்பி மற்றும் தீ விபத்து அபாயம்', category: 'Electrical' },
      { text: 'நான்காவது மாடியில் ஏணி மற்றும் சாரம் விரிசல் கண்டேன்', category: 'Fall' },
      { text: 'மருத்துவ கழிவு மற்றும் ரத்தம் வார்டு அருகில்', category: 'Biological' }
    ],
    hi: [
      { text: 'खुला बिजली का तार और शॉर्ट सर्किट का खतरा', category: 'Electrical' },
      { text: 'केमिकल रिसाव और तेज बदबू आ रही है', category: 'Chemical' },
      { text: 'दीवार में दरार और छत गिरने का खतरा', category: 'Structural' },
      { text: 'बायोमेडिकल कचरा और सुई फर्श पर बिखरी है', category: 'Biological' }
    ],
    en: [
      { text: 'Exposed live electrical wires near water puddle at entrance', category: 'Electrical' },
      { text: 'Chemical spill and toxic fumes on second floor corridor', category: 'Chemical' },
      { text: 'Missing safety harness anchor line on high scaffolding', category: 'Fall' },
      { text: 'Blocked drainage in ground floor emergency washrooms', category: 'Sanitation' }
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
  async startListening({ lang = 'en', onStart, onResult, onError, onEnd }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (typeof onError === 'function') {
        onError({
          message: 'Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or try the 1-Click Simulation buttons below.',
          code: 'not-supported'
        });
      }
      return;
    }

    // Try to trigger permission prompt explicitly if possible
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        // Continue anyway; SpeechRecognition will request or throw not-allowed
      }
    }

    if (this.isListening && this.recognition) {
      try { this.recognition.abort(); } catch (e) {}
    }

    const rec = new SpeechRecognition();
    this.recognition = rec;
    rec.lang = this.langMap[lang] || 'en-IN';
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => {
      this.isListening = true;
      if (typeof onStart === 'function') onStart();
    };

    let accumulatedText = '';

    rec.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        accumulatedText += (accumulatedText ? ' ' : '') + finalTranscript.trim();
      }

      const activeText = accumulatedText + (interimTranscript ? (accumulatedText ? ' ' : '') + interimTranscript : '');
      const detectedCategory = this.suggestCategory(activeText);
      const translatedEnglish = this.translateToEnglish(activeText);

      if (typeof onResult === 'function') {
        onResult({
          text: activeText,
          nativeText: activeText,
          englishText: translatedEnglish,
          isFinal: Boolean(finalTranscript),
          suggestedCategory: detectedCategory,
          detectedLang: this.detectLanguage(activeText)
        });
      }
    };

    rec.onerror = (event) => {
      this.isListening = false;
      let friendlyMsg = 'Microphone error occurred.';
      if (event.error === 'not-allowed') {
        friendlyMsg = 'Microphone permission blocked. Please click the lock icon in your browser address bar to allow microphone, or use the 1-Click test buttons below.';
      } else if (event.error === 'no-speech') {
        friendlyMsg = 'No speech detected. Please speak closer to your microphone or use test buttons.';
      } else if (event.error === 'audio-capture') {
        friendlyMsg = 'No microphone device found on your computer. Use the 1-Click test buttons below to test instantly.';
      } else if (event.error === 'network') {
        friendlyMsg = 'Browser speech network connection error. You can type or use the test phrases below.';
      }

      if (typeof onError === 'function') {
        onError({
          message: friendlyMsg,
          code: event.error
        });
      }
    };

    rec.onend = () => {
      this.isListening = false;
      if (typeof onEnd === 'function') {
        onEnd();
      }
    };

    try {
      rec.start();
    } catch (e) {
      this.isListening = false;
      if (typeof onError === 'function') {
        onError({
          message: 'Could not start microphone: ' + (e.message || 'unknown error'),
          code: 'start-failed'
        });
      }
    }
  },

  /**
   * Stop Speech Recognition
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
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
    utterance.rate = 0.95;

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
      try { this.synth.cancel(); } catch (e) {}
      this.currentUtterance = null;
    }
  }
};