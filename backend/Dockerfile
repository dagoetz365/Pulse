FROM python:3.11-slim

WORKDIR /app

# Install deps first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source (overridden by volume mount in dev)
COPY . .

# Fix Windows CRLF line endings and make executable
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

CMD ["bash", "start.sh"]
