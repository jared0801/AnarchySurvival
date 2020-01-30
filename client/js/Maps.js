export class Maps {
    static list = {};
    constructor(id, imgSrc, bgColor) {
        this.id = id;
        this.image = new Image();
        this.image.src = imgSrc;
        this.bgColor = bgColor;

        Maps.list[this.id] = this;
    }

    draw(width, height, player) {
        let ctx = document.getElementById('canvas').getContext('2d');
        let x = width/2 - player.x;
        let y = height/2 - player.y;
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(this.image, x, y);
    }
}