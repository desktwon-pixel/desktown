
INSERT INTO users (id, username, password, email, first_name, last_name, role, status, profile_image_url)
VALUES (
  gen_random_uuid(),
  'admin',
  'd74e8d30899f135cb37c9684ab7a254d4b74c7414ef7690e6057fb15111463e931bc4d27f4e785f2653d0e027e882b1c968a9931d5ca81795f086df16f5f2d8c.306e05889bbea44c02b854778dae5a89',
  'admin@desktown.app',
  'Admin',
  'User',
  'admin',
  'online',
  'https://ui-avatars.com/api/?name=Admin&background=random'
)
ON CONFLICT (email) DO NOTHING;
