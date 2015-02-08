#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, abort, g, render_template, request, Response, url_for
import pymysql
import pymysql.cursors
import re

# Configuration
DEBUG          = True
MYSQL_HOST     = 'localhost'
MYSQL_USERNAME = 'xxxxxxxx'
MYSQL_PASSWORD = 'xxxxxxxx'
MYSQL_DATABASE = 'xxxxxxxx'

# Create application
app = Flask(__name__)
app.config.from_object(__name__)
app.config.from_envvar('CUBJECTIVES_SETTINGS', silent=True)

# Connect to MySQL.
def connect_db():
    return pymysql.connect(host=app.config['MYSQL_HOST'], user=app.config['MYSQL_USERNAME'], passwd=app.config['MYSQL_PASSWORD'], db=app.config['MYSQL_DATABASE'])

# Returns WCA events (id, name) as a list.
def wca_events():
    cursor = g.connection.cursor()
    cursor.execute('SELECT id, name FROM Events WHERE rank < 900')
    events = cursor.fetchall()
    return [(event[0], event[1]) for event in events]

# Returns WCA events (id) as a list.
def wca_events_ids():
    cursor = g.connection.cursor()
    cursor.execute('SELECT id FROM Events WHERE rank < 900')
    ids = cursor.fetchall()
    return [id[0] for id in ids]

# Returns fullname of WCA events.
def wca_event_fullname(id):
    events = wca_events()
    for e in events:
        if id == e[0]:
            return e[1]
    return ''

# Returns best record of person.
def bestrecord_by_id(e, id):
    cursor = g.connection.cursor()
    cursor.execute("SELECT best FROM CUBJECTIVES_{0} WHERE personId = '{1}'".format(e, id))
    b = cursor.fetchall()
    if len(b) != 0:
        return b[0][0]
    else:
        return -1

# Returns JSON string that represents statistics between two events.
def relationship_jsonstr(ex, ey, needs_data):
    if (needs_data):
        including_data = 1
    else:
        including_data = 0
    cursor = g.connection.cursor()
    cursor.execute("SELECT json FROM CUBJECTIVES_CACHE WHERE ex = '{0}' AND ey = '{1}' AND includingData = {2}".format(ex, ey, including_data))
    rows = cursor.fetchall()
    return rows[0][0]

@app.before_request
def before_request():
    g.connection = connect_db()

# Routing
# 1) Main page.
@app.route('/', methods=['GET'])
def index():
    if 'base' not in request.args:
        base = '333'
    elif request.args['base'] in wca_events_ids():
        base = request.args['base']
    else:
        abort(400)
    return render_template('index.html', params=dict(wca_events=wca_events(), base=base, fullname_base=wca_event_fullname(base)))

# 2) Detail page that shows a chart.
@app.route('/chart', methods=['GET'])
def chart():
    if request.args['ex'] == request.args['ey']:
        abort(400)
    elif request.args['ex'] not in wca_events_ids() or request.args['ey'] not in wca_events_ids():
        abort(400)
    else:
        return render_template('chart.html', params=dict(ex=request.args['ex'], ey=request.args['ey'],\
                                                         fullname_ex=wca_event_fullname(request.args['ex']),\
                                                         fullname_ey=wca_event_fullname(request.args['ey'])))

# Javascript that gives information of WCA events etc.
@app.route('/wca.js')
def wcajs():
    js = ','.join(["'" + e[0] + "':" + '"' + e[1] + '"' for e in wca_events()])
    return Response(render_template('wca.js', params=dict(wca_events_js=js)), mimetype='text/javascript')

# JSON that gives record of given person and event, accessed in ajax from 1).
@app.route('/bestrecord.json', methods=['GET'])
def bestrecord():
    id = request.args['id'].upper()
    if request.args['e'] not in wca_events_ids():
        abort(400)
    elif not re.search(r'^(1|2)[0-9]{3}[A-Z]{4}[0-9]{2}$', id):
        abort(400)
    else:
        best = bestrecord_by_id(request.args['e'], id)
        return Response(render_template('bestrecord.json', params=dict(id=id, event=request.args['e'], best=best)), mimetype='application/json')

# JSON that gives regression lines between given event and all events
# and some other information, accessed in ajax from 1).
@app.route('/statistics.json', methods=['GET'])
def statistics():
    if request.args['base'] not in wca_events_ids():
        abort(400)
    statistics = []
    for e in wca_events_ids():
        if e != request.args['base']:
            statistics.append(relationship_jsonstr(request.args['base'], e, False))
    return Response(render_template('statistics.json', params=dict(base=request.args['base'], json=','.join(statistics))), mimetype='application/json')

# JSON that gives relationship between two events, accessed in ajax from 2).
@app.route('/relationship.json', methods=['GET'])
def relationship():
    if request.args['ex'] == request.args['ey']:
        abort(400)
    elif request.args['ex'] not in wca_events_ids() or request.args['ey'] not in wca_events_ids():
        abort(400)
    else:
        jsonstr = relationship_jsonstr(request.args['ex'], request.args['ey'], True)
        return Response(render_template('relationship.json', params=dict(ex=request.args['ex'], ey=request.args['ey'], json=jsonstr)), mimetype='application/json')

if __name__ == '__main__':
    app.run()
