import CryptoJS from 'crypto-js';
import { useState, useEffect } from 'react';

const SECRET_KEY = "SUA-CHAVE-SECRETA-AQUI-123";

export const useLicense = () => {
  const [isLicensed, setIsLicensed] = useState(false);
  const [licenseKey, setLicenseKey] = useState(() => localStorage.getItem('licenseKey') || '');
  const [licenseError, setLicenseError] = useState('');

  const checkLicense = (key) => {
    if (!key) {
      setIsLicensed(false);
      return false;
    }

    try {
      const bytes = CryptoJS.AES.decrypt(key, SECRET_KEY);
      const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

      const expirationDate = new Date(decryptedData.expires);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expirationDate >= today) {
        setIsLicensed(true);
        setLicenseError('');
        return true;
      } else {
        setIsLicensed(false);
        setLicenseError('Sua licença expirou.');
        return false;
      }
    } catch (e) {
      setIsLicensed(false);
      setLicenseError('Chave de licença inválida.');
      return false;
    }
  };

  useEffect(() => {
    checkLicense(licenseKey);
  }, [licenseKey]);

  const activateLicense = (key) => {
    if (checkLicense(key)) {
      localStorage.setItem('licenseKey', key);
      setLicenseKey(key);
      return true;
    }
    return false;
  };

  return {
    isLicensed,
    licenseError,
    activateLicense,
    licenseKey
  };
};
