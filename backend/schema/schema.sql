CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE hangman_words (
    id         SERIAL PRIMARY KEY,
    word       VARCHAR(100) NOT NULL,
    hint       VARCHAR(255) NOT NULL,
    difficulty VARCHAR(10)  NOT NULL DEFAULT 'easy'
               CHECK (difficulty IN ('easy', 'medium', 'hard')),
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE word_search_words (
    id         SERIAL PRIMARY KEY,
    word       VARCHAR(30) NOT NULL,
    category   VARCHAR(50) NOT NULL DEFAULT 'general',
    active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE hangman_sessions (
    session_id UUID      PRIMARY KEY,
    word_order INTEGER[] NOT NULL,
    position   INTEGER   NOT NULL DEFAULT 0,
    expires_at TIMESTAMP NOT NULL
);
