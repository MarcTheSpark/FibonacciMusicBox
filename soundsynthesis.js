let context = new (window.AudioContext || window.webkitAudioContext)();
let marimbaBuffers = {};
let reverb, wetGain, dryGain;

fetch('notes/ConcertHall.mp3').then(response => {
    return response.arrayBuffer();
}).then(arrayBuffer => {
    return context.decodeAudioData(arrayBuffer);
}).then(audioBuffer => {
    reverb = context.createConvolver();
    reverb.buffer = audioBuffer;

    // Create gain nodes for wet and dry signals
    wetGain = context.createGain();
    dryGain = context.createGain();
    wetGain.gain.value = 0.2;  // Wet level is the "timbre" value
    dryGain.gain.value = 0.8;  // Dry level is the inverse of the "timbre" value

    // Connect the reverb to the wet gain
    reverb.connect(wetGain);

    // Connect both gains to the destination
    wetGain.connect(context.destination);
    dryGain.connect(context.destination);
});

for (let i = 36; i <= 96; i += 6) {
    fetch(`notes/marimba${i}.mp3`).then(response => {
        return response.arrayBuffer();
    }).then(arrayBuffer => {
        return context.decodeAudioData(arrayBuffer);
    }).then(audioBuffer => {
        marimbaBuffers[i] = audioBuffer;
    });
}

function playNote(pitch, volume, when, duration) {
    // find the closest available MIDI note
    let closest = Object.keys(marimbaBuffers).reduce((prev, curr) => {
        return (Math.abs(curr - pitch) < Math.abs(prev - pitch) ? curr : prev);
    });

    let source = context.createBufferSource();
    source.buffer = marimbaBuffers[closest];

    // Calculate the playback rate for the correct pitch
    let midiPitch = parseFloat(pitch);
    let midiClosest = parseFloat(closest);
    let frequencyRatio = Math.pow(2, (midiPitch - midiClosest) / 12);
    source.playbackRate.value = frequencyRatio;

    // Create a gain node to control the volume
    let gainNode = context.createGain();
    gainNode.gain.value = Math.pow(volume, 1.7);

    // Connect the source to the gain node
    source.connect(gainNode);

    // Connect the gain node to both the reverb (wet signal) and the dry gain
    gainNode.connect(reverb);
    gainNode.connect(dryGain);

    // Start the note at the specified time
    source.start(when);

    // Stop the note at the specified end time
    source.stop(when + duration);

    // Schedule the gain to reduce to 0 right before the note stops.
    gainNode.gain.setValueAtTime(volume, when);
    gainNode.gain.linearRampToValueAtTime(0, when + duration);

    // Disconnect the gainNode shortly after the note stops.
    setTimeout(() => {
        gainNode.disconnect();
    }, (when + duration - context.currentTime) * 1000 + 50); // Add 50ms buffer to ensure the note has stopped

    return source
}
