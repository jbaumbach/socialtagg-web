#!/bin/bash

echo ** 
echo ** todo: create .slugignore file: https://devcenter.heroku.com/articles/slug-compiler

echo ** 
echo ** Adding and committing changes to local git repo...
git add .
git commit -a -m "Updates for site"

echo ** 
echo ** Pushing and building source to Heroku...
git push staging master

echo ** 
echo ** Checking status after build...
heroku ps --remote staging

echo ** 
echo ** If anything went wrong, you will see the error here...
heroku logs --remote staging


