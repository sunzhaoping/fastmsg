var Socket = (function () {
    function Socket(url) {
        this.url = url;
        this.conn = new SockJS(url);
        this.callbacks = {};
        var self = this;
        this.conn.onopen = function (ev) {
            self.onConnect(ev);
        };
        this.conn.onmessage = function (ev) {
            self.onMessage(ev);
        };
        this.conn.onclose = function (ev) {
            self.onClose(ev);
        };
        ;
    }
    Socket.prototype.emit = function (event, data) {
        if (data === void 0) { data = ""; }
        var msg = ["emit", event, data];
        var packed = JSON.stringify(msg);
        this.conn.send(packed);
    };
    Socket.prototype.broadcast = function (event, data) {
        if (data === void 0) { data = ""; }
        var msg = ["broadcast", event, data];
        var packed = JSON.stringify(msg);
        this.conn.send(packed);
    };
    Socket.prototype.on = function (event, callback) {
        this.callbacks[event] = callback;
    };
    Socket.prototype.onConnect = function (ev) {
        this.callback_emit("connect", null);
    };
    Socket.prototype.callback_emit = function (event, data) {
        var callback = this.callbacks[event];
        if (callback) {
            callback(data);
        }
    };
    Socket.prototype.onMessage = function (ev) {
        var msg = JSON.parse(ev.data);
        this.channel = msg[0];
        var event = msg[1];
        var data = msg[2];
        this.callback_emit(event, data);
    };
    Socket.prototype.onClose = function (ev) {
        this.callback_emit("close", null);
    };
    Socket.prototype.close = function () {
        this.conn.close();
    };
    return Socket;
})();
Socket.prototype.__class__ = "Socket";
