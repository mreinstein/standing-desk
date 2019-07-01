#!/bin/bash

# install node/npm
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -

sudo apt-get install -y nodejs build-essential

sudo apt-get update

sudo apt-get upgrade

npm install

# configure the voice interaction agent to run automatically at boot, restart on failure
sudo cp desk.service /lib/systemd/system/

sudo systemctl daemon-reload

sudo systemctl enable desk.service

sudo systemctl start desk.service
