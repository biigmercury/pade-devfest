-- Pàdé demo profiles. Paste into the Supabase SQL editor after schema.sql.
-- Re-running replaces the previous demo profiles (and their matches).

delete from public.profiles where is_demo;

insert into public.profiles (name, emoji, interests, goal, fun_pick, is_demo) values
  ('Tolu Adeyemi', '🌍', array['design', 'web3', 'devops'], 'cofounder', 'party', true),
  ('Chiamaka Okafor', '🔥', array['product', 'gaming', 'ai'], 'mentee', 'party', true),
  ('Ibrahim Musa', '🚀', array['mobile', 'web3', 'afrobeats'], 'cofounder', 'party', true),
  ('Funke Akinwale', '🦄', array['community', 'ai', 'football'], 'mentee', 'party', true),
  ('Emeka Nwosu', '👾', array['web', 'gaming', 'afrobeats'], 'mentor', 'party', true),
  ('Aisha Bello', '👾', array['web', 'security', 'community'], 'hire', 'smoky', true),
  ('Seun Ogunleye', '🍕', array['design', 'security', 'web'], 'mentee', 'smoky', true),
  ('Ngozi Eze', '🎧', array['cloud', 'gaming', 'afrobeats'], 'collab', 'party', true),
  ('Kunle Bakare', '⚡', array['cloud', 'security', 'product'], 'cofounder', 'party', true),
  ('Zainab Abubakar', '🧠', array['football', 'devops', 'security'], 'mentor', 'smoky', true),
  ('Damilola Ojo', '🥁', array['afrobeats', 'fintech', 'design'], 'hire', 'party', true),
  ('Chidi Obi', '👾', array['mobile', 'gaming', 'design'], 'mentee', 'smoky', true),
  ('Halima Sani', '🌍', array['afrobeats', 'design', 'gaming'], 'cofounder', 'party', true),
  ('Bisi Adebayo', '🍕', array['fintech', 'startups', 'football'], 'hire', 'smoky', true),
  ('Obinna Uche', '🍕', array['web', 'devops', 'football'], 'vibes', 'smoky', true),
  ('Fatima Yusuf', '🌍', array['product', 'gaming', 'data'], 'mentee', 'smoky', true),
  ('Tunde Lawal', '🦄', array['mobile', 'design', 'data'], 'collab', 'party', true),
  ('Adaeze Nnamdi', '🚀', array['gaming', 'devops', 'football'], 'collab', 'smoky', true),
  ('Yemi Alabi', '🐢', array['startups', 'afrobeats', 'devops'], 'get_hired', 'party', true),
  ('Uche Okonkwo', '🥁', array['product', 'mobile', 'gaming'], 'cofounder', 'smoky', true),
  ('Kemi Oladipo', '🚀', array['web3', 'startups', 'design'], 'hire', 'party', true),
  ('Ifeanyi Ike', '🎨', array['startups', 'afrobeats', 'community'], 'mentor', 'party', true),
  ('Amina Danjuma', '🎧', array['afrobeats', 'web3', 'security'], 'get_hired', 'party', true),
  ('Segun Afolabi', '🍕', array['security', 'product', 'web3'], 'get_hired', 'smoky', true),
  ('Nkechi Onyeka', '👾', array['design', 'web', 'mobile'], 'hire', 'party', true),
  ('Bayo Ogundipe', '👾', array['ai', 'data', 'community'], 'mentee', 'party', true),
  ('Hauwa Garba', '🦁', array['gaming', 'ai', 'mobile'], 'mentor', 'smoky', true),
  ('Femi Oyelaran', '🌍', array['design', 'product', 'community'], 'mentee', 'party', true),
  ('Ebuka Chukwu', '🥁', array['startups', 'web3', 'afrobeats'], 'mentor', 'party', true),
  ('Ronke Adewale', '💡', array['startups', 'ai', 'cloud'], 'cofounder', 'party', true);
