import { URLSearchParams } from "url";
import https from "https";

const TOKEN_OPTIONS = {
  hostname: "identity.nexar.com",
  path: "/connect/token",
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
};

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

interface JWTPayload {
  exp: number;
  [key: string]: any;
}

function decodeJWT(jwt: string): JWTPayload {
  return JSON.parse(
    Buffer.from(
      jwt.split(".")[1].replace("-", "+").replace("_", "/"),
      "base64"
    ).toString("binary")
  );
}

function getRequest(options: https.RequestOptions, data: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const contentType = res.headers["content-type"];

      let error: Error | null = null;
      if (res.statusCode !== 200) {
        error = new Error(
          "Request Failed.\n" +
            `Status Code: ${res.statusCode} ${res.statusMessage}`
        );
      } else if (!/^application\/graphql-response|json/.test(contentType || "")) {
        error = new Error(
          "Invalid content-type.\n" +
            `Expected application/json but received ${contentType}`
        );
      }
      if (error) {
        console.error(error.message);
        // Consume response data to free up memory
        res.resume();
        reject(error);
        return;
      }

      let rawData = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (rawData += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${parseError}`));
        }
      });
    });
    req.on("error", (err) => reject(err));
    req.write(data);
    req.end();
  });
}

export class NexarClient {
  #accessToken: Promise<TokenResponse> | null = null;
  #exp: Promise<number> | null = null;
  #id: string;
  #secret: string;
  hostName = "api.nexar.com";

  /**
   * Client for the Nexar API to manage authorization and requests.
   * @param id - the client id assigned to a Nexar application.
   * @param secret - the client secret assigned to a Nexar application.
   */
  constructor(id: string, secret: string) {
    this.#id = id;
    this.#secret = secret;
  }

  #getAccessToken(id: string, secret: string): Promise<TokenResponse> {
    const data = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
    });

    return getRequest(TOKEN_OPTIONS, data.toString());
  }

  #checkTokenExp(): Promise<TokenResponse> {
    this.#exp =
      this.#exp ||
      this.#accessToken!.then(
        (token) => decodeJWT(token.access_token)?.exp * 1000
      );

    return this.#exp!.then((exp) => {
      if (exp < Date.now() + 300000) {
        //token is expired ... or will be in less than 5 minutes (300000 msec)
        this.#exp = null;
        this.#accessToken = this.#getAccessToken(this.#id, this.#secret);
      }
      return this.#accessToken!;
    });
  }

  /**
   * Make a request to the Nexar API
   * @param gqlQuery - graphQL string containing the query/mutation.
   * @param variables - key/value pairs for variables used in the gqlQuery.
   * @returns The Nexar API response
   */
  async query<T = any>(gqlQuery: string, variables?: Record<string, any>): Promise<GraphQLResponse<T>> {
    this.#accessToken =
      this.#accessToken || this.#getAccessToken(this.#id, this.#secret);

    const token = await this.#checkTokenExp();
    const options: https.RequestOptions = {
      hostname: this.hostName,
      path: "/graphql",
      method: "POST",
      headers: {
        Authorization: "Bearer " + token.access_token,
        "Content-Type": "application/json",
      },
    };
    const data = {
      query: gqlQuery,
      variables: variables || {},
    };

    return getRequest(options, JSON.stringify(data));
  }
} 