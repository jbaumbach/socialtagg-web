#!/bin/bash

git add .
git commit -a -m "Updates for site"
git push heroku master

echo Checking status after build...
heroku ps

heroku logs


