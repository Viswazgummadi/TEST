# alembic/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

import sys
import os

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- BEGIN Flask App Context Integration ---
# Add the project's root directory (backend/) to Python's path
# This assumes env.py is in backend/alembic/
# and your app.py and models.py are in backend/
project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_dir)

# Import your Flask app instance and SQLAlchemy db object
from app import app as flask_app  # flask_app is your Flask app instance from app.py
from models import db as flask_db # flask_db is the SQLAlchemy instance from models.py
# It's also good to import all your models to ensure they are registered with SQLAlchemy's metadata
import models # This ensures AdminUser, APIKey classes are defined and part of flask_db.metadata

# Make the Flask app context available for Alembic
with flask_app.app_context():
    # Set the sqlalchemy.url in the Alembic config from Flask app's config
    # This ensures Alembic uses the same database as your app
    db_url = flask_app.config['SQLALCHEMY_DATABASE_URI']
    
    # Alembic needs an absolute path for relative SQLite URLs like "sqlite:///./reploit_dev.db"
    # The path in DATABASE_URL is relative to where `python app.py` is run (backend dir)
    if db_url.startswith("sqlite:///"):
        # Construct absolute path if it's a relative SQLite path starting with './' or just 'filename.db'
        path_part = db_url[len("sqlite:///"):]
        if path_part.startswith("./"):
            path_part = path_part[2:]
        # The base directory for resolving relative paths should be the project_dir (backend/)
        absolute_db_url = "sqlite:///" + os.path.join(project_dir, path_part)
        config.set_main_option('sqlalchemy.url', absolute_db_url)
    else:
        config.set_main_option('sqlalchemy.url', db_url)

    # target_metadata should be your SQLAlchemy db.Model.metadata
    # This comes from the flask_db instance which has all models registered.
    target_metadata = flask_db.metadata
# --- END Flask App Context Integration ---

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.
    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.
    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # compare_type=True, # Add this to detect column type changes
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.
    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        # Determine if we need batch mode for SQLite
        is_sqlite = connectable.engine.url.drivername == "sqlite"
        
        # Consolidate all options into one context.configure call
        configure_opts = {
            "connection": connection,
            "target_metadata": target_metadata,
            # "compare_type": True, # Uncomment if you need to detect column type changes
        }
        
        if is_sqlite:
            configure_opts["render_as_batch"] = True
            # For SQLite, also ensure transactional_ddl is False if using batch mode,
            # though Alembic often handles this well.
            # configure_opts["transactional_ddl"] = False # Usually not needed to set explicitly here

        context.configure(**configure_opts) # Call configure once with all options

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()