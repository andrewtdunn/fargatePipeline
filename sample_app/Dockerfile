# Fetching the latest node image on alpine linux
FROM --platform=linux/amd64 node:alpine as builder

# Declaring env
ENV NODE_ENV production

# Setting up the work directory
WORKDIR /app

# Installing dependencies
COPY ./package*.json ./
RUN npm install 

# Copying all the files in our project 
COPY . .

# Building our application 
RUN npm run build

# Fetching the latest nginx image
FROM nginx

# Copy thhe built assets from the builder
COPY --from=builder /app/build /usr/share/nginx/html 

# Copying our nginx.conf 
COPY nginx.conf /etc/nginx/conf.d/default.conf