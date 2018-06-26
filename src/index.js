

const fs = require("fs");
const Koa = require("koa");
const KoaRouter = require("koa-router");
const KoaStatic = require("koa-static");
const Koa2Cors = require("koa2-cors");
const KoaBodyParser = require("koa-bodyparser");
const MYSQL2 = require("mysql2/promise");
const BlueBird = require("bluebird");
const Axios = require("axios");
const JWT = require("jsonwebtoken");

const Result = require("./result");


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


function invalid (obj) {
    if (obj) {
        return true;
    }
    else {
        if (obj === 0) {
            return true;
        }
        else if (obj === "") {
            return true;
        }
        else {
            return false;
        }
    }
}

let serverPoint = 8765;

const privateKey = fs.readFileSync(__dirname + "/keys/private.key");
const publicKey = fs.readFileSync(__dirname + "/keys/public.key");

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
        let reqBody = ctx.request.body;
        let type = invalid(reqBody.type) ? reqBody.type : -100;
        let status = invalid(reqBody.status) ? reqBody.status : -100;
        let isSend = invalid(reqBody.isSend) ? reqBody.isSend : -100;
        let talker = invalid(reqBody.talker) ? reqBody.talker : '';
        let content = invalid(reqBody.content) ? reqBody.content : '';
        let opTime = invalid(reqBody.opTime) ? reqBody.opTime : '';
        let tcTime = invalid(reqBody.tcTime) ? reqBody.tcTime : '';
        let pageIndex = invalid(reqBody.pageIndex) ? reqBody.pageIndex : 0;
        let pageSize = invalid(reqBody.pageSize) ? reqBody.pageSize : 20;
        let result = await dal.queryMsg(type, status, isSend, talker, content, opTime, tcTime, pageIndex, pageSize);
        ctx.body = Result.success(result, "查询成功");
    });


    router.get("/weChatLogin", async (ctx, next) => {
        const appId = "wxbf89cbcf5526091c";
        const appSecret = "55170b9dd5b97e11c79a31092283505e";
        let reqBody = ctx.request.body;
        let jsCode = ctx.query.code;
        let reqUrl = `https://api.weixin.qq.com/sns/jscode2session?` +
                        `appid=${ appId }&` +
                        `secret=${ appSecret }&` +
                        `js_code=${ jsCode }&` +
                        `grant_type=authorization_code`;
        let response = await Axios.get(reqUrl);
        let data = response.data;
        if (data["session_key"] && data["openid"]) {
            let openId = data["openid"];
            let token = JWT.sign(
                {
                    openId: openId
                },
                privateKey,
                {
                    algorithm: "RS256",
                    expiresIn: 60
                }
            );

            console.log("开始验证");
            for (let i = 0; i < 100000; ++i) {
                let result = JWT.verify(token, publicKey);
                console.log(i, result);
            }
            console.log("结束验证");


            ctx.body = token;
        }
        else {
            ctx.body = "无效code";
        }
    });

    // router.use("/haha", (ctx, next) => {
    //     console.log("哈哈哈哈哈哈");
    //     return next();
    // });

    router.post("/haha", (ctx, next) => {
        let request = ctx.request;
        ctx.body = ctx.request.rawBody;
    });

    app
        .use(KoaBodyParser())
        .use(cors)
        .use(KoaStatic(__dirname + "/www"))
        .use(router.routes())
        .use(router.allowedMethods());

    app.listen(serverPoint);
    console.log("服务已经启动，工作在 " + serverPoint + " 端口...");
}

main ();