class Maps {
    static list = {};
    constructor(id, width, height) {
        this.id = id;
        this.width = width;
        this.height = height;

        Maps.list[this.id] = this;
    }
}

module.exports = Maps;