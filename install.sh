#!/bin/bash

# disable bluetooth
#sudo bash
#echo '# disable bluetooth' >> /boot/config.txt
#echo 'dtoverlay=pi3-disable-bt' >> /boot/config.txt
#exit

# install node/npm on raspberry pi zero w
wget https://nodejs.org/dist/latest-v10.x/node-v10.16.1-linux-armv6l.tar.xz
tar -xvf node-v10.16.1-linux-armv6l.tar.xz
cd node-v10.16.1-linux-armv6l
sudo cp -R * /usr/local/
cd ..
rm -rf node-v10.16.1-linux-armv6l
rm node-v10.16.1-linux-armv6l.tar.xz


# install node/npm for other platforms
#curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
#sudo apt-get install -y nodejs build-essential


sudo apt-get update
sudo apt-get upgrade
npm install


# install and configurate nginx
sudo apt-get install -y nginx

sudo systemctl enable nginx

sudo mv nginx-config /etc/nginx/sites-available/default

sudo /etc/init.d/nginx reload


# configure the voice interaction agent to run automatically at boot, restart on failure
sudo cp desk.service /lib/systemd/system/

sudo systemctl daemon-reload

sudo systemctl enable desk.service

sudo systemctl start desk.service
