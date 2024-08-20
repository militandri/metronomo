import Metronome from "./metronome.js"

// Buttons
const play = document.getElementById("play-button")
const stop = document.getElementById("stop-button")
const tap = document.getElementById("tap-button")

// Blinker
const blinker = document.getElementById("blinker")

// Inputs
const bpmInput = document.getElementById("bpm")
const subInput = document.getElementById("sub")

// Labels
const bpmLabel = document.getElementById("bpm-text")
const subLabel = document.getElementById("sub-text")

// Divs
const subDiv = document.getElementById("sub-div")
const accent = document.getElementById("accent-on-one")

// Utility per il metronomo
let accentOnOne = true
let tapTempoTimeout = null

// Array di boolean che contiene gli accenti sulle suddivisioni
let subArr = []
let tapTempoArr = []

// Metronomo
const metronome = new Metronome()

// Imposto i valori iniziali
initialize();

tap.addEventListener('click', () => {
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
        metronome.time = 60000 / calculateBPMFromTap(tapTempoArr)
        bpmLabel.textContent = calculateBPMFromTap(tapTempoArr)
        bpmInput.value = calculateBPMFromTap(tapTempoArr)
    }
})

// Listener per l'accento sull'uno
accent.addEventListener('change', () => {
    accentOnOne = accent.checked
    metronome.accent = accentOnOne
    accentOnOne ? subDiv.children[0].classList.add('accent') : subDiv.children[0].classList.remove('accent')
})

// Listener per l'input dei BPM
bpmInput.addEventListener("input", () => {
    metronome.time = 60000 / bpmInput.value
    bpmLabel.textContent = bpmInput.value
})

// Listener per il numero di suddivisioni
subInput.addEventListener("input", () => {
    subLabel.textContent = subInput.value
    updateSubDots(subInput.value)
    metronome.accent ? subDiv.children[0].classList.add('accent') : subDiv.children[0].classList.remove('accent')
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
    bpmLabel.textContent = bpmInput.value
    subLabel.textContent = subInput.value

    // Aggiorno le suddivisioni
    updateSubDots(subInput.value)
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