import postgres, { camel } from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";
import axios from "axios";


export interface MovieProps {
	movie_id?: number,
	title: string,
	description: string,
	status: 'watched' | 'to_watch',
	movie_poster: string
}

export default class Movie {
	constructor(
		private sql: postgres.Sql<any>,
		public props: MovieProps,
	) {}

	static async create(sql: postgres.Sql<any>, props: MovieProps): Promise<Movie> {
		const connection = await sql.reserve();

		const [row] = await connection<MovieProps[]>`
		INSERT INTO movies
			${sql(convertToCase(camelToSnake, props))}
		RETURNING *
		`;

		await connection.release();

		return new Movie(sql, convertToCase(snakeToCamel, row) as MovieProps);
	}

	static async read(sql: postgres.Sql<any>, movie_id: number): Promise<Movie> {
		return new Movie(sql, { });
	}

	static async readAll(sql: postgres.Sql<any>, movie_name: string): Promise<Movie[]> {
		// todo: check movies in db, add to possible movies then search api for any other movies comparing the ids making sure theres no dupe movies
		const url = `https://api.themoviedb.org/3/search/multi?query=${movie_name}&api_key=6fcea430137f18e2310636c498360fc8`;
		const response = await axios.get(url);

		let possibleMovies: Movie[] = []
		let movie: MovieProps;
		for(let i = 0; i < response.data.results.length; i++)
		{
			if (response.data.results[i].poster_path != null)
			{
				if (response.data.results[i].title != null)
				{
					movie = {
						movie_id: response.data.results[i].id,
						title: response.data.results[i].title,
						description: response.data.results[i].overview, 
						status: 'to_watch',
						movie_poster: "https://image.tmdb.org/t/p/original" + response.data.results[i].poster_path
					};
					possibleMovies[i] = new Movie(sql, convertToCase(snakeToCamel, movie) as MovieProps)
				}
			}
		}
	

		return possibleMovies;
	}

	async update(updateProps: Partial<MovieProps>) {
		// If they update the rating change the required stuff
	}

	async delete() {
	}
}
