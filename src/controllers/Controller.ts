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
		router.post("/users", this.createUser);
		router.get("/users/:id/edit", this.getUserProfileForm)
		router.post("/users/:id/edit", this.updateUserProfile)
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
	updateUserProfile = async (req: Request, res: Response) => {
		if(req.session.get("userId"))
		{
			let user = await User.read(this.sql, req.session.get("userId"));
			if (req.session.get("userId") == user.props.id)
			{
				const userProps: Partial<UserProps> = {
					id: req.session.get("userId")
				};

				if (req.body.email) {
					userProps.email = req.body.email;
				}
	
				if (req.body.password) {
					userProps.password = req.body.password;
				}

				if (req.body.profile) {
					userProps.profile = req.body.profile;
				}

				if (req.body.darkmode)
				{
					res.setCookie(
						new Cookie(
							"theme",
							"dark"
						)
					)
				}
				else
				{
					res.setCookie(
						new Cookie(
							"theme",
							"light"
						)
					)
				}

				try 
				{
					await user.update(userProps);
				} 
				catch (error) 
				{
					await res.send({
						statusCode: StatusCode.BadRequest,
						message: "User with this email already exists",		
						redirect: `/users/${user.props.id}/edit?failure=yes`,
					});
					return
				}
	
				await res.send({
					statusCode: StatusCode.OK,
					message: "User updated successfully!",		
					redirect: `/users/${user.props.id}/edit?success=yes`,
				});
			}
		}
		else
		{
			await res.send({
				statusCode: StatusCode.Forbidden,
				message: "not authenticated",
				redirect: "/login",
			});
		}
	}

	getUserProfileForm = async (req: Request, res: Response) => {
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		  );
		if(req.session.get("userId"))
		{
			const user = await User.read(this.sql, req.session.get("userId"));
			let darkMode: string = "";
			if (req.findCookie("theme")?.value === "dark")
			{
				darkMode = "Dark mode enabled"	
			}
			else 
			{
				darkMode = "Dark mode disabled"
			}
			await res.send({
				statusCode: StatusCode.OK,
				message: "User Profile",
				payload: {
					isDarkMode: req.findCookie("theme")?.value === "dark",
					darkModeMessage: darkMode,
					message: req.getSearchParams().get("success") ?  "User updated successfully!" : "",
					error: req.getSearchParams().get("failure") ?  "User with this email already exists" : "",
					sessionCookie: session.get("userId") ? true : false,
					userId: session.get("userId"),
					email: user.props.email,
					image: user.props.profile ? user.props.profile : "https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg"
				},
				template: "UserProfileView",
			});
		}
		else
		{
			await res.send({
				statusCode: StatusCode.Forbidden,
				message: "not authenticated",
				redirect: "/login",
			});
		}

	};
	/**
	 * TODO: Upon form submission, this controller method should
	 * validate that no fields are blank/missing, that the passwords
	 * match, and that there isn't already a user with the given email.
	 * If there are any errors, redirect back to the registration form
	 * with an error message.
	 * @param req
	 * @param res
	 */
	createUser = async (req: Request, res: Response) => {
		const password = req.body.password
		const confirm_password = req.body.confirmPassword
		const email = req.body.email

		if (!email)
		{
			res.send({
				statusCode: StatusCode.BadRequest,
				message: "Email is required",
				redirect: "/register?error=Email is required"
			})
			return
		}

		if (!password)
		{
			res.send({
				statusCode: StatusCode.BadRequest,
				message: "Password is required.",
				redirect: "/register?error=Password is required"
			})
			return
		}
		if (password != confirm_password)
		{
			res.send({
				statusCode: StatusCode.BadRequest,
				message: "Passwords do not match",
				redirect: "/register?error=Passwords do not match"
			})
			return
		}

		let user: User | null = null;

		let userProps: UserProps = {
			email: req.body.email,
			password: req.body.password,
			createdAt: createUTCDate(),
		};

		try {
			user = await User.create(this.sql, userProps);
		} catch (error) {
			res.send({
				statusCode: StatusCode.BadRequest,
				message: "Invalid",
				redirect: "/register"
			})
			return
		}

		await res.send({
			statusCode: StatusCode.Created,
			message: "User created successfully!",
			redirect: `/login`,
		});
	};
}
