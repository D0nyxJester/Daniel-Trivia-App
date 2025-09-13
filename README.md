Daniel Social Media Login Page
A simple social media login page built with Node.js that uses google and GitHub 3-legged OAuth authentication to sign into the website.

# Installation

1. Clone the repository: git clone https://github.com/D0nyxJester/Daniel-Social-Media-Login-Page.git
2. Navigate to the project directory: cd Daniel-Social-Media-Login-Page
3. Once in the directory, you need to create a .env file that stores all the login data for the database and the OAuth client ID and Secret for both the google and GitHub

.env file:  
 DB_HOST= “hostname”
DB_USER= “username”
DB_PASSWORD= “Password”
DB_NAME= “database name”
DB_PORT= “port number”
GOOGLE_CLIENT_ID= “google client ID link”  
 GOOGLE_CLIENT_SECRET= “google client secret link”
GITHUB_CLIENT_ID= “GitHub client ID link”
GITHUB_CLIENT_SECRET= “GitHub client secret link”

4. After filling in all the required links to the .env file, open a terminal and type npm install
5. After the install, type in Node App.js in the terminal to run the program
6. Then Type http://localhost:3000 into your local browser, this will send you to the website

# Pre-requisites

- MySQL Database: you need to create and implement a MySQL database to store and to look at all users that sign in through the website
- Once you have created your database, either by using amazon AWS or google cloud (these are free site to a certain amount), you need to copy the log in, username, password, port number and database to the .env file
- Note, the code has a create table in the code, allowing it to create the table and the contents for it

# Google OAuth 2.0:

1. You need to create a project on google cloud platform to get the OAuth 2.0 link, and to do this,
2. Go to Google Cloud platform, create an account or login and click on create a project
3. Once you create your project, type in the search bar Google Auth Platform, click on it
4. Then go to clients and click on “create a new client”
5. Make sure to click Web application for your application type
6. You can name the client whatever works best for you
7. You need to add the URL http://localhost:3000/auth/google/callback to the Authorized redirect URI to have google know where to send the permission the website
8. Once you have created a client, copy the Client ID and the Client Secret into the .env file in the Daniel-Social-Media-Login-Page directory

# GitHub OAuth 2.0:

1. you need to create an account on GitHub to access the developer page to create the OAuth 2.0
2. Once you log in or create a GitHub account, go over to your profile picture, click on it and click on settings.
3. In settings, scroll down till you see Developer setting on the left side, then click on Developer setting
4. In Developer settings, find and click on OAuth apps, where you need to find then click on create new OAuth app
5. In “Application name” Type in any name that goes with the project ex: “GitHub website login”
6. For “Homepage URL”, paste the app home URL: http://localhost:3000/
7. For “Authorization callback URL”, paste in the URL: http://localhost:3000/auth/github/callback
8. Once completed, go into the OAuth app that you created, then find and copy the client ID string, as well as generating the client secret string to copy to the .env file in the Daniel-Social-Media-Login-Page directory

# File Structure

- App.js: Main application file
- index.html: Login page UI
- .env: stores the database login and client ID and Secret passwords for both Google and GitHub
- .gitignore: ignores the .env file from being uploaded to GitHub
- Package.json and Package.lockjson: Project metadata and dependencies

# Requirements

- Node.js (v14 or higher recommended)
- MySQL database
- Google Cloud personal project account
- GitHub Account

# Troubleshooting

- Login buttons not working?

  - Make sure you start the server with node App.js.  
    Open your browser and go to http://localhost:3000
    Do not open index.html directly; authentication routes require the backend server to be running.

- Database not wanting to connect

  - The terminal will display a database error message if it cannot receive the database, this can be caused if there is no database to log into or  
    Check if the database exists and is running
    If that doesn't work, check the .env file and see if the database login is correct

- If OAuth is not connecting though Google or GitHub
  - check and look at the google or GitHub platform are producing the same client ID and secret that you put into you .env file
