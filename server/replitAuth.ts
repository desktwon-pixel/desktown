import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage.ts";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  let store;
  if (process.env.USE_MEMORY_SESSION === 'true') {
    console.log('[Auth] Using MemoryStore for sessions (Database unavailable)');
    store = new session.MemoryStore();
  } else {
    const pgStore = connectPg(session);
    store = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
      errorLog: console.error,
    });
  }

  return session({
    secret: process.env.SESSION_SECRET || "desktown_default_secret_key",
    store: store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    status: "online",
    lastSeenAt: new Date(),
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // =====================
  // Google Auth Setup
  // =====================
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const email = profile.emails?.[0].value;
            const claims = {
              sub: `google-${profile.id}`,
              email: email,
              first_name: profile.name?.givenName || profile.displayName,
              last_name: profile.name?.familyName || "",
              profile_image_url: profile.photos?.[0].value,
            };
            await upsertUser(claims);
            const user = {
              claims,
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            };
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );

    app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/api/login" }),
      (req, res) => {
        res.redirect("/");
      }
    );
  }

  // DEV MODE: Bypass Replit Auth if using dummy ID or on Render
  console.log(`[Auth] Current REPL_ID: "${process.env.REPL_ID}"`);
  const isDummy = process.env.REPL_ID?.toLowerCase().includes('dummy') ||
    process.env.REPL_ID?.toLowerCase().includes('render') ||
    !process.env.REPL_ID;

  if (isDummy) {
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    app.get("/api/login", async (req, res) => {
      const requestedRole = (req.query.role as string) || "admin";
      const profileType = (req.query.type as string) || "office";

      const claims = {
        sub: `dev-${requestedRole}-id`,
        email: `${requestedRole}@example.com`,
        first_name: requestedRole.charAt(0).toUpperCase() + requestedRole.slice(1),
        last_name: "User",
        profile_image_url: `https://ui-avatars.com/api/?name=${requestedRole}&background=random`,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week
        role: requestedRole // Add role to claims for mock auth
      };

      const user = {
        claims,
        access_token: "dummy_access_token",
        refresh_token: "dummy_refresh_token",
        expires_at: claims.exp
      };

      // Create/Update user with the specific role
      try {
        await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          username: requestedRole,
          firstName: claims.first_name,
          lastName: claims.last_name,
          profileImageUrl: claims.profile_image_url,
          role: requestedRole, // Set the requested role
          status: "online",
        });
      } catch (err) {
        console.warn(`[Auth] Failed to persist user to database (running in mock mode?):`, err);
        // Continue to login anyway
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.redirect("/api/login");
        }

        // Handle redirect based on profile type
        if (profileType === 'visitor') {
          return res.redirect("/welcome");
        }
        return res.redirect("/");
      });
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });
    return;
  }

  if (!process.env.REPL_ID) {
    console.warn("[Auth Warning] REPL_ID environment variable is missing! Falling back to 'dummy_dev' for Render compatibility.");
    process.env.REPL_ID = 'dummy_dev';
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, (err: any, user: any, info: any) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.redirect("/api/login");
      }
      if (!user) {
        console.error("No user returned:", info);
        return res.redirect("/api/login");
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.redirect("/api/login");
        }
        return res.redirect("/");
      });
    })(req, res, next);
  });

  app.get("/api/logout", async (req, res) => {
    const user = req.user as any;
    if (user?.claims?.sub) {
      await storage.updateUserStatus(user.claims.sub, "offline");
    }
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // DEV MODE: Bypass token check
  if (process.env.REPL_ID?.toLowerCase().includes('dummy')) {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
