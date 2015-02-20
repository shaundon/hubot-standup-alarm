// Description:
//   Have Hubot remind you to do standups.
//   hh:mm must be in the same timezone as the server Hubot is on. Probably UTC.
//
//   This is configured to work for Hipchat. You may need to change the 'create standup' command
//   to match the adapter you're using.

//
// Commands:
//   hubot standup help - See a help document explaining how to use.
//   hubot create standup hh:mm - Creates a standup at hh:mm every weekday for this room
//   hubot list standups - See all standups for this room
//   hubot list standups in every room - See all standups in every room
//   hubot delete hh:mm standup - If you have a standup at hh:mm, deletes it
//   hubot delete all standups - Deletes all standups for this room.
//
// Dependencies:
//   underscore
//   cron

var cronJob = require('cron').CronJob;
var _ = require('underscore');

module.exports = function(robot) {

    // Constants.
    var STANDUP_MESSAGES = [
        "Standup time!",
        "Time for standup, you guys.",
        "It's standup time once again!",
        "Get up, stand up (it's time for our standup)",
        "Standup time. Get up, humans",
        "Standup time! Now! Go go go!"
    ];

    // Check for standups that need to be fired, once a minute
    // Monday to Friday.
    var standupClock = new cronJob('1 * * * * 1-5', function() {
        checkStandups();
    }, null, true);

    // Compares current time to the time of the standup
    // to see if it should be fired.
    function standupShouldFire(standupTime) {
        var now = new Date();
        var currentHours = now.getHours();
        var currentMinutes = now.getMinutes();

        var standupHours = standupTime.split(':')[0];
        var standupMinutes = standupTime.split(':')[1];

        try {
            standupHours = parseInt(standupHours);
            standupMinutes = parseInt(standupMinutes);
        }
        catch (_error) {
            return false;
        }

        if (standupHours == currentHours && standupMinutes == currentMinutes) {
            return true;
        }
        return false;
    }

    // Returns all standups.
    function getStandups() {
        return robot.brain.get('standups') || [];
    }

    // Returns just standups for a given room.
    function getStandupsForRoom(room) {
        var allStandups = getStandups();
        var standupsForRoom = [];
        _.each(allStandups, function(standup) {
            if (standup.room == room) {
                standupsForRoom.push(standup);
            }
        });
        return standupsForRoom;
    }

    // Gets all standups, fires ones that should be.
    function checkStandups() {
        var standups = getStandups();

        _.each(standups, function(standup) {
            if (standupShouldFire(standup.time)) {
                doStandup(standup.room);
            }
        });
    }

    // Fires the standup message.
    function doStandup(room) {
        var message = STANDUP_MESSAGES[Math.floor(Math.random()*STANDUP_MESSAGES.length)];
        robot.messageRoom(room, message);
    }

    // Finds the room for most adaptors
    function findRoom(msg) {
        var room = msg.envelope.room;
        if(room == undefined) {
            room = msg.envelope.user.reply_to;
        }
        return room;
    }

    // Stores a standup in the brain.
    function saveStandup(room, time) {
        var standups = getStandups();
        var newStandup = {
            time: time,
            room: room
        };
        standups.push(newStandup);
        updateBrain(standups);
    }

    // Updates the brain's standup knowledge.
    function updateBrain(standups) {
        robot.brain.set('standups', standups);
    }

    function clearAllStandupsForRoom(room) {
        var standups = getStandups();
        var standupsToKeep = [];
        var standupsRemoved = 0;
        _.each(standups, function(standup) {
           if (standup.room != room) {
               standupsToKeep.push(standup);
           }
           else {
               standupsRemoved++;
           }
        });
        updateBrain(standupsToKeep);
        return standupsRemoved;
    }

    function clearSpecificStandupForRoom(room, time) {
        var standups = getStandups();
        var standupsToKeep = [];
        var standupsRemoved = 0;
        _.each(standups, function(standup) {
            if (standup.room == room && standup.time == time) {
                standupsRemoved++;
            }
            else {
                standupsToKeep.push(standup);
            }
        });
        updateBrain(standupsToKeep);
        return standupsRemoved;
    }

    robot.respond(/delete all standups/i, function(msg) {
        var standupsCleared = clearAllStandupsForRoom(findRoom(msg));
        msg.send('Deleted ' + standupsCleared + ' standup' + (standupsCleared === 1 ? '' : 's') + '. No more standups for you.');
    });

    robot.respond(/delete ([0-5]?[0-9]:[0-5]?[0-9]) standup/i, function(msg) {
        var time = msg.match[1]
        var standupsCleared = clearSpecificStandupForRoom(findRoom(msg), time);
        if (standupsCleared === 0) {
            msg.send("Nice try. You don't even have a standup at " + time);
        }
        else {
            msg.send("Deleted your " + time + " standup.");
        }
    });

    robot.respond(/create standup ([0-5]?[0-9]:[0-5]?[0-9])$/i, function(msg) {
        var time = msg.match[1];

        var room = findRoom(msg);

        saveStandup(room, time);
        msg.send("Ok, from now on I'll remind this room to do a standup every weekday at " + time);
    });

    robot.respond(/list standups$/i, function(msg) {
        var standups = getStandupsForRoom(findRoom(msg));

        if (standups.length === 0) {
            msg.send("Well this is awkward. You haven't got any standups set :-/");
        }
        else {
            var standupsText = [];
            standupsText.push("Here's your standups:");
            _.each(standups, function (standup) {
                standupsText.push(standup.time);
            });
            msg.send(standupsText.join('\n'));
        }
    });

    robot.respond(/list standups in every room/i, function(msg) {
        var standups = getStandups();
        if (standups.length === 0) {
            msg.send("No, because there aren't any.");
        }
        else {
            var standupsText = [];
            standupsText.push("Here's the standups for every room:");
            _.each(standups, function (standup) {
                standupsText.push('Room: ' + standup.room + ', Time: ' + standup.time);
            });
            msg.send(standupsText.join('\n'));
        }
    });

    robot.respond(/standup help/i, function(msg) {
        var message = [];
        message.push("I can remind you to do your daily standup!");
        message.push("Use me to create a standup, and then I'll post in this room every weekday at the time you specify. Here's how:");
        message.push("");
        message.push(robot.name + " create standup hh:mm - I'll remind you to standup in this room at hh:mm every weekday.");
        message.push(robot.name + " list standups - See all standups for this room.");
        message.push(robot.name + " list standups in every room - Be nosey and see when other rooms have their standup.");
        message.push(robot.name + " delete hh:mm standup - If you have a standup at hh:mm, I'll delete it.");
        message.push(robot.name + " delete all standups - Deletes all standups for this room.");
        msg.send(message.join('\n'));
    });
};
