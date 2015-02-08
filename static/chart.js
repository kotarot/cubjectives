/**
 * chart.js
 */

var cubjectives = {};
var init_cubjectives = function() {
    // Clear SVG.
    d3.select('#chart-all-area svg').remove();
    $('#chart-all-area').append('<svg></svg>');
    d3.select('#chart-sub-area svg').remove();
    $('#chart-sub-area').append('<svg></svg>');

    cubjectives = {};
    show_chart_loading();
};

// Show chart
$(document).ready(function() {
    init_cubjectives();
    cubjectives['ex'] = query_ex;
    cubjectives['ey'] = query_ey;

    $('.unit-ex').text(event_unit(query_ex));
    $('.unit-ey').text(event_unit(query_ey));
    request_json();
});

var request_json = function() {
    show_chart_loading();
    $.ajax({
        type: 'GET',
        url: './relationship.json?ex=' + cubjectives['ex'] + '&ey=' + cubjectives['ey'],
        dataType: 'json'
    })
    .done(function(json) {
        cubjectives['r'] = json;
        disp_charts();
    })
    .fail(function(xhr, status, error) {
        show_chart_error();
        console.log('Ajax Error!');
        console.log(xhr.status + ': ' + xhr.statusText);
        console.log(status + ': ' + error);
    });
};

// Display charts.
var disp_charts = function() {
    var json = cubjectives['r'];
    var relationship = json['relationship']
    var dataset_all = relationship['dataset'];
    var margin = 40;
    var w = $('#tron').innerWidth();
    if (w < 450) {
        w = 450;
        $('.panel-chart').width(450)
    }
    var h = parseInt(w * 0.5);

    // 1. All cubers
    disp_one_chart(w, h, margin, dataset_all, 'all');

    // 2. Fast cubers (below average on both events)
    var dataset_sub = [];
    if (cubjectives['ex'] == '333mbf') {
        for (var i = 0, l = dataset_all.length; i < l; i++) {
            if (dataset_all[i][0] >= relationship['avgx'] && dataset_all[i][1] <= relationship['avgy']) {
                dataset_sub.push(dataset_all[i]);
            }
        }
    } else if (cubjectives['ey'] == '333mbf') {
        for (var i = 0, l = dataset_all.length; i < l; i++) {
            if (dataset_all[i][0] <= relationship['avgx'] && dataset_all[i][1] >= relationship['avgy']) {
                dataset_sub.push(dataset_all[i]);
            }
        }
    } else {
        for (var i = 0, l = dataset_all.length; i < l; i++) {
            if (dataset_all[i][0] <= relationship['avgx'] && dataset_all[i][1] <= relationship['avgy']) {
                dataset_sub.push(dataset_all[i]);
            }
        }
    }
    disp_one_chart(w, h, margin, dataset_sub, 'sub');

    $('#chart-error').hide();
    $('#chart-loading').hide();
    $('#charts').show();
};

var disp_one_chart = function(w, h, margin, dataset, name) {
    // Scale functions.
    var xMax = d3.max(dataset, function(d) { return d[0]; });
    var yMax = d3.max(dataset, function(d) { return d[1]; });
    var xMin = d3.min(dataset, function(d) { return d[0]; });
    var yMin = d3.min(dataset, function(d) { return d[1]; });
    if (name == "all") {
        var xScale = d3.scale.linear()
            .domain([0, xMax])
            .range([margin * 2, w - margin * 2]);
        var yScale = d3.scale.linear()
            .domain([0, yMax])
            .range([h - margin, margin]);
    } else if (name == "sub") {
        var xScale = d3.scale.linear()
            .domain([xMin - xMin / 10, xMax])
            .range([margin * 2, w - margin * 2]);
        var yScale = d3.scale.linear()
            .domain([yMin - yMin / 10, yMax])
            .range([h - margin, margin]);
    }

    // Axes
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .innerTickSize(-(h - margin * 2))
        .outerTickSize(5)
        .tickPadding(10);
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left')
        .innerTickSize(-(w - margin * 4))
        .outerTickSize(5)
        .tickPadding(10);

    // SVG element.
    var svg = d3.select('#chart-' + name + '-area svg')
        .attr('width', w + margin)
        .attr('height', h + margin);

    // A) Draws scatter plots.
    var point_color = '#e67e22';
    var opacity = 0.6;
    if (name == 'sub') {
        var opacity = 0.8;
    }
    svg.selectAll('circle')
        .data(dataset)
        .enter()
        .append('circle')
        .attr('cx', function(d) { return xScale(d[0]); })
        .attr('cy', function(d) { return yScale(d[1]); })
        .attr('r', 2)
        .attr('fill', point_color)
        .attr('opacity', opacity);

    // B) Draws line.
    if (name == 'all') {
        var line_color = '#e74c3c';
        var slope = cubjectives['r']['relationship']['line']['slope'];
        var intercept = cubjectives['r']['relationship']['line']['intercept'];
        var regression = function(x) { return slope * x + intercept; };
        var regression_inv = function(y) { return (y - intercept) / slope; };
        // left point
        var x1 = 0;
        var y1 = regression(0);
        if (y1 < 0) {
            x1 = regression_inv(0);
            y1 = 0;
        } else if (yMax < y1) {
            x1 = regression_inv(yMax);
            y1 = yMax;
        }
        // right point
        var x2 = xMax;
        var y2 = regression(xMax);
        if (y2 < 0) {
            x2 = regression_inv(0);
            y2 = 0;
        } else if (yMax < y2) {
            x2 = regression_inv(yMax);
            y2 = yMax;
        }
        svg.append('line')
            .attr('x1', xScale(x1))
            .attr('y1', yScale(y1))
            .attr('x2', xScale(x2))
            .attr('y2', yScale(y2))
            .attr('stroke', line_color)
            .attr('stroke-width', 1)
            .attr('opacity', 0.9);
    }

    // Draw axes.
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0, ' + (h - margin) + ')')
        .call(xAxis);
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + (margin * 2) + ', 0)')
        .call(yAxis);

    // Draw labels.
    svg.append('text')
        .text('X: ' + event_fullname(cubjectives['ex']) + ' (' + event_unit(cubjectives['ex']) + ')')
        .attr('x', w * 0.5)
        .attr('y', h)
        .attr('class', 'label')
        .style('text-anchor', 'middle');
    svg.append('text')
        .text('Y: ' + event_fullname(cubjectives['ey']) + ' (' + event_unit(cubjectives['ey']) + ')')
        .attr('transform', 'rotate(-90, ' + margin + ', 0)')
        .attr('x', -(h * 0.5))
        .attr('y', 0)
        .attr('class', 'label')
        .style('text-anchor', 'middle');

    // Display information
    if (name == 'all') {
        $('.point-color').css('color', point_color);
        $('.line-color').css('color', line_color);
        $('.regression-s').text(round2(slope));
        if (intercept < 0) {
            $('.regression-sign').text('-');
        } else {
            $('.regression-sign').text('+');
        }
        $('.regression-absi').text(round2(Math.abs(intercept)));
        $('.all-num-cubers').text(cubjectives['r']['relationship']['count']);
        $('.correlation-r').text(round3(cubjectives['r']['relationship']['r_value']));
        $('.avg-ex').text(round2(cubjectives['r']['relationship']['avgx']));
        $('.var-ex').text(round2(cubjectives['r']['relationship']['varx']));
        $('.std-ex').text(round2(cubjectives['r']['relationship']['stdx']));
        $('.avg-ey').text(round2(cubjectives['r']['relationship']['avgy']));
        $('.var-ey').text(round2(cubjectives['r']['relationship']['vary']));
        $('.std-ey').text(round2(cubjectives['r']['relationship']['stdy']));
    } else if (name == 'sub') {
        $('.sub-num-cubers').text(dataset.length);
    }
};

// Show chart loading.
var show_chart_loading = function() {
    $('#chart-error').hide();
    $('#chart-loading').show();
    $('#charts').hide();
};
// Show chart error.
var show_chart_error = function() {
    $('#chart-error').show();
    $('#chart-loading').hide();
    $('#charts').hide();
};
