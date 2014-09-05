hubot-standup-alarm
===================

Use Hubot to remind your team to do your standups.

## What does it do?

In a chat room, you can ask Hubot to create a standup at a specific time. From then on, at that time every weekday, Hubot will post in the chat room reminding you to have your standup.

You can create as many standups as you like, across as many rooms as you like.

## Usage

`hubot standup help` - See a help document explaining how to use.

`hubot create standup hh:mm` - Creates a standup at hh:mm every weekday for this room

`hubot list standups` - See all standups for this room

`hubot list standups in every room` - See all standups in every room

`hubot delete hh:mm standup` - If you have a standup at hh:mm, deletes it

`hubot delete all standups` - Deletes all standups for this room.

## Caveats

Currently, the time you specify must be the same timezone as the server Hubot resides on. You can check this with `hubot time`.

Standup reminders are sent using `robot.messageRoom`. Therefore, the room name needs to be saved correctly when a standup reminder is created. This was originally written for Hipchat, which retrieves the room from a message using `msg.envelope.user.reply_to`. You might need to change this if you're using a different adapter. You can find that part of the code around line 170, inside the `create standup` comand.

## Contributing

Feel free! Send a pull request :)
