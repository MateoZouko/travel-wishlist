-- Stored procedure to delete a destination
CREATE OR REPLACE FUNCTION delete_destination(p_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM destinations WHERE id=p_id;
END;
$$ LANGUAGE plpgsql;
