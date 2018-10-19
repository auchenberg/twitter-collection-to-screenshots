var Twitter = require('twitter');
var path = require('path')
var mkdirp = require('mkdirp');
var puppeteer = require('puppeteer');

var client = new Twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});

var screenshotTweet = async function(tweet, browser, folderPath) {
    console.log(`... screenshotting tweet ${tweet.id}`)

    var filePath = path.resolve(folderPath, `tweet-${tweet.id}.png`)

    try {
        const page = await browser.newPage();
        await page.setViewport({
            deviceScaleFactor: 2,
            width: 1500,
            height: 1500
        })
        await page.goto(tweet.url);
        const tweetElement = await page.$(`.tweet[data-tweet-id="${tweet.id}"]`);
        await tweetElement.screenshot({ path: filePath});
        console.log(`... success`);  
    } catch (err) {
        console.error(`... error ${err.message}`);
    }
}

var getTweetsFromCollection = function(collectionId) {
    return new Promise(function(resolve, reject) {
        client.get('collections/entries', {id: `custom-${collectionId}`, count: 200}, function(err, response) {
            if (err) {
                return reject(err);
            }

            var collectedTweets = Object.values(response.objects.tweets).map(tweet => {
                var userName = response.objects.users[tweet.user.id_str].screen_name;
                var tweetId = tweet.id_str;
                var tweetUrl = `https://twitter.com/${userName}/status/${tweetId}`   
                return {
                    id: tweetId,
                    url: tweetUrl
                }
            })

            resolve(collectedTweets)
        });        
    })
}

var captureCollection = async function(collectionId, folderPath) {
    mkdirp.sync(folderPath); // Make sure path exists

    console.log(`Getting tweets for collection ${collectionId}`)
    var tweets = await getTweetsFromCollection(collectionId);
    console.log(`... found ${tweets.length}!`)

    var browser = await puppeteer.launch();

    for(const tweet of tweets) {
        await screenshotTweet(tweet, browser, folderPath)
    }

    console.log('All done. Bye bye')
    process.exit();
}
 
module.exports = captureCollection