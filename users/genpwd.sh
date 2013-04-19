#!/bin/bash
read -p "Username (letters and numbers only): " 
if [[ $REPLY =~ ^[A-Za-z0-9]+$ ]]
then
	USERNAME=$REPLY
	read -s -p "Enter password for $USERNAME (at least 4 chars): "
	if [[ $REPLY =~ .{4,} ]]
	then
		PASSWORD=$REPLY
	else
		echo "Invalid password"
		exit 1
	fi
else
	echo   
	echo "Invalid username";
	exit 1
fi
echo -n "FRDDomotics-$USERNAME$PASSWORD" | shasum -a 512 | awk '{print tolower($1)}' > $USERNAME.pwd
echo -e "\n\n$USERNAME.pwd file updated."
