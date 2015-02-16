var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Animal = (function (_super) {
    __extends(Animal, _super);
    function Animal(name, root_main, x, y, isTarget) {
        _super.call(this);
        this.animal_name = "";
        this.isTarget = false;
        this.isTarget = isTarget;
        this.animal_name = name;
        this.root_main = root_main;
        var stageW = root_main.stage.stageWidth;
        var stageH = root_main.stage.stageHeight;
        var animal = new egret.Bitmap();
        var texture = RES.getRes(name);
        animal.texture = texture;
        animal.anchorX = animal.anchorY = 0.5;
        var scale_value = 120 / animal.height;
        animal.scaleX = scale_value;
        animal.scaleY = scale_value;
        this.addChild(animal);
        this.touchEnabled = true;
        this.x = x;
        this.y = y;
        egret.Tween.get(this).to({ scaleX: 0.5, scaleY: 0.5 }, 1).to({ scaleX: 1.0, scaleY: 1.0 }, 100);
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onAnimalSelect, this);
    }
    Animal.prototype.onAnimalSelect = function (evt) {
        if (this.isTarget) {
            var json = { "uid": this.root_main.params["uid"] };
            var jsonstr = JSON.stringify(json);
            this.root_main.socket.broadcast("gameend", jsonstr);
            this.root_main.gameend(jsonstr);
        }
    };
    return Animal;
})(egret.Sprite);
Animal.prototype.__class__ = "Animal";
