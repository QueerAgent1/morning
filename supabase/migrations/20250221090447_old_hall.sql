/*
  # Brand Indexes

  1. Indexes
    - Add indexes for brand-related tables to improve query performance
*/

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_brand_books_active ON brand_books(is_active);
CREATE INDEX IF NOT EXISTS idx_marketing_strategies_status ON marketing_strategies(status);
CREATE INDEX IF NOT EXISTS idx_brand_assets_type ON brand_assets(type);
CREATE INDEX IF NOT EXISTS idx_brand_assets_active ON brand_assets(is_active);
CREATE INDEX IF NOT EXISTS idx_brand_guidelines_category ON brand_guidelines(category);
CREATE INDEX IF NOT EXISTS idx_brand_guidelines_active ON brand_guidelines(is_active);