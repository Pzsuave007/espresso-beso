#!/bin/bash
cd /root/espresso-beso
git checkout -- .
git pull origin main
chmod +x ./deploy/*.sh
sudo ./deploy/fix-deps.sh
