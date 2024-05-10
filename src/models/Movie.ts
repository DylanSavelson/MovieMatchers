import postgres from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";
import axios from "axios";


export interface MovieProps {
	id?: number,
	title: string,
	description: string,
	status: 'watched' | 'to_watch',
	user_id: number
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
		return new Movie(sql, {});
	}

	static async readAll(sql: postgres.Sql<any>, movie_name: string, user_id: number): Promise<Movie[]> {
		// if movie not found in db search using api then add to db
		const url = `https://api.themoviedb.org/3/search/movie?query=${movie_name}&api_key=6fcea430137f18e2310636c498360fc8`;
		const response = await axios.get(url);

		let possibleMovies: Movie[] = []
		let movie: MovieProps;
		for(let i = 0; i < response.data.results.length; i++)
		{
			movie = {
				id: response.data.results[i].id,
				title: response.data.results[i].title,
				description: response.data.results[i].overview, 
				status: 'to_watch',
				user_id: user_id
			};
			possibleMovies[i] = new Movie(sql, convertToCase(snakeToCamel, movie) as MovieProps)
		}
	

		return possibleMovies;
	}

	async update(updateProps: Partial<MovieProps>) {
	}

	async delete() {
	}
}
