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
from api import BaseService
from tornado import gen
import time

class Service(BaseService):
    @gen.coroutine 
    def do_request(self):
        """ this method return the server player data version to the client side
        to judge if need to download old data; then update current player id to 
        a active player list for inviting friends
        """
        raise gen.Return("%f" % (time.time()))
