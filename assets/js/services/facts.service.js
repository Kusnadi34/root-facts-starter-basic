import { logError } from '../core/utils.js';
import { pipeline } from '@xenova/transformers';

class FunFactService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = null;
    this.currentBackend = null;
  }

  async loadModel() {
    try {
      console.log('📥 Memuat model Transformers.js...');
      this.generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-77M');
      this.isModelLoaded = true;
      console.log('✅ Model Transformers.js berhasil dimuat');
      return this.generator;
    } catch (error) {
      logError('Error loading Transformers.js model', error);
      console.warn('⚠️ Model AI tidak bisa dimuat, akan menggunakan fallback');
      this.isModelLoaded = false;
      return null;
    }
  }

  async generateFunFact(vegetable, tone = 'normal') {
    if (!this.isModelLoaded || !this.generator) {
      console.warn('⚠️ Model AI tidak tersedia, menggunakan fallback');
      return { funFact: 'Model not available. Please try again later.' };
    }

    if (this.isGenerating) {
      throw new Error('Model sedang menghasilkan fakta');
    }

    if (!vegetable || typeof vegetable !== 'string') {
      throw new Error('Nama sayuran yang valid diperlukan');
    }

    this.isGenerating = true;
    try {
      const cleanVegetable = vegetable.replace(/[^a-zA-Z ]/g, '').trim();
      console.log(`Menghasilkan fakta untuk sayuran: ${cleanVegetable} dengan nada: ${tone}`);
      if (!cleanVegetable) throw new Error('Nama sayuran tidak valid');

      let prompt = `describe vegetable ${cleanVegetable} with one sentence:`;
      if (tone !== 'normal') {
        prompt = `describe vegetable ${cleanVegetable} in a ${tone} way with one sentence:`;
      }

      const result = await this.generator(prompt, {
        max_new_tokens: 50,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true,
        repetition_penalty: 1.1
      });

      let generatedText = result[0]?.generated_text || '';
      if (generatedText.startsWith(prompt)) {
        generatedText = generatedText.slice(prompt.length).trim();
      }

      if (!generatedText) {
        return { funFact: 'Unable to generate a fact for this vegetable.' };
      }

      return { funFact: generatedText };
    } catch (error) {
      logError('Error generating fun fact', error);
      return { funFact: 'An error occurred while generating the fact.' };
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded && !this.isGenerating;
  }
}

export default FunFactService;