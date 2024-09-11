const EventEmitter = require('events');
const { app } = require('electron');
const fs = require('fs-extra');
const forge = require('node-forge');
const path = require('path');
const os = require('os');
const net = require('net');
const https = require('https');
const dns = require('dns');
const url = require('url');
const uuidv4 = require('uuid/v4');
const Proxy = require('http-mitm-proxy');
const { differenceInMonths } = require('date-fns');
const storage = require('electron-json-storage');
const { addHostsEntries, getEntries, removeHostsEntries } = require('electron-hostile');
const { exec } = require('child_process');
const { decrypt_request, decrypt_response } = require('./smon_decryptor');

const { promisify } = require('util');
const sleep = promisify(setTimeout);

const CERT_MAX_LIFETIME_IN_MONTHS = 12;

class SWProxy extends EventEmitter {
  constructor(steamproxy) {
    super();
    this.httpServer = null;
    this.proxy = null;
    this.logEntries = [];
    this.addresses = [];

    this.sensitiveCommands = ['BattleRTPvPStart', 'getRtpvpReplayData'];
    this.sensitiveProperties = ['runes', 'artifacts', 'skills', 'replay_data', 'session_key'];
    this.sensitiveProperties4A = [ 'session_key'];

    this.steamproxy = steamproxy;
    this.proxiedHostnames = {
      'summonerswar-eu-lb.qpyou.cn': '127.11.12.13',
      'summonerswar-gb-lb.qpyou.cn': '127.11.12.14',
      'summonerswar-sea-lb.qpyou.cn': '127.11.12.15',
      'summonerswar-jp-lb.qpyou.cn': '127.11.12.16',
      'summonerswar-kr-lb.qpyou.cn': '127.11.12.17',
      'summonerswar-cn-lb.qpyou.cn': '127.11.12.18',
    };
    this.loopbackProxies = [];
  }
  async start(port, steamMode) {
    const self = this;

    if (steamMode && process.platform == 'win32') {
      try {
        await addHostsEntries(
          Object.entries(this.proxiedHostnames).map(([host, ip]) => {
            return { ip, host, wrapper: 'SWEX' };
          }),
          { name: 'SWEX' }
        );
      } catch (error) {
        this.log({ type: 'error', source: 'proxy', message: `无法编辑hosts文件: ${error.message}` });
      }
      exec('ipconfig /flushdns');

      const proxyHost = '127.0.0.1';
      const proxyPort = port;

      for (const hostname in this.proxiedHostnames) {
        const loopbackProxy = new this.steamproxy.TransparentProxy(hostname, 443, proxyHost, proxyPort);
        const bindAddr = this.proxiedHostnames[hostname];
        loopbackProxy.run(bindAddr, 443);
        this.loopbackProxies.push(loopbackProxy);
      }
    }

    this.proxy = Proxy();

    this.proxy.onError(function (ctx, e, errorKind) {
      if (e.code === 'EADDRINUSE') {
        self.log({ type: 'warning', source: 'proxy', message: '端口正在被占用，请稍后重试或者更换端口' });
      }
      // we do not show further errors here, since they are mostly meaningless regarding the proxy itself
    });

    this.proxy.onRequest(function (ctx, callback) {
      if (ctx.clientToProxyRequest.url.includes('/api/gateway_c2.php')) {
        ctx.use(Proxy.gunzip);
        ctx.SWRequestChunks = [];
        ctx.SWResponseChunks = [];
        ctx.onRequestData(function (ctx, chunk, callback) {
          ctx.SWRequestChunks.push(chunk);
          return callback(null, chunk);
        });
       
        ctx.onResponseData(function (ctx, chunk, callback) {
          ctx.SWResponseChunks.push(chunk);
          return callback(null, chunk);
        });
        ctx.onResponseEnd(function (ctx, callback) {
          let reqData;
          let respData;
          try {
              reqData = decrypt_request(Buffer.concat(ctx.SWRequestChunks).toString());
              respData = decrypt_response(Buffer.concat(ctx.SWResponseChunks).toString());
              const { command } = respData;
              //安全考虑
              self.removeSessionKey(respData);
              if (config.Config.App.clearLogOnLogin && (command === 'HubUserLogin' || command === 'GuestLogin')) {
                self.clearLogs();
              }
              let myid = (config.Config.Swwiki.myInfo && config.Config.Swwiki.myInfo.myid)?config.Config.Swwiki.myInfo.myid:-1;
              respData.myid = myid
              respData = self.checkSensitiveCommands(respData);
              // Emit events, one for the specific API command and one for all commands
              self.emit(command, reqData, respData);
              self.emit('apiCommand', reqData, respData);
          } catch (e) {
            // Error decrypting the data, log and do not fire an event
            self.log({ type: '调试', source: 'proxy', message: `解密异常 - 【可忽略本消息】 ${e}` });
          }
          return callback();
        });
      }
      return callback();
    });
    this.proxy.onConnect(function (req, socket, head, callback) {
      const serverUrl = url.parse(`https://${req.url}`);
      if (req.url.includes('lb.qpyou.cn') && config.Config.App.httpsMode) {
        return callback();
      } else {
        const srvSocket = net.connect(serverUrl.port, serverUrl.hostname, () => {
          socket.write('HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: Node-Proxy\r\n' + '\r\n');
          srvSocket.pipe(socket);
          socket.pipe(srvSocket);
        });
        srvSocket.on('error', () => {});

        socket.on('error', () => {});
      }
    });
    const dnsResolver = new dns.Resolver();
    this.proxy.listen(
      {
        host: '::',
        port,
        sslCaDir: path.join(app.getPath('userData'), 'swcerts'),
        httpsAgent:
          steamMode && process.platform == 'win32'
            ? new https.Agent({
                keepAlive: false,
                lookup: (hostname, options, callback) => {
                  dnsResolver.resolve4(hostname, (err, result) => {
                    callback(err, result[0], 4);
                  });
                },
              })
            : undefined,
      },
      async (e) => {
        if(config.Config.Plugins.魔灵wiki.enabled){
          this.log({ type: 'info', source: '通用', message: `${steamMode ? ' 【steam模式】' : '【普通模式】'} 代理已启动，使用端口： ${port}，【魔灵wiki】用户${config.Config.Swwiki.myInfo.state}` });
        }else{
          this.log({ type: 'info', source: '通用', message: `${steamMode ? ' 【steam模式】' : '【普通模式】'} 代理已启动，使用端口： ${port}，【魔灵wiki】插件未应用` });
        }
        const expired = await this.checkCertExpiration();

        if (expired) {
          this.log({
            type: 'warning',
            source: 'proxy',
            message: `证书已经过期 ${CERT_MAX_LIFETIME_IN_MONTHS} . 若无法使用，请重新生成并安装证书`,
          });
        }
      }
    );

    win.webContents.send('proxyStarted');
  }

  async stop() {
    this.proxy.close();
    this.proxy = null;

    if (this.loopbackProxies.length > 0) {
      for (const loopbackProxy of this.loopbackProxies) {
        loopbackProxy.server.close();
      }
      this.loopbackProxies = [];
    }
    try {
      await this.removeHostsModifications();
    } catch (error) {
      this.log({ type: 'error', source: 'proxy', message: `无法编辑hosts文件: ${error.message}` });
    }

    win.webContents.send('proxyStopped');
    this.log({ type: 'info', source: 'proxy', message: '代理已关闭' });
  }

  async removeHostsModifications() {
    const hostsEntries = await getEntries();
    const foundEntry = hostsEntries.find((entry) => entry[1].includes('lb.qpyou.cn'));

    if (!foundEntry) return;

    await removeHostsEntries(
      Object.entries(this.proxiedHostnames).map(([host, ip]) => {
        return { ip, host, wrapper: 'SWEX' };
      }),
      { name: 'SWEX' }
    );

    exec('ipconfig /flushdns');
  }

  removeSessionKey(data) {
    if (!(data instanceof Object)) return data;
    Object.keys(data).forEach((property) => {
      if (this.sensitiveProperties4A.includes(property)) {
        delete data[property];
      } else if (data[property] instanceof Object) {
        this.removeSessionKey(data[property]);
      }
    });

    return data;
  }

  getInterfaces() {
    this.addresses = [];
    const interfaces = os.networkInterfaces();
    for (const k in interfaces) {
      for (const k2 in interfaces[k]) {
        const address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
          this.addresses.push(address.address);
        }
      }
    }
    return this.addresses;
  }

  async checkCertExpiration() {
    const certPath = path.join(app.getPath('userData'), 'swcerts', 'certs', 'ca.pem');
    const certExists = await fs.pathExists(certPath);
    if (certExists) {
      const certInfo = await fs.stat(certPath);

      return differenceInMonths(new Date(), certInfo.ctime) >= CERT_MAX_LIFETIME_IN_MONTHS;
    } else {
      return false;
    }
  }

  pemToPkcs12(pemBytes) {
    const cert = forge.pki.certificateFromPem(pemBytes);
    const asn1 = forge.pkcs12.toPkcs12Asn1(null, cert);
    return forge.asn1.toDer(asn1).getBytes();
  }

  logCertUnavailable() {
    this.log({
      type: 'info',
      source: 'proxy',
      message: 'No certificate available yet. You might have to start the proxy once and then try again.',
    });
  }

  async getPemCertPath(log = false) {
    const pemCertPath = path.join(app.getPath('userData'), 'swcerts', 'certs', 'ca.pem');
    if (await fs.pathExists(pemCertPath)) {
      return pemCertPath;
    }
    if (log) {
      this.logCertUnavailable();
    }
    return null;
  }

  async copyPkcs12CertToPublic() {
    const pemCertPath = await this.getPemCertPath(true);
    if (pemCertPath === null) {
      return;
    }
    const pemBytes = await fs.readFile(pemCertPath, 'ascii');
    const exportPath = path.join(global.config.Config.App.filesPath, 'cert', 'cert_windows.p12');

    await fs.writeFile(exportPath, this.pemToPkcs12(pemBytes), 'binary');
    this.log({
      type: 'success',
      source: 'proxy',
      message: `证书已经拷贝至： ${exportPath}.`,
    });
    return exportPath;
  }

  async copyPemCertToPublic() {
    const pemCertPath = await this.getPemCertPath(true);
    if (pemCertPath === null) {
      return;
    }
    const copyPath = path.join(global.config.Config.App.filesPath, 'cert', 'ca.pem');
    await fs.copy(pemCertPath, copyPath);
    this.log({
      type: 'success',
      source: 'proxy',
      message: `证书已经拷贝至： ${copyPath}.`,
    });
    return copyPath;
  }

  async reGenCert() {
    await fs.emptyDir(path.join(app.getPath('userData'), 'swcerts'));
    if (this.isRunning()) {
      await this.stop();
    }

    await this.start(process.env.port || config.Config.Proxy.port);
    // make sure the root cert was generated
    await sleep(1000);
    await this.copyPemCertToPublic();
  }

  checkSensitiveCommands(respData) {
    return respData.command && this.sensitiveCommands.includes(respData.command) ? this.removeProperties(respData) : respData;
  }

  removeProperties(data) {
    if (!(data instanceof Object)) return data;
    Object.keys(data).forEach((property) => {
      if (this.sensitiveProperties.includes(property)) {
        delete data[property];
      } else if (data[property] instanceof Object) {
        this.removeProperties(data[property]);
      }
    });

    return data;
  }

  isRunning() {
    if (this.proxy) {
      return true;
    }
    return false;
  }

  log(entry) {
    if (!entry) {
      return;
    }

    // add unique id for performance reasons
    entry.id = uuidv4();

    entry.date = new Date().toLocaleTimeString();
    this.logEntries = [entry, ...this.logEntries];

    const maxLogEntries = parseInt(config.Config.App.maxLogEntries) || 0;
    if (this.logEntries.length > maxLogEntries && maxLogEntries !== 0) {
      this.logEntries.pop();
    }

    win.webContents.send('logupdated', this.logEntries);
  }

  updateMyIdOk(){
    win.webContents.send('updateMyIdOver');
  }

  getLogEntries() {
    return this.logEntries;
  }

  clearLogs() {
    this.logEntries = [];
    win.webContents.send('logupdated', this.logEntries);
  }
}

module.exports = SWProxy;
