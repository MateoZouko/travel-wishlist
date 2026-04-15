-- Stored procedure to add a destination
CREATE OR REPLACE FUNCTION add_destination(
    p_name VARCHAR,
    p_country VARCHAR,
    p_notes TEXT,
    p_status VARCHAR
) RETURNS destinations AS $$
DECLARE
    result destinations;
BEGIN
    INSERT INTO destinations (name, country, notes, status)
    VALUES (p_name, p_country, p_notes, p_status)
    RETURNING * INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Stored procedure to update a destination
CREATE OR REPLACE FUNCTION update_destination(
    p_id INT,
    p_name VARCHAR,
    p_country VARCHAR,
    p_notes TEXT,
    p_status VARCHAR
) RETURNS destinations AS $$
DECLARE
    result destinations;
BEGIN
    UPDATE destinations
    SET name=p_name, country=p_country, notes=p_notes, status=p_status
    WHERE id=p_id
    RETURNING * INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Stored procedure to delete a destination
CREATE OR REPLACE FUNCTION delete_destination(p_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM destinations WHERE id=p_id;
END;
$$ LANGUAGE plpgsql;