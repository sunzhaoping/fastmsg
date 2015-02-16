var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *	 * Redistributions of source code must retain the above copyright
 *	   notice, this list of conditions and the following disclaimer.
 *	 * Redistributions in binary form must reproduce the above copyright
 *	   notice, this list of conditions and the following disclaimer in the
 *	   documentation and/or other materials provided with the distribution.
 *	 * Neither the name of the Egret-Labs.org nor the
 *	   names of its contributors may be used to endorse or promote products
 *	   derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var Main = (function (_super) {
    __extends(Main, _super);
    function Main() {
        _super.call(this);
        this.uids = [];
        this.color_define = 0xff0000;
        this.animals = ["bear", "beaver", "cat", "cow", "dog", "elephant", "elk", "ghost", "giraffe", "gnu", "goat", "hippo", "kangaroo", "monkey", "mouse", "owl", "penguin", "pig", "sheep", "squirrel", "zebra"];
        this.gameState = "";
        this.stageAnimals = [];
        this.params = this.GetRequest();
        if (this.params["uid"] == "1")
            this.color_define = 0xff0000;
        if (this.params["uid"] == "2")
            this.color_define = 0x00ff00;
        if (this.params["uid"] == "2")
            this.color_define = 0x0000ff;
        this.socket = new Socket("/fastmsg/endpoint");
        this.socket.on('connect', this.onConnect.bind(this));
        this.socket.on('login', this.onLogin.bind(this));
        this.socket.on('join', this.onJoin.bind(this));
        this.socket.on('leave', this.onLeave.bind(this));
        this.socket.on('gamestart', this.gamestart.bind(this));
        this.socket.on('gameend', this.gameend.bind(this));
        this.socket.on('taped', this.taped.bind(this));
        this.socket.on('touchbegin', this.touchbegin.bind(this));
        this.socket.on('touchmove', this.touchmove.bind(this));
        this.socket.on('touchend', this.touchend.bind(this));
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }
    Main.prototype.GetRequest = function () {
        var url = location.search; //获取url中"?"符后的字串
        var theRequest = new Object();
        if (url.indexOf("?") != -1) {
            var str = url.substr(1);
            var strs = str.split("&");
            for (var i = 0; i < strs.length; i++) {
                theRequest[strs[i].split("=")[0]] = decodeURIComponent(strs[i].split("=")[1]);
            }
        }
        return theRequest;
    };
    Main.prototype.shuffle = function (array) {
        var counter = array.length, temp, index;
        while (counter > 0) {
            // Pick a random index
            index = Math.floor(Math.random() * counter);
            // Decrease counter by 1
            counter--;
            // And swap the last element with it
            temp = array[counter];
            array[counter] = array[index];
            array[index] = temp;
        }
        return array;
    };
    Main.prototype.onConnect = function (data) {
        if (this.params["uid"])
            this.socket.emit("login", this.params["uid"]);
    };
    Main.prototype.onLogin = function (data) {
        if (this.params["channel"]) {
            this.socket.emit("join", this.params["channel"]);
        }
    };
    Main.prototype.onJoin = function (data) {
        this.uids.push(data);
        console.log(data.toString() + " join");
    };
    Main.prototype.onLeave = function (data) {
        var i = this.uids.indexOf(data);
        if (i >= 0)
            this.uids.slice(i, 1);
        console.log(data.toString() + " leave");
    };
    Main.prototype.gamestart = function (data) {
        if (this.gameState == "r")
            return;
        this.gameState = "r";
        this.startButton.visible = false;
        console.log(data);
        var json = JSON.parse(data);
        for (var i = 0; i < this.stageAnimals.length; i++)
            this.removeChild(this.stageAnimals[i]);
        for (var i = 0; i < 3; i++)
            if (json.animals[i])
                this.txt.text = "which animal is " + json.animals[i];
        this.stageAnimals.length = 0;
        this.stageAnimals.push(this.createAnimalByName(json.animals[0], json.x[0], json.y[0], json.iTarget[0]));
        this.stageAnimals.push(this.createAnimalByName(json.animals[1], json.x[1], json.y[1], json.iTarget[1]));
        this.stageAnimals.push(this.createAnimalByName(json.animals[2], json.x[2], json.y[2], json.iTarget[2]));
    };
    Main.prototype.gameend = function (data) {
        if (this.gameState == "e")
            return;
        this.gameState = "e";
        var json = JSON.parse(data);
        var text = json.uid + " win!";
        this.txt.text = text;
        this.startButton.visible = true;
    };
    Main.prototype.taped = function (data) {
    };
    Main.prototype.touchbegin = function (data) {
        var json = JSON.parse(data);
    };
    Main.prototype.touchmove = function (data) {
        var json = JSON.parse(data);
    };
    Main.prototype.touchend = function (data) {
        var json = JSON.parse(data);
    };
    Main.prototype.onAddToStage = function (event) {
        //设置加载进度界面
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);
        //初始化Resource资源加载库
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/resource.json", "resource/");
    };
    /**
    * 配置文件加载完成,开始预加载preload资源组。
    */
    Main.prototype.onConfigComplete = function (event) {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.loadGroup("preload");
    };
    /**
    * preload资源组加载完成
    */
    Main.prototype.onResourceLoadComplete = function (event) {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            this.drawText();
            this.createStartButton();
        }
    };
    /**
    * preload资源组加载进度
    */
    Main.prototype.onResourceProgress = function (event) {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    };
    /**
    * 创建游戏场景
    */
    Main.prototype.createStartButton = function () {
        var stageW = this.stage.stageWidth;
        var stageH = this.stage.stageHeight;
        var start_png = this.createBitmapByName("start");
        start_png.anchorX = start_png.anchorY = 0.5;
        this.startButton = new egret.Sprite();
        this.startButton.addChild(start_png);
        this.startButton.x = 80;
        this.startButton.y = 80;
        this.addChild(this.startButton);
        this.startButton.touchEnabled = true;
        this.startButton.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onGameStartTap, this);
    };
    Main.prototype.onGameStartTap = function (evt) {
        this.animals = this.shuffle(this.animals);
        var animals_target = this.animals.slice(0, 3);
        var animals_select = this.shuffle(animals_target);
        var iTarget = Math.floor(Math.random() * 30) % 3;
        var json = { "uid": this.params["uid"], "animals": animals_select, "x": [160, 320, 480], "y": [320, 320, 320], "iTarget": [iTarget == 0, iTarget == 1, iTarget == 2] };
        var jsonstr = JSON.stringify(json);
        this.socket.broadcast("gamestart", jsonstr);
        this.gamestart(jsonstr);
    };
    /**
        * 创建游戏场景
    */
    Main.prototype.createLevelScene = function () {
        var stageW = this.stage.stageWidth;
        var stageH = this.stage.stageHeight;
        this.animals = this.shuffle(this.animals);
    };
    Main.prototype.onTouchTap = function (evt) {
        this.socket.broadcast("taped", this.params["uid"]);
    };
    Main.prototype.onTouchBegin = function (evt) {
        var json = { "uid": this.params["uid"], "localX": evt.localX, "localY": evt.localY, "color": this.color_define };
        var jsonstr = JSON.stringify(json);
        this.socket.broadcast("touchbegin", jsonstr);
        this.touchbegin(jsonstr);
    };
    Main.prototype.onTouchMove = function (evt) {
        var json = { "uid": this.params["uid"], "localX": evt.localX, "localY": evt.localY, "color": this.color_define };
        var jsonstr = JSON.stringify(json);
        this.socket.broadcast("touchmove", jsonstr);
        this.touchmove(jsonstr);
    };
    Main.prototype.onTouchEnd = function (evt) {
        var json = { "uid": this.params["uid"], "localX": evt.localX, "localY": evt.localY, "color": this.color_define };
        var jsonstr = JSON.stringify(json);
        this.socket.broadcast("touchend", jsonstr);
        this.touchend(jsonstr);
    };
    Main.prototype.drawText = function () {
        this.txt = new egret.TextField();
        this.txt.size = 24;
        this.txt.x = 0;
        this.txt.y = 100;
        this.txt.width = 640;
        this.txt.height = 100;
        this.txt.text = "";
        this.txt.textAlign = egret.HorizontalAlign.CENTER;
        this.txt.textColor = 0xff0000;
        this.addChild(this.txt);
    };
    /**
    * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
    */
    Main.prototype.createBitmapByName = function (name) {
        var result = new egret.Bitmap();
        var texture = RES.getRes(name);
        result.texture = texture;
        return result;
    };
    Main.prototype.createAnimalByName = function (name, x, y, isTarget) {
        var result = new Animal(name, this, x, y, isTarget);
        this.addChild(result);
        return result;
    };
    return Main;
})(egret.DisplayObjectContainer);
Main.prototype.__class__ = "Main";
