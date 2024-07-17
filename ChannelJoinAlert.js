registerPlugin({

name: 'Channel Join Alert',
version: 'v.2.1.0',
description: 'Automatically alerts every admin of a channel when a user connects to that channel.',
author: 'Nekonika || Nuk3_Craft3r <nuk3craft3r@gmail.com>',
vars:[
    { /* Enables or Diables logging */
        name: 'doLogging',
        title: 'Enable Logging',
        type: 'checkbox',
        default: false
    },
    { /* Enables or Diables debugging */
        name: 'doDebug',
        title: 'Enable Debugging',
        type: 'checkbox',
        default: false,
        conditions: [{
            field: "doLogging",
            value: true
        }]
    },
    { /* Allowes the user to choose between poke and pm for the notifications */
        name: 'messageType',
        title: 'Should the Bot send a privat chat message or poke the users?',
        type: 'select',
        options: [
            'Private Message',
            'Poke'
        ]
    },
    { /* Allowes the user to choose if the bot should ping users which are set to afk */
        name: 'ignoreAfkUsers',
        title: 'Should the Bot ignore AFK users?',
        type: 'checkbox',
        default: false
    },
    { /* Specify a cooldown for pings and messages, so supporters can't be spammed */
        name: 'messageCooldown',
        title: 'Supply a cooldown for your pings and messages (in seconds):',
        type: 'number',
        placeholder: 0
    },
    { /* The Messge each admin receives when a user connects to their moderated channel */
        name: 'adminMessage',
        title: 'Set a message which will be sent to the admin if anyone joins a Support-Channel:',
        type: 'string',
        placeholder: "User {Username} in Channel {Channel} could use some support!"
    },
    { /* The Messge the user receives after connecting to a moderated channel */
        name: 'userMessage',
        title: 'Set a message which will be sent to the user if he joins any Support-Channel:',
        type: 'string',
        placeholder: "Successfully messaged {FoundSupporter} Supporter."
    },
    { /* The Messge the user receives if no supporter was found */
        name: 'userNoSuppMessage',
        title: 'Set a message which will be sent to the user if no Supporter was found:',
        type: 'string',
        placeholder: "There is currently no Supporter available!"
    },
    { /* Groups that can join all channels without trigering notifications (admins) */
        name: 'channelGroups',
        title: 'Channel Groups',
        type: 'array',
        vars: [
            {
                name: "channelName",
                indent: 1,
                title: 'Give your Channelgroup a nice name:',
                type: 'string'
            },
            {
                name: "channelID",
                indent: 1,
                title: "Select a corresponding channel for this group:",
                type: "channel"
            },
            {
                name: "useGroup",
                indent: 1,
                title: "Select how you want to specify whos an Admin:",
                type: "select",
                options: [
                    "Specify admins by GroupIDs",
                    "Specify admins by their UID"
                ]
            },
            {
                name: "channelAdminsRole",
                indent: 1,
                title: "Add all your Admins for that channel here:",
                type: "array",
                conditions: [{
                    field: 'useGroup',
                    value: 0,
                }],
                vars: [
                    {
                        name: "roleName",
                        indent: 2,
                        title: "Add an optional name here for reference:",
                        type: "string",
                        placeholder: "No name given."
                    },
                    {
                        name: "roleID",
                        indent: 2,
                        title: "The Groups RoleID:",
                        type: "number"
                    }
                ]
            },
            {
                name: "channelAdminsName",
                indent: 1,
                title: "Add all your Admins for that channel here:",
                type: "array",
                conditions: [{
                    field: 'useGroup',
                    value: 1,
                }],
                vars: [
                    {
                        name: "adminName",
                        indent: 2,
                        title: "Add an optional name here for reference:",
                        type: "string",
                        placeholder: "No name given."
                    },
                    {
                        name: "adminID",
                        indent: 2,
                        title: "The Admins UID:",
                        type: "string"
                    }
                ]
            }
        ]
    },
    { /* admins in these channels will be ignored when pinging */
        name: "ignoredPingChannel",
        title: "Add the channels where Admins will not be pinged:",
        type: "array",
        vars: [{
            name: "ignoreChannel",
            indent: 2,
            title: "Select a channel to ignore:",
            type: "channel"
        }]
    }
]

}, function(sinusbot, config) {
    var engine = require('engine');
    var backend = require('backend');
    var event = require('event');

    var last_pinged = []; //[0] ( [0] = integer client.id | [1] = channel-id | [2] = long last_pinged_at + offset )

    if ( config.doLogging ) { engine.log( "[Main] " + "Successfully loaded the script!" ) }

    event.on('clientMove', function(ev) {

        if ( config.doLogging && config.doDebug ) { engine.log( "[Main] " + "Event 'clientMove' has been triggered!" ) }

        if ( ev.client.isSelf() ) {
            if ( config.doLogging && config.doDebug ) { engine.log( "I have been moved!" ) }
            return;
        }

        if ( ev.toChannel ){
            var isModeratedChannelResult = isModeratedChannel( ev.toChannel.id(), config.channelGroups )

            if ( isModeratedChannelResult[0] ) {
                var isChannelAdminResult = isChannelAdmin( ev.client, isModeratedChannelResult[1] )

                if ( isChannelAdminResult[0] ) {

                    // just write a log entry
                    if ( config.doLogging ) { engine.log( "Admin " +isChannelAdminResult[1]+ " joined channel " +isModeratedChannelResult[1].channelName+ "! (" +ev.client.name()+ ")" ) }

                } else {

                    // write a log entry, ping all admins and ignore those who are in an ignored channel
                    if ( config.doLogging ) { engine.log( "Nonadmin " +ev.client.name()+ " joined channel " +isModeratedChannelResult[1].channelName+ "!" ) }

                    //private message
                    sendMessage( ( isModeratedChannelResult[1].useGroup == 0 ? isModeratedChannelResult[1].channelAdminsRole : isModeratedChannelResult[1].channelAdminsName ), ( isModeratedChannelResult[1].useGroup == 0 ? true : false ), ev.client, ev.toChannel )

                }
            }
        }

        if ( config.doLogging && ev.fromChannel ){
            var wasModeratedChannelResult = isModeratedChannel( ev.fromChannel.id(), config.channelGroups )

            if ( wasModeratedChannelResult[0] ) {
                var isChannelAdminResult = isChannelAdmin( ev.client, wasModeratedChannelResult[1] )

                if ( isChannelAdminResult[0] ) {

                    // write a log entry that the channeladmin joined the channel
                    engine.log( "Admin " +isChannelAdminResult[1]+ " left channel " +wasModeratedChannelResult[1].channelName+ "! (" +ev.client.name()+ ")" )

                } else {

                    // write a log entry that a nonadmin left the channel
                    engine.log( "Nonadmin  " +ev.client.name()+ " left channel " +wasModeratedChannelResult[1].channelName+ "!" )

                }
            }
        }
    });

    // checks if the given channel is in the given channel list
    // returns { bool isModeratedChannel, channel moderatedChannel }
    function isModeratedChannel(channelID, moderatedChannels){

        if ( config.doLogging && config.doDebug ) { engine.log( "[isModeratedChannel] " + "Checking if channel " +channelID+ " is Moderated." ) }
        for (var moderatedChannel in moderatedChannels){
            if ( moderatedChannels[moderatedChannel].channelID == channelID ){
                if ( config.doLogging && config.doDebug ) { engine.log( "[isModeratedChannel] " + "Channel " +channelID+ " is Moderated." ) }
                return [true, moderatedChannels[moderatedChannel]];
            }
        }
        if ( config.doLogging && config.doDebug ) { engine.log( "[isModeratedChannel] " + "Channel " +channelID+ " is not Moderated." ) }
        return [false, null];
    }

    // checks if the user is an admin of that channel
    // returns { bool isAdmin, string adminName }
    function isChannelAdmin(client, channel){
        if ( config.doLogging && config.doDebug ) { engine.log( "[isChannelAdmin] " + "Checking if clientID " +client.uid()+ " is an Admin for channel " +channel.channelName+ "." ) }
        
        if ( config.doLogging && config.doDebug ) { engine.log( "[isChannelAdmin] " + "Variable useGroup for " +channel.channelName+ " is set to using " +( channel.useGroup == 0 ? "Roles" : "UserIDs" )+ "." ) }

        // continue here if we selected to specify admins by role
        if ( channel.useGroup == 0 ) {

            var serverGroups = client.getServerGroups();
            for (var serverGroup in serverGroups){
                for (var adminRole in channel.channelAdminsRole ) {
                    var myRole = channel.channelAdminsRole[adminRole]
                    if (serverGroups[serverGroup].id() == myRole.roleID ){
                        if ( config.doLogging && config.doDebug ) { engine.log( "[isChannelAdmin] " + "User " +client.name()+ " has an Admin-Role." ) }
                        return [true, myRole.roleName];
                    }
                }
            }

            if ( config.doLogging && config.doDebug ) { engine.log( "[isChannelAdmin] " + "User " +client.name()+ " is not in an Admin-Role." ) }
            return [false, null];

        // continue here if we selected to specify admins by userID
        } else {

            for (var channelAdmin in channel.channelAdminsName){
                var admin = channel.channelAdminsName[channelAdmin]
                if (admin.adminID == client.uid()){
                    if ( config.doLogging && config.doDebug ) { engine.log( "[isChannelAdmin] " + "User " +client.name()+ " is an Admin." ) }
                    return [true, admin.adminName];
                }
            }

            if ( config.doLogging && config.doDebug ) { engine.log( "[isChannelAdmin] " + "User " +client.name()+ " is not an Admin." ) }
            return [false, null];
        }
    }

    // sendMessage( array channelAdmins, bool useGroup, client client )
    function sendMessage( channelAdmins, useGroup, client, channel ) {
        var channelName = channel.name();
        var channelId = parseInt(channel.id());

        var foundSupporter = 0;
        var recentPingedSupporter = 0;

        for ( channelAdmin in channelAdmins ) {

            if ( useGroup ) {
                // if we want to use the role

                var clients = backend.getClients();

                // filter AFK users, as those should not be pinged anyways
                if ( config.ignoreAfkUsers ) { clients = clients.filter(client => !client.isAway()); }

                for ( currentClient in clients ) {

                    //skip checking roles if we got the client who needs support
                    if ( client == clients[currentClient] ) { continue; }

                    roles = clients[currentClient].getServerGroups();

                    for ( role in roles ) {

                        if ( roles[role].id() == channelAdmins[channelAdmin].roleID ) {
                            
                            // check if admin is in ignoredPingChannel or has recently been pinged
                            if ( hasRecentlyBeenMessaged( clients[currentClient].id(), channelId )[0] ) { recentPingedSupporter++; continue; }
                            if ( isInIgnoredPingChannel( clients[currentClient] ) ) { continue; }

                            foundSupporter++;

                            var next_ping = new Date(); next_ping.setSeconds(next_ping.getSeconds() + config.messageCooldown);
                            last_pinged.push([ parseInt(clients[currentClient].id()), channelId, next_ping.getTime() ]);

                            // message user / poke user
                            if (config.messageType == 0 ) {
                                clients[currentClient].chat( (config.adminMessage).replace("{Username}", client.name()).replace("{Channel}", channelName) )
                            } else {
                                clients[currentClient].poke( (config.adminMessage).replace("{Username}", client.name()).replace("{Channel}", channelName) )
                            }

                        }                        
                    }
                }
            } else {
                // if we want to use the admins ids

                var thisAdmin = backend.getClientByUID( channelAdmins[channelAdmin].adminID )
                if ( thisAdmin ) {

                    // check if admin is in ignoredPingChannel or has recently been pinged
                    if ( hasRecentlyBeenMessaged( thisAdmin.id(), channelId )[0] ) { recentPingedSupporter++; continue; }
                    if ( isInIgnoredPingChannel( thisAdmin ) ) { continue; }
                    if ( config.ignoreAfkUsers && thisAdmin.isAway() ) { continue; }

                    foundSupporter++;

                    var next_ping = new Date(); next_ping.setSeconds(next_ping.getSeconds() + config.messageCooldown);
                    last_pinged.push([ parseInt(thisAdmin.id()), channelId, next_ping.getTime() ]);

                    // message user / poke user
                    if (config.messageType == 0 ) {
                        thisAdmin.chat( (config.adminMessage).replace("{Username}", client.name()).replace("{Channel}", channelName) )
                    } else {
                        thisAdmin.poke( (config.adminMessage).replace("{Username}", client.name()).replace("{Channel}", channelName) )
                    }

                } else {

                    if ( config.doLogging ) { engine.log( "[ATTENTION] " + "Could not find any client with id " +channelAdmins[channelAdmin].adminID+ "!" ) }

                }
            }
        }

        if ( foundSupporter > 0 ) {

            if ( config.doLogging ) {
                if ( recentPingedSupporter > 0 ) {
                    engine.log( "Successfully found " +(foundSupporter + recentPingedSupporter)+ " Supporter, where " +recentPingedSupporter+ " of them have recently been notified!" );
                } else {
                    engine.log( "Successfully found " +foundSupporter+ " Supporter!" );
                }
            }

            // Message: "Es wurden " +foundSupporter+ " Supporter benachrichtigt, dass du Hilfe brauchst!"
            client.chat( ( config.userMessage ).replace("{FoundSupporter}", foundSupporter + recentPingedSupporter).replace("{Channel}", channelName ) );

        } else if ( recentPingedSupporter > 0 ) {

            if ( config.doLogging ) { engine.log( "All " +recentPingedSupporter+ " Supporter have already been notified less than " +config.messageCooldown+ " seconds ago!" ); }

            client.chat( ( config.userMessage ).replace("{FoundSupporter}", recentPingedSupporter).replace("{Channel}", channelName ) );

        } else {

            if ( config.doLogging ) { engine.log( "Could not find any Supporter!" ); }

            // message client that there is currently no Supporter
            client.chat( config.userNoSuppMessage );

        }
    }

    function isInIgnoredPingChannel( client ) {
        var audChannel = client.getAudioChannel()
        if ( audChannel ) {
            audChannel = audChannel.id()
        } else {
            if ( config.doLogging ) { engine.log( "[ATTENTION] " + "Could not get Channel " +client.name()+ " is in!" ) }
            return false;
        }


        for ( ignoredChannel in config.ignoredPingChannel ) {
            if ( config.ignoredPingChannel[ignoredChannel].ignoreChannel == audChannel ) {

                if ( config.doLogging && config.doDebug ) { engine.log( "[isInIgnoredPingChannel] " + "Do not ping " +client.name()+ " because client is in an ignored channel.") }
                return true;

            }
        }

        if ( config.doLogging && config.doDebug ) { engine.log( "[isInIgnoredPingChannel] " + "User " +client.name()+ " may be pinged.") }
        return false;

    }

    function hasRecentlyBeenMessaged( client_id, channel_id ) {
        var now = new Date().getTime();

        //remove exceeded objects
        last_pinged = last_pinged.filter(x => x[2] > now );
        
        for ( i = 0; i < last_pinged.length; i++ ) {
            var last_pinged_client = last_pinged[i];

            if ( last_pinged_client[0] == parseInt(client_id) && last_pinged_client[1] == parseInt(channel_id) ) {
                if ( config.doLogging && config.doDebug ) { engine.log( "[hasRecentlyBeenMessaged] " + "Client with id " +client_id+ " won't be pinged, as he already received a notification " +Math.ceil((last_pinged_client[2] - now) / 1000)+ " seconds ago!" ); }
                return [true, last_pinged_client];
            }
        }

        if ( config.doLogging && config.doDebug ) { engine.log( "[hasRecentlyBeenMessaged] " + "User with id " +client_id+ " may be pinged." ); }
        return [false, null];
    }
});