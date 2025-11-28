FROM node:20-alpine

WORKDIR /app

# 1. Copy file cấu hình trước
COPY package*.json ./
COPY prisma ./prisma

# 2. Cài dependency
RUN npm install

# 3. Generate Prisma Client
RUN npx prisma generate

# 4. Copy code còn lại
COPY . .

# 5. Build TS
RUN npm run build

EXPOSE 3000

CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]
