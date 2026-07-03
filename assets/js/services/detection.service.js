import { logError } from '../core/utils.js';
import * as tf from 'https://esm.sh/@tensorflow/tfjs';

class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
  }

  async loadModel() {
    try {
      await tf.ready();
      console.log('✅ Backend TFJS:', tf.getBackend());

      
      if (tf.getBackend() === 'webgl') {
        try {
          const test = tf.tensor1d([1, 2, 3]);
          test.dispose();
        } catch (e) {
          console.warn('⚠️ WebGL gagal, pakai CPU');
          await tf.setBackend('cpu');
          await tf.ready();
          console.log('✅ Backend CPU aktif');
        }
      }

      const modelPath = './model/model.json';
      console.log('📥 Memuat model dari:', modelPath);
      
      this.model = await tf.loadLayersModel(modelPath);
      console.log('✅ Model berhasil dimuat');

      
      const resp = await fetch('./model/metadata.json');
      if (!resp.ok) {
        throw new Error(`Gagal memuat metadata: ${resp.status}`);
      }
      const meta = await resp.json();
      
      if (meta && meta.labels && Array.isArray(meta.labels)) {
        this.labels = meta.labels;
        console.log('✅ Labels:', this.labels);
      } else {
        throw new Error('Metadata tidak punya labels');
      }
      
      return this.model;
    } catch (error) {
      logError('Gagal load model', error);
      throw new Error(`Gagal memuat model: ${error.message}`);
    }
  }

  async predict(imageElement) {
    if (!this.model) throw new Error('Model belum dimuat');
    if (!imageElement) throw new Error('Elemen gambar tidak valid');
    
    return tf.tidy(() => {
      const tensor = tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .expandDims(0);
      
      const normalized = tensor.div(255.0);
      const predictions = this.model.predict(normalized);
      const data = predictions.dataSync();
      
      let maxIndex = 0;
      let maxVal = data[0];
      for (let i = 1; i < data.length; i++) {
        if (data[i] > maxVal) {
          maxVal = data[i];
          maxIndex = i;
        }
      }
      
      const className = this.labels[maxIndex] || 'Tidak diketahui';
      const confidence = Math.round(maxVal * 100);
      
      return { className, confidence };
    });
  }

  isLoaded() {
    return this.model !== null;
  }
}

export default DetectionService;