import postgres, { camel } from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";
import axios from "axios";
import { ContentProps } from "./Content";
import Content from "./Content"

export default class ToWatchContent{
    constructor(
        private sql: postgres.Sql<any>,
    ){}

    static async readAll(sql: postgres.Sql<any>, contentId: number): Promise<Content[]>
    {
        const givenContent = await Content.read(sql, contentId)
        let possibleContent: Content[] = [];
		let content: Partial<ContentProps>;
        if (givenContent.props.type == "movie")
        {
            const movieSimilarUrl = `https://api.themoviedb.org/3/movie/${contentId}}/similar?language=en-US&page=1&api_key=6fcea430137f18e2310636c498360fc8`;
            const movieSimilarResponse = await axios.get(movieSimilarUrl);
            for(let i = 0; i < movieSimilarResponse.data.results.length; i++)
            {   
                let individualMovieUrl = `https://api.themoviedb.org/3/movie/${movieSimilarResponse.data.results[i].id}?language=en-US&api_key=6fcea430137f18e2310636c498360fc8`
                let individualMovieResponse = await axios.get(individualMovieUrl);  
                if (individualMovieResponse.data.poster_path != null)
                {
                    if (individualMovieResponse.data.title != null)
                    {
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
							contentId: individualMovieResponse.data.id,
							title: individualMovieResponse.data.title,
							description: individualMovieResponse.data.overview, 
							contentPoster: "https://image.tmdb.org/t/p/original" + individualMovieResponse.data.poster_path,
							type: "movie",
							createdBy: creators,
							releaseDate: individualMovieResponse.data.release_date,
							genres: genres,
							rating: individualMovieResponse.data.vote_average,
						}
                        let existingContent;
                        if (content.contentId)
                        {
                            existingContent = await Content.read(sql, content.contentId)
                            if (!existingContent.props.contentId)
                            {
                                await Content.create(sql, content as ContentProps)
                            }
                        }
                        possibleContent[i] = new Content(sql, content as ContentProps)
                    }
                }
            }
        }
        else if (givenContent.props.type == "tv")
        {
            const tvSimilarUrl = `https://api.themoviedb.org/3/tv/${contentId}}/similar?language=en-US&page=1&api_key=6fcea430137f18e2310636c498360fc8`;
            const tvSimilarResponse = await axios.get(tvSimilarUrl);
            for(let i = 0; i < tvSimilarResponse.data.results.length; i++)
            {
                if (tvSimilarResponse.data.poster_path != null)
                {
                    if (tvSimilarResponse.data.name != null)
                    {
                        let individualTvUrl = `https://api.themoviedb.org/3/tv/${tvSimilarResponse.data.results[i].id}?language=en-US&api_key=6fcea430137f18e2310636c498360fc8`
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
							contentId: individualTvResponse.data.id,
							title: individualTvResponse.data.name,
							description: individualTvResponse.data.overview || "N/A", 
							contentPoster: "https://image.tmdb.org/t/p/original" + individualTvResponse.data.poster_path,
							type: "tv",
							createdBy: creators ,
							releaseDate: individualTvResponse.data.first_air_date,
							genres: genres,
							rating: rating,
							seasons: seasons
						}
                        let existingContent;
                        if (content.contentId)
                        {
                            existingContent = await Content.read(sql, content.contentId)
                            if (!existingContent.props.contentId)
                            {
                                await Content.create(sql, content as ContentProps)
                            }
                        }
                        possibleContent[i] = new Content(sql, content as ContentProps)
                    }
                }
            }
        }
        return possibleContent;	
    }
}