import { getCameraErrorMessage, logError } from '../core/utils.js';

class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.config = null;
    this.initializeElements();
    this.init();
  }

  initializeElements() {
    this.video = document.getElementById('videoElement');
    this.canvas = document.getElementById('canvasElement');
    this.cameraSelect = document.getElementById('camera-select');
  }

  async init() {
    await this.loadCameras();
  }

  async loadCameras() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn('⚠️ Browser tidak mendukung enumerateDevices');
        this.setDefaultCameraOption();
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      if (this.cameraSelect) {
        this.cameraSelect.innerHTML = '';
        if (videoDevices.length === 0) {
          this.setDefaultCameraOption();
          // Hanya peringatan, bukan error
          console.info('ℹ️ Belum ada kamera terdeteksi (izin belum diberikan). Silakan klik tombol kamera.');
        } else {
          videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Kamera ${index + 1}`;
            this.cameraSelect.appendChild(option);
          });
          console.log(`✅ ${videoDevices.length} kamera ditemukan`);
        }
      }
    } catch (error) {
      logError('Gagal memuat kamera', error);
      this.setDefaultCameraOption();
    }
  }

  setDefaultCameraOption() {
    if (this.cameraSelect) {
      this.cameraSelect.innerHTML = '<option value="default">Kamera Default</option>';
    }
  }

  async startCamera() {
    try {
      let deviceId = this.cameraSelect?.value || 'default';
      let videoConstraints = {
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 }
      };
      if (deviceId && deviceId !== 'default' && deviceId !== '') {
        videoConstraints.deviceId = { exact: deviceId };
      }
      const constraints = {
        video: videoConstraints,
        audio: false
      };
      console.log('📷 Mencoba mengakses kamera dengan constraints:', constraints);
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
        console.log('✅ Kamera berhasil diaktifkan');
      }
      return this.stream;
    } catch (error) {
      logError('Gagal memulai kamera', error);
      const errorMessage = getCameraErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    console.log('📷 Kamera dimatikan');
  }

  isActive() {
    return this.stream !== null && this.stream.active;
  }

  isReady() {
    return this.video && this.video.readyState >= 2;
  }
}

export default CameraService;