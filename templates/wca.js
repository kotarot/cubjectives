/**
 * wca.js
 */

var wca_events = {
    {{ params.wca_events_js }}
};
var event_fullname = function(e) {
    return wca_events[e];
}
var event_unit = function(e) {
    if (e == '333fm') { return 'moves'; }
    else if (e == '333mbf') { return 'cubes'; }
    else { return 'sec'; }
};
var event_format_example = function(e) {
    if (e == '333fm' || e == '333mbf') { return '<b>24</b>'; }
    else { return '<b>12.34</b>, <b>4:56.78</b>'; }
};
