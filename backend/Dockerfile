FROM python:3.12-slim-bookworm

# The installer requires curl (and certificates) to download the release archive
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates

# Download the latest installer
ADD https://astral.sh/uv/install.sh /uv-installer.sh

# Run the installer then remove it
RUN sh /uv-installer.sh && rm /uv-installer.sh

# update path for uv
ENV PATH="/root/.local/bin:${PATH}"

# install uvicorn
RUN apt-get install uvicorn -y

WORKDIR /code

# Copy rest of the code
COPY . .
RUN uv sync --locked


EXPOSE 8000

# CMD ["uv","run","fastapi","dev", "--port", "80", "--host", "0.0.0.0"]

CMD ["/code/.venv/bin/fastapi", "run", "app/main.py", "--port", "8000", "--host", "0.0.0.0"]

