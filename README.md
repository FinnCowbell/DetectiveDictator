# DetectiveDictator

An Online Version of the Mafia-style WWII Electon Game!

It's the board game Secret Hitler, but in you and your friends browsers!

Whereas a website such as secrethitler.io was made to provide to a community of online Secret Hitler players, I made this version for social-distancing game lovers who want to get their friends together for a Zoom board game night!

## Reducing TTFB

This app used to be completely hosted on a free Heroku Dyno. However, this resulted in page-load times >10s if the dyno needed to wake from sleep.

This branch deploys the front end on Github pages, and connects to the Heroku backend. This way, the page loads instantly, and the user can wait on the main menu for the dyno to spin up. 