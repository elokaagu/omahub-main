-- Update Our Story text in platform_settings table
INSERT INTO platform_settings (key, value, updated_at)
VALUES (
  'our_story',
  'OmaHub was founded in 2025 from a powerful belief: that Africa''s designers deserve a global platform on their own terms.

Rooted in the Igbo word "Oma", meaning beauty or goodness, OmaHub exists to honour the artistry shaping fashion across the continent. What began as a digital space to spotlight emerging talent has grown into a dynamic platform connecting African creators with conscious consumers worldwide.

We bridge tradition and innovation, celebrating bold design, handmade craft, and cultural roots. OmaHub champions modern expression while helping preserve timeless techniques. This is more than fashion; it''s a movement rooted in craft, creativity, and community.

At our core, we believe in the good quality work, honest relationships, and building trust. We''re here for informed customers who value not just the product, but the story and creativity behind it. This is the good hub: where beauty and integrity meet.',
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW(); 