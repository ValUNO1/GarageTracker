import { createContext, useContext, useState, useEffect } from 'react';
import { translations, languageNames } from '../i18n/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  const [distanceUnit, setDistanceUnit] = useState(() => {
    const saved = localStorage.getItem('distanceUnit');
    return saved || 'miles';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('distanceUnit', distanceUnit);
  }, [distanceUnit]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  // Convert miles to km or vice versa
  const convertDistance = (value, toUnit = distanceUnit) => {
    if (!value) return 0;
    if (toUnit === 'km') {
      return Math.round(value * 1.60934);
    }
    return value; // Already in miles
  };

  // Format distance with unit
  const formatDistance = (value, showUnit = true) => {
    if (!value && value !== 0) return 'N/A';
    const converted = convertDistance(value);
    const unit = distanceUnit === 'km' ? 'km' : 'mi';
    return showUnit ? `${converted.toLocaleString()} ${unit}` : converted.toLocaleString();
  };

  // Get unit label
  const getDistanceUnit = () => {
    return distanceUnit === 'km' ? 'km' : 'miles';
  };

  const getDistanceUnitShort = () => {
    return distanceUnit === 'km' ? 'km' : 'mi';
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      languageNames,
      distanceUnit,
      setDistanceUnit,
      convertDistance,
      formatDistance,
      getDistanceUnit,
      getDistanceUnitShort
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
