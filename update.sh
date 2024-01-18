#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
sudo vuepress build docs

# 进入生成的文件夹s
cp -r /Users/li/study-code/blog/site /Users/li/study-code

cd /Users/li/study-code/site
git add .
git commit -m 'deploy'
git push orgin master master:gh-pages

cd -