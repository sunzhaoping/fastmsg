# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, print_function, with_statement
import base64
import logging
import tornado
from tornado import gen

class BaseService():
    def __init__(self, connection, event, data):
        self.connection = connection
        self.event = event
        self.message = data
        self.result = {"status":200, "data":""}

    def do_request(self):
        pass

    @gen.coroutine 
    def start(self):
        response = yield self.do_request()
        raise gen.Return(response)
