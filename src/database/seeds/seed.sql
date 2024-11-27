-- Drop existing tables if they exist (useful for development resets)
DROP TABLE IF EXISTS public.tweets_hashtags_hashtags;
DROP TABLE IF EXISTS public.tweets;
DROP TABLE IF EXISTS public.hashtags;

-- Create Tweets Table
CREATE TABLE IF NOT EXISTS public.tweets
(
    id uuid DEFAULT uuid_generate_v4() NOT NULL
    CONSTRAINT "PK_19d841599ad812c558807aec76c" PRIMARY KEY,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT now() NOT NULL
    );

ALTER TABLE public.tweets
    OWNER TO "user";

-- Create Hashtags Table
CREATE TABLE IF NOT EXISTS public.hashtags
(
    id UUID DEFAULT uuid_generate_v4() NOT NULL
    CONSTRAINT "PK_994c5bf9151587560db430018c5" PRIMARY KEY,
    tag VARCHAR NOT NULL
    CONSTRAINT "UQ_0b4ef8e83392129fb3373fdb3af" UNIQUE,
    count INTEGER DEFAULT 0 NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT now() NOT NULL
    );

ALTER TABLE public.hashtags
    OWNER TO "user";

-- Create Pivot Table to Represent Many-to-Many Relationship Between Tweets and Hashtags
CREATE TABLE IF NOT EXISTS public.tweets_hashtags_hashtags
(
    "tweetsId" UUID NOT NULL
    CONSTRAINT "FK_a7615f813fbbb3c3bf6235073ae"
    REFERENCES public.tweets
    ON UPDATE CASCADE ON DELETE CASCADE,
    "hashtagsId" UUID NOT NULL
    CONSTRAINT "FK_59bc33e0e20825dbc96e6804070"
    REFERENCES public.hashtags,
    CONSTRAINT "PK_5368d3d855b8fdc3f7559b735a0"
    PRIMARY KEY ("tweetsId", "hashtagsId")
    );

ALTER TABLE public.tweets_hashtags_hashtags
    OWNER TO "user";

CREATE INDEX IF NOT EXISTS "IDX_a7615f813fbbb3c3bf6235073a"
    ON public.tweets_hashtags_hashtags ("tweetsId");

CREATE INDEX IF NOT EXISTS "IDX_59bc33e0e20825dbc96e680407"
    ON public.tweets_hashtags_hashtags ("hashtagsId");

-- Insert Sample Hashtags (10 Sample Hashtags)
INSERT INTO public.hashtags (tag) VALUES ('#HelloWorld');
INSERT INTO public.hashtags (tag) VALUES ('#Redis');
INSERT INTO public.hashtags (tag) VALUES ('#NestJS');
INSERT INTO public.hashtags (tag) VALUES ('#Docker');
INSERT INTO public.hashtags (tag) VALUES ('#Kubernetes');
INSERT INTO public.hashtags (tag) VALUES ('#SQL');
INSERT INTO public.hashtags (tag) VALUES ('#JavaScript');
INSERT INTO public.hashtags (tag) VALUES ('#TypeScript');
INSERT INTO public.hashtags (tag) VALUES ('#Cloud');
INSERT INTO public.hashtags (tag) VALUES ('#OpenAI');

-- Generate 50 Tweets with Random Content
DO $$
BEGIN
FOR i IN 1..50 LOOP
        INSERT INTO public.tweets (content)
        VALUES (concat('This is tweet number ', i, ' about random topics.'));
END LOOP;
END $$;

-- Link Each Tweet with Random Hashtags (Each Tweet Gets 1-3 Hashtags Randomly)
DO $$
DECLARE
tweet_record RECORD;
    hashtag_count INTEGER;
    hashtag_record RECORD;
BEGIN
    -- Loop through each tweet to link with hashtags
FOR tweet_record IN (SELECT id FROM public.tweets) LOOP
        -- Randomly select 1 to 3 hashtags for each tweet
        hashtag_count := floor(random() * 3) + 1;

FOR i IN 1..hashtag_count LOOP
SELECT * FROM public.hashtags
ORDER BY random()
    LIMIT 1
INTO hashtag_record;

-- Insert into pivot table
INSERT INTO public.tweets_hashtags_hashtags ("tweetsId", "hashtagsId")
VALUES (tweet_record.id, hashtag_record.id);
END LOOP;
END LOOP;
END $$;
