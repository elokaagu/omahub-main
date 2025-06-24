# OmaHub - African Fashion Marketplace

OmaHub is a modern marketplace platform connecting African fashion designers with global audiences. Built with Next.js 13, Supabase, and TypeScript.

## Features

- 🛍️ Brand Discovery & Management
- 👔 Designer Profiles
- 🎨 Collection Showcases
- 🔐 Secure Authentication
- 📱 Responsive Design
- 🎯 Admin Dashboard

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI
- **State Management**: React Context
- **Image Storage**: Supabase Storage
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- npm or yarn
- Supabase account

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/elokaagu/omahub-main.git
cd omahub-main
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

1. Create a new Supabase project
2. Run the following SQL commands in Supabase SQL editor:

```sql
-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade,
  email text,
  first_name text,
  last_name text,
  avatar_url text,
  role text default 'user',
  owned_brands text[],
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Create brands table
create table brands (
  id text primary key,
  name text not null,
  description text,
  long_description text,
  location text,
  website text,
  image text,
  logo_url text,
  price_range text,
  category text,
  rating numeric default 0,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create collections table
create table collections (
  id uuid default uuid_generate_v4() primary key,
  brand_id text references brands(id) on delete cascade,
  name text not null,
  description text,
  images text[],
  season text,
  year integer,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table brands enable row level security;
alter table collections enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Brands are viewable by everyone"
  on brands for select
  using (true);

create policy "Only admins can modify brands"
  on brands for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Create a new project on Vercel
3. Import your GitHub repository
4. Add environment variables
5. Deploy!

### Environment Variables for Production

Add the following environment variables in your Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email info@oma-hub.com or join our Discord community.
