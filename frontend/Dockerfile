# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependência primeiro para aproveitar cache
COPY package*.json ./

# Instala todas as dependências
RUN npm install

# Copia os arquivos de código
COPY . .

# Expõe a porta padrão de desenvolvimento do Vite
EXPOSE 5173

# Roda o Vite expondo o host para que a rede do Docker acesse as portas do container
CMD ["npm", "run", "dev", "--", "--host"]
