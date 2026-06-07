cd backend

# If using standard pip/venv:
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Or if the project uses poetry:
poetry install
poetry shell

# Run migrations
alembic upgrade head

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


psql -h hostname -p 5432 -U username -d database_name
psql -h localhost -p 5432 -U postgres -d mydb





# Explore these commands
venv\Scripts\ruff check app
venv\Scripts\ruff check app --fix
venv\Scripts\ruff check app --fix --diff
venv\Scripts\ruff check app --fix --diff --show-source