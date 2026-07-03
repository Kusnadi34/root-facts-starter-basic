import UIHandler from '../ui/ui.handler.js';
import { APP_CONFIG } from './config.js';
import { logError } from './utils.js';
import CameraService from '../services/camera.service.js';
import DetectionService from '../services/detection.service.js';
import FunFactService from '../services/facts.service.js';
import * as tf from '@tensorflow/tfjs';

class RootFactsApp {
  constructor() {
    this.detector = null;
    this.camera = null;
    this.funFactGenerator = null;
    this.ui = new UIHandler();
    this.isRunning = false;
    this.currentLoopId = null;
    this.config = APP_CONFIG;
    this.currentFunFact = '';
    this.currentTone = 'normal';
    this.fps = 30;
    this.isInitialized = false;

    this.ui.disableButton();
    this.bindEvents();
    this.init();
  }

  bindEvents() {
    this.ui.bindEvents({
      onToggleCamera: () => this.toggleCamera(),
      onCameraChange: () => this.handleCameraChange(),
      onFPSChange: (fps) => { this.fps = fps; },
      onCopy: () => this.copyFunFact(),
      onToneChange: (tone) => { this.currentTone = tone; }
    });
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker berhasil didaftarkan', registration);
      } catch (err) {
        console.warn('⚠️ Gagal daftar SW:', err);
      }
    }
  }

  async init() {
    try {
      await tf.ready();
      console.log('🔧 Backend aktif:', tf.getBackend());

      
      if (tf.getBackend() === 'webgl') {
        try {
          const test = tf.tensor1d([1, 2, 3]);
          test.dataSync();
          test.dispose();
        } catch (e) {
          console.warn('⚠️ WebGL bermasalah, pindah ke CPU');
          await tf.setBackend('cpu');
          await tf.ready();
          console.log('✅ Sekarang backend CPU');
        }
      }

      let progress = 0;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + 5, 90);
        this.ui.updateHeaderStatus(`Memuat model... ${progress}%`, false);
      }, 500);

      this.ui.updateHeaderStatus('Menyiapkan kamera...', false);
      this.camera = new CameraService();

      this.ui.updateHeaderStatus('Memuat model deteksi...', false);
      this.detector = new DetectionService();
      await this.detector.loadModel();
      console.log('✅ Model deteksi berhasil dimuat');

      this.ui.updateHeaderStatus('Memuat model AI...', false);
      this.funFactGenerator = new FunFactService();
      await this.funFactGenerator.loadModel();
      console.log('✅ Model AI berhasil dimuat');

      clearInterval(progressInterval);
      this.ui.updateHeaderStatus('Siap', false);
      this.ui.enableButton();
      this.isInitialized = true;

      await this.registerServiceWorker();

    } catch (error) {
      logError('Gagal menginisialisasi aplikasi', error);
      this.ui.updateHeaderStatus('Error', false);
      this.ui.showError(`Gagal menginisialisasi: ${error.message}`);
      this.ui.disableButton();
    }
  }

  async toggleCamera() {
    if (!this.isInitialized) {
      this.ui.showError('Aplikasi belum siap, tunggu sebentar...');
      return;
    }

    if (this.camera.isActive()) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  async startCamera() {
    try {
      await this.camera.startCamera();
      this.ui.updateCameraUI(true);
      this.startDetection();
    } catch (error) {
      logError('Gagal memulai kamera', error);
      this.ui.showError(error.message);
      this.ui.updateCameraUI(false);
    }
  }

  stopCamera() {
    this.camera.stopCamera();
    this.ui.updateCameraUI(false);
    this.stopDetection();
  }

  startDetection() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.detectLoop();
  }

  stopDetection() {
    this.isRunning = false;
    if (this.currentLoopId) {
      cancelAnimationFrame(this.currentLoopId);
      this.currentLoopId = null;
    }
  }

  async detectLoop() {
    if (!this.isRunning) return;
    const startTime = performance.now();

    try {
      if (this.camera.isReady()) {
        const video = this.camera.video;
        if (video && video.readyState >= 2) {
          const result = await this.detector.predict(video);
          if (result && result.className && result.confidence >= this.config.detectionConfidenceThreshold) {
            await this.generateAndShowResults(result);
          }
        }
      }
    } catch (error) {
      logError('Detection loop error', error);
    }

    const elapsed = performance.now() - startTime;
    const interval = 1000 / this.fps;
    const delay = Math.max(0, interval - elapsed);
    setTimeout(() => {
      this.currentLoopId = requestAnimationFrame(() => this.detectLoop());
    }, delay);
  }

  async generateAndShowResults(detectionResult) {
    try {
      this.ui.showResults(detectionResult, null);
      const funFactData = await this.funFactGenerator.generateFunFact(
        detectionResult.className,
        this.currentTone
      );
      this.currentFunFact = funFactData.funFact;
      this.ui.showResults(detectionResult, { funFact: this.currentFunFact });
    } catch (error) {
      logError('Gagal menampilkan hasil', error);
      this.ui.updateFunFactState('error');
    }
  }

  async copyFunFact() {
    try {
      const text = this.currentFunFact || this.ui.getFunFactText();
      if (!text) return;
      await navigator.clipboard.writeText(text);
      this.ui.setCopyButtonCopied();
      setTimeout(() => this.ui.resetCopyButton(), 2000);
    } catch (error) {
      logError('Gagal menyalin', error);
      alert('Gagal menyalin teks');
    }
  }

  handleCameraChange() {
    if (this.camera.isActive()) {
      this.stopCamera();
      this.startCamera();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new RootFactsApp();
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

export default RootFactsApp;