import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './prisma';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/auth/google/callback` : '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
          
          if (!user) {
            const email = profile.emails?.[0]?.value;
            if (email) {
              const existingUser = await prisma.user.findUnique({ where: { email } });
              if (existingUser) {
                user = await prisma.user.update({
                  where: { email },
                  data: { googleId: profile.id },
                });
              } else {
                user = await prisma.user.create({
                  data: {
                    email,
                    name: profile.displayName || 'Google User',
                    password: '', // No password for OAuth
                    googleId: profile.id,
                  },
                });
              }
            }
          }
          done(null, user as any);
        } catch (err) {
          done(err, undefined);
        }
      }
    )
  );
}

export default passport;
