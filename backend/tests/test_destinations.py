from unittest.mock import patch, MagicMock
import json


SAMPLE_ROW = (1, "Tokyo", "Japan", "Visit in spring", "wishlist", "2026-04-15 10:00:00", "Tokyo", "JPY", "https://flagcdn.com/w320/jp.png")

SAMPLE_DESTINATION = {
    "id": 1,
    "name": "Tokyo",
    "country": "Japan",
    "notes": "Visit in spring",
    "status": "wishlist",
    "created_at": "2026-04-15 10:00:00",
    "capital": "Tokyo",
    "currency": "JPY",
    "flag_url": "https://flagcdn.com/w320/jp.png"
}


def make_mock_conn(fetchone=None, fetchall=None):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = fetchone
    mock_cursor.fetchall.return_value = fetchall or []
    mock_conn.cursor.return_value = mock_cursor
    return mock_conn


# --- Health ---

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"


# --- GET /api/destinations ---

def test_get_destinations_empty(client):
    with patch("routes.destinations.get_connection", return_value=make_mock_conn(fetchall=[])):
        res = client.get("/api/destinations")
        assert res.status_code == 200
        assert res.get_json() == []


def test_get_destinations_returns_list(client):
    with patch("routes.destinations.get_connection", return_value=make_mock_conn(fetchall=[SAMPLE_ROW])):
        res = client.get("/api/destinations")
        data = res.get_json()
        assert res.status_code == 200
        assert len(data) == 1
        assert data[0]["name"] == "Tokyo"
        assert data[0]["currency"] == "JPY"
        assert data[0]["flag_url"] == "https://flagcdn.com/w320/jp.png"


# --- GET /api/destinations/:id ---

def test_get_destination_found(client):
    with patch("routes.destinations.get_connection", return_value=make_mock_conn(fetchone=SAMPLE_ROW)):
        res = client.get("/api/destinations/1")
        assert res.status_code == 200
        assert res.get_json()["name"] == "Tokyo"


def test_get_destination_not_found(client):
    with patch("routes.destinations.get_connection", return_value=make_mock_conn(fetchone=None)):
        res = client.get("/api/destinations/999")
        assert res.status_code == 404
        assert "error" in res.get_json()


# --- POST /api/destinations ---

def test_create_destination(client):
    with patch("routes.destinations.get_connection", return_value=make_mock_conn(fetchone=SAMPLE_ROW)), \
         patch("routes.destinations.enrich_with_country_data", return_value=("Tokyo", "JPY", "https://flagcdn.com/w320/jp.png")):

        res = client.post("/api/destinations",
            data=json.dumps({"name": "Tokyo", "country": "Japan", "notes": "Visit in spring", "status": "wishlist"}),
            content_type="application/json"
        )
        assert res.status_code == 201
        data = res.get_json()
        assert data["name"] == "Tokyo"
        assert data["capital"] == "Tokyo"


# --- PUT /api/destinations/:id ---

def test_update_destination(client):
    updated_row = (1, "Tokyo", "Japan", "Updated notes", "planned", "2026-04-15 10:00:00", "Tokyo", "JPY", "https://flagcdn.com/w320/jp.png")

    with patch("routes.destinations.get_connection", return_value=make_mock_conn(fetchone=updated_row)), \
         patch("routes.destinations.enrich_with_country_data", return_value=("Tokyo", "JPY", "https://flagcdn.com/w320/jp.png")):

        res = client.put("/api/destinations/1",
            data=json.dumps({"name": "Tokyo", "country": "Japan", "notes": "Updated notes", "status": "planned"}),
            content_type="application/json"
        )
        assert res.status_code == 200
        assert res.get_json()["status"] == "planned"


def test_update_destination_not_found(client):
    with patch("routes.destinations.get_connection", return_value=make_mock_conn(fetchone=None)), \
         patch("routes.destinations.enrich_with_country_data", return_value=("N/A", "N/A", "")):

        res = client.put("/api/destinations/999",
            data=json.dumps({"name": "X", "country": "Y", "notes": "", "status": "wishlist"}),
            content_type="application/json"
        )
        assert res.status_code == 404


# --- DELETE /api/destinations/:id ---

def test_delete_destination(client):
    with patch("routes.destinations.get_connection", return_value=make_mock_conn()):
        res = client.delete("/api/destinations/1")
        assert res.status_code == 200
        assert res.get_json()["message"] == "Destination deleted"


# --- enrich_with_country_data ---

def test_enrich_returns_fallback_on_error():
    from routes.destinations import enrich_with_country_data
    with patch("routes.destinations.requests.get", side_effect=Exception("timeout")):
        capital, currency, flag = enrich_with_country_data("Fakeland")
        assert capital == "N/A"
        assert currency == "N/A"
        assert flag == ""
