DROP DATABASE IF EXISTS "MovieDB";
CREATE DATABASE "MovieDB";

\c MovieDB;

DROP TYPE IF EXISTS movie_status;

DROP TABLE IF EXISTS movies;
CREATE TABLE movies (
  movie_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  movie_poster VARCHAR(255)
  );


DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
	  profile VARCHAR(255),
	  is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP
);

DROP TABLE IF EXISTS watched_movies;
CREATE TABLE watched_movies (
  user_id INTEGER REFERENCES users(user_id),
  movie_id INTEGER REFERENCES movies(movie_id),
  PRIMARY KEY (user_id, movie_id),
  rating INTEGER
);