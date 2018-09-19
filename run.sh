#!/bin/bash

# Authenticate using the username and password
#LP_ACCOUNT=insert_value LP_USER=insert_value LP_PASS=insert_value node ./main.js

# Authenticate using the key and secret
LP_ACCOUNT=insert_value LP_USER=insert_value \
LP_APP_KEY=insert_value LP_SECRET=insert_value \
LP_ACCESS_TOKEN=insert_value LP_ACCESS_TOKEN_SECRET=insert_value \
node ./main.js
