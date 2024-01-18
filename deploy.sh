#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
sudo vuepress build docs

# 进入生成的文件夹s
rm -rf /Users/li/study-code/web
cp -r /Users/li/study-code/blog/site /Users/li/study-code

cd /Users/li/study-code/site
git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:erlieStar/blog.git master:gh-pages

cd -