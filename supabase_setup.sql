-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text not null,
  username text unique not null,
  phone text,
  email text,
  avatar_url text,
  provider text default 'email',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Function to handle new user signups
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, phone, email, avatar_url, provider)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'phone',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create a profile for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
