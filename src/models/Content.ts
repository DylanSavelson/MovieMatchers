import postgres, { camel } from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";
import axios from "axios";
import { CONNREFUSED } from "node:dns";
import internal from "node:stream";


export interface ContentProps {
	contentId?: number,
	title: string,
	description: string,
	contentPoster: string,
	type: "movie" | "tv",
	createdBy?: string[],
	releaseDate?: string,
	genres?: string[],
	rating?: number,
	seasons?: number
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
		const connection = await sql.reserve();

		const [row] = await connection<ContentProps[]>`
			SELECT * 
			FROM content
			WHERE content_id = ${content_id}
		`;

		await connection.release();

		return new Content(sql, convertToCase(snakeToCamel, row) as ContentProps );
	}

	static async readAll(sql: postgres.Sql<any>, content_name: string): Promise<Content[]> {
		const allContentUrl = `https://api.themoviedb.org/3/search/multi?query=${content_name}&include_adult=false&api_key=6fcea430137f18e2310636c498360fc8`;
		const allResponse = await axios.get(allContentUrl);

		let possibleContent: Content[] = [];
		let content: Partial<ContentProps>;
		for(let i = 0; i < allResponse.data.results.length; i++)
		{
			let existingContent = null;
			if (allResponse.data.results[i].poster_path != null)
			{
				if (allResponse.data.results[i].title != null || allResponse.data.results[i].name != null)
				{
					existingContent = await Content.read(sql, allResponse.data.results[i].id);
					if (allResponse.data.results[i].media_type == "tv")
					{
						let individualTvUrl = `https://api.themoviedb.org/3/tv/${allResponse.data.results[i].id}?language=en-US&api_key=6fcea430137f18e2310636c498360fc8`
						let individualTvResponse = await axios.get(individualTvUrl);
						
						let creators: string[] = [];
						let genres: string [] = [];
						let rating: number = 0;
						let seasons: number = 0;
						for (let j = 0; j < individualTvResponse.data.created_by.length; j++)
						{
							creators[j] = individualTvResponse.data.created_by[j].name;
						}
						for (let k = 0; k < individualTvResponse.data.genres.length; k++)
						{
							genres[k] = individualTvResponse.data.genres[k].name;
						}
						for (let m = 0; m < individualTvResponse.data.seasons.length; m++)
						{
							if (individualTvResponse.data.seasons[m].vote_average != 0)
							{
								seasons+=1;
								rating += individualTvResponse.data.seasons[m].vote_average;
							}
						}
						rating = rating / seasons
						content = {
							contentId: allResponse.data.results[i].id,
							title: allResponse.data.results[i].name,
							description: allResponse.data.results[i].overview || "N/A", 
							contentPoster: "https://image.tmdb.org/t/p/original" + allResponse.data.results[i].poster_path,
							type: allResponse.data.results[i].media_type,
							createdBy: creators ,
							releaseDate: individualTvResponse.data.first_air_date,
							genres: genres,
							rating: rating,
							seasons: seasons
						}
					}
					else
					{
						let individualMovieUrl = `https://api.themoviedb.org/3/movie/${allResponse.data.results[i].id}?language=en-US&api_key=6fcea430137f18e2310636c498360fc8`
						let individualMovieResponse = await axios.get(individualMovieUrl);
						let creators: string[] = [];
						let genres: string [] = [];
						for (let j = 0; j < individualMovieResponse.data.production_companies.length; j++)
						{
							creators[j] = individualMovieResponse.data.production_companies[j].name;
						}
						for (let k = 0; k < individualMovieResponse.data.genres.length; k++)
						{
							genres[k] = individualMovieResponse.data.genres[k].name;
						}

						content = {
							contentId: allResponse.data.results[i].id,
							title: allResponse.data.results[i].title,
							description: allResponse.data.results[i].overview, 
							contentPoster: "https://image.tmdb.org/t/p/original" + allResponse.data.results[i].poster_path,
							type: allResponse.data.results[i].media_type,
							createdBy: creators,
							releaseDate: individualMovieResponse.data.release_date,
							genres: genres,
							rating: individualMovieResponse.data.vote_average,
						}
					}
					if (!existingContent.props.contentId)
					{
						await Content.create(sql, content as ContentProps)
					}
					possibleContent[i] = new Content(sql, content as ContentProps)
				}
			}
		}

		return possibleContent;
	}
}