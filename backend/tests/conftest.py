import pytest
from unittest.mock import MagicMock, patch

# Patch wait_for_db before importing app so it doesn't try to connect to DB
@pytest.fixture(autouse=True, scope="session")
def mock_wait_for_db():
    with patch("database.init_db"):
        yield

@pytest.fixture
def app():
    with patch("database.init_db"), patch("database.get_connection"):
        from app import app as flask_app
        flask_app.config["TESTING"] = True
        yield flask_app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def mock_db():
    """Returns a mock connection + cursor ready to use in tests."""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    return mock_conn, mock_cursor
