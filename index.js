const OAuth = require('oauth');
const fs = require('fs');

// Twitter API Credentials
const TWITTER_API = {
    CONSUMER_KEY: "",
    CONSUMER_SECRET: "",
    ACCESS_KEY: "",
    ACCESS_SECRET: "",
}

// Specify first user_id (using user_id since there was a limit to use screen_name while fetching followers)
let user_ids = ['2924521080']
let global_screen_name = 'davidfrawleyved'

let last_update = Date.now()

const getTweetsByUserId = (user_id, screen_name, id = null) => {
    let url = `https://api.twitter.com/1.1/statuses/user_timeline.json?user_id=${user_id}&count=200`;
    let oauth = new OAuth.OAuth(
        `https://api.twitter.com/oauth/request_token`,
        `https://api.twitter.com/oauth/access_token`,
        `${TWITTER_API.CONSUMER_KEY}`,
        `${TWITTER_API.CONSUMER_SECRET}`,
        '1.0A',
        null,
        'HMAC-SHA1'
    );
    oauth.get(
        id ? url + `&max_id=${id}` : url,
        `${TWITTER_API.ACCESS_KEY}`,
        `${TWITTER_API.ACCESS_SECRET}`,
        function (e, data, res) {
            if (e) console.error(e);
            // console.log(data);
            let latest_tweets = JSON.parse(data);
            writeTweetsToFile(screen_name, latest_tweets)
            if (latest_tweets.length > 1) {
                getTweetsByUserId(user_id, screen_name, latest_tweets.slice(-1)[0].id - 1)
            } else {
                console.log('Just one.. Not writing')
            }
        });
}

const getFollowersByUserId = (user_id) => {
    let url = `https://api.twitter.com/1.1/friends/ids.json?user_id=${user_id}&stringify_ids=true`;
    let oauth = new OAuth.OAuth(
        `https://api.twitter.com/oauth/request_token`,
        `https://api.twitter.com/oauth/access_token`,
        `${TWITTER_API.CONSUMER_KEY}`,
        `${TWITTER_API.CONSUMER_SECRET}`,
        '1.0A',
        null,
        'HMAC-SHA1'
    );
    oauth.get(
        url,
        `${TWITTER_API.ACCESS_KEY}`,
        `${TWITTER_API.ACCESS_SECRET}`,
        function (e, data, res) {
            if (e) console.error(e);
            // console.log(data);
            let id_data = JSON.parse(data);
            user_ids = id_data.ids;
            getScreenName(user_ids[0])
        });
}

const getScreenName = (user_id) => {
    let url = `https://api.twitter.com/1.1/users/lookup.json?user_id=${user_id}`;
    let oauth = new OAuth.OAuth(
        `https://api.twitter.com/oauth/request_token`,
        `https://api.twitter.com/oauth/access_token`,
        `${TWITTER_API.CONSUMER_KEY}`,
        `${TWITTER_API.CONSUMER_SECRET}`,
        '1.0A',
        null,
        'HMAC-SHA1'
    );
    oauth.get(
        url,
        `${TWITTER_API.ACCESS_KEY}`,
        `${TWITTER_API.ACCESS_SECRET}`,
        function (e, data, res) {
            if (e) console.error(e);
            // console.log(data);
            let name = JSON.parse(data);
            global_screen_name = name[0].screen_name
            console.log(`Next user --> ${global_screen_name}, id --> ${user_id}`)
            try {
                if (fs.existsSync(`./tweets/${global_screen_name}.csv`) || name[0].protected) {
                    //file exists
                    console.log('Already exists/Protected. Fetching new user')
                    user_ids.shift()
                    getScreenName(user_ids[0])
                }
            } catch (err) {
                console.error(err)
            }

        });
}

const fun = () => {
    console.log('Fetching for --> ', global_screen_name)
    last_update = Date.now()
    try {
        if (!fs.existsSync(`./tweets/${global_screen_name}.csv`)) {
            getTweetsByUserId(user_ids[0], global_screen_name)
        }
    } catch (err) {
        console.error(err)
    }
    if (user_ids.length == 1) {
        getFollowersByUserId(user_ids[0])
    } else {
        user_ids.shift()
        getScreenName(user_ids[0])
    }
}

fun();

setInterval(() => {
    if(Date.now() - last_update > 10000) {
        fun()
    }
}, 10000)

const writeTweetsToFile = (username, tweetArr) => {
    let content = ''
    try {
        if (!fs.existsSync(`./tweets/${username}.csv`)) {
            content+='id,created_at,text\n'
        }
    } catch (err) {
        console.error(err)
    }
    tweetArr.forEach(tweet => {
        const search = `\n`;
        const replacer = new RegExp(search, 'g')
        const { id, created_at, text} = tweet
        content += `${id},${created_at},${text.replace(replacer, ' ')}\n`
    });
    
    fs.appendFile(`./tweets/${username}.csv`, content, 'utf8', function (err) {
        if (err) throw err;
        console.log(`Saved! for ${username}`);
        last_update = Date.now()
    });
}