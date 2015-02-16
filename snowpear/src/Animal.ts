class Animal extends egret.Sprite{
	public animal_name:string = "";
	public root_main:Main;
	public constructor(name:string, root_main :Main, x:number, y:number) {
		super();
		this.animal_name = name;
		this.root_main = root_main;
		var stageW:number = root_main.stage.stageWidth;
		var stageH:number = root_main.stage.stageHeight;
		var animal:egret.Bitmap = new egret.Bitmap();
		var texture:egret.Texture = RES.getRes(name);
		animal.texture = texture;
		animal.anchorX = animal.anchorY = 0.5;
		animal.scaleX = 160 / animal.height;
		animal.scaleY = 160 / animal.height;
		this.addChild(animal);
		this.touchEnabled = true;
		this.x = x;
		this.y = y;
		this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onAnimalSelect, this);
	}

	private onAnimalSelect( evt: egret.TouchEvent )
	{
		if(this.animal_name == "chicken"){
			var json = {"uid":this.root_main.params["uid"]};
			var jsonstr = JSON.stringify(json);
			this.root_main.socket.broadcast("gameend", jsonstr);
			this.root_main.gameend(jsonstr);
		}
	}

}