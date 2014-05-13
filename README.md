# Planbox [![Build Status](https://travis-ci.org/openplans/planbox.png?branch=master)](https://travis-ci.org/openplans/planbox)

Planbox is a platform for getting the word out about your planning projects.
Its beautiful and easy to use interface will help you get your project online
in no time.

## Features

* Create project
* Quickly and easily edit details
* Timeline of progress

## Requirements

Describe the technology stack and any dependencies.

## Local Setup

### Clone this repo

    git clone https://github.com/brecke/planbox.git

### Install dependencies

     cd planbox
     virtualenv env
     source env/bin/activate
     pip install -r requirements.txt
     bower install
     cp src/planbox/local_settings.py.template src/planbox/local_settings.py 
     src/manage.py syncdb
     src/manage.py migrate

### Start your local server

     src/manage.py runserver
    

## TODO

* Remove the s3 reference for image upload

## Supported Browsers

### Desktop
* Chrome (latest)
* Firefox (latest)
* Safari (latest)
* Internet Explorer (8-10)

### Mobile
* IOS Safari 6+
* Android Browser 4+
* Chrome


## Copyright

Copyright (c) 2014 OpenPlans
