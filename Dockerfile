FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

RUN useradd --create-home --uid 10001 netmap
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=netmap:netmap . .

USER netmap
EXPOSE 5005
CMD ["gunicorn", "--bind", "0.0.0.0:5005", "--workers", "3", "--threads", "2", "--timeout", "60", "app:create_app()"]

