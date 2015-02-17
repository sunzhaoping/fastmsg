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
class Main extends egret.DisplayObjectContainer{
	/**
	 * 加载进度界面
	 */
	private loadingView:LoadingUI;
	public socket:Socket;
	public params:Object;
	private uids :string[] = [];
	private color_define : Number = 0xff0000;
	private animals:string[] = ["bear","beaver","cat","cow","dog","elephant","elk","ghost","giraffe","gnu","goat","hippo","kangaroo","monkey","mouse","owl","penguin","pig","sheep","squirrel","zebra"]
	public  gameState:string = ""; 
	private stageAnimals: egret.Sprite[] = [];
	private startButton: egret.Sprite;
	private start_time: number = 5;
	private current_targert:string = "";
	private current_winner:string = "";
	private current_wintime:number = 0;
	private current_select:number = 0;
	private alive_timer:egret.Timer;
	private show_start:boolean = true;
	private GetRequest(): Object{
		var url = location.search; //获取url中"?"符后的字串
		var theRequest:Object = new Object();
		if (url.indexOf("?") != -1) {
			var str = url.substr(1);
			var strs = str.split("&");
			for(var i = 0; i < strs.length; i ++) {
			   theRequest[strs[i].split("=")[0]]= decodeURIComponent(strs[i].split("=")[1]);
			 }
		}
		return theRequest;
	}
	
	private shuffle(array:string[]) {
		var counter = array.length, temp, index;
		// While there are elements in the array
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
	}
	
	public constructor() {
		super();
		this.params = this.GetRequest();
		if(this.params["uid"] == "1")
			this.color_define = 0xff0000;
		if(this.params["uid"] == "2")
			this.color_define = 0x00ff00;
		if(this.params["uid"] == "2")
			this.color_define = 0x0000ff;
		this.socket = new Socket("/fastmsg/endpoint");
		this.startButton = new egret.Sprite();
		this.socket.on('connect', this.onConnect.bind(this));
		this.socket.on('login', this.onLogin.bind(this));
		this.socket.on('join', this.onJoin.bind(this));
		this.socket.on('leave', this.onLeave.bind(this));
		this.socket.on('gamestart', this.gamestart.bind(this));
		this.socket.on('gameend', this.gameend.bind(this));
		this.socket.on('selectAnimal', this.selectAnimal.bind(this));
		this.socket.on('timeminus', this.timeminus.bind(this));
		this.socket.on('alive', this.alive.bind(this));
		this.addEventListener(egret.Event.ADDED_TO_STAGE,this.onAddToStage,this);
		this.alive_timer = new egret.Timer(1000,0);
		this.alive_timer.addEventListener(egret.TimerEvent.TIMER,this.onAliveMessage,this);
		this.show_start = true;
	}
	
	
	private onConnect(data){
		if (this.params["uid"])
			this.socket.emit("login", this.params["uid"]);
	}
	
	private onLogin(data){
		if (this.params["channel"]){
			this.alive_timer.start();
		}
	}
	
	private alive(data){
		var json = JSON.parse(data);
		this.uids = json;
		if(json.length > 0){
			if(json[0] == this.params["uid"] && this.show_start){
				this.createStartButton();
			}
		}
	}

	private onJoin(data){
		var i : number = this.uids.indexOf(data);
		if(i < 0){
			this.uids.push(data);
			console.log(data.toString() + " join");
		}
	}

	private onLeave(data){
		var i : number = this.uids.indexOf(data);
		if(i>=0)
			this.uids.slice(i,1);
		console.log(data.toString() + " leave");
	}
	
	public timeminus(data){
		this.startButton.visible = false;
		var json = JSON.parse(data);
		this.txttimer.text = "game will start at "+ json["time"]+" seconds";
	}

	public gamestart(data){
		this.txttimer.text = "";
		if(this.gameState == "r")
			return;
		this.gameState = "r";
		var json = JSON.parse(data);
		this.uids = json.uids;
		console.log(this.uids);
		for(var i = 0 ; i < this.stageAnimals.length; i++)
			this.removeChild(this.stageAnimals[i]);
		for(var i = 0 ; i <3; i++){
			if(json.iTarget[i]){
				this.txt.text = "which animal is "+ json.animals[i]+"?\n";
				this.current_targert = json.animals[i];
			}
		}
		this.current_winner = "";
		this.current_wintime = 0;
		this.current_select = 0;
		this.stageAnimals.length = 0;
		this.stageAnimals.push(this.createAnimalByName(json.animals[0], json.x[0], json.y[0],json.iTarget[0]));
		this.stageAnimals.push(this.createAnimalByName(json.animals[1], json.x[1], json.y[1],json.iTarget[1]));
		this.stageAnimals.push(this.createAnimalByName(json.animals[2], json.x[2], json.y[2],json.iTarget[2]));
	}


	public gameend(data){
		if(this.gameState != "r")
			return;
		this.gameState = "e";
		var json = JSON.parse(data);
		
		var text:string = "";
		if (json.uid != "" ) text = json.uid + " win!\n";
		this.txt.text += text;
		if(this.uids[0] == this.params["uid"])
				this.createStartTimer();
	}

	public selectAnimal(data){
		var json = JSON.parse(data);
		if(json.uid == this.params["uid"])
			this.gameState = "w"
		var text:string = json.uid + " select " + json.animal + "\n";
		this.current_select++;
		this.txt.text += text;
		if(this.uids[0] == this.params["uid"]){
			if(json.animal == this.current_targert && (this.current_wintime == 0 || this.current_wintime > json.time)){
				this.current_winner = json.uid;
				this.current_wintime = json.time;
			}
			if(this.current_select >= this.uids.length){
				var json:any = {"uid":this.current_winner};
				var jsonstr = JSON.stringify(json);
				this.socket.broadcast("gameend", jsonstr);
				this.gameend(jsonstr);
			}
		}
	}
	
	private onAddToStage(event:egret.Event){
		//设置加载进度界面
		this.loadingView  = new LoadingUI();
		this.stage.addChild(this.loadingView);
		//初始化Resource资源加载库
		RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE,this.onConfigComplete,this);
		RES.loadConfig("resource/resource.json","resource/");
	}
	/**
	* 配置文件加载完成,开始预加载preload资源组。
	*/
	private onConfigComplete(event:RES.ResourceEvent):void{
		RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE,this.onConfigComplete,this);
		RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE,this.onResourceLoadComplete,this);
		RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS,this.onResourceProgress,this);
		RES.loadGroup("preload");
	}

	/**
	* preload资源组加载完成
	*/
	private onResourceLoadComplete(event:RES.ResourceEvent):void {
		if(event.groupName=="preload"){
			this.stage.removeChild(this.loadingView);
			RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE,this.onResourceLoadComplete,this);
			RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS,this.onResourceProgress,this);
			this.drawText();
		}
	}

	/**
	* preload资源组加载进度
	*/
	private onResourceProgress(event:RES.ResourceEvent):void {
		if(event.groupName=="preload"){
			this.loadingView.setProgress(event.itemsLoaded,event.itemsTotal);
		}
	}

	private textContainer:egret.Sprite;

	/**
	* 创建游戏场景
	*/
	private createStartTimer():void{
		var stageW:number = this.stage.stageWidth;
		var stageH:number = this.stage.stageHeight;
		this.start_time = 5;
		var timer:egret.Timer = new egret.Timer(1000,5);
		timer.addEventListener(egret.TimerEvent.TIMER,this.timerFunc,this);
		timer.addEventListener(egret.TimerEvent.TIMER_COMPLETE,this.onGameStart,this);
		timer.start();
	}
	
	private createStartButton():void{
		var stageW:number = this.stage.stageWidth;
		var stageH:number = this.stage.stageHeight;
		var start_png:egret.Bitmap = this.createBitmapByName("start");
		start_png.anchorX = start_png.anchorY = 0.5;
		this.startButton.addChild(start_png);
		this.startButton.x = 320;
		this.startButton.y = 480;
		this.addChild(this.startButton);
		this.startButton.touchEnabled = true;
		this.show_start = false;
		this.startButton.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onGameStartButtonTap, this);
	}
	
	private onAliveMessage():void
	{
		var json = {"uid":this.params["uid"], "channel":this.params["channel"]};
		var jsonstr = JSON.stringify(json);
		this.socket.emit("alive", jsonstr);
	}
	
	private timerFunc():void
	{
		this.start_time--;
		var json = {"uid":this.params["uid"], "time":this.start_time};
		var jsonstr = JSON.stringify(json);
		this.socket.broadcast("timeminus", jsonstr);
		this.timeminus(jsonstr);
	}
	
	private onGameStart():void
	{
		this.animals = this.shuffle(this.animals);
		var animals_target:string[] = this.animals.slice(0,3);
		var animals_select = this.shuffle(animals_target);
		var iTarget = Math.floor(Math.random() * 30) % 3
		var json = {"uid":this.params["uid"],"uids":this.uids, "animals": animals_select, "x":[160,320,480] , "y" : [480, 480, 480], "iTarget":[iTarget==0, iTarget==1, iTarget==2]};
		var jsonstr = JSON.stringify(json);
		this.socket.broadcast("gamestart", jsonstr);
		this.gamestart(jsonstr);
	}
	
	private onGameStartButtonTap(evt: egret.TouchEvent):void
	{
		this.startButton.touchEnabled = false;
		this.createStartTimer();
	}

	/**
		* 创建游戏场景
	*/
	private createLevelScene():void{
		var stageW:number = this.stage.stageWidth;
		var stageH:number = this.stage.stageHeight;
		this.animals = this.shuffle(this.animals);
	}

	//绘制文本
	private  txt:egret.TextField;
	private  txttimer:egret.TextField;
	private drawText():void
	{
		this.txt = new egret.TextField();
		this.txt.size = 24;
		this.txt.x = 0;
		this.txt.y = 100;
		this.txt.width = 640;
		this.txt.height = 100;
		this.txt.text = "";
		this.txt.textAlign = egret.HorizontalAlign.CENTER;
		this.txt.textColor = 0xff0000;
		this.addChild( this.txt );
		this.txttimer = new egret.TextField();
		this.txttimer.size = 24;
		this.txttimer.x = 0;
		this.txttimer.y = 50;
		this.txttimer.width = 640;
		this.txttimer.height = 100;
		this.txttimer.text = "waiting for game start...";
		this.txttimer.textAlign = egret.HorizontalAlign.CENTER;
		this.txttimer.textColor = 0x0000ff;
		this.addChild( this.txttimer );
	}
	/**
	* 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
	*/
	private createBitmapByName(name:string):egret.Bitmap {
		var result:egret.Bitmap = new egret.Bitmap();
		var texture:egret.Texture = RES.getRes(name);
		result.texture = texture;
		return result;
	}
	
	private createAnimalByName(name:string, x:number, y:number, isTarget:boolean):egret.Sprite {
		var result:Animal = new Animal(name,this, x, y,isTarget);
		this.addChild(result);
		return result;
	}
}


