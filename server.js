const express = require('express');
const path = require('path');
const cheerio = require('cheerio');
const request = require('request');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'main')));

// Body Parser 미들웨어 추가
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Express 세션 설정
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// MySQL 연결 설정
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'login',
});

// 영화 순위 
app.get('/movie-rankings', (req, res) => {
    const url = 'http://www.cgv.co.kr/movies/?lt=1&ft=0';

    request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(html);
            const movieListItems = $('.sect-movie-chart ol li');
            const movies = [];

            movieListItems.each((index, element) => {
                const rank = $(element).find('.rank').text().trim();
                const title = $(element).find('.title').text().trim();
                const posterUrl = $(element).find('.thumb-image img').attr('src');
                const movie = {
                    rank,
                    title,
                    posterUrl,
                };
                movies.push(movie);
            });

            // 19등까지의 정보만 클라이언트로 전달
            const moviesToSend = movies.slice(0, 19);

            res.json(moviesToSend);
        } else {
            console.error('에러 발생:', error);
            res.status(500).send('내부 서버 오류');
        }
    });
});
// 신규 영화 목록 
app.get('/new-movies', (req, res) => {
    const url = 'http://www.cgv.co.kr/movies/pre-movies.aspx';

    request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(html);
            const movieListItems = $('.sect-movie-chart ol li');
            const newMovies = [];

            movieListItems.each((index, element) => {
                const title = $(element).find('.title').text().trim();
                const posterUrl = $(element).find('.thumb-image img').attr('src');
                const releaseDate = $(element).find('.txt-info strong').first().text().trim();
                const dDay = $(element).find('.dday').text().trim();
                
                const newMovie = {
                    title,
                    posterUrl,
                    releaseDate,
                    dDay,
                };
                newMovies.push(newMovie);
            });
            const moviesToSend = newMovies.slice(0, 40);
            res.json(moviesToSend);
        } else {
            console.error('에러 발생:', error);
            res.status(500).send('내부 서버 오류');
        }
    });
});

//로그인 구현
function restrict(req, res, next) {
    if (req.session.loggedin) {
    next();
    } else {
    req.session.error = 'Access denied!';
    res.sendFile(path.join(__dirname + '/main/login.html'));
    }
}

app.use('/', function(request, response, next) {
    if ( request.session.loggedin == true || request.url == "/login" || request.url == "/register" ) {
    next();
    }
    else {
    response.sendFile(path.join(__dirname + '/main/login.html'));
    }
});

app.get('/login', function(request, response) {
    response.sendFile(path.join(__dirname + '/main/login.html'));
});

app.post('/login', function(request, response) {
    var username = request.body.username;
    var password = request.body.password;

    if (username && password) {
        connection.query('SELECT * FROM user WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
            if (error) {
                console.error(error);
                response.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;

                // 로그인이 성공하면 사용자명을 JSON으로 클라이언트에 전달
                response.sendFile(path.join(__dirname, '/main/index.html'));
            } else {
                // 로그인 실패 시 loginerror로
                response.sendFile(path.join(__dirname, '/main/loginerror.html'));
            }
        });
    } else {
        response.status(400).json({ error: 'ID와 패스워드를 입력하세요!' });
    }
});

app.get('/register', function(request, response) {
    response.sendFile(path.join(__dirname + '/main/register.html'));
});

app.post('/register', function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    var password2 = request.body.password2;
    var email = request.body.email;
    console.log(username, password, email);

    if (username && password && email) {
        connection.query('SELECT * FROM user WHERE username = ? AND password = ? AND email = ?', [username, password, email], function(error, results, fields) {
            if (error) throw error;

            if (results.length <= 0) {
                connection.query('INSERT INTO user (username, password, email) VALUES(?,?,?)', [username, password, email], function (error, data) {
                    if (error) {
                        console.log(error);
                        response.send('오류 발생. 다시 시도하세요.');
                    } else {
                        console.log(data);
                        response.redirect('/login.html');
                    }
                });
            } else {
                response.redirect('/main/index.html');
            }
        });
    } else {
        response.send('Please enter User Information!');
        response.end();
    }
});

app.get('/logout', function(request, response) {
    request.session.loggedin = false;
    response.send('<center><H1>Logged Out.</H1><H1><a href="/index.html">Goto Home</a></H1></center>');
    response.end();
});

app.get('/index', restrict, function(request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname + '/index.html'));
    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});

app.listen(port, () => {
console.log(`서버가 http://localhost:${port} 포트에서 실행 중입니다.`);
});