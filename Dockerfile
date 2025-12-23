# 1. 빌드 단계 (Build Stage)
# 18-alpine 대신 20-alpine으로 변경
FROM node:20-alpine AS builder
WORKDIR /app

# [중요] 빌드 시점에 API 주소를 주입받기 위한 설정 추가
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 2. 실행 단계 (Runner Stage)
# 실행 환경도 20-alpine으로 통일
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]