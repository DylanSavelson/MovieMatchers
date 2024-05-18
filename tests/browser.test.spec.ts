import postgres from "postgres";
import { test, expect, Page } from "@playwright/test";
import { getPath } from "../src/url";
import Content, { ContentProps } from "../src/models/Content"
import User, { UserProps } from "../src/models/User";
import { createUTCDate } from "../src/utils";

const sql = postgres({
	database: "ContentDB",
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

const createUser = async (props: Partial<UserProps> = {}) => {
    return await User.create(sql, {
        userId: props.userId || 1,
        email: props.email || "user@email.com",
        password: props.password || "password",
        createdAt: props.createdAt || createUTCDate(),
        visibility: true
    });
};

const login = async (
	page: Page,
	email: string = "user@email.com",
	password: string = "password",
) => {
	await page.goto(`/login`);
	await page.fill('form#login-form input[name="email"]', email);
	await page.fill('form#login-form input[name="password"]', password);
	await page.click("form#login-form #login-form-submit-button");
};

const logout = async (page: Page) => {
	await page.goto("/logout");
};

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
    await createUser();
});

/**
 * Clean up the database after each test. This function deletes all the rows
 * from the todos and subtodos tables and resets the sequence for each table.
 * @see https://www.postgresql.org/docs/13/sql-altersequence.html
 */
test.afterEach(async ({ page }) => {
	await logout(page);
});

test("Homepage was retrieved successfully", async ({ page }) => {
	await page.goto("/");

	expect(await page?.title()).toBe("My App");
});

test.only("Content retrieved successfully.", async ({ page }) => {
	await login(page);
	const content = await createContent();

	await page.goto(`individual_content`);

	const titleElement = await page.$("#title");

    console.log(titleElement);

	expect(await titleElement?.innerText()).toBe(content.props.title);
});

test("Todo not retrieved while logged out.", async ({ page }) => {
	const todo = await createTodo();

	await page.goto(`todos/${todo.props.id}`);

	expect(await page?.url()).toBe(getPath("login"));
});

test("All Todos were retrieved.", async ({ page }) => {
	await login(page);
	const todos = [await createTodo(), await createTodo(), await createTodo()];

	await page.goto("/todos");

	const h1 = await page.$("h1");
	const todoElements = await page.$$("[todo-id]");

	expect(await h1?.innerText()).toMatch("Todos");
	expect(todoElements.length).toBe(todos.length);

	for (let i = 0; i < todoElements.length; i++) {
		const status = await todoElements[i].getAttribute("status");
		expect(await todoElements[i].innerText()).toMatch(todos[i].props.title);
		expect(status).toMatch(todos[i].props.status);
	}
});

test("All todos not retrieved while logged out.", async ({ page }) => {
	const todo = await createTodo();

	await page.goto(`todos`);

	expect(await page?.url()).toBe(getPath("login"));
});

test("Todo created successfully.", async ({ page }) => {
	await login(page);
	const todo = {
		title: "Test Todo",
		description: "This is a test todo",
		status: "incomplete",
	};

	await page.goto("/todos/new");

	const h1 = await page.$("h1");

	expect(await h1?.innerText()).toMatch("Create Todo");

	await page.fill('form#new-todo-form input[name="title"]', todo.title);
	await page.fill(
		'form#new-todo-form textarea[name="description"]',
		todo.description,
	);
	await page.click("form#new-todo-form #new-todo-form-submit-button");

	expect(await page?.url()).toBe(getPath(`todos/1`));

	const titleElement = await page.$("#title");
	const descriptionElement = await page.$("#description");
	const statusElement = await page.$(`[status="${todo.status}"]`);

	expect(await titleElement?.innerText()).toBe(todo.title);
	expect(await descriptionElement?.innerText()).toBe(todo.description);
	expect(statusElement).not.toBeNull();
});

test("Todo not created while logged out.", async ({ page }) => {
	await page.goto(`/todos/new`);

	expect(await page?.url()).toBe(getPath("login"));
});

test("Todo updated successfully.", async ({ page }) => {
	await login(page);
	const todo = await createTodo();

	await page.goto(`todos/${todo.props.id}/edit`);

	const h1 = await page.$("h1");

	expect(await h1?.innerText()).toMatch("Edit Todo");

	const newTitle = "Updated Test Todo";
	const newDescription = "This is an updated test todo";

	await page.fill('form#edit-todo-form input[name="title"]', newTitle);
	await page.fill(
		'form#edit-todo-form textarea[name="description"]',
		newDescription,
	);
	await page.click("form#edit-todo-form #edit-todo-form-submit-button");

	expect(await page?.url()).toBe(getPath(`todos/${todo.props.id}`));

	const titleElement = await page.$("#title");
	const descriptionElement = await page.$("#description");

	expect(await titleElement?.innerText()).toBe(newTitle);
	expect(await descriptionElement?.innerText()).toBe(newDescription);
});

test("Todo not updated while logged out.", async ({ page }) => {
	const todo = await createTodo();

	await page.goto(`todos/${todo.props.id}/edit`);

	expect(await page?.url()).toBe(getPath("login"));
});

test("Todo deleted successfully.", async ({ page }) => {
	await login(page);
	const todo = await createTodo();

	await page.goto(`todos/${todo.props.id}`);

	await page.click("form#delete-todo-form button");

	expect(await page?.url()).toBe(getPath(`todos`));

	const body = await page.$("body");

	expect(await body?.innerText()).toMatch("No todos found");
});

test("Todo completed successfully.", async ({ page }) => {
	await login(page);
	const todo = await createTodo();

	await page.goto(`todos/${todo.props.id}`);

	await page.click("form#complete-todo-form button");

	expect(await page?.url()).toBe(getPath(`todos/${todo.props.id}`));

	const statusElement = await page.$(`[status="complete"]`);

	expect(statusElement).not.toBeNull();
});