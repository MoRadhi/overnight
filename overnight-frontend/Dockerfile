# Dev-only image, used by the root docker-compose.yml for local development.
# Production deploys go straight to Vercel/Netlify from the repo - they don't
# use this Dockerfile at all.
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
