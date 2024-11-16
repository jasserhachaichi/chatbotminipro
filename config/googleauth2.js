const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./../models/user');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/auth/google/callback',
      passReqToCallback: true,
    },
    function(req, accessToken, refreshToken, profile, done) {
      // Check if the user exists in your database
      User.findOne({ googleId: profile.id }) // Changed 'user' to 'User'
        .then(user => {
          if (!user) {
            // If the user doesn't exist, create a new one
            const newUser = new User({ // Changed 'user' to 'User'
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              // Other fields as needed
            });
            return newUser.save();
          } else {
            // If the user exists, return the user object
            return user;
          }
        })
        .then(user => {
          done(null, user);
        })
        .catch(err => {
          done(err);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id) // Changed 'user' to 'User'
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err);
    });
});
