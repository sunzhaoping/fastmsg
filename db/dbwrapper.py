# -*- coding: utf-8 -*-
# Copyright 2014 pitaya games
# Licensed under the Pitaya Games License, Version 1.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#     http://www.pitayagames.com/licenses/LICENSE-1.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

from __future__ import absolute_import, division, print_function, with_statement

import logging
import hashlib
import datetime
from tornado import options
from tornado.options import define, options, parse_command_line


try:
    import pylibmc as memcache
    _pylibmc = True
except ImportError, e:
    import memcache
    _pylibmc = False

def force_str(text, encoding="utf-8", errors='strict'):
    t_type = type(text)
    if t_type == str:
        return text
    elif t_type == unicode:
        return text.encode(encoding, errors)
    return str(text)

def force_unicode(text, encoding="utf-8", errors='strict'):
    t_type = type(text)
    if t_type == str:
        return text.decode(encoding, errors)
    elif t_type == unicode:
        return text
    elif hasattr(text, '__unicode__'):
        return unicode(text)
    return unicode(str(text), encoding, errors)

class MemcacheClient(object):
    def __init__(self, servers, default_timeout=0):
        '''
            servers is a string like "192.168.0.1:9988;192.168.0.1:9989"
        '''
        logging.info("memcached servers :" + servers)
        self._current = memcache.Client(servers.split(';'))
        if _pylibmc:
            self._current.behaviors['distribution'] = 'consistent'
            self._current.behaviors['tcp_nodelay'] = 1
        self.default_timeout = default_timeout
    
    def add(self, key, value, timeout=0, min_compress=50):
        if isinstance(value, unicode):
            value = value.encode('utf-8')
        return self._current.add(force_str(key), value, timeout or self.default_timeout, min_compress)
    
    def get(self, key, default=None):
        try:
            val = self._current.get(force_str(key))
        except:
            val = self._current.get(force_str(key))
        if val is None:
            return default
        return val
    
    def set(self, key, value, timeout=0, min_compress=50):
        if isinstance(value, unicode):
            value = value.encode('utf-8')
        try:
            return self._current.set(force_str(key), value, timeout or self.default_timeout, min_compress)
        except:
            return self._current.set(force_str(key), value, timeout or self.default_timeout, min_compress)
    
    def delete(self, key):
        try:
            try:
                val = self._current.delete(force_str(key))
            except:
                val = self._current.delete(force_str(key))
            if type(val)==bool:
                val = 1
        except:
            val = 0
        return val
    
    def get_multi(self, keys):
        return self._current.get_multi(map(force_str, keys))
    
    def close(self, **kwargs):
        self._current.disconnect_all()
    
    def incr(self, key, delta=1):
        return self._current.incr(key, delta)
    
    def decr(self, key, delta=1):
        return self._current.decr(key, delta)
    
    def current(self):
        return self._current

def _smart(v):
    t = type(v)
    if t == str:
        return v
    elif t == unicode:
        return force_str(v)
    elif (t == int) or (t == long) or (t == float):
        return str(v)
    elif t == datetime.datetime:
        return v.strftime("%Y-%m-%d %H:%M:%S")
    return str(v)

def _pairtext(k, v):
    if v is None:
        return "%s=null" % k
    return "%s='%s'" % (k, escape_string(_smart(v)))

def _sqltext(data, delimiter=","):
    sql = delimiter.join([_pairtext(k[0], k[1]) for k in data.items()])
    return sql

class Config(object):
    def __init__(self):
        super(Config, self).__init__()
    
    def configure(self, cfg_file):
        cf = open(cfg_file)
        try:
            gs = {}
            exec(cf.read(), gs)
            for k in gs:
                if k <> "__builtins__":
                    setattr(self, k, gs[k])
        finally:
            cf.close()
