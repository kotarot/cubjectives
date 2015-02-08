// Some functions.
var round2 = function(x) { return Math.round(x * 100) / 100; };
var round3 = function(x) { return Math.round(x * 1000) / 1000; };
var format_time = function(sec) {
    sec = sec - 0;
    if (sec < 60) {
        return sec.toFixed(2);
    } else {
        var min = Math.floor(sec / 60);
        var sec = sec - min * 60;
        return min + ':' + ('0' + sec.toFixed(2)).slice(-5);
    }
}
