#!/bin/bash  
eco `gulp clean`
for((i=7100;i<=7130;i++));  
do   
echo `kill -kill \`lsof -t -i tcp:${i}\``; 
	# echo `lsof -t -i tcp:$i`;
done