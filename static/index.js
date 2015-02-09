/**
 * index.js
 */

var cubjectives = {};
var init_cubjectives = function() {
    cubjectives = {};
    show_output_loading();
};

$(document).ready(function() {
    cubjectives['base'] = query_base;
    $('.unit-base').html(event_unit(query_base));
    $('.format-example-base').html(event_format_example(query_base));
    $('#select-change-event').val(query_base);
    $('.cubjectives-info-' + query_base).html('<span class="your-real-record">This is your real record.</span>');
});

$('#link-change-event').click(function() {
    $('#panel-input-event').fadeIn('normal');
    return false;
});

// Check if the string is WCA ID.
var is_wcaid = function(str) {
    str = str.toUpperCase();
    if (str.match(/^(1|2)\d{3}[A-Z]{4}\d{2}$/)) {
        cubjectives['wca_id'] = str;
        return true;
    }
    return false;
};

// Validation of record field.
var check_record = function(r) {
    if (r == '') {
        return 'The field must not be blank.';
    }
    if (query_base == '333fm' || query_base == '333mbf') {
        // Format check.
        if (r.match(/^\d+$/)) { // format like: 123
            cubjectives['_record'] = r - 0;
        } else {
            return 'The field must be an integer or your WCA ID, when the event is ' + event_fullname('333fm') + ' or ' + event_fullname('333mbf') + '.';
        }
        // Range check.
        if (cubjectives['_record'] < 1 || 100 < cubjectives['_record']) {
            return 'The value must be between 1-100, when the event is ' + event_fullname('333fm') + ' or ' + event_fullname('333mbf') + '.';
        }
    } else {
        // Format check.
        if (r.match(/^\d+$/) || r.match(/^\d+\.\d+$/)) { // format like: 123 or 123.45
            cubjectives['_record'] = r - 0;
        } else if (r.match(/^\d+:\d+$/) || r.match(/^\d+:\d+\.\d+$/)) { // format like: 12:345 or 12:345.67
            var s = r.split(':');
            cubjectives['_record'] = (s[0] - 0) * 60 + (s[1] - 0);
        } else {
            return 'Invalid time format. Example: 12.34 or 5:67.89, or your WCA ID.';
        }
        // Range check.
        if (cubjectives['_record'] < 0.1 || 3600 < cubjectives['_record']) {
            return 'The value must be between 0.1sec. - 1hr.';
        }
    }
    return '';
};

// Show cubjectives
$('#get-cubjectives').click(function() {
    var record = $('#input-record').val();
    record = record.replace(/(^\s+)|(\s+$)/g, ''); // trim function

    cubjectives['input_record'] = record;
    if (is_wcaid(record)) {
        // Valid WCA ID
        request_two_jsons();
    } else {
        var msg = check_record(record);
        if (msg == '') {
            // Valid record
            request_json();
        } else {
            // Invalid record
            show_input_error(msg);
        }
    }
});

// Fetch JSON that gives statistics.
var request_json = function() {
    $.ajax({
        type: 'GET',
        url: './statistics.json?base=' + cubjectives['base'],
        dataType: 'json'
    })
    .done(function(json) {
        cubjectives['s'] = json;
        calculate_cubjectives();
    })
    .fail(function(xhr, status, error) {
        show_output_error();
        console.log('Ajax Error!');
        console.log(xhr.status + ': ' + xhr.statusText);
        console.log(status + ': ' + error);
    });
};

// Fetch two JSONs that give statistics and record from WCA ID.
var request_two_jsons = function() {
    $.when(
        $.ajax({
            type: 'GET',
            url: './statistics.json?base=' + cubjectives['base'],
            dataType: 'json'
        }),
        $.ajax({
            type: 'GET',
            url: './bestrecord.json?e=' + cubjectives['base'] + '&id=' + cubjectives['wca_id'],
            dataType: 'json'
        })
    )
    .done(function(json1, json2) {
        cubjectives['s'] = json1[0];
        cubjectives['b'] = json2[0];
        if (cubjectives['b']['best'] == -1) {
            show_input_error('There is no record of ' + cubjectives['wca_id'] + ' for ' + event_fullname(cubjectives['base']));
        } else {
            cubjectives['_record'] = cubjectives['b']['best'] - 0;
            calculate_cubjectives();
        }
    })
    .fail(function(xhr, status, error) {
        show_output_error();
        console.log('Ajax Error!');
        console.log(xhr.status + ': ' + xhr.statusText);
        console.log(status + ': ' + error);
    });
};

// Calculates cubjectives of all events.
var calculate_cubjectives = function() {
    if (target == '333fm' || target == '333mbf') {
        $('.cubjectives-record-' + cubjectives['base']).html(round2(cubjectives['_record']) + ' ' + event_unit(cubjectives['base']));
    } else {
        $('.cubjectives-record-' + cubjectives['base']).html(format_time(cubjectives['_record']));
    }

    cubjectives['output'] = {};
    var stat = cubjectives['s']['statistics'];
    for (var i = 0, l = stat.length; i < l; i++) {
        var target = stat[i]['ey'];
        var slope = stat[i]['line']['slope'];
        var intercept = stat[i]['line']['intercept'];
        cubjectives['output'][target] = slope * cubjectives['_record'] + intercept;
        if (target == '333fm' || target == '333mbf') {
            $('.cubjectives-record-' + target).text(round2(cubjectives['output'][target]) + ' ' + event_unit(target));
        } else {
            $('.cubjectives-record-' + target).text(format_time(cubjectives['output'][target]));
        }
    }
    show_output();
};

var show_input_error = function(msg) {
    $('#input-error').text('Error: ' + msg);
    $('#input-error').show();
    $('#output-error').hide();
    $('#output-loading').hide();
    $('#output').hide();
};
var show_output_error = function() {
    $('#input-error').hide();
    $('#output-error').show();
    $('#output-loading').hide();
    $('#output').hide();
};
var show_output_loading = function() {
    $('#input-error').hide();
    $('#output-error').hide();
    $('#output-loading').show();
    $('#output').hide();
};
var show_output = function() {
    $('#input-error').hide();
    $('#output-error').hide();
    $('#output-loading').hide();
    $('#output').show();
};
