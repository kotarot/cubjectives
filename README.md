Cubjectives
===========

"Speedcubing + Objectives = Speed-Cubjectives"

The tool computes statistics-based speedsolving objectives for you.  
Given your record of a WCA events, the tool calcultes and tells you WCA-database-based objectives in the other events. 

This application is available at:  
[http://www.terabo.net/cubjectives/](http://www.terabo.net/cubjectives/)


Requirements
------------

This is a Flask application.
To run the application, you need:

* Python 3
* Flask
* PyMySQL
* Numpy
* SciPy


Initialization
--------------

Before you run the application, you need to import the WCA-database in your MySQL.
After that, you type your username, password, and some more information in _cubjectives.py_ and _init/create\_cache.py_.

When you run the application for the first time or once after you update the WCA-database,
do the followings:

    mysql -h localhost -u <username> -p<password> --default-character-set=utf8 <database> < ./init/create_tables.sql
    python3 ./init/create_cache.py


Lisence
-------

MIT.
