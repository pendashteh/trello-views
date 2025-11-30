#! /usr/bin/env bash
cd data
ls *.trello.json 2>/dev/null > index.txt
echo "Updated data/index.txt with $(wc -l < index.txt) board file(s)"
