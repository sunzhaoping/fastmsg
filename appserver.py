# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, print_function, with_statement

import shortuuid
import logging
import socket
import tornado
import zmq
from db.dbwrapper import MemcacheClient
from tornado import gen
from tornado.options import define, options, parse_command_line
from tornado.web import Application as BaseApplication
from sockjs.tornado import SockJSRouter, SockJSConnection, stats, proto
from tornado.tcpserver import TCPServer
from zmq.eventloop import ioloop, zmqstream
ioloop.install()

PROTOCOL_PING = '0x00'

class ChannelHandler(SockJSConnection):
    server = None
    channels = dict()
    class_cache = dict()

    def on_open(self, info):
        self.channel = shortuuid.uuid()
        self.sub(self.channel)
        self.uid = self.session.session_id

    def on_close(self):
        self.unsub(self.channel)
        self.channel_emit(self.channel, "leave" , self.uid)
        self.remove_uid(self.channel,self.uid)

    @gen.coroutine
    def on_message(self, msg):
        try:
            method, event, data = tornado.escape.json_decode(msg)
            if method == 'broadcast':
                self.channel_emit(self.channel, event, data);
                return
            myclass = self.class_cache.get(event)
            if not myclass:
                module_name = "api." + event
                class_name = "Service"
                mod = __import__(module_name, globals(), locals(), [class_name], -1)
                myclass = getattr(mod, class_name)
                self.class_cache[event] = myclass 
            api_obj = myclass(self , event , data)
            response = yield api_obj.start()
            self.emit(event, response)
        except Exception,e:
            logging.exception(str(e))

    def emit(self, event, msg):
        data = tornado.escape.json_encode([self.channel, event, msg])
        self.send(data)

    def channel_emit(self, channel, event, msg):
        if options.v_host:
            ChannelHandler.ventilator.send_multipart([channel, ChannelHandler.server_id, event, msg])
        ChannelHandler.broadcast(channel, event, msg, self)

    def join(self, channel):
        self.unsub(self.channel);
        self.sub(channel);
        self.channel_emit(self.channel, "leave" , self.uid)
        self.remove_uid(self.channel,self.uid)
        self.channel = channel;
        self.channel_emit(self.channel, "join" ,self.uid)
        self.add_uid(self.channel,self.uid)
        
    def get_uids(self, channel):
        key = "fmsg|chl|%s" % (channel)
        return self.get_data(key)

    def add_uid(self, channel, uid):
        key = "fmsg|chl|%s" % (channel)
        uids = self.get_data(key)
        if not uids:
            uids = []
        if uid not in uids:
            uids.append(uid)
        self.set_data(key, uids)
        return uids

    def remove_uid(self, channel, uid):
        key = "fmsg|chl|%s" % (channel)
        uids = self.get_data(key)
        if not uids:
            uids = []
        if uid in uids:
            uids.remove(uid)
        if uids:
            self.set_data(key, uids)
        else:
            self.delete_data(key)
        return uids

    def set_data(self, key, value):
        return ChannelHandler.data_client.set(key, value)

    def delete_data(self, key):
        return ChannelHandler.data_client.delete(key)
        
    def get_data(self, key):
        return ChannelHandler.data_client.get(key)

    def sub(self, channel):
        channels = ChannelHandler.channels.get(channel,[])
        if not channels:
            ChannelHandler.sinker.setsockopt(zmq.SUBSCRIBE, tornado.escape.utf8(channel))
        if self not in channels:
            channels.append(self)
            ChannelHandler.channels[channel] = channels

    def unsub(self, channel):
        channels = ChannelHandler.channels.get(channel,[])
        if channels and self in channels:
            channels.remove(self)
            if channels:
                ChannelHandler.channels[channel] = channels
            else:
                del ChannelHandler.channels[channel]
            if not channels:
                ChannelHandler.sinker.setsockopt(zmq.UNSUBSCRIBE, tornado.escape.utf8(channel))

    @classmethod
    def broadcast(cls, channel , event , msg, ignore_client = None):
        channels = cls.channels.get(channel,[])
        if channels:
            data = [channel, event , msg]
            packed = tornado.escape.json_encode(data)
            json_msg = None

            count = 0
            for c in channels:
                if ignore_client == c:
                    continue 
                sess = c.session
                if not sess.is_closed:
                    sess.send_message(packed, stats=False)
                    count += 1
            cls.server.stats.on_pack_sent(count)

    @classmethod
    def on_sinker_message(cls, data):
        if data[1] == cls.server_id:
            return
        cls.broadcast(data[0], data[2], data[3])

    @classmethod
    def setup_master(cls,server):
        cls.data_client = MemcacheClient(options.memcached,0);
        cls.server_id = shortuuid.uuid();
        cls.server = server
        cls.context = zmq.Context(8)
        cls.ventilator = cls.context.socket(zmq.PUSH)
        cls.sinker = cls.context.socket(zmq.SUB)
        cls.sinker.bind(options.s_host)
        logging.info("start sinker at %s", options.s_host);
        cls.results_stream = zmqstream.ZMQStream(cls.sinker, ioloop.IOLoop.instance())
        cls.results_stream.on_recv(cls.on_sinker_message)
        for v in options.v_host.split(";"):
            if v and v != options.s_host:
                cls.ventilator.connect(v)

define("v_host", default="", help="ventilator host", type=str)
define("memcached", default="127.0.0.1:11211", help="memcached settigns", type=str)
define("s_host", default="tcp://127.0.0.1:1991", help="sink host", type=str)
define("host", default="0.0.0.0", help="bind host", type=str)
define("port", default=10080, help="bind port", type=int)

if __name__ == "__main__":
    parse_command_line()
    SockRouter = SockJSRouter(ChannelHandler, '/fastmsg/endpoint')
    app = tornado.web.Application(SockRouter.urls + [(r'/fastmsg/(.*)', tornado.web.StaticFileHandler, {'path': './snowpear/release/html5'})])
    app.listen(options.port, options.host)
    ChannelHandler.setup_master(SockRouter);
    ioloop.IOLoop.instance().start()
