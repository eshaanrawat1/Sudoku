var startTime;
var stopWatchInterval;

function startStopWatch() {
    if (!stopWatchInterval) {
        startTime = new Date().getTime();
        stopWatchInterval = setInterval(updateStopWatch, 1000); 
    }
}

function updateStopWatch() {
    var currentTime = new Date().getTime();
    var elapsedTime = currentTime - startTime;

    var seconds = Math.floor(elapsedTime / 1000) % 60;
    var minutes = Math.floor(elapsedTime / 1000 / 60) % 60;
    var hours = Math.floor(elapsedTime / 1000 / 60 / 60);

    var displayTime = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
    document.getElementById("stopwatch").innerHTML = displayTime;
}

function pad(number) {
    return (number < 10 ? "0" : "") + number;
}

startStopWatch();