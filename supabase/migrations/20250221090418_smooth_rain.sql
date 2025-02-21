/*
  # RSS Trend Metrics Function

  1. Functions
    - Add function to update trend metrics based on co-occurring keywords
    - Create trigger to automatically update metrics on trend changes
*/

-- Functions
CREATE OR REPLACE FUNCTION update_trend_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update related keywords based on co-occurrence
  WITH co_occurring_keywords AS (
    SELECT 
      UNNEST(keywords) as related_keyword,
      COUNT(*) as occurrence_count
    FROM rss_articles
    WHERE 
      keywords @> ARRAY[NEW.keyword]
      AND created_at >= (CURRENT_TIMESTAMP - INTERVAL '7 days')
    GROUP BY related_keyword
    ORDER BY occurrence_count DESC
    LIMIT 5
  )
  UPDATE trends
  SET 
    related_keywords = ARRAY(SELECT related_keyword FROM co_occurring_keywords),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_trend_metrics_trigger ON trends;

-- Create trigger
CREATE TRIGGER update_trend_metrics_trigger
AFTER INSERT OR UPDATE ON trends
FOR EACH ROW
EXECUTE FUNCTION update_trend_metrics();