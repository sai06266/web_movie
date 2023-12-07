const express = require('express');
const path = require('path');
const cheerio = require('cheerio');
const request = require('request');

const app = express();
const port = process.env.PORT || 3000;

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'main')));

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
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 포트에서 실행 중입니다.`);
});