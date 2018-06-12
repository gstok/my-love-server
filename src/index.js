

const Koa = require("koa");
const KoaRouter = require("koa-router");
const KoaStatic = require("koa-static");
const Koa2Cors = require("koa2-cors");
const MYSQL2 = require("mysql2/promise");
const BlueBird = require("bluebird");




class myDAL {

    constructor () {
    }

    async initConnection (conCfg) {
        this.connection = await MYSQL2.createConnection(conCfg);
    }

    async queryMsg (type, status, isSend, talker, content, opTime, tcTime, pageIndex, pageSize) {
        let [dataSets, fieldsSets] = await this.connection.execute("CALL queryMsg(?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [
                type,
                status, 
                isSend, 
                talker, 
                content, 
                opTime, 
                tcTime, 
                pageIndex, 
                pageSize
            ]
        );

        let result = {
            total: dataSets[0][0].count,
            pageData: dataSets[1]
        };

        return result;
    }
}



async function main () {
    let dal = new myDAL();
    await dal.initConnection({
        host: "www.91weixin.net",
        user: "gu",
        password: "gu@shi$hao^1993*",
        database: "MicroMsg",
        Promise: BlueBird,
    });

    let app = new Koa();
    let router = new KoaRouter();

    //跨域配置
    let cors = Koa2Cors({
        origin: function (ctx) {
            return "*";
        },
        exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        maxAge: 5,
        credentials: true,
        allowMethods: ['GET'],
        allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });


    router.post("/queryMsg", async (ctx, next) => {
        let result = await dal.queryMsg(-100, -100, -100, '', '', '', '', 0, 10);
        ctx.body = result;
    });

    app.use(cors).use(KoaStatic(__dirname + "/www")).use(router.routes()).use(router.allowedMethods());

    app.listen(5432);
    console.log("服务已经启动，工作在 " + 5432 + " 端口...");
}

main ();