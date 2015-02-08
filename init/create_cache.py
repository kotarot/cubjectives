#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Creates statistics information and cache in DB.
# Needs to be called when the app runs at the first time,
# or the WCA DB is updated.

import json
import math
import numpy as np
import pymysql
import pymysql.cursors
from scipy import stats

# Configuration
MYSQL_HOST     = 'localhost'
MYSQL_USERNAME = 'xxxxxxxx'
MYSQL_PASSWORD = 'xxxxxxxx'
MYSQL_DATABASE = 'xxxxxxxx'

connection = None

# Connect to MySQL.
def connect_db():
    return pymysql.connect(host=MYSQL_HOST, user=MYSQL_USERNAME, passwd=MYSQL_PASSWORD, db=MYSQL_DATABASE)

# Returns WCA events (id) as a list.
def wca_events_ids():
    cursor = connection.cursor()
    cursor.execute('SELECT id FROM Events WHERE rank < 900')
    ids = cursor.fetchall()
    return [id[0] for id in ids]

# Writes to DB as JSON.
def write_to_db(ex, ey, including_data, stat):
    jsonstr = json.dumps(stat, sort_keys=True, separators=(',', ':'))
    cursor = connection.cursor()
    cursor.execute("INSERT INTO CUBJECTIVES_CACHE (ex, ey, includingData, json) VALUES ('{0}', '{1}', {2}, '{3}')".format(ex, ey, including_data, jsonstr))

# Returns statistics between two events.
def statistics_between(ex, ey, needs_data):
    cursor = connection.cursor()
    cursor.execute('SELECT * FROM CUBJECTIVES_{0} INNER JOIN (SELECT * FROM CUBJECTIVES_{1}) T ON CUBJECTIVES_{2}.personId = T.personId'.format(ex, ey, ex))
    data = cursor.fetchall()
    dataset = [(float(d[1]), float(d[3])) for d in data]

    # Calculates averages, variances, and standard deviation.
    count = len(dataset)
    npax = np.array([d[0] for d in dataset])
    npay = np.array([d[1] for d in dataset])
    avgx, avgy, varx, vary = np.average(npax), np.average(npay), np.var(npax), np.var(npay)
    stdx, stdy = math.sqrt(varx), math.sqrt(vary)

    # Calculates correlation coefficient and regression line.
    slope, intercept, r_value, p_value, std_err = stats.linregress(npax, npay)
    if (needs_data):
        return {'ex': ex, 'ey': ey, 'dataset': dataset, 'count': count,\
                'avgx': avgx, 'varx': varx, 'stdx': stdx, 'avgy': avgy, 'vary': vary, 'stdy': stdy,\
                'r_value': r_value, 'line': {'slope': slope, 'intercept': intercept}}
    else:
        return {'ex': ex, 'ey': ey, 'count': count,\
                'avgx': avgx, 'varx': varx, 'stdx': stdx, 'avgy': avgy, 'vary': vary, 'stdy': stdy,\
                'r_value': r_value, 'line': {'slope': slope, 'intercept': intercept}}

def all_statistics():
    events = wca_events_ids()
    for ex in events:
        for ey in events:
            if ex != ey:
                print('Writing cache of (' + ex + ', ' + ey + ') to DB...')
                write_to_db(ex, ey, 1, statistics_between(ex, ey, True))
                write_to_db(ex, ey, 0, statistics_between(ex, ey, False))

if __name__ == '__main__':
    connection = connect_db()
    all_statistics()
