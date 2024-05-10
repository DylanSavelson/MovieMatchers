import postgres from "postgres";
import Router from "../router/Router";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import User, { InvalidCredentialsError, UserProps } from "../models/User";
import SessionManager from "../auth/SessionManager";
import Cookie from "../auth/Cookie";
import Session from "../auth/Session"
import { spec } from "node:test/reporters";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";
import Movie from "../models/Movie";


export default class AuthController {
	private sql: postgres.Sql<any>;
	private sessionManager: SessionManager;
	constructor(sql: postgres.Sql<any>) {
		this.sql = sql;
		this.sessionManager = SessionManager.getInstance();
	}

	registerRoutes(router: Router) {
		router.get("/movie", this.getMovieForm);
        router.post("/movie", this.getSearchedMovies);
    }


    getSearchedMovies = async (req: Request, res: Response) => 
    {
        const session = req.getSession();
		res.setCookie( 
			session.cookie
		  );
          const new_movies = await Movie.readAll(this.sql, req.body.movie, req.session.get("userId"))

          if (new_movies)
          {
              await res.send({
                  statusCode: StatusCode.OK,
                  message: "Movies",
                  payload: {
                    sessionCookie: session.get("userId") ? true : false,
                    userId: session.get("userId"),
                    movie: new_movies
                  },
                  template: "SearchedMovies",
              });
          }
    }

	getMovieForm = async (req: Request, res: Response) => 
	{
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		  );
		await res.send({
			statusCode: StatusCode.OK,
			message: "Movie search form",
			payload: {
				sessionCookie: session.get("userId") ? true : false,
				userId: session.get("userId")
			},
			template: "MovieView",
		});
	}


}