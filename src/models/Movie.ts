import postgres from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";
import axios from "axios";


export interface MovieProps {
	id?: number;
}

export default class Movie {
	constructor(
		private sql: postgres.Sql<any>,
		public props: MovieProps,
	) {}

	static async create(sql: postgres.Sql<any>, props: MovieProps): Promise<Movie> {
		return new Movie(sql, {});
	}

	static async read(sql: postgres.Sql<any>, movie_name: string): Promise<Movie> {
		// if movie not found in db search using api then add to db
		const url = `https://api.themoviedb.org/3/search/movie?query=${movie_name}&include_adult=false&language=en-US&page=1`;
		const response = await axios.get(url);

		console.log(response.data);

		try {
			await sql`
			INSERT INTO movies ("id", "title")
			VALUES (${response.data.name}, ${response.data.name})
			`;

			console.log("Successfully inserted! CTRL+C to exit.");
		} catch (error) {
			console.error(error);
		}
		return new Movie(sql, {});
	}

	static async readAll(sql: postgres.Sql<any>): Promise<Movie[]> {
		return [new Movie(sql, {})];
	}

	async update(updateProps: Partial<MovieProps>) {
	}

	async delete() {
	}
}
