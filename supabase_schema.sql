-- SUPABASE SCHEMA FOR GARDEN GROUPS APP

-- 1. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GROUPS
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GROUP MEMBERS
CREATE TABLE IF NOT EXISTS public.group_members (
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, group_id)
);

-- 4. TODOS (TASKS)
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.groups ON DELETE CASCADE,
    creator_id UUID REFERENCES auth.users ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (BASIC - Can be refined)

-- Profiles: Anyone can view, only owner can edit
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups: Members can view, owners can edit
CREATE POLICY "Groups are viewable by members" ON public.groups FOR SELECT 
USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid())
);

CREATE POLICY "Owners can update their groups" ON public.groups FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "Anyone can create a group" ON public.groups FOR INSERT 
WITH CHECK (owner_id = auth.uid());

-- Group Members: Members can view other members
CREATE POLICY "Members can view group membership" ON public.group_members FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_members.group_id AND user_id = auth.uid()));

CREATE POLICY "Anyone can join a group" ON public.group_members FOR INSERT 
WITH CHECK (true);

-- Todos: Members can view and create tasks
CREATE POLICY "Todos are viewable by group members" ON public.todos FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = todos.group_id AND user_id = auth.uid()));

CREATE POLICY "Members can create todos" ON public.todos FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = todos.group_id AND user_id = auth.uid()));

CREATE POLICY "Members can update todos" ON public.todos FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = todos.group_id AND user_id = auth.uid()));
