// index.js
const express = require('express');
const bodyParser = require('body-parser');
const minify = require('express-minify');
const http = require('http');

// IMPORTS
const db = require('./db.js');
const auth = require('./authentification');
const public = require('./public');
const user = require('./user');
const crypto = require('crypto');
const app = express();

const properties = ["Year", "Rated", "Genre", "Director", "Language", "imdbRating"];
const PORT = 4242;

// DODGE CROS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header("Access-Control-Allow-Origin", "http://localhost:8080");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  next();
});

function shuffle(a) {
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
}

app.use(minify());
app.use(express.static("."));
app.use(bodyParser.json())
app.disable('x-powered-by');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const session = require('express-session');
const sessionStore   = new session.MemoryStore({ reapInterval: 60000 * 10 })
app.use(session({
  resave: false,
  store: sessionStore,
  saveUninitialized: true,
  secret: 'sdlfjljrowuroweu',
  cookie: {
    httpOnly: false
  }
}));

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('body-parser').urlencoded({ extended: true }));


// Function ensure that user is connected
function ensureAuthentificated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.statusCode = 403;
    res.send(JSON.stringify('User not authenticated'));
  }
}

/**
* @api {get} / Entry point
* @apiName /
* @apiGroup All
*
*/
app.get('/', function(req, res) {
  sess = req.session;
  if (sess.email) {
    res.send('OK is authenticated');
  } else {
    res.send('KO not authenticated');
  }
});

/**
* @api {get} /api/session Session
* @apiName session
* @apiGroup All
*
* @apiDescription
* Allow to retreive user session info
*
*
*/
app.get('/api/session', function(req, res) {
  if (req.session.user) {
    res.statusCode = 200;
    res.send(JSON.stringify(req.session.user));
  } else {
    res.statusCode = 403;
    res.send('User not authentificated');
  }
});


/**
* @api {get} /api/movie/:id Movie by id
* @apiGroup Movies
*
* @apiParam {int} id
*
* @apiDescription
* Get movie detail by id
*/
app.get('/api/movie/:id', function(req, res) {
  if (!req.params.id) {
    res.statusCode = 400;
    res.send('No id provided');
  } else {
    var query = public.getFilmsByID(req.params.id, function(err, movie) {
      if (err) {
        console.log(err);
        res.statusCode = 400;
        res.send(err);
      } else {
        if (movie) {
          console.log('Sending movie detail');
          res.statusCode = 200;
          res.send(movie);
        }
      }
    });
  }
});

/**
* @api {get} /api/recommandation/:id Recommandation
* @apiGroup User
*
* @apiParam {int} id
*
* @apiDescription
* Get recommandation for a specific userID
*/
app.get('/api/recommandation/:id', (req, res) => {
  console.log("Requesting users recommandation");
  if (!req.params.id) {
    res.statusCode = 400;
    res.send('No user provided');
  } else {
    shuffle(properties);
    var query = user.favoriteByCriteria(req.params.id, properties, function(err, movies) {
      if (err) {
        console.log(err);
        res.statusCode = 400;
        res.send(err);
      } else {
        if (movies) {
          console.log('Sending personnal recommandations');
          res.statusCode = 200;
          res.send(movies);
        }
      }
    });
  }
});

/**
* @api {post} /api/logOut Log out
* @apiGroup Authentification
*
* @apiDescription
* Log out the user
*/
app.post('/api/logOut', function(req, res) {
  console.log('Logout user ' + req.session.username)
  req.session = null;
  res.statusCode = 200;
  res.send();
});

/**
* @api {post} /api/signIn Create a new account
* @apiName SignIn
* @apiGroup Authentification
*
* @apiParam {string} login
* @apiParam {string} password
*
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*          login : hadrien
*          password : iLoveJS
*          id : 3
*     }
*
* @apiError Error reason Could not create user
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 400 Error
*     {
*       "error": "reason"
*     }
*/
app.post('/api/signIn', (req, res) => {
  console.log(req.body.pwd);
  console.log(crypto.createHash('md5').update(req.body.pwd).digest("hex"));
  var newUser = auth.registerUser(req.body.login, crypto.createHash('md5').update(req.body.pwd).digest("hex"), function(err, user) {
    if (err) {
      console.log(err);
      res.statusCode = 403;
      res.send(err);
    }
    console.log(user);
    if (user) {
      delete user.password;
      res.statusCode = 200;
      res.send(JSON.stringify(user));
    }
  });
});


/**
* @api {post} /api/updateURL Update user Url
* @apiGroup User
*
* @apiDescription
* Update the url of the user profile picture
*/
app.post('/api/updateURL', (req, res) => {
  if (!req.body.url) {
    res.statusCode = 400;
    res.send('No url provided');
  }
  console.log(req.session);
  console.log(req.body);
  console.log(req.session.user.id);
  var urlAction = user.updateURL(req.body.url, req.session.user.id, function(err, user) {
    if (err) {
      console.log(err);
      res.statusCode = 403;
      res.send(err);
    }
    console.log(user);
    if (user) {
      delete user.password;
      res.statusCode = 200;
      res.send(JSON.stringify(user));
    }
  });
});

/**
* @api {post} /api/logIn Log into account
* @apiName logIn
* @apiGroup Authentification
*
* @apiParam {string} login
* @apiParam {string} password
*
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*          login : hadrien
*          password : iLoveJS
*          id : 3
*     }
*
* @apiError Error reason Could log user in
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 400 Error
*     {
*       "error": "reason"
*     }
*/
app.post('/api/logIn', (req, res) => {
  console.log("/api/login called");
  let sess = req.session;
  if (!req.body.login || !req.body.pwd) {
    res.statusCode = 403;
    res.send('Credentials can not be empty');
  } else {
    var newUser = auth.logUser(req.body.login, req.body.pwd, function(err, user) {
      if (err) {
        console.log(err);
        res.statusCode = 403;
        res.send(err);
      }
      console.log(user);
      if (user) {
        delete user.password;
        console.log("Next is session id INIT can not be null");
        console.log(user.id);
        sess.user = user;
        req.session.save();
        res.statusCode = 200;
        res.send(JSON.stringify(user));
      }
    });
  }
});

/**
* @api {post} /api/like Add image to favorites
* @apiGroup Favorite
*
* @apiParam {string} movieID
*
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*          res : true
*     }
*
* @apiError Error reason could not add to favorites
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 400 Error
*     {
*       "error": "reason"
*     }
*/
app.post('/api/like', ensureAuthentificated, (req, res) => {
  if (!req.body.movieID) {
    res.statusCode = 400;
    res.send('{ "error" : No film provided }');
  } else {
    sess = req.session;
    var newUser = user.likeMovie(req.body.movieID, req.session.user.id, function(err, isOk) {
      if (err) {
        console.log(err);
        res.statusCode = 400;
        res.send('{ "error" : ' + err + '}');
      }
      console.log(isOk);
      if (isOk) {
        res.statusCode = 200;
        res.send('{ "res" : "'+isOk+'"}');
      }
    });
  }
});

/**
* @api {get} /api/favorites/:id Get user favorites
* @apiGroup Favorite
*
* @apiParam {int} id the id of the user
*
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*          // movie object list
*     }
*
* @apiError Error reason could get favorites movies
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 400 Error
*     {
*       "error": "reason"
*     }
*/
app.get('/api/favorites/:id', ensureAuthentificated, (req, res) => {
  console.log("Requesting user favorites");
  if (!req.params.id) {
    res.statusCode = 400;
    res.send('No user provided');
  } else {
    var newUser = user.myMovies(req.params.id, function(err, movies) {
      if (err) {
        console.log(err);
        res.statusCode = 400;
        res.send(err);
      } else {
        if (movies) {
          console.log('Sending personnal movies');
          res.statusCode = 200;
          res.send(movies);
        } else {
        res.statusCode = 200;
        res.send('{ "info" : "no favorites" }');
      }
      }
    });
  }
});

/**
* @api {get} /api/films Get film list
* @apiName GetFilms
* @apiGroup Movies
*
*
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*          [
*            {
*              "id": 1,
*              "Title": "2012",
*              "Year": 2009,
*              "Rated": "PG-13",
*              "Released": "13 Nov 2009",
*              "Runtime": "158 min",
*              "Genre": "Action, Adventure, Sci-Fi",
*              "Director": "Roland Emmerich",
*              "Writer": "Roland Emmerich, Harald Kloser",
*              "Actors": "John Cusack, Amanda Peet, Chiwetel Ejiofor, Thandie Newton",
*              "Plot": "A frustrated writer struggles to keep his family alive when a series of global catastrophes threatens to annihilate mankind.",
*              "Language": "English, French, Tibetan, Mandarin, Russian, Hindi, Portuguese, Latin, Italian",
*              "Country": "USA",
*              "Awards": "5 wins & 20 nominations.",
*              "Poster": "https://images-na.ssl-images-amazon.com/images/M/MV5BMTY0MjEyODQzMF5BMl5BanBnXkFtZTcwMTczMjQ4Mg@@._V1_SX300.jpg",
*              "Metascore": 49,
*              "imdbRating": "5.8",
*              "imdbVotes": "297,440",
*              "BoxOffice": "$166,112,167"
*            },
*            {
*              "id": 2,
*              "Title": "47 Ronin",
*              "Year": 2013,
*              "Rated": "PG-13",
*              "Released": "25 Dec 2013",
*              "Runtime": "128 min",
*              "Genre": "Action, Adventure, Drama",
*              "Director": "Carl Rinsch",
*              "Writer": "Chris Morgan (screenplay), Hossein Amini (screenplay), Chris Morgan (screen story by), Walter Hamada (screen story by)",
*              "Actors": "Keanu Reeves, Hiroyuki Sanada, Ko Shibasaki, Tadanobu Asano",
*              "Plot": "A band of samurai set out to avenge the death and dishonor of their master at the hands of a ruthless shogun.",
*              "Language": "English, Japanese",
*              "Country": "USA",
*              "Awards": "5 nominations.",
*                "Poster": "https://images-na.ssl-images-amazon.com/images/M/MV5BMTc0MjE2NzE0OV5BMl5BanBnXkFtZTgwNTU5MjE1MDE@._V1_SX300.jpg",
*              "Metascore": 28,
*                "imdbRating": "6.3",
*                "imdbVotes": "123,023",
*                "BoxOffice": "$20,518,224"
*              }
*            ]
*     }
*
* @apiError Error reason Could not fetch films
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 400 Error
*     {
*       "error": "reason"
*     }
*/
app.get('/api/films', (req, res) => {
  var newUser = public.getFilms(function(err, movies) {
    if (err) {
      console.log(err);
      res.statusCode = 501;
      res.send(err);
    }
    if (movies) {
      res.statusCode = 200;
      res.send(movies);
    }
  });
});

/**
* @api {get}/api/users Get user list
* @apiGroup User
*
* @apiDescription
* Retreive a list of all users
*/
app.get('/api/users', (req, res) => {
  var newUser = public.getUsers(function(err, users) {
    if (err) {
      console.log(err);
      res.statusCode = 501;
      res.send(err);
    }
    if (users) {
      res.statusCode = 200;
      res.send(users);
    }
  });
});

/**
* @api {get} /api/user/:id Get user info by id
* @apiGroup User
*
* @apiDescription
* Retreive basic user info by their id
*/
app.get('/api/user/:id', (req, res) => {
  if (!req.params.id) {
    res.statusCode = 400;
    res.send('No user provided');
  } else {
    var newUser = public.getUserByID(req.params.id, function(err, user) {
      if (err) {
        console.log(err);
        res.statusCode = 501;
        res.send(err);
      }
      if (user) {
        res.statusCode = 200;
        res.send(user);
      }
    });
  }
});

let server = http.createServer(app);
server.listen(PORT, () => {
  console.log('GMBD server listening on port ' + PORT + '!');
});
