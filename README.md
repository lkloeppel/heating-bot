# Feedback Slackbot
This bot will enable us to capture feedback within Slack and easily get access to the captured feedback when we want to.

## Configuration / setting up of the Slackbot
Find a detailled tutorial at ...

## Running the bot 
Add a `.env` file in the root folder and add the signing secret and bot token to the file
```
SLACK_SIGNING_SECRET=12121212121212121
SLACK_BOT_TOKEN=xoxb-123123123123-12312312312312-asdasdasdasdasdasd
```

Run `yarn` to install all dependencies and then run `yarn start`, to start the bot.

After the bot was successfullt started, it should print `Feedback Bot is running on 3000!` in the terminal