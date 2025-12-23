# 1. 빌드 단계 (Build Stage)
FROM node:18-alpine AS builder
WORKDIR /app

# 의존성 파일만 먼저 복사 (캐싱 활용)
COPY package*.json ./
RUN npm install

# 나머지 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 2. 실행 단계 (Runner Stage)
FROM node:18-alpine
WORKDIR /app

# 빌드 결과물과 실행에 필요한 파일만 가져오기
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Next.js 실행
CMD ["npm", "start"]