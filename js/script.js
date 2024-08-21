import Metronome from "./metronome.js"

// Global
const maxBpm = 400
const minBpm = 20

// Buttons
const play = document.getElementById("play-button")
const stop = document.getElementById("stop-button")
const tap = document.getElementById("tap-button")

// Blinker
const blinker = document.getElementById("blinker")

// Inputs
const subInput = document.getElementById("sub")
const bpmCircle = document.getElementById("bpm-circle")

// Labels
const bpmLabel = document.getElementById("bpm-text")
const subLabel = document.getElementById("sub-text")

// Divs
const subDiv = document.getElementById("sub-div")
const accent = document.getElementById("accent-on-one")

// Utility per il metronomo
let accentOnOne = true
let tapTempoTimeout = null

// Utility per bpmCircle
let bpmPointerPos = null
let newBPM = null
let dragging = false
let bpmOnDraggingStart = null

// Array di boolean che contiene gli accenti sulle suddivisioni
let subArr = []
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

// Listener per l'accento sull'uno
accent.addEventListener('change', () => {
    accentOnOne = accent.checked
    metronome.accent = accentOnOne
    accentOnOne ? subDiv.children[0].classList.add('accent') : subDiv.children[0].classList.remove('accent')
})

// Listener per il numero di suddivisioni
subInput.addEventListener("input", () => {
    subLabel.textContent = subInput.value
    updateSubDots(subInput.value)
    metronome.accent ? subDiv.children[0].classList.add('accent') : subDiv.children[0].classList.remove('accent')
})

// Mousedown per controllo bpm con trascinamento
bpmCircle.addEventListener('mousedown', (event) => {
    bpmPointerPos = event.clientY
    bpmOnDraggingStart = metronome.bpm
    console.log(bpmOnDraggingStart)
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

play.addEventListener("click", () => {
    metronome.audioContext.resume()
    .then(() => {
        metronome.play(() => {
            pulse(blinker)
        });
    })
})

stop.addEventListener("click", () => {
    metronome.stop()
})

// Aggiorna i div delle suddivisioni in base alle impostazioni del metronomo
function updateSubDots(nDots) {
    let dots = Array.from(subDiv.getElementsByClassName('subdivision-dot'));
    const delta = dots.length - nDots
    if(delta > 0){
        for(let i = 0; i < delta; i++){
            removeSubDot()
        }
    }else{
        for(let i = 0; i < Math.abs(delta); i++){
            addSubDot()
        }
    }
    metronome.subs = subArr
}

// Rimuove una suddivisione
function removeSubDot(){
    subDiv.children[subDiv.children.length - 1].remove()
    subArr.pop()
}

// Aggiunge una suddivisione
function addSubDot() {
    let dot = document.createElement("div")
    dot.classList.add("subdivision-dot")
    subDiv.appendChild(dot)
    subArr.push(false)

    // Callback per attivare o disattivare un accento su suddivisione
    dot.addEventListener('click', () => {
        dot.classList.contains('dot-focus') ? dot.classList.remove('dot-focus') : dot.classList.add('dot-focus')
        let dots = Array.from(subDiv.getElementsByClassName('subdivision-dot'));
        let index = dots.indexOf(dot);
        subArr[index] = dot.classList.contains('dot-focus')
    })
}

function initialize(){
    // Labels
    bpmLabel.textContent = metronome.bpm
    subLabel.textContent = subInput.value

    // Aggiorno le suddivisioni
    updateSubDots(subInput.value)
    updateBpmCircle(metronome.bpm)
    subDiv.children[0].classList.add('accent')
}

// Fa lampeggiare il blinker
function pulse(blinker) {
    blinker.style.backgroundColor = 'red'
    setTimeout(() => {
        blinker.style.backgroundColor = 'green'
    }, 50);
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