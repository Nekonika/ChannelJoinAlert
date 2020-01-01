# **ChannelJoinAlert**

ChannelJoinAlert is a script made for [SinusBot](https://www.sinusbot.com/) (TeamSpeak).
It provides functionality to specify admins for certain channel and alert them if someone joins their moderated channel.

Messages as well as functionality is fully customizable through the configuration page of your SinusBot.

## How to install the script

Go to the Directory you installed the Bot in. Make sure it contains the sinusbot.exe. Now open the folder "scripts" - if it doesn't exist create it.
Now this is where you want to add the "ChannelJoinAlert.js"-file.

## Setting up the config

On your "Scripts"-Page in the Web UI of the bot tick "ChannelJoinAlert" to activate the script.
Now click on the little arrow in front of the scriprts name to open the configuration page.

**Here is what you can set up:**

_"Should the Bot send a privat chat message or poke the users?"_
Decide if the Admins get a Private Message or a Poke when a user joins their moderated channel.

_"Set a message which will be sent to the admin if anyone joins a Support-Channel:"_
Provide a message you want to send to your admins if their moderated channel need attention.
(you may use {Username} for the username of the user who joined the channel or {Channel} for the name of the channel they joined)

_"Set a message which will be sent to the user if he joins any Support-Channel:"_
This is the message the user who joined the moderated channel receives.
(available placeholders: {FoundSupporter} which is the amount of supporter/admins that got notified)

_"Set a message which will be sent to the user if no Supporter was found:"_
Is the message the user receives when no supporter/admins were notified.

_"Add the channels where Admins will not be pinged:"_
If a admin is in any of these channels, then he won't get notified.

_"Enable Logging"_
Writes the most important informations about what the script is doing into the "Instance Log".

_"Enable Debugging"_
Will enable the "spam the f*ck out of me"-mode and log everything that the script does into the "Instance Log".


**Channel Groups**

_"Give your Channelgroup a nice name:"_
Add a name for your channel group.

_"Select a corresponding channel for this group:"_
Choose for a trigger channel (if a nonadmin joins this channel each admin will get notified)

_"The Groups RoleID:"_
The groups role-id. (can be found in the server group dialogue in TeamSpeak)
