# Compressr

Project Description:
  > This project is a React and Node application which outlines and suggests ways to compress imputed text. The Node API is stand alone and GETs data from Google's NLP Cloud service. It then inputs the metadata of each sentence to a proprietary algorithm whih outputs a rank for each sentence determining its importance to the passage as a whole. This data is then consumed by the React app and outputted in a user friendly UI. 

Steps to run locally:
  > 1. Clone Repo
  > 2. npm start in based directory and inside "react/client/src" 
  > 3. Google Cloud Service Key is needed for this project to function: https://cloud.google.com/iam/docs/creating-managing-service-account-keys

Export GOOGLE_APPLICATION_CREDENTIALS to local enviornment at runtime using command below
  > export GOOGLE_APPLICATION_CREDENTIALS="[directory of your JSON credential file]"
  
Node App: runs on Port 8080
React: Default Port 3000

Node App Query Instructions:
  > http://localhost:8080/api/analysis?text=[text]
  > [text] example: Hello world! This app is called Compressr
