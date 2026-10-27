/**
 * WorkRight Multilingual Workplace Hazard Translator
 * Translates Tamil and Hindi workplace hazard reports into English,
 * and preserves the employee's original native speech.
 * 100% free, runs in Node.js and browser without any paid API keys.
 */

// Vocabulary dictionaries for workplace safety terms
const translationDict = {
  tamil: [
    // Multi-word phrases
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
    // Single words
    { from: /ரசாயனம்/gi, to: 'chemical' },
    { from: /அமிலம்/gi, to: 'acid' },
    { from: /கசிவு/gi, to: 'leak / spill' },
    { from: /நெருப்பு/gi, to: 'fire' },
    { from: /தீ/gi, to: 'fire' },
    { from: /புகை/gi, to: 'smoke' },
    { from: /மின்சாரம்/gi, to: 'electricity' },
    { from: /மின்/gi, to: 'electrical' },
    { from: /வயர்/gi, to: 'wire' },
    { from: /சாரம்/gi, to: 'scaffolding' },
    { from: /ஏணி/gi, to: 'ladder' },
    { from: /விரிசல்/gi, to: 'crack' },
    { from: /இடிவு/gi, to: 'collapse' },
    { from: /இயந்திரம்/gi, to: 'machinery' },
    { from: /மெஷின்/gi, to: 'machine' },
    { from: /தூசு/gi, to: 'dust' },
    { from: /துர்நாற்றம்/gi, to: 'pungent odor' },
    { from: /குப்பை/gi, to: 'waste garbage' },
    { from: /ஊசி/gi, to: 'used syringe needles' },
    { from: /இரத்தம்/gi, to: 'blood spill' },
    { from: /ஆபத்து/gi, to: 'danger' },
    { from: /மற்றும்/gi, to: 'and' },
    { from: /அல்லது/gi, to: 'or' },
    { from: /உடன்/gi, to: 'with' },
    { from: /இல்/gi, to: 'in' },
    { from: /மேல்/gi, to: 'on' },
    { from: /கீழ்/gi, to: 'under' },
    { from: /மிகவும்/gi, to: 'severe' },
    { from: /இங்கே/gi, to: 'here' },
    { from: /உள்ளது/gi, to: 'detected' },
    { from: /அருகில்/gi, to: 'near' },
    { from: /கண்டேன்/gi, to: 'observed' }
  ],
  hindi: [
    // Multi-word phrases
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
    // Single words
    { from: /रसायन/gi, to: 'chemical' },
    { from: /केमिकल/gi, to: 'chemical' },
    { from: /अम्ल/gi, to: 'acid' },
    { from: /एसिड/gi, to: 'acid' },
    { from: /आग/gi, to: 'fire' },
    { from: /धुआं/gi, to: 'smoke' },
    { from: /बिजली/gi, to: 'electricity' },
    { from: /करंट/gi, to: 'current' },
    { from: /तार/gi, to: 'wire' },
    { from: /पाड़/gi, to: 'scaffolding' },
    { from: /सीढ़ी/gi, to: 'ladder' },
    { from: /दरार/gi, to: 'crack' },
    { from: /मशीन/gi, to: 'machine' },
    { from: /उपकरण/gi, to: 'equipment' },
    { from: /कचरा/gi, to: 'garbage waste' },
    { from: /सुई/gi, to: 'needles' },
    { from: /रक्त/gi, to: 'blood' },
    { from: /खून/gi, to: 'blood' },
    { from: /खतरा/gi, to: 'hazard' },
    { from: /फिसलन/gi, to: 'slippery floor' },
    { from: /गिरना/gi, to: 'fall risk' },
    { from: /बदबू/gi, to: 'pungent smell' },
    { from: /और/gi, to: 'and' },
    { from: /या/gi, to: 'or' },
    { from: /के साथ/gi, to: 'with' },
    { from: /में/gi, to: 'in' },
    { from: /पर/gi, to: 'on' },
    { from: /नीचे/gi, to: 'under' },
    { from: /यहाँ|यहां/gi, to: 'here' },
    { from: /बहुत/gi, to: 'severe' },
    { from: /पास/gi, to: 'near' },
    { from: /है/gi, to: 'reported' }
  ]
};

/**
 * Detect Language of Input Text
 * @param {string} text
 * @returns {'Tamil' | 'Hindi' | 'English'}
 */
function detectLanguage(text) {
  if (!text) return 'English';
  // Tamil Unicode Range: \u0B80-\u0BFF
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'Tamil';
  }
  // Devanagari (Hindi) Unicode Range: \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) {
    return 'Hindi';
  }
  return 'English';
}

/**
 * Translate Text to English if in Tamil or Hindi
 * @param {string} text
 * @returns {{ language: string, original: string, english: string }}
 */
function translateHazardDescription(text) {
  if (!text || typeof text !== 'string') {
    return { language: 'English', original: '', english: '' };
  }

  const trimmed = text.trim();
  const lang = detectLanguage(trimmed);

  if (lang === 'English') {
    return {
      language: 'English',
      original: trimmed,
      english: trimmed
    };
  }

  let translated = trimmed;
  let matchesCount = 0;
  const rules = lang === 'Tamil' ? translationDict.tamil : translationDict.hindi;

  for (const rule of rules) {
    if (rule.from.test(translated)) {
      matchesCount++;
      translated = translated.replace(rule.from, rule.to);
    }
  }

  // Clean up any double spaces
  translated = translated.replace(/\s+/g, ' ').trim();

  // If no workplace terms matched at all
  if (matchesCount === 0 && translated === trimmed) {
    translated = `[Reported in ${lang}]: ${trimmed} (Workplace incident requiring supervisor review)`;
  } else {
    // Capitalize first letter
    translated = translated.charAt(0).toUpperCase() + translated.slice(1);
  }

  return {
    language: lang,
    original: trimmed,
    english: translated
  };
}

module.exports = {
  detectLanguage,
  translateHazardDescription
};
