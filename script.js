const noteLabels = ['Sa', 'Ri', 'Ga', 'Ma', 'Pa', 'Da', 'Ni'];

// Preload audio files
const audioFiles = noteLabels.map((_, index) => {
    const audio = new Audio(`sounds/${index + 1}.mp3`);
    audio.preload = 'auto';
    return audio;
});

const colors = [
    { main: '#FF0000', light: '#FF6464' }, // Red
    { main: '#0000FF', light: '#6464FF' }, // Blue
    { main: '#00FF00', light: '#64FF64' }, // Green
    { main: '#FFFF00', light: '#FFFF64' }, // Yellow
    { main: '#FFA500', light: '#FFC864' }, // Orange
    { main: '#800080', light: '#C864C8' }, // Purple
    { main: '#00FFFF', light: '#64FFFF' }  // Cyan
];

// Base duration for normal speed (in milliseconds)
const BASE_DURATION = 1000;

// Speed multipliers
const speedMultipliers = {
    slow: 1,      // Half the speed (twice the duration)
    normal: 0.65,    // Normal speed
    fast: 0.45     // Double the speed (half the duration)
};

const MAX_MISTAKES = 3;

let currentSpeed = 'normal';
let sequence = [];
let userSequence = [];
let level = 1;
let mistakes = 0;
let isPlaying = false;

function getCurrentDuration() {
    return BASE_DURATION * speedMultipliers[currentSpeed];
}

function generateRandomSequence(length) {
    return Array.from({ length }, () => Math.floor(Math.random() * noteLabels.length));
}

function updateMessages(gameMsg = '', seqMsg = '') {
    document.getElementById('level-text').textContent = `Level ${level} - Mistakes: ${mistakes}/${MAX_MISTAKES}`;
    document.getElementById('game-message').textContent = gameMsg;
    document.getElementById('sequence-message').textContent = seqMsg;
}

function playNote(index, duration) {
    return new Promise((resolve) => {
        const audio = audioFiles[index];
        audio.currentTime = 0;
        audio.play();
        setTimeout(resolve, duration);
    });
}

function createPads() {
    const container = document.getElementById('pad-container');
    const centerX = 400;
    const centerY = 300;
    const radius = 150;

    noteLabels.forEach((label, i) => {
        const angle = (i / noteLabels.length) * (2 * Math.PI);
        const x = centerX + radius * Math.cos(angle) - 75;
        const y = centerY + radius * Math.sin(angle) - 75;

        const pad = document.createElement('div');
        pad.className = 'pad';
        pad.dataset.index = i;
        pad.textContent = label;
        pad.style.backgroundColor = colors[i].main;
        pad.style.left = `${x}px`;
        pad.style.top = `${y}px`;

        pad.addEventListener('click', () => handlePadClick(i));
        container.appendChild(pad);
    });
}

async function playPad(index) {
    const duration = getCurrentDuration();
    const pad = document.querySelector(`.pad[data-index="${index}"]`);
    pad.style.backgroundColor = colors[index].light;
    await playNote(index, duration);
    pad.style.backgroundColor = colors[index].main;
}

async function playSequence() {
    isPlaying = true;
    const sequenceDuration = getCurrentDuration();
    const pauseDuration = sequenceDuration / 2;

    updateMessages(`Playing sequence at ${currentSpeed} speed...`);

    for (let index of sequence) {
        const pad = document.querySelector(`.pad[data-index="${index}"]`);
        pad.classList.add('highlighted');
        await playPad(index);
        pad.classList.remove('highlighted');
        await new Promise(resolve => setTimeout(resolve, pauseDuration));
    }

    isPlaying = false;
    updateMessages('Your turn!');
}

async function handlePadClick(index) {
    if (isPlaying) return;

    await playPad(index);
    userSequence.push(index);

    if (userSequence[userSequence.length - 1] !== sequence[userSequence.length - 1]) {
        mistakes++;
        updateMessages('Wrong! Try again...', 'Watch the sequence...');
        
        if (mistakes >= MAX_MISTAKES) {
            updateMessages('Game Over!', `You reached level ${level}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            initGame();
            return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        userSequence = [];
        await playSequence();
        return;
    }

    if (userSequence.length === sequence.length) {
        if (userSequence.every((val, i) => val === sequence[i])) {
            updateMessages('Correct!', 'Next level...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            level++;
            mistakes = 0;
            sequence = generateRandomSequence(level + 2);
            userSequence = [];
            updateMessages();
            await playSequence();
        }
    }
}

function initGame() {
    level = 1;
    mistakes = 0;
    sequence = generateRandomSequence(3);
    userSequence = [];
    updateMessages('Game started!', 'Watch the sequence...');
    playSequence();
}

document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (isPlaying) return; // Prevent speed changes during sequence playback

        // Highlight the active button
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentSpeed = btn.dataset.speed;

        updateMessages(`Speed changed to ${currentSpeed}`);

        // Replay the current sequence with new speed
        if (sequence.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await playSequence();
        }
    });
});



document.getElementById('restart-btn').addEventListener('click', () => {
    if (!isPlaying) {
        initGame();
    }
});

document.getElementById('quit-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to quit?')) {
        window.close();
    }
});

// Initialize the game
createPads();

// Start game on first user interaction
document.addEventListener('click', function initAudio() {
    initGame();
    document.removeEventListener('click', initAudio);
}, { once: true });