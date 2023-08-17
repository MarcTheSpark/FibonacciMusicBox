class Segment {
    constructor(from, to, clr, opacity, fadeTime=3000) {
        this.from = from;
        this.to = to;
        this.clr = clr;
        this.opacity = this.originalOpacity = opacity;
        this.fadeTime = fadeTime;
        this.creationTime = millis(); // store the creation time
    }

    drawSegment() {
        stroke(red(this.clr), green(this.clr), blue(this.clr), this.opacity);
        line(this.from[0], this.from[1], this.to[0], this.to[1]);
    }

    fade() {
        let elapsedTime = millis() - this.creationTime;
        this.opacity = map(elapsedTime, 0, this.fadeTime, this.originalOpacity, 0);
    }
}

class Dot {
    constructor(location, clr, opacity, fadeTime=3000) {
        this.location = location;
        this.clr = clr;
        this.opacity = this.originalOpacity = opacity;
        this.fadeTime = fadeTime;
        this.creationTime = millis(); // store the creation time
    }

    drawDot() {
        fill(red(this.clr), green(this.clr), blue(this.clr), this.opacity);
        ellipse(this.location[0], this.location[1], dotWidth); // draw dot
    }

    fade() {
        let elapsedTime = millis() - this.creationTime;
        this.opacity = map(elapsedTime, 0, this.fadeTime, this.originalOpacity, 0);
    }
}

let leftMargin, topMargin, gridWidth, gridHeight;
let sliderN, sliderSpeed, sliderDecay, sliderCircuits, sliderNotes, sliderVolume, sliderMedianPitch, sliderScaleSelector;
let btnEndAll;
let segments, dots;
let dotWidth;
let n, oldN;
let dotColors, dotColorationTimes;
let scheduledNotes = [], scheduledActions = [];
let currentScale;

function setup() {
  let canvas = createCanvas(min(windowWidth, windowHeight), min(windowWidth, windowHeight));
  canvas.parent('canvas-container');
  leftMargin = width * 0.1; // Margin to center the grid
  topMargin = height * 0.02; // Adjusted margin to center the grid
  gridWidth = width * 0.87;// Width of the grid
  gridHeight = height * 0.87; // Height of the grid
  sliderN = select('#n-slider');
  sliderSpeed = select('#speed-slider');
  sliderDecay = select('#decay-slider');
  buttonEndAllNotes = select('#end-all');
  scaleSelector = select('#scale-selector');
  sliderMedianPitch = select('#median-pitch-slider');

  textAlign(CENTER, CENTER);
  noStroke();
  background(0);
  oldN = n = sliderN.value();
  resetN(n);

  setScale();
}

function setScale() {
  currentScale = new Scale(0, scaleIntervals[scaleSelector.value()]);
  let totalWidth = currentScale.get(n - 1);
  currentScale.startPitch = parseInt(sliderMedianPitch.value() - totalWidth / 2);
}


function draw() {
    n = sliderN.value();
    processScheduledActions();
    pruneScheduledNotes();
    background(0);
    drawGrid();
    drawSegments();
    drawDots();
    if (keyIsPressed && key === 'Shift') {
      drawAllDotColors();
    }
}

function processScheduledActions() {
  while (scheduledActions.length > 0) {
    let [t, action] = scheduledActions[0];
    if (t <= millis()) {
      action();
      scheduledActions.shift();
    } else {
      break;
    }
  }
}

function pruneScheduledNotes() {
  for (let i = scheduledNotes.length - 1; i >= 0; i--) {
      if (scheduledNotes[i][0] < context.currentTime - 0.1) {
          scheduledNotes.splice(i, 1);
      }
  }
}

function endAllNotes() {
  for (scheduledNote of scheduledNotes) {
    scheduledNote[1].stop();
  }
  scheduledNotes.length = 0;
  scheduledActions.length = 0;
}

function getGridPointLocation(point) {
    return [
      point[0] * (gridWidth / n) + (gridWidth / n / 2) + leftMargin,
      (n - point[1]) * (gridHeight / n) - (gridHeight / n / 2) + topMargin
    ]
}

function drawDots() {
    push();

    for (let i = dots.length - 1; i >= 0; i--) {
        dots[i].drawDot();
        dots[i].fade();
        if (dots[i].opacity <= 0) {
            // Remove segment if it has completely faded
            dots.splice(i, 1);
        }
    }
    pop();
}

function drawSegments() {
    push();
    strokeWeight(map(n, 1, 100, dotWidth / 4, dotWidth)); // make the line thinner
    strokeCap(ROUND); // round corners
    strokeJoin(ROUND); // round joiners

    for (let i = segments.length - 1; i >= 0; i--) {
        segments[i].drawSegment();
        segments[i].fade();
        if (segments[i].opacity <= 0) {
            // Remove segment if it has completely faded
            segments.splice(i, 1);
        }
    }
    pop();
}

function generateFibCircuit(start, n, numLoops=1) {
    let circuit = [start];
    let a = start[0];
    let b = start[1];
    do {
        let temp = b;
        b = (a + b) % n;
        a = temp;
        circuit.push([a, b]);
        if (a == start[0] && b == start[1]) { numLoops--; }
    } while (numLoops > 0)
    return circuit;
}

function generateFibPath(start, n, numDots) {
    let path = [start];
    let a = start[0];
    let b = start[1];
    while (path.length < numDots) {
      let temp = b;
      b = (a + b) % n;
      a = temp;
      path.push([a, b]);
    }
    return path;
}

let distinctColors = ['#ff0000', '#00ff4a', '#4a46fa', '#ff00ff', '#23e0ff', '#606f50', '#f68493', '#800080', '#91dd85', '#d26509', '#088db6', '#a6a8f6', '#5ac409', '#880605', '#072b84', '#008000', '#f10f81', '#ffff80', '#c14de2', '#0000ff', '#8000ff', '#07fda6', '#e1db01', '#09b055', '#85f9f0', '#7082b5', '#ff80ff', '#b64b7a', '#b19a42', '#423a0a', '#deccc0', '#613ea6', '#808000', '#8dfa23', '#49d2b3', '#feab45', '#3e96fd', '#0039d3', '#06655a', '#c00bcd', '#3106b7', '#360651', '#904329', '#00ff00', '#c3103e', '#63b060', '#fa4a54', '#4ffa5f', '#d1fe3c', '#b598a1', '#fb4bbd', '#cfd16f', '#053336', '#2f8d7c', '#0ab811', '#8077fe', '#8932e3', '#9fb506', '#61335c', '#235a91', '#388e28', '#0570fa', '#3af225', '#e53215', '#67c1f8', '#d99e08', '#02bad6', '#c4f7a4', '#8ed0c8', '#c0eaf3', '#0bd77a', '#e2b6fe', '#4214ef', '#3769ca', '#cb6c4f', '#cd7fdf', '#8c717e', '#490314', '#9fcb43', '#f348ff', '#b80e83', '#810f40', '#7ab09c', '#8704bf', '#d12fa2', '#9f64b8', '#fd7732', '#43ffda', '#6dfbab', '#fcdc46', '#59631a', '#fb1cc9', '#441d85', '#043702', '#fbb38d', '#ffff00', '#fa0f3e', '#a9fc65', '#000080', '#1eb89a', '#fea4cb', '#20642c', '#9933a5', '#3ea1c2', '#952b6d', '#be1404', '#9f6e32', '#d0a571', '#39d34b', '#9ca373', '#cec232', '#d862a4', '#b627fe', '#78b330', '#f5fec3', '#3635c2', '#00d831', '#bcf905', '#c13b42', '#08f9d9', '#2a4063', '#759ce1', '#50d677', '#7158d4', '#628a86', '#3dfb91', '#100a2b', '#5c6089', '#1a31fe', '#69da31', '#b8c29d', '#ff5303', '#fada98', '#88d809', '#5171f4', '#ae860e', '#049730', '#a25901', '#838a46', '#7ef450', '#29baf3', '#8b535f', '#01195d', '#0161b6', '#0999f4', '#6b251d', '#0d21b1', '#f1d7ee', '#3a2e3c', '#9c87cb', '#c27e7d', '#06d8ba', '#f63482', '#327602', '#559b02', '#35b62b', '#f076c4', '#23e102', '#a1f4c7', '#fe8500', '#281a00', '#61ff04', '#942a05', '#cba5d2', '#591ac7', '#9154f7', '#008080', '#94d0fe', '#b12ecd', '#5bdedd', '#f7bc16', '#5f01a4', '#754702', '#2054e9', '#f37365', '#0505cf', '#2fb371', '#3e84a6', '#db8f4b', '#80ff80', '#445144', '#824d8f', '#26804c', '#fe578c', '#bdc5e3', '#d90bf5', '#ad01fc', '#4aa698', '#1bfa70', '#761d9b', '#ff25fa', '#e003aa', '#76d05a', '#2cd6d7', '#9cabbb', '#248bd9', '#3ea250', '#d2fb73', '#6a9325', '#addd1e', '#e72c4b', '#ab76f6', '#5af5ff', '#fafd3b', '#a30355', '#00ffff', '#60b6cb', '#71d098', '#bb4005', '#306c6f', '#610f5c', '#d62fe2', '#dda2a3', '#5c65b2', '#1e461c', '#db556b', '#6625f9', '#b6dabc', '#289a02', '#6f553a', '#dd67f9', '#bde24a', '#5a38d8', '#a5242e', '#cf2b75', '#e194fe', '#5388d9', '#2e0287', '#8d9398', '#a714ac', '#2d3994', '#de7f1e', '#e30d19', '#04a67c', '#b0bd65', '#064b79', '#8f9d1b', '#b74ba8', '#e8582f', '#0d5c06', '#f9c768', '#50427a', '#ccbd01', '#86c076', '#d10463', '#28f2c3', '#a20429', '#9412e1', '#02d8e6', '#c97eb3', '#15e359', '#560e37', '#a27c61', '#826017', '#568c60', '#6605e1', '#cdf6cf', '#f3986e', '#27d79b', '#039162', '#aeb32e', '#621301', '#0b41a7', '#af6592', '#9cffa0', '#d5d699', '#414eae', '#b25426', '#0276d7', '#0cfc25', '#ff3733', '#2b1d66', '#1b1ee2', '#b0fe2b', '#4be000', '#29fef8', '#0106a5', '#d743c3', '#92b04e', '#ed9929', '#f2e46e', '#8f49bf', '#6b59fc', '#005042', '#52be42', '#c365ca', '#ae2055', '#e5e827', '#1b779a', '#b4e785', '#38fb02', '#436e38', '#127f20', '#27bac3', '#8126bf', '#46d2f9', '#7e2d3e', '#b15955', '#72317f', '#f62eaa', '#4eace7', '#5a027e', '#78e8c6', '#7e74d8', '#5df938', '#26fc43', '#8fb9e1', '#f5bedb', '#33c103', '#fea4fc', '#39560b', '#30d427', '#0cbb34', '#fd1d60', '#958eef', '#2351c3', '#555763', '#e5f09f', '#03bdfe', '#79aa01', '#fedcc9', '#9aff01', '#d9fef4', '#05753d', '#2f03d9', '#8de5a8', '#fd66e3', '#c07f31', '#587e05', '#64ec8d', '#648cfd', '#7e7a24', '#219ca4', '#55ba80', '#2c1d24', '#f71e01', '#2b77f7', '#d84990', '#4550d5', '#d0a734', '#011f16', '#1c1c44', '#3522a6', '#049d0c', '#8de031', '#01aeb8', '#c92522', '#798b6a', '#bb91f5', '#def705', '#a8fdeb', '#9be2e3', '#9b7b9c', '#50edbf', '#56aa22', '#97c9a5', '#053955', '#03d511', '#f101cf', '#f438d9', '#94dd61', '#0e014b', '#639db5', '#4ba175', '#846f52', '#2406f8', '#e091c1', '#b043fd', '#554327', '#b89063', '#2dce72', '#f5bbb1', '#5abaa9', '#014dfd', '#699e47', '#fd0162', '#e1b650', '#d3b986', '#95019a', '#bebec1', '#c915a7', '#af2b85', '#67fed4', '#8f21fe', '#a73f59', '#869ac1', '#fddd15', '#fe0fa5', '#b89f17', '#18a5ce', '#7b6e9d', '#6ba37f', '#f18fdf', '#6d061f', '#743efc', '#75e2f5', '#547270', '#94c821', '#cb8201', '#5a853e', '#3a33e5', '#cfceff'];

function kthColor(k) {
  return distinctColors[k];
}

function resetN(n) {
  dotColors = Array(n).fill().map(() => Array(n).fill(null));
  let colorIndex = 0;
  for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
          if (dotColors[i][j] == null) {
              let c = kthColor(colorIndex);
              colorIndex++;
              let circuit = generateFibCircuit([i, j], n);
              for (let m = 0; m < circuit.length; m++) {
                  dotColors[circuit[m][0]][circuit[m][1]] = c;
              }
          }
      }
  }
  //dotColors = Array(n).fill().map(() => Array(n).fill(color(0, 255, 0))); // all dots start off white
  dotColorationTimes = Array(n).fill().map(() => Array(n).fill(Number.NEGATIVE_INFINITY));
  oldN = n;

  // Clear the segments and dots lists
  segments = [];
  dots = [];
  setScale();
  endAllNotes();
}

function drawGrid() {
    if (n !== oldN) { resetN(n); }

    dotWidth = width * 0.4 / n / 2; // calculate dot width based on grid size
    textSize(height/25); // Set text size for 'n' label
    let verticalOffset = textAscent() /4;
    fill(255); // White color
    text('F', width / 2, height * 0.96); // Draw 'n' label
    textSize(height/35); // Set text size for 'n' label
    text("n", width / 2 + textWidth("F")*1.5, height * 0.96 + verticalOffset);
    text("-", width / 2 + textWidth("F n "), height * 0.96 + verticalOffset);
    text("1", width / 2 + textWidth("F n - "), height * 0.96 + verticalOffset);
    textAlign(LEFT, CENTER);
    textSize(height/25); // Set text size for 'n' label
    text('F', width * 0.02, height / 2); // Draw 'n' label
    textSize(height/35); // Set text size for 'n' label
    text("n", width * 0.02 + textWidth("F")*1.5, height / 2 + verticalOffset);
    textAlign(CENTER, CENTER);

    textSize(map(n, 0, 100, width/20, width/60));

    let labelInterval; // Determine interval for labeling the grid
    if (n <= 10) {
        labelInterval = 1;
    } else if (n <= 20) {
        labelInterval = 5;
    } else {
        labelInterval = 10;
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            dotLocation = getGridPointLocation([i, j]);
            fill(255);
            ellipse(dotLocation[0], dotLocation[1], dotWidth); // draw dot
        }
    }

    fill(255); // white color
    textAlign(CENTER, TOP);
    for (let i = 0; i < n; i += labelInterval) {
        let [x, y] = getGridPointLocation([i, 0]); // use the getGridPointLocation to calculate x position
        y += dotWidth / 2 +  min(gridWidth / n, textAscent() * 0.75); // slightly below the bottom of the grid
        text(i, x, y); // draw label along x axis
    }
    textAlign(RIGHT, CENTER);
    for (let j = 0; j < n; j += labelInterval) {
        let [x, y] = getGridPointLocation([0, j]); // use the getGridPointLocation to calculate y position
        x -= dotWidth / 2 + min(gridWidth / n, textAscent() * 0.75); // slightly to the left of the grid
        text(j, x, y); // draw label along y axis
    }
    textAlign(CENTER, CENTER);

}

function drawAllDotColors() {
  for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
          dotLocation = getGridPointLocation([i, j]);
          fill(dotColors[i][j]);
          ellipse(dotLocation[0], dotLocation[1], dotWidth); // draw dot
      }
  }
}

function animateFibonacciSequence(circuit, delay=0.1) {
  dotColorationTimes[circuit[0][0]][circuit[0][1]] = millis();
  dots.push(
    new Dot(
      getGridPointLocation(circuit[0]),
      dotColors[circuit[0][0]][circuit[0][1]],
      255
    )
  )
  let firstNoteTime = context.currentTime;
  playNote(currentScale.get(circuit[0][1]), 1.0, firstNoteTime, 0.5);
  for (let i = 1; i < circuit.length; i++) {
    let [x, y] = circuit[i];
    let decayMul = Math.pow(sliderDecay.value(), i);
    scheduledActions.push([millis() + delay * 1000 * i, function() {
      dots.push(
        new Dot(
          getGridPointLocation(circuit[i]),
          dotColors[x][y],
          parseInt(255 * decayMul)
        )
      )
      segments.push(
        new Segment(
          getGridPointLocation(circuit[i - 1]),
          getGridPointLocation(circuit[i]),
          dotColors[x][y],
          parseInt(255 * decayMul)
        )
      );
    }]);
    scheduledNotes.push([
      firstNoteTime + i * delay,
      playNote(currentScale.get(y), 0.7 * Math.pow(sliderDecay.value(), i), firstNoteTime + i * delay, 0.5)
    ]);
  }
  scheduledNotes.sort((a, b) => a[0] - b[0]);
  scheduledActions.sort((a, b) => a[0] - b[0]);
}

function mousePressed() {
    let cellWidth = gridWidth / n;
    let cellHeight = gridHeight / n;
    // Determine the row and column of the cell that was clicked
    let i = Math.floor((mouseX - leftMargin) / cellWidth);
    let j = n - 1 - Math.floor((mouseY - topMargin) / cellHeight);  // We subtract from n - 1 because the y-coordinate increases as we move down, but we want j to increase as we move up
    // Make sure the click was within the grid
    if (i >= 0 && i < n && j >= 0 && j < n) {
        let timeDelay = 1 / Math.pow(2, sliderSpeed.value());
        animateFibonacciSequence(getFibPath([i, j]), timeDelay);
    }
}

function getFibPath(pathStart) {
  let activeSliderGroup = document.querySelector('.switchable.active');

  if (activeSliderGroup) { // check if an active group was found
      let groupId = activeSliderGroup.id;

      // Get the slider input within the active group
      let activeSliderInput = activeSliderGroup.querySelector('input[type="range"]');

      if (activeSliderInput) { // check if an input was found
          // Get the value of the active slider
          let sliderValue = activeSliderInput.value;

          if (groupId === 'num-cycles-slider-group') {
              return generateFibCircuit(pathStart, n, numLoops=sliderValue);
          } else if (groupId === 'num-notes-slider-group') {
              return generateFibPath(pathStart, n, numDots=sliderValue);
          } else if (groupId === 'decay-threshold-slider-group') {
              // Perform action for 'decay-threshold-slider-group'
              let numNotes = Math.ceil(Math.log(sliderValue) / Math.log(sliderDecay.value()));
              return generateFibPath(pathStart, n, numDots=numNotes);
          }
      } else { return generateFibCircuit(pathStart, n); } // shouldn't happen
  } else { return generateFibCircuit(pathStart, n); } // shouldn't happen
}

function windowResized() {
  resizeCanvas(min(windowWidth, windowHeight), min(windowWidth, windowHeight));
  leftMargin = width * 0.09; // Margin to center the grid
  topMargin = height * 0.02; // Adjusted margin to center the grid
  gridWidth = width * 0.9; // Width of the grid
  gridHeight = height * 0.88; // Height of the grid
}

window.onload = function() {
  let sliders = document.querySelectorAll('[id$="-slider"]'); // select all elements whose id ends with "-slider"

  sliders.forEach((slider) => {
    slider.addEventListener('input', function() {
      let valueId = this.id.replace('-slider', '-value'); // create the id of the corresponding value span
      let valueSpan = document.getElementById(valueId);
      if (this.id == "speed-slider") {
        valueSpan.textContent = Math.round(Math.pow(2, this.value) * 60);
      } else {
        valueSpan.textContent = this.value;
      }
      if (this.id == "median-pitch-slider" || this.id == "n-slider") { setScale(); }
    });
  });

  let switchableSliderGroups = document.querySelectorAll('.slider-group.switchable');

  switchableSliderGroups.forEach(function(group) {
    let slider = group.querySelector('input[type="range"]');

    slider.addEventListener('input', function() {
      // Set the current group as active and all others as inactive
      switchableSliderGroups.forEach(function(otherGroup) {
        if (otherGroup === group) {
          otherGroup.classList.remove('inactive');
          otherGroup.classList.add('active');
        } else {
          otherGroup.classList.remove('active');
          otherGroup.classList.add('inactive');
        }
      });
    });
  } );

  let scaleSelector = document.getElementById('scale-selector');
  let scaleIntervalsInput = document.getElementById('scale-intervals');

  let handleScaleChange = function() {
      if (scaleSelector.value === 'custom') {
          scaleIntervalsInput.disabled = false;
          scaleIntervals.custom = scaleIntervalsInput.value.split(',').map(Number);
      } else {
          scaleIntervalsInput.disabled = true;
          scaleIntervalsInput.value = scaleIntervals[scaleSelector.value].join(', ');
      }
      setScale();
  };

  // Add the event listener
  scaleSelector.addEventListener('change', handleScaleChange);

  // Call the function directly to handle the initial state
  handleScaleChange();

  scaleIntervalsInput.addEventListener('input', function() {
      // Remove anything that's not a number, comma or whitespace
      this.value = this.value.replace(/[^0-9.,\s]/g, '');

      // Replace multiple spaces with a single space
      this.value = this.value.replace(/\s+/g, ' ');
  });


  scaleIntervalsInput.addEventListener('change', function() {
      // Trim leading and trailing whitespace
      this.value = this.value.trim();

      // Split the string by comma or space
      let parts = this.value.split(/[,\s]/).filter(Boolean);

      // Check if all parts are valid numbers
      let valid = parts.every(part => !isNaN(parseFloat(part)));

      if (!valid) {
          this.style.borderColor = 'red';
          this.style.backgroundColor = '#fdd';
      } else {
          this.style.borderColor = '';
          this.style.backgroundColor = '';
          // update scaleIntervals.custom with the new values
          scaleIntervals.custom = parts.map(parseFloat);
          setScale();
      }
  });
}
