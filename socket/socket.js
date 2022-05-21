const socketIo = require('socket.io')
const Chat = require('../models/chat');
const User = require('../models/user');
const users = {};

const PORT = process.env.PORT || 3000;

class Sockets {
    constructor(server) {
        this.users = []
        this.io = socketIo(server, {
            cors: {
                origin: `http://localhost:${PORT}`,
                methods: ["GET", "POST"]
            },
            allowEIO3: true
        });
        this.io.on('connection', socket => {
            this.connection(socket)
            console.log("socket io connected")
        });
    }

    // User connection
    connection(client) {
        // join room
        client.join("private")
            // console.log(client);
        console.log('New user connected: ' + client.id);
        // client.emit('test', "connexion reussie");

        // Private Chat
        client.on("privateMessage", async(privateMessage, media, { user }) => {
            if (!user) {
                throw new Error("Authentification requise")
            }
            console.log(privateMessage);
            const sender = privateMessage.sender;
            console.log("ID: ", sender);
            const current = await User.findById(sender)
            const blockedMe = current.blockedMe;
            console.log("BLOCKEDME: ", blockedMe);
            const blockedUsers = current.blockedUsers;
            console.log("BLOCKEDUSERS: ", blockedUsers);
            const receiver = privateMessage.receiver
            if (!privateMessage.chatId) privateMessage.chatId = sender + receiver
            console.log("RECEIVER: ", receiver);
            User.findOne({
                    '_id': receiver
                })
                .then(exist => {
                    if (!exist) {
                        throw new Error("Cet utilisateur n'existe pas")
                    } else {
                        let name = exist.firstName + ' ' + exist.lastName;
                        if (blockedMe.includes(receiver)) {
                            throw new Error(`Désolé, vous ne pouvez pas envoyer de message à ${name}`);
                        }
                        if (blockedUsers.includes(receiver)) {
                            throw new Error(`Désolé, vous ne pouvez pas envoyer de message à ${name}`);
                        }

                        const privateChat = new Chat({
                            senderId: sender,
                            receiverId: receiver,
                            chatId: privateMessage.chatId,
                            content: privateMessage.content
                        });

                        const type = privateMessage.type;
                        privateChat.type = type
                        if (type === 'photo' || type === 'memo') {
                            if (!media)
                                throw new Error("Renseignez une image ou un memo")
                            console.log('uploading ...', media)
                            const uploaded = processUpload(media,
                                `src/publics/usersmedias/${sender}_${current.email}/Media/${type === 'memo' ? 'Audio' : 'Document'}`)
                            if (uploaded.path) {
                                console.log('cheminimage ', uploaded.path)
                                const path = uploaded.path.split('publics/')
                                privateChat.media = path[1]
                            } else console.log('erreur lors de upload')
                        }

                        privateChat.save()
                            .then(async privateChat => {
                                console.log(privateChat);
                                client.to("private").emit('private_message', (privateChat));

                                let description = privateMessage.content;
                                if (type === 'photo') description = "Image reçue!"
                                if (type === 'memo' && !privateMessage.content) description = 'Audio reçu!';

                                await sendNotification(
                                    "newMessage",
                                    null,
                                    null,
                                    null,
                                    null,
                                    description, {
                                        senderUser: current,
                                        receiverUser: exist,
                                        data: {
                                            message: privateMessage.content,
                                            id: privateChat.id,
                                        },
                                    }
                                );
                            });

                    }
                })
        });

        //Group Chat
        client.on('groupMessage', async(groupMessage, media, { user }) => {
            if (!user) {
                throw new Error("Authentification requise")
            }
            console.log(groupMessage);
            const member = await GroupMember.findOne({ 'userId': user.id })
            const sender = await User.findById(user.id)
            console.log(member)
            const group = await Group.findOne({ 'groupId': groupId })
            const isGranted = groupId.includes(groupId.toString())
            if (member.status == false) {
                throw new Error("Vous avez été suspendu et n'êtes pas autorisés à envoyer de message dans ce groupe.")
            }
            if (!isGranted || !group) {
                throw new Error("Ce group n'existe pas ou vous n'etes pas membre")
            } else {
                const groupChat = new Chat({
                    senderId: user.id,
                    groupId: groupId,
                    content: groupMessage.content
                });

                const type = groupMessage.type
                groupChat.type = type
                if (type === 'photo' || type === 'memo') {
                    if (!media)
                        throw new Error("Renseignez une image ou un memo")
                    console.log('uploading ...', media)
                    const uploaded = await processUpload(media,
                        `src/publics/usersmedias/${user.id}_${sender.email}/Media/${type === 'memo' ? 'Audio' : 'Document'}`)
                    if (uploaded.path) {
                        console.log('cheminimage ', uploaded.path)
                        const path = uploaded.path.split('publics/')
                        groupChat.media = path[1]
                    } else console.log('erreur lors de upload', err)
                } else groupChat.content = groupMessage.content
                const savedGroupChat = await groupChat.save();
                console.log(savedGroupChat);
                client.broadcast.emit("group_message", savedGroupChat);
                const users = await User.aggregate([{
                    $match: {
                        groups: savedGroupChat.groupId,
                    },
                }]);
                console.log('users : ' + users);
                for (var userId of users) {
                    const user = await User.findById(userId)
                    await sendNotification(
                        "groupMessage",
                        null,
                        null,
                        null,
                        null,
                        savedGroupChat.content, {
                            senderUser: sender,
                            recieverUser: user,
                            data: {
                                message: savedGroupChat.content,
                                id: savedGroupChat.id,
                                groupId: savedGroupChat.groupId
                            },
                        }
                    );
                }

            }
        });
        //User disconnection
        client.on('disconnect', function() {
            // remove saved socket from users object
            delete users[client.id];
        });
    };
};
module.exports = Sockets;