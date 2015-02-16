class Animal extends egret.Sprite{
	public animal_name:string = "";
	public root_main:Main;
	public isTarget:boolean = false;
	public constructor(name:string, root_main :Main, x:number, y:number, isTarget: boolean) {
		super();
		this.isTarget = isTarget;
		this.animal_name = name;
		this.root_main = root_main;
		var stageW:number = root_main.stage.stageWidth;
		var stageH:number = root_main.stage.stageHeight;
		var animal:egret.Bitmap = new egret.Bitmap();
		var texture:egret.Texture = RES.getRes(name);
		animal.texture = texture;
		animal.anchorX = animal.anchorY = 0.5;
		var scale_value = 120 / animal.height;
		animal.scaleX = scale_value;
		animal.scaleY = scale_value;
		this.addChild(animal);
		this.touchEnabled = true;
		this.x = x;
		this.y = y;	
		egret.Tween.get(this).to({scaleX:0.5,scaleY:0.5},1).to({scaleX:1.0,scaleY:1.0},100);
		this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onAnimalSelect, this);
	}

	private onAnimalSelect( evt: egret.TouchEvent )
	{
		if(this.isTarget){
			var json = {"uid":this.root_main.params["uid"]};
			var jsonstr = JSON.stringify(json);
			this.root_main.socket.broadcast("gameend", jsonstr);
			this.root_main.gameend(jsonstr);
		}
	}

}