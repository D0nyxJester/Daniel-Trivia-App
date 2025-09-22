# uses node version 22 as base image

FROM node:22

WORKDIR /danielapp

# copy package.json and package-lock.json to the working directory
COPY package*.json ./

# install dependencies
RUN npm install

# copy the rest of the application code to the working directory
COPY . .

ENV PORT=3000

EXPOSE 3000

CMD [ "node", "App.js" ]