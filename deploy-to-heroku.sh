#!/bin/bash

echo ** Adding and committing changes to local git repo...
git add .
git commit -a -m "Updates for site"

echo ** Pushing and building source to Heroku...
git push heroku master

echo ** Checking status after build...
heroku ps

echo ** If anything went wrong, you will see the error here...
heroku logs


