import postgres, { camel } from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";
import axios from "axios";


export interface ContentProps {
	content_id: number,
	title: string,
	description: string,
	content_poster: string
}

export default class Content {
	constructor(
		private sql: postgres.Sql<any>,
		public props: ContentProps,
	) {}

	static async create(sql: postgres.Sql<any>, props: ContentProps): Promise<Content> {
		const connection = await sql.reserve();

		const [row] = await connection<ContentProps[]>`
		INSERT INTO content
			${sql(convertToCase(camelToSnake, props))}
		RETURNING *
		`;

		await connection.release();

		return new Content(sql, convertToCase(snakeToCamel, row) as ContentProps);
	}

	static async read(sql: postgres.Sql<any>, content_id: number): Promise<Content> {
		return new Content(sql, { });
	}

	static async readAll(sql: postgres.Sql<any>, content_name: string): Promise<Content[]> {
		// todo: check Contents in db, add to possible Contents then search api for any other Contents comparing the ids making sure theres no dupe Contents
		const url = `https://api.themoviedb.org/3/search/multi?query=${content_name}&include_adult=false&api_key=6fcea430137f18e2310636c498360fc8`;
		const response = await axios.get(url);

		let possibleContent: Content[] = [];
		let content: ContentProps;
		for(let i = 0; i < response.data.results.length; i++)
		{
			if (response.data.results[i].poster_path != null)
			{
				if (response.data.results[i].title != null)
				{
					content = {
						content_id: response.data.results[i].id,
						title: response.data.results[i].title,
						description: response.data.results[i].overview, 
						content_poster: "https://image.tmdb.org/t/p/original" + response.data.results[i].poster_path
					};
					possibleContent[i] = new Content(sql, convertToCase(snakeToCamel, content) as ContentProps)
				}
			}
		}
	

		return possibleContent;
	}

	async update(updateProps: Partial<ContentProps>) {
		// If they update the rating change the required stuff
	}

	async delete() {
	}
}
