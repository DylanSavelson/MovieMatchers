import postgres from "postgres";
import Router from "../router/Router";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import User, { InvalidCredentialsError, UserProps } from "../models/User";
import SessionManager from "../auth/SessionManager";
import Cookie from "../auth/Cookie";
import Session from "../auth/Session"
import { spec } from "node:test/reporters";


/**
 * Controller for handling Todo CRUD operations.
 * Routes are registered in the `registerRoutes` method.
 * Each method should be called when a request is made to the corresponding route.
 */
export default class AuthController {
	private sql: postgres.Sql<any>;
	private sessionManager: SessionManager;
	constructor(sql: postgres.Sql<any>) {
		this.sql = sql;
		this.sessionManager = SessionManager.getInstance();
	}

	registerRoutes(router: Router) {
		router.get("/register", this.getRegistrationForm);
		router.get("/login", this.getLoginForm);
		router.post("/login", this.login);
		router.get("/logout", this.logout);
	}

	getRegistrationForm = async (req: Request, res: Response) => {
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		  );
		await res.send({
			statusCode: StatusCode.OK,
			message: "New sign up form",
			payload: {
				isDarkMode: req.findCookie("theme")?.value === "dark",
				error: req.getSearchParams().get("error"),
				sessionCookie: session.get("userId") ? true : false,
				userId: session.get("userId")
			},
			template: "RegistrationFormView",
		});
	};


	getLoginForm = async (req: Request, res: Response) => {
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		  );
		let specifiedError = req.getSearchParams().get("error");
		if (specifiedError)
		{
			specifiedError = specifiedError + "."
		}
		await res.send({
			statusCode: StatusCode.OK,
			message: "Login Form",
			payload: {
				error: specifiedError,
				rememberedEmail: req.findCookie("email")?.value,
				sessionCookie: session.get("userId") ? true : false,
				userId: session.get("userId")
			},
			template: "LoginFormView",
		});
	};

	login = async (req: Request, res: Response) => {
		const password = req.body.password
		const email = req.body.email
		const remember = req.body.remember
		try 
		{
			const user = await User.login(this.sql, email, password);

			const session = req.getSession();
			session.set("userId", user.props.id);

			if (remember)
			{
				res.setCookie(
					new Cookie(
						"email",
						email
					)
				)
			}
			await res.send({
				statusCode: StatusCode.OK,
				message: "Successful Login",
				redirect: "/todos",
			});
		} catch (error) {
			if (!email)
			{
				await res.send({
					statusCode: StatusCode.BadRequest,
					message: "someting wrong",
					redirect: "/login?error=Email is required",
				});
				
			}

			else if(this.isInvalidCredentialsError(error))
			{
				let errorMessage = error.message.slice(0, -1);
				await res.send({
					statusCode: StatusCode.BadRequest,
					message: "someting wrong",
					redirect: "/login?error="+ errorMessage,
				});
			}

		}

	};

	isInvalidCredentialsError(error: unknown): error is InvalidCredentialsError {
		return error instanceof InvalidCredentialsError;
	  }


	logout = async (req: Request, res: Response) => {
		const cookie : Cookie = req.session.cookie;
		cookie.setExpires();
		res.setCookie(
			cookie
		);
		await res.send({
			statusCode: StatusCode.Redirect,
			message: "successful logout",
			redirect: "/"
		});
	};
}
