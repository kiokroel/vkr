FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm config set fund false \
    && npm config set audit false \
    && npm config set registry https://registry.npmjs.org/ \
    && if [ -f package-lock.json ]; then npm ci --prefer-offline; else npm install --prefer-offline; fi

COPY . .
RUN npm run build

FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
