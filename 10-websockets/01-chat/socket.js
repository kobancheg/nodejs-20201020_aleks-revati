const socketIO = require('socket.io');

const Session = require('./models/Session');
const Message = require('./models/Message');

function socket(server) {
  const io = socketIO(server);

  io.use(async function(socket, next) {
    try {
      const {token} = socket.handshake.query;
      if (!token) throw next(new Error('anonymous sessions are not allowed'));

      const session = await Session.findOne({token}).populate('user');
      if (!session) throw next(new Error('wrong or expired session token'));

      socket.user = session.user;
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', function(socket) {
    socket.on('message', async (msg) => {
      await Message.create({
        date: new Date(),
        text: msg,
        chat: socket.user._id,
        user: socket.user.displayName,
      });
    });
  });

  return io;
}

module.exports = socket;
