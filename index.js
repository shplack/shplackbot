const { Client } = require('discord.js');
const { token } = require('./settings');
const client = new Client();
const help = "Welcome to **shplackbot** commands!\n" +
"I\'ve sent you this message because you used the \`!help\` command!\n\n" +
"To use **shplackbot**, please use the following commands:\n\n" +
"\`\`\`\n" +
"!roleme <game name>\n" +
"or\n" +
"!roleme <game name> <amount>\n" +
"\`\`\`" +
"\`!roleme\` creates a role, and channels for you to @ others and chat with!\n" +
"Use \`!roleme\` again to remove the role so you don\'t get notifications. Add it again at any time!" +
"Game name should not have any spaces\n" +
"Amount must be between 1 and 5\n\n" +

"You can even use\n" +
"\`\`\`\n" +
"!delete <game name>\n" +
"\`\`\`\n" +
"Role/channel must be empty";

client.once('ready', () => { console.log('Ready!'); });

client.on('message', (msg) => {
    var author = msg.author;
    var uname = author.username;
    var uid = author.id;
    const args = msg.content.slice('!'.length).trim().split(' ');
    const command = args.shift();

    if (msg.author.bot || !msg.content.startsWith('!')) return;

    if (command == 'help' || msg.channel.type == 'dm') {
      msg.author.createDM().then(DM => DM.send(help));
    }

    if (command == 'delete') {
      if (args.length > 1) {
        msg.member.createDM().then(DM => DM.send("Too many arguments")).catch((err) => error(err));
        return;
      }
      var role_name = args[0];
      var role = findRole(role_name);
      if (!role) {
        msg.member.createDM().then(DM => DM.send("Role doesn't exist")).catch((err) => error(err));
        return;
      } else {
        if (role.members.size != 0 && !msg.member.hasPermission('ADMINISTRATOR')) {
          msg.member.createDM().then(DM => DM.send("Role must be empty. Contact an admin to do this manually if you think this is wrong.")).catch((err) => error(err));
          return;
        }
        removeChannels(role_name);
      }
      return;
    }

    if (command == 'roleme') {
        console.log(uname + "@" + uid + ' executed ' + args);
        var role_name = args[0];
        var role = findRole(role_name);
        var amount = args.length == 2 ? args[1] : 1;
        if (amount < 1 || amount > 5) {
          msg.member.createDM().then(DM => DM.send('That\'s not a reasonable number.'));
          return;
        }

        if (role) {
          (msg.member.roles.cache.has(role.id) ? removeRole(role) : assignRole(role));
        } else {
          if (msg.guild.channels.cache.find(channel => channel.name.toLowerCase() == role_name.toLowerCase())) {
            msg.member.createDM().then(DM => DM.send("Role name must not be the same as an existing channel name")).catch((err) => error(err));
            return;
          }
          createRole(role_name).then((role) => {
              assignRole(role);
              createChannels(role_name, role.id, amount);
          }).catch((err) => error(err));
        }

        return;
    }

    function error(err) {
      console.log(err);
      msg.member.createDM().then(DM => DM.send("Something went wrong. Please forward this to shplack:\n" + err)).catch((error) => console.log(error));
    }

    function findRole(role_name) {
      return msg.guild.roles.cache.find(role => role.name.toLowerCase() == role_name.toLowerCase());
    }

    function createRole(role_name) {
      console.log('creating new role');
      //TODO add to .json
      return msg.guild.roles.create({
        data: {
          name: role_name,
          color: 'RANDOM',
        },
      });
    }

    function assignRole(role) {
      console.log('assigning role to user');
      //TODO add to .json
      msg.member.roles.add(role);
    }

    function removeRole(role) {
      console.log('removing role from user');
      //TODO add to .json
      msg.member.roles.remove(role);
    }

    function createChannels(role_name, role_id, amount) {
      console.log('creating new channels')
      const category = newChannel(role_name, 'category')
        .then((cat) => {
          newChannel(role_name, 'text', cat.id).then((text) => { text.lockPermissions(); }).catch((err) => error(err));
          for (var i = 1; i <= amount; i++) {
            newChannel((amount == 1 ? role_name : role_name + ` ${i}`), 'voice', cat.id).then((voice) => { voice.lockPermissions(); }).catch((err) => error(err));
          }
        })
        .catch((err) => error(err));

      function newChannel(channel_name, type, parent) { //create new channel with name type and if has parent

        return msg.guild.channels.create(channel_name, {
          type: type,
          parent: parent,
          permissionOverwrites: [
            {
              id: msg.guild.id,
              deny: ['VIEW_CHANNEL'],
            },
            {
              id: role_id,
              allow: ['VIEW_CHANNEL'],
            },
          ],
        });

      }
    }

    function removeChannels(channel_name) {
      const to_delete = msg.guild.channels.cache.find(channel => channel.name.toLowerCase() == channel_name.toLowerCase() && channel.type == 'category');
      to_delete.children.each(chan => {
        console.log('deleting ' + chan.type + ' chat ' + chan.name);
        chan.delete().catch((err) => error(err));
      });
      to_delete.delete().catch((err) => error(err));

      msg.guild.roles.cache.find(role => role.name.toLowerCase() == channel_name.toLowerCase()).delete().catch((err) => error(err));
    }


  });

client.login(token);
