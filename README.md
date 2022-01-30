# Reducing TTFB

This repository is a worktree in the dist folder, as described here:
https://gist.github.com/cobyism/4730490?permalink_comment_id=2337463#gistcomment-2337463

This site has been hosted entirely on Heroku using a free dyno. However, if the dyno had gone to sleep, it would result in load times of >10 seconds before the page loads.

Building the frontend with "yarn build-gh-pages" builds a version of the frontend that points to the heroku backend. That way, the user loads into the menu immediately, and can wait there for the backend to boot up.