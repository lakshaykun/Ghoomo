/**
 * Socket.IO singleton
 * Provides a way for controllers to access the io instance
 */

let _io = null;

module.exports = {
  init(io) {
    _io = io;
    return io;
  },
  getIO() {
    return _io;
  },
};
