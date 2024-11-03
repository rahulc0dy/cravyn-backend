FROM node:23
LABEL authors="rahul"

ENTRYPOINT ["top", "-b"]

WORKDIR /user/app

COPY package*.json /user/app

RUN npm install

COPY . .

EXPOSE 8800

CMD ["npm", "run", "dev"]