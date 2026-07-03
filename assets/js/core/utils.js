import {
	APP_CONFIG,
	UI_CONFIG,
} from './config.js';

export const isMobileDevice = () => {
	try {
		return navigator.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
	} catch (e) {
		return false;
	}
};

export const createDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const isValidDetection = (result) => {
	const { detectionConfidenceThreshold } = APP_CONFIG;
	return result && result.isValid && result.confidence >= detectionConfidenceThreshold;
};

export const validateModelMetadata = (metadata) => {
	return metadata && metadata.labels && Array.isArray(metadata.labels);
};

export const getCameraErrorMessage = (error) => {
	if (!error) return 'Gagal memulai kamera: error tidak diketahui';
	if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
		return 'Izin kamera ditolak. Harap izinkan akses kamera di pengaturan browser.';
	} else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
		return 'Tidak ada kamera ditemukan pada perangkat ini.';
	} else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
		return 'Kamera sedang digunakan oleh aplikasi lain atau tidak dapat diakses.';
	} else if (error.name === 'OverconstrainedError') {
		return 'Kamera tidak mendukung resolusi yang diminta.';
	}
	return `Gagal memulai kamera: ${error.message || 'Unknown error'}`;
};

export const addFadeInAnimation = (element) => {
	if (!element) return;
	const { fadeAnimation } = UI_CONFIG;
	try {
		element.style.animation = 'none';
		void element.offsetWidth;
		element.style.animation = fadeAnimation;
	} catch (e) {
	}
};

export const hideElement = (element) => {
	if (element) element.classList.add('hidden');
};

export const showElement = (element) => {
	if (element) element.classList.remove('hidden');
};

export const setElementText = (element, text) => {
	if (element) element.textContent = text;
};

export const logError = (context, error) => {
	try {
		console.error(`❌ ${context}:`, error);
	} catch (e) {
	}
};

export const isWebGPUSupported = () => {
	try {
		return typeof navigator !== 'undefined' && 'gpu' in navigator;
	} catch (e) {
		return false;
	}
};