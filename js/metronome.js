export default class Metronome {
    constructor(){
        this.audioContext = new AudioContext();
        // Audio
        this.gainNode = null;
        this.oscillator = null;
        this.filter = null;

        // Impostazioni metronomo
        // Suddivisioni
        this.subs = [false];

        // Accento sull'uno
        this.accent = true;
        
        // Tempo click
        this.time = 500;
        this.bpm = 120;

        // Contatori
        this.playing = false
        this.count = 0;
    }

    setBPM(bpm){
        this.bpm = bpm
        this.time = 60000 / bpm
    }

    initializeAudio() {
        // Crea gli oggetti per la riproduzione sonora
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();
        this.filter = this.audioContext.createBiquadFilter();

        // Setto l'oscillatore
        this.oscillator.type = 'square';
        this.oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);

        // Setto il filtro
        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(700, this.audioContext.currentTime);

        // Imposto il gain a 0
        this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

        // Routing del segnare
        this.oscillator.connect(this.filter);
        this.filter.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
    }

    click(){
        if(this.count == 0 && this.accent){
            this.playClick(1400);
        }else if(this.subs[this.count]){
            this.filter.frequency.setValueAtTime(1500, this.audioContext.currentTime);
            this.playClick(1050)
            this.filter.frequency.setValueAtTime(700, this.audioContext.currentTime + 0.1);
        }else{
            this.playClick()
        }
    }

    // Emette un click ad una frequenza
    playClick(frequency) {
        this.oscillator.frequency.setValueAtTime(frequency ? frequency : 1000, this.audioContext.currentTime);
        this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 0.1);
    }

    play(callback){
        this.playing = true
        this.count = 0

        this.initializeAudio()

        // Faccio partire l'oscillatore
        this.oscillator.start();

        // Primo click
        this.click();
        this.count++

        // Faccio partire il metronomo
        this.playMetronome(callback)
    }

    stop(){
        this.oscillator.stop(this.audioContext.currentTime)
        this.playing = false
    }

    // Manda in play il metronomo
    playMetronome(callback){
        setTimeout(() => {
            if(this.playing){
                callback();
                this.click();
                this.count == this.subs.length - 1 ? this.count = 0 : this.count++
                this.playMetronome(callback)
            }else{
                this.stop();
            }
        }, this.time);
    }
}