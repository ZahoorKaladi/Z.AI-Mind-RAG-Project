# Use official Python image
FROM python:3.10

# Set the working directory
WORKDIR /code

# Copy requirements and install them
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the rest of the backend code
COPY . .

# Hugging Face requires the server to run on port 7860!
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
