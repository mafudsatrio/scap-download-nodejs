const cheerio = require('cheerio')
const axios = require('axios').default
const express = require('express')
const puppeteer = require('puppeteer')
const app = express()
const fs = require('fs')
const port = 3000

// EJS vie egine
app.set('view engine', 'ejs')

app.get('/', async (req, res) => {
    let list_cp = []

    // Get one piece
    let response = await axios.get('https://komiku.id/manga/one-piece-indonesia/')

    // Load page
    let $ = cheerio.load(response.data)

    $('.judulseries').each(function() {
        // Get ch list
        let $2 = cheerio.load($(this).html())
        
        // Get link to spesific cp and title cp
        let chapter = $2('a').attr('href')
        let title = $2('a').attr('title')
        let obj = {
            link: chapter,
            title: title
        }
        list_cp.push(obj)
    })

    res.render('index', {
        list_cp: list_cp,
        manga: 'one-piece-indonesia',
    })
})

// Get panel image per cp manga
app.get('/manga/:title/:chapter', async (req, res) =>
{
    let list_img = []
    let title = req.params.title
    let chapter = req.params.chapter
    chapter = chapter.replaceAll('|', '/')

    // pupeter
    const browser = await puppeteer.launch({
        headless: false
    })
    const page = await browser.newPage()
    await page.goto(`https://komiku.id${chapter}`, {"waitUntil" : "load"})
    await page.setViewport({
        width: 1366,
        height: 766
    })

    await autoScroll(page)

    // Load page
    let $ = cheerio.load(await page.content())

    await browser.close()

    // Open baca komik section
    let $2 = cheerio.load($('#Baca_Komik').html())
    
    $2('img').each(function() {
        axios({
            url: $2(this).attr('src'),
            method: 'get',
            responseType: 'stream',
        }).then(response => {
            response.data.pipe(fs.createWriteStream($2(this).attr('alt') + ".jpg"));
        })
        list_img.push($2(this).attr('src'))
    })

    res.render('detail', {
        list_img: list_img
    })
})

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0
            var distance = 100
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight
                window.scrollBy(0, distance)
                totalHeight += distance

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer)
                    resolve()
                }
            }, 10)
        })
    })
}


app.listen(port)

