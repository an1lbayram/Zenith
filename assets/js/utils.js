/**
 * Utility functions for Zenith
 */
export const Utils = {
    // XSS Protection Input Sanitization
    sanitize: (str) => {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // Unique ID Generator
    generateId: () => {
        return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    },

    // Format Date with Relative Labels (Bugün, Yarın, Dün)
    formatDate: (dateInput) => {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const isSameDay = (d1, d2) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        if (isSameDay(d, today)) return 'Bugün';
        if (isSameDay(d, tomorrow)) return 'Yarın';
        if (isSameDay(d, yesterday)) return 'Dün';

        const options = { month: 'short', day: 'numeric' };
        return d.toLocaleDateString('tr-TR', options);
    },

    // Format ISO Date String (YYYY-MM-DD)
    toISODateString: (dateObj = new Date()) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Debounce
    debounce: (func, wait = 250) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Web Audio Synthesized Chime sound
    playChime: (type = 'success') => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            const playNote = (freq, duration, delay, vol = 0.15) => {
                setTimeout(() => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(vol, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + duration);
                }, delay);
            };

            if (type === 'success') {
                playNote(523.25, 0.2, 0);   // C5
                playNote(659.25, 0.2, 100); // E5
                playNote(783.99, 0.4, 200); // G5
            } else if (type === 'levelUp') {
                playNote(440, 0.15, 0);    // A4
                playNote(554.37, 0.15, 100); // C#5
                playNote(659.25, 0.15, 200); // E5
                playNote(880, 0.5, 300);    // A5
            } else if (type === 'timerEnd') {
                playNote(587.33, 0.25, 0);   // D5
                playNote(880, 0.25, 250);    // A5
                playNote(1174.66, 0.5, 500); // D6
            } else if (type === 'purchase') {
                playNote(659.25, 0.15, 0);
                playNote(880, 0.3, 100);
            }
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    },

    // ----------------------------------------------------
    // PROCEDURAL AMBIENT SOUND ENGINE (20 SOUND PROFILES)
    // ----------------------------------------------------
    ambientAudioCtx: null,
    ambientNodes: [],
    ambientIntervals: [],

    stopAmbientSound: () => {
        if (Utils.ambientIntervals && Utils.ambientIntervals.length) {
            Utils.ambientIntervals.forEach(id => clearInterval(id));
            Utils.ambientIntervals = [];
        }
        if (Utils.ambientNodes && Utils.ambientNodes.length) {
            Utils.ambientNodes.forEach(node => {
                try { node.stop(); } catch (e) {}
                try { node.disconnect(); } catch (e) {}
            });
            Utils.ambientNodes = [];
        }
        if (Utils.ambientAudioCtx) {
            try { Utils.ambientAudioCtx.close(); } catch (e) {}
            Utils.ambientAudioCtx = null;
        }
    },

    // Helper: Create White / Pink / Brown Noise Buffer
    createNoiseBuffer: (ctx, type = 'pink') => {
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === 'white') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.1;
            }
        } else if (type === 'brown') {
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.05 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 0.8;
            }
        } else {
            // Pink noise
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.1;
                b6 = white * 0.115926;
            }
        }
        return buffer;
    },

    playAmbientSound: (type) => {
        Utils.stopAmbientSound();
        if (!type || type === 'none') return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            Utils.ambientAudioCtx = ctx;

            // Helper to start looping noise source
            const createNoiseSource = (noiseType, filterType = 'lowpass', filterFreq = 1000, volume = 0.1) => {
                const buffer = Utils.createNoiseBuffer(ctx, noiseType);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;

                const filter = ctx.createBiquadFilter();
                filter.type = filterType;
                filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(volume, ctx.currentTime);

                source.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                source.start();
                Utils.ambientNodes.push(source);
                return { source, filter, gain };
            };

            // Helper to create Binaural Beats (Stereo Left / Right)
            const createBinauralBeat = (freqLeft, freqRight, vol = 0.06) => {
                const merger = ctx.createChannelMerger(2);

                const oscL = ctx.createOscillator();
                const gainL = ctx.createGain();
                oscL.frequency.setValueAtTime(freqLeft, ctx.currentTime);
                gainL.gain.setValueAtTime(vol, ctx.currentTime);
                oscL.connect(gainL);
                gainL.connect(merger, 0, 0);

                const oscR = ctx.createOscillator();
                const gainR = ctx.createGain();
                oscR.frequency.setValueAtTime(freqRight, ctx.currentTime);
                gainR.gain.setValueAtTime(vol, ctx.currentTime);
                oscR.connect(gainR);
                gainR.connect(merger, 0, 1);

                merger.connect(ctx.destination);
                oscL.start();
                oscR.start();
                Utils.ambientNodes.push(oscL, oscR);
            };

            switch (type) {
                // 1. Hafif Yağmur
                case 'rain':
                    createNoiseSource('pink', 'lowpass', 1200, 0.12);
                    break;

                // 2. Şiddetli Fırtına (FIXED: Heavy rain + periodic lowpass thunder bursts)
                case 'storm': {
                    createNoiseSource('pink', 'lowpass', 800, 0.14);

                    // Periodic Thunder Rumbles
                    const thunderInterval = setInterval(() => {
                        if (Math.random() > 0.45) {
                            const thunderNoise = ctx.createBufferSource();
                            thunderNoise.buffer = Utils.createNoiseBuffer(ctx, 'brown');
                            const filter = ctx.createBiquadFilter();
                            const gain = ctx.createGain();
                            filter.type = 'lowpass';
                            filter.frequency.setValueAtTime(220, ctx.currentTime);

                            gain.gain.setValueAtTime(0.01, ctx.currentTime);
                            gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.3);
                            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

                            thunderNoise.connect(filter);
                            filter.connect(gain);
                            gain.connect(ctx.destination);
                            thunderNoise.start();
                            thunderNoise.stop(ctx.currentTime + 2.5);
                        }
                    }, 4000);
                    Utils.ambientIntervals.push(thunderInterval);
                    break;
                }

                // 3. Okyanus Dalgaları
                case 'ocean': {
                    const { filter } = createNoiseSource('pink', 'lowpass', 600, 0.12);
                    const lfo = ctx.createOscillator();
                    const lfoGain = ctx.createGain();
                    lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
                    lfoGain.gain.setValueAtTime(350, ctx.currentTime);
                    lfo.connect(lfoGain);
                    lfoGain.connect(filter.frequency);
                    lfo.start();
                    Utils.ambientNodes.push(lfo);
                    break;
                }

                // 4. Rüzgar Esintisi
                case 'wind': {
                    const { filter } = createNoiseSource('pink', 'bandpass', 600, 0.12);
                    filter.Q.setValueAtTime(2.5, ctx.currentTime);
                    const lfo = ctx.createOscillator();
                    const lfoGain = ctx.createGain();
                    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
                    lfoGain.gain.setValueAtTime(400, ctx.currentTime);
                    lfo.connect(lfoGain);
                    lfoGain.connect(filter.frequency);
                    lfo.start();
                    Utils.ambientNodes.push(lfo);
                    break;
                }

                // 5. Kamp Ateşi (FIXED: Warm brown noise base + realistic micro crackles & pops)
                case 'campfire': {
                    createNoiseSource('brown', 'lowpass', 500, 0.08);

                    const crackleInterval = setInterval(() => {
                        if (Math.random() > 0.3) {
                            const popSource = ctx.createBufferSource();
                            popSource.buffer = Utils.createNoiseBuffer(ctx, 'white');
                            const filter = ctx.createBiquadFilter();
                            const gain = ctx.createGain();
                            filter.type = 'bandpass';
                            filter.frequency.setValueAtTime(1500 + Math.random() * 2000, ctx.currentTime);
                            filter.Q.setValueAtTime(5.0, ctx.currentTime);

                            const popVol = 0.04 + Math.random() * 0.08;
                            gain.gain.setValueAtTime(popVol, ctx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

                            popSource.connect(filter);
                            filter.connect(gain);
                            gain.connect(ctx.destination);
                            popSource.start();
                            popSource.stop(ctx.currentTime + 0.04);
                        }
                    }, 90);
                    Utils.ambientIntervals.push(crackleInterval);
                    break;
                }

                // 6. Beyaz Gürültü
                case 'whitenoise':
                    createNoiseSource('white', 'lowpass', 8000, 0.08);
                    break;

                // 7. Kahverengi Gürültü (FIXED: Rich, audible deep focus brown noise)
                case 'brownnoise':
                    createNoiseSource('brown', 'lowpass', 600, 0.18);
                    break;

                // 8. 432Hz Derin Odak
                case 'focus432': {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(432, ctx.currentTime);
                    gain.gain.setValueAtTime(0.06, ctx.currentTime);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    Utils.ambientNodes.push(osc);
                    break;
                }

                // 9. 528Hz Şifa & Netlik
                case 'solfeggio528': {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(528, ctx.currentTime);
                    gain.gain.setValueAtTime(0.06, ctx.currentTime);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    Utils.ambientNodes.push(osc);
                    break;
                }

                // 10. Binaural Alpha (10Hz)
                case 'binaural_alpha':
                    createBinauralBeat(200, 210, 0.07);
                    break;

                // 11. Binaural Theta (6Hz)
                case 'binaural_theta':
                    createBinauralBeat(150, 156, 0.07);
                    break;

                // 12. Binaural Beta (15Hz)
                case 'binaural_beta':
                    createBinauralBeat(250, 265, 0.07);
                        // 13. Sıcak Kafe Ambiyansı (REDESIGNED: Background Hum + Porcelain Cup Clinks + Espresso Steam Hiss)
                case 'cafe': {
                    const { gain: g1 } = createNoiseSource('pink', 'lowpass', 750, 0.14);
                    createNoiseSource('brown', 'lowpass', 350, 0.12);

                    const lfo = ctx.createOscillator();
                    const lfoGain = ctx.createGain();
                    lfo.frequency.setValueAtTime(0.5, ctx.currentTime);
                    lfoGain.gain.setValueAtTime(0.04, ctx.currentTime);
                    lfo.connect(lfoGain);
                    lfoGain.connect(g1.gain);
                    lfo.start();
                    Utils.ambientNodes.push(lfo);

                    // Periodic Cup Clinks & Steam Wand Hiss
                    const cafeInterval = setInterval(() => {
                        if (Math.random() > 0.4) {
                            const clinkOsc = ctx.createOscillator();
                            const clinkGain = ctx.createGain();
                            clinkOsc.type = 'sine';
                            const clinkFreq = 2200 + Math.random() * 1200;
                            clinkOsc.frequency.setValueAtTime(clinkFreq, ctx.currentTime);
                            clinkGain.gain.setValueAtTime(0.05, ctx.currentTime);
                            clinkGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
                            clinkOsc.connect(clinkGain);
                            clinkGain.connect(ctx.destination);
                            clinkOsc.start();
                            clinkOsc.stop(ctx.currentTime + 0.08);
                        }

                        if (Math.random() > 0.8) {
                            const steamNoise = ctx.createBufferSource();
                            steamNoise.buffer = Utils.createNoiseBuffer(ctx, 'white');
                            const filter = ctx.createBiquadFilter();
                            const gain = ctx.createGain();
                            filter.type = 'bandpass';
                            filter.frequency.setValueAtTime(3200, ctx.currentTime);
                            filter.Q.setValueAtTime(2.0, ctx.currentTime);

                            gain.gain.setValueAtTime(0.01, ctx.currentTime);
                            gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);
                            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

                            steamNoise.connect(filter);
                            filter.connect(gain);
                            gain.connect(ctx.destination);
                            steamNoise.start();
                            steamNoise.stop(ctx.currentTime + 1.2);
                        }
                    }, 1800);
                    Utils.ambientIntervals.push(cafeInterval);
                    break;
                }

                // 14. Kozmik Uzay Uğultusu
                case 'space': {
                    const osc1 = ctx.createOscillator();
                    const osc2 = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc1.type = 'sine';
                    osc2.type = 'sine';
                    osc1.frequency.setValueAtTime(65, ctx.currentTime);
                    osc2.frequency.setValueAtTime(130, ctx.currentTime);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    osc1.connect(gain);
                    osc2.connect(gain);
                    gain.connect(ctx.destination);
                    osc1.start();
                    osc2.start();
                    Utils.ambientNodes.push(osc1, osc2);
                    break;
                }

                // 15. Orman Hışırtısı (REDESIGNED: Modulated Tree Canopy Breeze + Rustling Leaves)
                case 'forest': {
                    const { filter } = createNoiseSource('pink', 'bandpass', 1100, 0.12);
                    filter.Q.setValueAtTime(1.2, ctx.currentTime);

                    const lfo = ctx.createOscillator();
                    const lfoGain = ctx.createGain();
                    lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
                    lfoGain.gain.setValueAtTime(500, ctx.currentTime);
                    lfo.connect(lfoGain);
                    lfoGain.connect(filter.frequency);
                    lfo.start();
                    Utils.ambientNodes.push(lfo);

                    const forestInterval = setInterval(() => {
                        if (Math.random() > 0.35) {
                            const leafNoise = ctx.createBufferSource();
                            leafNoise.buffer = Utils.createNoiseBuffer(ctx, 'pink');
                            const leafFilter = ctx.createBiquadFilter();
                            const leafGain = ctx.createGain();
                            leafFilter.type = 'bandpass';
                            leafFilter.frequency.setValueAtTime(2200 + Math.random() * 800, ctx.currentTime);
                            leafFilter.Q.setValueAtTime(3.0, ctx.currentTime);

                            leafGain.gain.setValueAtTime(0.05 + Math.random() * 0.04, ctx.currentTime);
                            leafGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

                            leafNoise.connect(leafFilter);
                            leafFilter.connect(leafGain);
                            leafGain.connect(ctx.destination);
                            leafNoise.start();
                            leafNoise.stop(ctx.currentTime + 0.18);
                        }
                    }, 1400);
                    Utils.ambientIntervals.push(forestInterval);
                    break;
                }

                // 16. Tren Yolculuğu (FIXED: Authentic 4-beat "clack-clack" rhythmic rail pulses)
                case 'train': {
                    createNoiseSource('brown', 'lowpass', 350, 0.08); // Train hum base

                    const trainInterval = setInterval(() => {
                        const playClack = (delayMs) => {
                            setTimeout(() => {
                                const clackNoise = ctx.createBufferSource();
                                clackNoise.buffer = Utils.createNoiseBuffer(ctx, 'pink');
                                const filter = ctx.createBiquadFilter();
                                const gain = ctx.createGain();
                                filter.type = 'bandpass';
                                filter.frequency.setValueAtTime(450, ctx.currentTime);
                                filter.Q.setValueAtTime(3.0, ctx.currentTime);

                                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

                                clackNoise.connect(filter);
                                filter.connect(gain);
                                gain.connect(ctx.destination);
                                clackNoise.start();
                                clackNoise.stop(ctx.currentTime + 0.08);
                            }, delayMs);
                        };

                        playClack(0);
                        playClack(110);
                        playClack(260);
                        playClack(370);
                    }, 1200);
                    Utils.ambientIntervals.push(trainInterval);
                    break;
                }

                // 17. Ritmik Su Damlaları
                case 'drop': {
                    const dropInterval = setInterval(() => {
                        if (Math.random() > 0.35) {
                            const dropOsc = ctx.createOscillator();
                            const dropGain = ctx.createGain();
                            dropOsc.type = 'sine';
                            const startFreq = 700 + Math.random() * 700;
                            dropOsc.frequency.setValueAtTime(startFreq, ctx.currentTime);
                            dropOsc.frequency.exponentialRampToValueAtTime(startFreq * 1.6, ctx.currentTime + 0.07);
                            dropGain.gain.setValueAtTime(0.06, ctx.currentTime);
                            dropGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
                            dropOsc.connect(dropGain);
                            dropGain.connect(ctx.destination);
                            dropOsc.start();
                            dropOsc.stop(ctx.currentTime + 0.07);
                        }
                    }, 550);
                    Utils.ambientIntervals.push(dropInterval);
                    break;
                }

                // 18. Zen Kuş Sesleri (FIXED: Realistic frequency modulated FM songbird chirps)
                case 'birds': {
                    const birdInterval = setInterval(() => {
                        if (Math.random() > 0.4) {
                            const carrier = ctx.createOscillator();
                            const modulator = ctx.createOscillator();
                            const modGain = ctx.createGain();
                            const mainGain = ctx.createGain();

                            const baseFreq = 2600 + Math.random() * 800;
                            carrier.type = 'sine';
                            carrier.frequency.setValueAtTime(baseFreq, ctx.currentTime);
                            carrier.frequency.exponentialRampToValueAtTime(baseFreq + 350, ctx.currentTime + 0.14);

                            modulator.type = 'sine';
                            modulator.frequency.setValueAtTime(25, ctx.currentTime); // Fast vibrato
                            modGain.gain.setValueAtTime(150, ctx.currentTime);

                            modulator.connect(modGain);
                            modGain.connect(carrier.frequency);

                            mainGain.gain.setValueAtTime(0.05, ctx.currentTime);
                            mainGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

                            carrier.connect(mainGain);
                            mainGain.connect(ctx.destination);

                            carrier.start();
                            modulator.start();
                            carrier.stop(ctx.currentTime + 0.14);
                            modulator.stop(ctx.currentTime + 0.14);
                        }
                    }, 2200);
                    Utils.ambientIntervals.push(birdInterval);
                    break;
                }

                // 19. Tibetan Zen Çanı
                case 'zenbowl': {
                    const bowlInterval = setInterval(() => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(216, ctx.currentTime);
                        gain.gain.setValueAtTime(0.12, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.5);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start();
                        osc.stop(ctx.currentTime + 4.5);
                    }, 5000);

                    const osc0 = ctx.createOscillator();
                    const gain0 = ctx.createGain();
                    osc0.type = 'sine';
                    osc0.frequency.setValueAtTime(216, ctx.currentTime);
                    gain0.gain.setValueAtTime(0.12, ctx.currentTime);
                    gain0.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.5);
                    osc0.connect(gain0);
                    gain0.connect(ctx.destination);
                    osc0.start();
                    osc0.stop(ctx.currentTime + 4.5);

                    Utils.ambientIntervals.push(bowlInterval);
                    break;
                }

                // 20. Odak Metronomu (60 BPM)
                case 'metronome': {
                    const metroInterval = setInterval(() => {
                        const tickOsc = ctx.createOscillator();
                        const tickGain = ctx.createGain();
                        tickOsc.type = 'sine';
                        tickOsc.frequency.setValueAtTime(1200, ctx.currentTime);
                        tickGain.gain.setValueAtTime(0.08, ctx.currentTime);
                        tickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
                        tickOsc.connect(tickGain);
                        tickGain.connect(ctx.destination);
                        tickOsc.start();
                        tickOsc.stop(ctx.currentTime + 0.03);
                    }, 1000);
                    Utils.ambientIntervals.push(metroInterval);
                    break;
                }

                default:
                    createNoiseSource('pink', 'lowpass', 1200, 0.1);
                    break;
            }
        } catch (e) {
            console.warn('Ambient sound error:', e);
        }
    },

    // Desktop Notification Helper
    sendNotification: (title, body) => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: 'assets/icons/icon-192.png' });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body, icon: 'assets/icons/icon-192.png' });
                }
            });
        }
    }
};
