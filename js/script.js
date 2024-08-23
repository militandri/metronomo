import Metronome from "./metronome.js"

// Global
const maxBpm = 400
const minBpm = 20

// Buttons
const togglePlay = document.getElementById("play-button")
const tap = document.getElementById("tap-button")
const removeSub = document.getElementById('remove-sub-button')
const addSub = document.getElementById('add-sub-button')

// Inputs
const bpmCircle = document.getElementById("bpm-circle")

// Labels
const bpmLabel = document.getElementById("bpm-text")

// Divs
const subContainer = document.getElementById("sub-container")
const playDiv = document.getElementById("play-div")

// Icons
const playIcon = document.getElementById("play-icon")

// Utility per il metronomo
let tapTempoTimeout = null
let playing = false

// Utility per bpmCircle
let bpmPointerPos = null
let newBPM = null
let dragging = false
let bpmOnDraggingStart = null

// Array di boolean che contiene gli accenti sulle suddivisioni
let tapTempoArr = []

// Metronomo
const metronome = new Metronome()

// Imposto i valori iniziali
initialize();

// Tap Tempo
tap.addEventListener('mouseup', () => {
    if(!dragging){
        clearTimeout(tapTempoTimeout)
        tapTempoTimeout = setTimeout(() => {
            tapTempoArr = []
        }, 2500);
        
        const time = new Date()
        
        if(tapTempoArr.length == 4){
            tapTempoArr.shift()
            tapTempoArr.push(time.getTime())
        }else{
            tapTempoArr.push(time.getTime())
        }
        
        if(tapTempoArr.length > 1){
            metronome.setBPM(calculateBPMFromTap(tapTempoArr))
            bpmLabel.textContent = metronome.bpm
            updateBpmCircle(metronome.bpm)
        }
    }
})

// Mousedown per controllo bpm con trascinamento
bpmCircle.addEventListener('mousedown', (event) => {
    bpmPointerPos = event.clientY
    bpmOnDraggingStart = metronome.bpm
    tap.classList.add("blink-tap-in")
    tap.classList.remove("blink-tap-out")
})

// Mousemove per modifica bpm con trascinamento
document.addEventListener('mousemove', (event) => {
    // Controlla se è stato definito il punto di partenza per il dragging (escludendo quindi che il mouse sia stato premuto ma non rilasciato)
    if(bpmOnDraggingStart){
        // Calcolo distanza tra il punto in cui si è cliccato e il punto attuale del mouse
        const deltaY = ((bpmPointerPos - event.clientY) / 0.8)
        
        // Se il trascinamento è maggiore di un certo range
        if(Math.abs(deltaY) > 20 && !dragging){
            // Entra in modalità dragging
            dragging = true

            // Toglie la treshold iniziale
            deltaY <= 0 ? bpmOnDraggingStart += 10 : bpmOnDraggingStart -= 10
        }

        // Se si è in modalità dragging modifica i bpm di conseguenza
        if(dragging){
            let deltaBPM 
            deltaBPM = deltaY / 2
            newBPM = Math.floor(bpmOnDraggingStart + deltaBPM)
            newBPM >= maxBpm ? newBPM = maxBpm : ''
            newBPM <= minBpm ? newBPM = minBpm : ''
            bpmLabel.textContent = newBPM
            updateBpmCircle(newBPM)
            metronome.setBPM(newBPM)
        }
    }
})

document.addEventListener('mouseup', () => {
    if(dragging){
        metronome.setBPM(newBPM)
        dragging = false
        newBPM = 0
    }
    bpmOnDraggingStart = null
    tap.classList.add("blink-tap-out")
    tap.classList.remove("blink-tap-in")
})

togglePlay.addEventListener("click", () => {
    if(!playing){
        metronome.audioContext.resume()
        .then(() => {
            metronome.play(blinkDot)
            playing = true
            playDiv.classList.toggle("fa-play-2")
            setTimeout(() => {
                playDiv.classList.toggle("fa-play-2")
                playIcon.classList.toggle("fa-play")
                playIcon.classList.toggle("fa-stop")
            }, 100);
        })
    }else{
        metronome.stop()
        playing = false
        playDiv.classList.toggle("fa-play-2")
        setTimeout(() => {
            playDiv.classList.toggle("fa-play-2")
            playIcon.classList.toggle("fa-play")
            playIcon.classList.toggle("fa-stop")
        }, 100);
    }
})

removeSub.addEventListener("click", () => {
    metronome.subs.length > 1 ? removeSubDot() : ''
})

addSub.addEventListener('click', () => {
    metronome.subs.length < 8 ? addSubDot() : ''
})

// Aggiorna i div delle suddivisioni in base alle impostazioni del metronomo
function updateSubDots() {
    let dots = Array.from(subContainer.getElementsByClassName('dot-container'));
    dots.forEach((dot, index) => {
        dot.style.transition = 'transform 0.5s ease'
        setTimeout(() => {
            dot.style.transform = `rotate(${360/dots.length * index}deg)`
        }, 10);
    })
}

// Rimuove una suddivisione
function removeSubDot(){
    const dot = subContainer.children[subContainer.children.length - 1]
    dot.remove()
    metronome.subs.pop()
    updateSubDots()
}

// Aggiunge una suddivisione
function addSubDot() {
    let dot = document.createElement("div")
    let dotDiv = document.createElement('div')
    dotDiv.classList.add('dot-container')
    dot.classList.add("subdivision-dot")
    dotDiv.appendChild(dot)
    subContainer.appendChild(dotDiv)
    metronome.subs.push(false)
    dotDiv.style.transform = `rotate(${360/(metronome.subs.length - 1) * (metronome.subs.length > 1 ? (metronome.subs.length - 2) : '')}deg)`
    updateSubDots()

    // Callback per attivare o disattivare un accento su suddivisione
    dot.addEventListener('click', () => {
        let dots = Array.from(subContainer.getElementsByClassName('dot-container')).map(el => el.querySelector('.subdivision-dot'));
        let index = dots.indexOf(dot);
        index == 0 ? toggleDotType(dot, true) : toggleDotType(dot, false)
        metronome.subs[index] = dot.classList.contains('dot-focus')
    })
}

function initialize(){
    // Labels
    bpmLabel.textContent = metronome.bpm

    // Aggiorno le suddivisioni
    addSubDot()
    let dots = Array.from(subContainer.getElementsByClassName('dot-container'));
    dots.forEach((dot, index) => {
        dot.style.transform += `rotate(${index * 360/dots.length}deg)`
    })
    updateBpmCircle(metronome.bpm)
    subContainer.querySelectorAll(".dot-container").item(0).querySelectorAll('.subdivision-dot').item(0).classList.add('accent')
    metronome.accent = true
}

function calculateBPMFromTap(arr){
    let count = 0

    for(let i = 1; i < arr.length; i++){
        count = count + arr[i] - arr[i-1]
    }

    return Math.floor(1000 / (count / (arr.length - 1)) * 60)
}

function updateBpmCircle(bpm){
    const deg = (bpm - 19) / 380 * 360
    bpmCircle.style.setProperty('--bpm-gradient-deg', deg + 'deg')
}

function toggleDotType(dot, withAccent) {
    const classList = dot.classList;

    if (classList.contains('accent')) {
        classList.remove('accent');
        classList.add('dot-focus');
        metronome.accent = false
    } else if (classList.contains('dot-focus')) {
        classList.remove('dot-focus');
    } else if (!classList.contains('accent') && !classList.contains('dot-focus')) {
        if (withAccent) {
            classList.add('accent');
            metronome.accent = true
        } else {
            classList.add('dot-focus');
        }
    }
}

function blinkDot(count){
    subContainer.querySelectorAll(".dot-container").item(count).querySelector('.subdivision-dot').classList.add('blinking');
    setTimeout(() => {
        subContainer.querySelectorAll(".dot-container").item(count).querySelector('.subdivision-dot').classList.remove('blinking');
    }, 100);
}