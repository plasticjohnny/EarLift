#!/bin/bash
# Quick deploy using lftp without password in URL

USER="john@tonedeath.app"
PASS="69cowsrcool!"
HOST="chi201.greengeeks.net"
DIR="."

lftp -c "
set ftp:ssl-allow no
open -u $USER,$PASS $HOST
cd $DIR || mkdir -p $DIR; cd $DIR
mput index.html manifest.json service-worker.js styles.css
mput app.js pitchDetector.js toneGenerator.js settings.js setup.js intonationExercise.js
mput icon-192.png icon-512.png
bye
"

echo "Deploy complete!"
