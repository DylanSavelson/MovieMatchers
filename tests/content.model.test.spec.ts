import postgres from "postgres";
import { test, expect, Page } from "@playwright/test";
import Content from "../src/models/Content"
import { ContentProps } from "../src/models/Content";

test.describe("CRUD operations", () => {
	// Set up the connection to the DB.
	const sql = postgres({
		database: "ContentDB",
	});

	test.beforeEach(async () => {
		// Anything you want to do before each test runs?
		await sql.unsafe(`DROP TABLE IF EXISTS content CASCADE;
		CREATE TABLE content (
		  content_id SERIAL PRIMARY KEY,
		  title VARCHAR(255) NOT NULL,
		  description TEXT NOT NULL,
		  content_poster TEXT NOT NULL,
		  type content_type NOT NULL,
			created_by TEXT[],
			release_date TEXT,
			genres TEXT[],
			rating FLOAT,
			seasons INTEGER
		);
		
		
		DROP TABLE IF EXISTS users CASCADE;
		CREATE TABLE users (
		  user_id SERIAL PRIMARY KEY,
		  email VARCHAR(100) NOT NULL UNIQUE,
		  password VARCHAR(255) NOT NULL,
		  profile TEXT,
		  is_admin BOOLEAN DEFAULT FALSE,
		  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		  edited_at TIMESTAMP,
		  visibility BOOLEAN DEFAULT TRUE
		);
		
		DROP TABLE IF EXISTS watched_content CASCADE;
		CREATE TABLE watched_content (
		  user_id INTEGER REFERENCES users(user_id),
		  content_id INTEGER REFERENCES content(content_id),
		  PRIMARY KEY (user_id, content_id),
		  rating FLOAT
		);
		
		DROP TABLE IF EXISTS to_watch_content CASCADE;
		CREATE TABLE to_watch_content (
		  user_id INTEGER REFERENCES users(user_id),
		  content_id INTEGER REFERENCES content(content_id),
		  PRIMARY KEY (user_id, content_id)
		);`);
	});

	/**
	 * Clean up the database after each test. This function deletes all the rows
	 * from the todos and subtodos tables and resets the sequence for each table.
	 * @see https://www.postgresql.org/docs/13/sql-altersequence.html
	 */
	test.afterEach(async () => {
		// Replace the table_name with the name of the table(s) you want to clean up.
	});

	// Close the connection to the DB after all tests are done.
	test.afterAll(async () => {
		await sql.end();
	});

	const createContent = async (props: Partial<ContentProps> = {}) => {
		return await Content.create(sql, {
            contentId: props.contentId || 1,
            title: props.title || "Logan",
            description: props.description || "Logan, The Wolverine goes on an adventure with a similar mutant to himself.",
            contentPoster: props.contentPoster || "the poster",
            type: props.type || "movie",
            createdBy: props.createdBy || ["James Mangold"],
            releaseDate: props.releaseDate || "2017-03-03",
            genres: props.genres || ["Action", "Drama"],
            rating: props.rating || 10.0
		});
	};

	test("content was created.", async () => {
		const content = await createContent({ title: "Alternate Logan", genres: ["Sci-Fi", "Thriller"]});

		expect(content.props.title).toBe("Alternate Logan");
		expect(content.props.genres).toBeInstanceOf(Array);
		expect(content.props.rating).toBe(10.0);
		expect(content.props.type).toBe("movie");
	});

	test("Content was retrieved", async () => {
		const content = await createContent({title: "Alternate Logan", genres: ["Sci-Fi", "Thriller"]});

		const readContent = await Content.read(sql, content.props.contentId);
			
		expect(readContent.props.title).toBe("Alternate Logan");
		expect(content.props.genres).toBeInstanceOf(Array);
		expect(readContent.props.rating).toBe(10.0);
		expect(readContent.props.type).toBe("movie");
	});

	test("Content for a search was retrieved", async () => {
		const content = await createContent({  });

        const allReadContent = await Content.readAll(sql, "Shrek");

        expect(allReadContent.length).toBeGreaterThan(1);
	});
});