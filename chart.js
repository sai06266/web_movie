//영화 순위 불러오기
// import cheerio  from "cheerio";
// import request from "request";
const cheerio = require('cheerio');
const request = require('request');

// CGV 영화 페이지 URL
const url = 'http://www.cgv.co.kr/movies/?lt=1&ft=0';

// HTTP 요청을 통해 HTML 가져오기
request(url, (error, response, html) => {
    if (!error && response.statusCode === 200) {
        // Cheerio를 사용하여 HTML 파싱
        const $ = cheerio.load(html);
        // 모든 영화 목록 항목 선택
        const movieListItems = $('.sect-movie-chart ol li');

        // 각 영화 항목을 반복하고 정보 추출
        movieListItems.each((index, element) => {
            const rank = $(element).find('.rank').text().trim();
            const title = $(element).find('.title').text().trim();
            const posterUrl = $(element).find('.thumb-image img').attr('src');

            console.log(`순위: ${rank}`);
            console.log(`제목: ${title}`);
            console.log(`포스터: ${posterUrl}`);
            console.log('------------------------');
        });
    } else {
        console.error('에러 발생:', error);
    }
});
